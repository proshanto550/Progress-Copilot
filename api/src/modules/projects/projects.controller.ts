import type { Request } from 'express';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { badRequest } from '../../lib/errors';

export const getGitHubData = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  let username = req.query.username as string | undefined;

  if (!username) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { aiBio: true } });
    const match = user?.aiBio?.match(/github:([a-zA-Z0-9_-]+)/);
    if (match) username = match[1];
  }

  if (!username) {
    return res.json({ connected: false });
  }

  try {
    const profileRes = await fetch(`https://api.github.com/users/${username}`, {
      headers: { 'User-Agent': 'Progress-Copilot-App' },
    });
    if (!profileRes.ok) throw badRequest('GitHub user not found');
    const profile = await profileRes.json();

    const reposRes = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=30`,
      { headers: { 'User-Agent': 'Progress-Copilot-App' } },
    );
    const reposData = reposRes.ok ? await reposRes.json() : [];

    const repositories = (Array.isArray(reposData) ? reposData : []).map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      description: r.description,
      htmlUrl: r.html_url,
      language: r.language,
      stargazersCount: r.stargazers_count,
      forksCount: r.forks_count,
      updatedAt: r.updated_at,
    }));

    let contributionCells: Array<{ date: string; count: number }> = [];
    try {
      const contribRes = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
      if (contribRes.ok) {
        const contribJson: any = await contribRes.json();
        if (contribJson?.contributions) {
          contributionCells = contribJson.contributions.map((c: any) => ({
            date: c.date,
            count: c.count,
          }));
        }
      }
    } catch {
      /* fallback */
    }

    return res.json({
      connected: true,
      username,
      profile: {
        avatarUrl: profile.avatar_url,
        name: profile.name || profile.login,
        login: profile.login,
        bio: profile.bio,
        publicRepos: profile.public_repos,
        followers: profile.followers,
        htmlUrl: profile.html_url,
      },
      repositories,
      contributions: contributionCells,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Failed to fetch GitHub data' });
  }
});

export const connectGitHub = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    throw badRequest('Username is required');
  }

  const cleanHandle = username.trim().replace(/^@/, '');
  const user = await prisma.user.findUnique({ where: { id: userId } });
  let aiBio = user?.aiBio || '';

  if (aiBio.includes('github:')) {
    aiBio = aiBio.replace(/github:[a-zA-Z0-9_-]+/, `github:${cleanHandle}`);
  } else {
    aiBio = (aiBio + ` github:${cleanHandle}`).trim();
  }

  await prisma.user.update({
    where: { id: userId },
    data: { aiBio },
  });

  return res.json({ ok: true, username: cleanHandle });
});

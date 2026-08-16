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

  const cleanUsername = username.trim().replace(/^@/, '');

  try {
    const headers = {
      'User-Agent': 'Progress-Copilot-App',
      Accept: 'application/vnd.github.v3+json',
    };

    let profile: any = {
      avatarUrl: `https://github.com/${cleanUsername}.png`,
      name: cleanUsername,
      login: cleanUsername,
      bio: 'GitHub Developer',
      publicRepos: 0,
      followers: 0,
      htmlUrl: `https://github.com/${cleanUsername}`,
    };

    try {
      const profileRes = await fetch(`https://api.github.com/users/${cleanUsername}`, { headers });
      if (profileRes.ok) {
        const pData = await profileRes.json();
        profile = {
          avatarUrl: pData.avatar_url || profile.avatarUrl,
          name: pData.name || pData.login || cleanUsername,
          login: pData.login || cleanUsername,
          bio: pData.bio || 'GitHub Developer',
          publicRepos: pData.public_repos || 0,
          followers: pData.followers || 0,
          htmlUrl: pData.html_url || `https://github.com/${cleanUsername}`,
        };
      }
    } catch {
      // Fallback already assigned
    }

    let repositories: any[] = [];
    try {
      const reposRes = await fetch(
        `https://api.github.com/users/${cleanUsername}/repos?sort=updated&direction=desc&per_page=30`,
        { headers },
      );

      if (reposRes.ok) {
        const reposData = await reposRes.json();
        if (Array.isArray(reposData)) {
          repositories = await Promise.all(
            reposData.map(async (r: any) => {
              let commitCount = 1;
              try {
                const commitsRes = await fetch(
                  `https://api.github.com/repos/${cleanUsername}/${r.name}/commits?per_page=1`,
                  { headers },
                );
                if (commitsRes.ok) {
                  const linkHeader = commitsRes.headers.get('link') || commitsRes.headers.get('Link');
                  if (linkHeader) {
                    const match = linkHeader.match(/page=(\d+)>; rel="last"/);
                    if (match && match[1]) {
                      commitCount = parseInt(match[1], 10);
                    }
                  } else {
                    const list = await commitsRes.json();
                    commitCount = Array.isArray(list) ? list.length : 1;
                  }
                }
              } catch {
                commitCount = 1;
              }

              return {
                id: r.id,
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                htmlUrl: r.html_url,
                language: r.language,
                stargazersCount: r.stargazers_count,
                forksCount: r.forks_count,
                updatedAt: r.updated_at,
                commitCount,
              };
            }),
          );
        }
      }
    } catch {
      repositories = [];
    }

    return res.json({
      connected: true,
      username: cleanUsername,
      profile,
      repositories,
    });
  } catch (err: any) {
    return res.json({
      connected: true,
      username: cleanUsername,
      profile: {
        avatarUrl: `https://github.com/${cleanUsername}.png`,
        name: cleanUsername,
        login: cleanUsername,
        bio: 'GitHub Developer',
        publicRepos: 0,
        followers: 0,
        htmlUrl: `https://github.com/${cleanUsername}`,
      },
      repositories: [],
    });
  }
});

export const connectGitHub = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;
  const { username } = req.body;
  if (!username || typeof username !== 'string') {
    throw badRequest('Username is required');
  }

  const cleanHandle = username.trim().replace(/^@/, '');
  if (!cleanHandle) {
    throw badRequest('Valid username is required');
  }

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

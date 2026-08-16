import type { Request } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { badRequest, notFound, unauthorized } from '../../lib/errors';

/* ─────────────────────────────────────────────────────────────────────────────
 * Phase 7 — Profile v2 controller
 *
 *   GET  /api/profile         — full Phase-7 payload (scalar fields +
 *                               Address[2] + Education[] + Skill[] +
 *                               completion%)
 *   PUT  /api/profile         — partial update by section (top-level keys).
 *                               Sections: profile, additional, addresses,
 *                               educations, skills.
 *   PATCH /api/profile/password — change password (requires current).
 *   PATCH /api/profile/avatar — set avatar (data URL string).
 *
 * The existing `profile.controller.ts` keeps its narrower personalization
 * schema for the AI Settings page (Edith's prompt builder) — both endpoints
 * coexist because they serve different UIs.
 * ───────────────────────────────────────────────────────────────────────────── */

const COUNTRIES = ['Bangladesh', 'India', 'Pakistan', 'Nepal', 'Sri Lanka', 'Other'] as const;

const phoneSchema = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[0-9 \-()]{6,20}$/.test(v), 'Invalid phone number')
  .or(z.literal(''))
  .nullable()
  .optional();

const trimNullable = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()
  .optional();

const profileSection = z.object({
  fullName: z.string().min(1).max(80).optional(),
  email: z.string().email().optional(), // read-only on update but echoed on GET
  avatar: z.string().min(1).max(3_000_000).nullable().optional(),
  mobileNumber: phoneSchema,
  whatsapp: phoneSchema,
});

const additionalSection = z.object({
  gender: z.enum(['Male', 'Female', 'Other']).nullable().optional(),
  ageRange: trimNullable,
  primaryDeviceType: trimNullable,
  experience: trimNullable,
  role: trimNullable,
  areaType: trimNullable,
  maritalStatus: trimNullable,
  country: z
    .enum(COUNTRIES)
    .nullable()
    .optional()
    .or(z.literal('').transform(() => null)),
  employmentRole: trimNullable,
});

const addressRow = z.object({
  country: trimNullable,
  district: trimNullable,
  streetAddress: trimNullable,
});
const addressesSection = z.object({
  present: addressRow.optional(),
  permanent: addressRow
    .extend({
      sameAsPresent: z.boolean().optional(),
    })
    .optional(),
});

const educationSection = z.object({
  educationLevel: trimNullable,
  examDegreeTitle: trimNullable,
  institutionName: trimNullable,
  isCurrentlyStudying: z.boolean().optional(),
  passingYear: z.number().int().min(1950).max(2100).nullable().optional(),
  currentYear: trimNullable,
  isCseStudent: z.boolean().optional(),
});

const skillRow = z.object({
  id: z.string().optional(), // present when updating existing row
  skillName: z.string().min(1).max(80),
  experienceInYear: trimNullable,
  projectLinks: trimNullable,
});
const skillsSection = z.object({
  // Full replacement — the client sends the complete desired list.
  // Rows with `id` are updated; rows without `id` are created; rows
  // missing from the response are deleted (tenant-isolated).
  skills: z.array(skillRow).max(50).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

const avatarSchema = z.object({
  // data URL or absolute http(s) URL; we trust clients over TLS
  // (no upload pipeline in Phase 7).
  avatar: z.string().min(1).max(2_000_000),
});

const putSchema = z.object({
  profile: profileSection.optional(),
  additional: additionalSection.optional(),
  addresses: addressesSection.optional(),
  educations: educationSection.optional(),
  skills: skillsSection.optional(),
});

/* ─── completion % ─────────────────────────────────────────────────────── */

/**
 * Compute profile completion percentage based on the canonical Phase-7
 * field list. Counted once per *user-visible* field, regardless of
 * which relation it lives on.
 *
 *   My Profile  : fullName, mobileNumber, whatsapp, avatar, password-known
 *   Additional  : gender, ageRange, primaryDeviceType,
 *                 experience, employmentRole, areaType, maritalStatus, country
 *   Address     : present (country + district + street),
 *                 permanent (sameAsPresent OR all three fields filled)
 *   Education   : educationLevel, examDegreeTitle, institutionName,
 *                 isCurrentlyStudying OR passingYear set,
 *                 currentYear (when studying), isCseStudent
 *   Skill Set   : ≥1 skill (skillName + experienceInYear)
 *
 * Returns integer 0..100.
 */
function computeCompletion(payload: {
  u: any;
  present: any;
  permanent: any;
  education: any[];
  skills: any[];
}): number {
  const { u, present, permanent, education, skills } = payload;
  const checks: boolean[] = [];

  // My Profile
  checks.push(!!(u.fullName && u.fullName.trim()));
  checks.push(!!u.mobileNumber);
  checks.push(!!u.whatsapp);
  checks.push(!!u.avatar);

  // Additional Info
  checks.push(!!u.gender);
  checks.push(!!u.ageRange);
  checks.push(!!u.primaryDeviceType);
  checks.push(!!u.experience);
  checks.push(!!u.employmentRole);
  checks.push(!!u.areaType);
  checks.push(!!u.maritalStatus);
  checks.push(!!u.country);

  // Address — present
  if (present) {
    checks.push(!!present.country);
    checks.push(!!present.district);
    checks.push(!!present.streetAddress);
  } else {
    checks.push(false, false, false);
  }

  // Address — permanent (sameAsPresent counts as fully filled)
  if (permanent?.sameAsPresent) {
    checks.push(true, true, true);
  } else if (permanent) {
    checks.push(!!permanent.country);
    checks.push(!!permanent.district);
    checks.push(!!permanent.streetAddress);
  } else {
    checks.push(false, false, false);
  }

  // Education — if no rows at all, count all 6 as missing
  if (education.length === 0) {
    checks.push(false, false, false, false, false, false);
  } else {
    const e = education[0];
    checks.push(!!e.educationLevel);
    checks.push(!!e.examDegreeTitle);
    checks.push(!!e.institutionName);
    // "currently studying" OR "passing year set"
    checks.push(!!(e.isCurrentlyStudying || e.passingYear));
    // current year only required while studying
    checks.push(e.isCurrentlyStudying ? !!e.currentYear : true);
    checks.push(typeof e.isCseStudent === 'boolean');
  }

  // Skill Set — at least one fully-filled skill
  if (skills.length === 0) {
    checks.push(false);
  } else {
    const filled = skills.some(
      (s) => !!s.skillName?.trim() && !!s.experienceInYear,
    );
    checks.push(filled);
  }

  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

/* ─── handlers ─────────────────────────────────────────────────────────── */

export const getProfileV2 = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      educations: { orderBy: { createdAt: 'asc' } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!user) throw notFound('User not found');

  const present =
    user.addresses.find((a) => a.kind === 'PRESENT') ?? null;
  const permanent =
    user.addresses.find((a) => a.kind === 'PERMANENT') ?? null;

  const completion = computeCompletion({
    u: user,
    present,
    permanent,
    education: user.educations,
    skills: user.skills,
  });

  return res.json({
    profile: {
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar,
      mobileNumber: user.mobileNumber,
      whatsapp: user.whatsapp,
    },
    additional: {
      gender: user.gender,
      ageRange: user.ageRange,
      primaryDeviceType: user.primaryDeviceType,
      experience: user.experience,
      role: user.role,
      employmentRole: user.employmentRole,
      areaType: user.areaType,
      maritalStatus: user.maritalStatus,
      country: user.country,
    },
    addresses: {
      present: present
        ? {
            country: present.country,
            district: present.district,
            streetAddress: present.streetAddress,
          }
        : null,
      permanent: permanent
        ? {
            country: permanent.country,
            district: permanent.district,
            streetAddress: permanent.streetAddress,
            sameAsPresent: permanent.sameAsPresent,
          }
        : null,
    },
    educations: user.educations.map((e) => ({
      id: e.id,
      educationLevel: e.educationLevel,
      examDegreeTitle: e.examDegreeTitle,
      institutionName: e.institutionName,
      isCurrentlyStudying: e.isCurrentlyStudying,
      passingYear: e.passingYear,
      currentYear: e.currentYear,
      isCseStudent: e.isCseStudent,
    })),
    skills: user.skills.map((s) => ({
      id: s.id,
      skillName: s.skillName,
      experienceInYear: s.experienceInYear,
      projectLinks: s.projectLinks,
    })),
    completion,
  });
});

/** Strip undefined + empty-string-as-null so untouched columns stay intact. */
function normalizePatch(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = typeof v === 'string' && v.trim() === '' ? null : v;
  }
  return out;
}

export const updateProfileV2 = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const patch = putSchema.parse(req.body);
  if (!patch) throw badRequest('No sections supplied');

  /* ── My Profile + Additional: user scalars ── */
  const userData: Record<string, unknown> = {};
  if (patch.profile) {
    const p = normalizePatch(patch.profile as any);
    for (const [k, v] of Object.entries(p)) {
      if (k === 'email') continue; // email is read-only
      userData[k] = v;
    }
  }
  if (patch.additional) {
    const a = normalizePatch(patch.additional as any);
    for (const [k, v] of Object.entries(a)) userData[k] = v;
  }
  if (Object.keys(userData).length > 0) {
    await prisma.user.update({ where: { id: userId }, data: userData });
  }

  /* ── Addresses — upsert both rows regardless of which section changed ── */
  if (patch.addresses) {
    const present = patch.addresses.present;
    const permanent = patch.addresses.permanent;

    if (present) {
      const data = normalizePatch(present as any);
      await prisma.address.upsert({
        where: { userId_kind: { userId, kind: 'PRESENT' } },
        update: data,
        create: { userId, kind: 'PRESENT', ...data },
      });
    }
    if (permanent) {
      const data = normalizePatch(permanent as any);
      await prisma.address.upsert({
        where: { userId_kind: { userId, kind: 'PERMANENT' } },
        update: data,
        create: { userId, kind: 'PERMANENT', ...data },
      });
    }
  }

  /* ── Education — single active row kept in this Phase ── */
  if (patch.educations) {
    const e = patch.educations;
    const data = normalizePatch(e as any);
    const existing = await prisma.education.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
    if (existing) {
      await prisma.education.update({ where: { id: existing.id }, data });
    } else {
      await prisma.education.create({ data: { userId, ...data } });
    }
  }

  /* ── Skills — full replacement with create/update/delete ── */
  if (patch.skills?.skills) {
    const incoming = patch.skills.skills;
    const keepIds = new Set(incoming.filter((s) => s.id).map((s) => s.id!));

    // Delete rows that aren't in the incoming list.
    await prisma.skill.deleteMany({
      where: { userId, id: { notIn: Array.from(keepIds) } },
    });

    for (const s of incoming) {
      const data = normalizePatch({
        skillName: s.skillName,
        experienceInYear: s.experienceInYear,
        projectLinks: s.projectLinks,
      });
      if (s.id) {
        await prisma.skill.update({ where: { id: s.id }, data });
      } else {
        // Ensure skillName is always present on create (Zod already enforces min(1)).
        await prisma.skill.create({
          data: { userId, skillName: s.skillName, ...data },
        });
      }
    }
  }

  // Re-fetch and return the canonical payload so the client can refresh.
  const fresh = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: true,
      educations: { orderBy: { createdAt: 'asc' } },
      skills: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!fresh) throw notFound('User not found');

  const present =
    fresh.addresses.find((a) => a.kind === 'PRESENT') ?? null;
  const permanent =
    fresh.addresses.find((a) => a.kind === 'PERMANENT') ?? null;

  const completion = computeCompletion({
    u: fresh,
    present,
    permanent,
    education: fresh.educations,
    skills: fresh.skills,
  });

  return res.json({
    ok: true,
    completion,
    profile: {
      fullName: fresh.fullName,
      email: fresh.email,
      avatar: fresh.avatar,
      mobileNumber: fresh.mobileNumber,
      whatsapp: fresh.whatsapp,
    },
    additional: {
      gender: fresh.gender,
      ageRange: fresh.ageRange,
      primaryDeviceType: fresh.primaryDeviceType,
      experience: fresh.experience,
      role: fresh.role,
      employmentRole: fresh.employmentRole,
      areaType: fresh.areaType,
      maritalStatus: fresh.maritalStatus,
      country: fresh.country,
    },
    addresses: {
      present: present && {
        country: present.country,
        district: present.district,
        streetAddress: present.streetAddress,
      },
      permanent: permanent && {
        country: permanent.country,
        district: permanent.district,
        streetAddress: permanent.streetAddress,
        sameAsPresent: permanent.sameAsPresent,
      },
    },
    educations: fresh.educations.map((e) => ({
      id: e.id,
      educationLevel: e.educationLevel,
      examDegreeTitle: e.examDegreeTitle,
      institutionName: e.institutionName,
      isCurrentlyStudying: e.isCurrentlyStudying,
      passingYear: e.passingYear,
      currentYear: e.currentYear,
      isCseStudent: e.isCseStudent,
    })),
    skills: fresh.skills.map((s) => ({
      id: s.id,
      skillName: s.skillName,
      experienceInYear: s.experienceInYear,
      projectLinks: s.projectLinks,
    })),
  });
});

export const changePassword = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { currentPassword, newPassword } = passwordSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) throw unauthorized();

  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw badRequest('Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { password: hash } });
  return res.json({ ok: true });
});

export const updateAvatar = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string | undefined;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { avatar } = avatarSchema.parse(req.body);
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { avatar },
    select: { avatar: true },
  });
  return res.json({ avatar: updated.avatar });
});

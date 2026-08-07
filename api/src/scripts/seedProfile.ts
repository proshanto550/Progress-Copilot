/**
 * One-off seeder for the personalization profile. Run with:
 *
 *   cd api && npx tsx src/scripts/seedProfile.ts
 *
 * Updates the first User row it finds with the personal context
 * details so Edith has real information on the very first reply.
 *
 * Idempotent — re-running just re-applies the same patch.
 */
import 'dotenv/config';
import { prisma } from '../lib/prisma';

const PROSHANTO_PROFILE = {
  fullName: 'Proshanto Kumar Das',
  hometown: 'Sylhet, Bangladesh',
  university: 'Metropolitan University, Sylhet',
  degree: 'B.Sc. in Computer Science & Engineering (CSE)',
  yearSemester: '4th year, 1st semester',
  hobbies: 'Watching movies, listening to music, exploring new places',
  interests:
    'Productivity, self-improvement, software engineering, learning new tech, travel',
  aiBio:
    'Use Banglish (Bengali words in Latin script) and English naturally — like a friend. ' +
    'Be encouraging but direct; push me to take small actions today. ' +
    'I collaborate on Progress Copilot with my friend Tanim Sakib.',
};

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!user) {
    console.error('No users found — sign up first, then re-run this script.');
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: PROSHANTO_PROFILE,
    select: {
      id: true,
      fullName: true,
      email: true,
      hometown: true,
      university: true,
      degree: true,
      yearSemester: true,
    },
  });

  console.log('Seeded profile for:', updated.email);
  console.log('  name       :', updated.fullName);
  console.log('  hometown   :', updated.hometown);
  console.log('  university :', updated.university);
  console.log('  degree     :', updated.degree);
  console.log('  term       :', updated.yearSemester);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

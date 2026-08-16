import type { Request } from 'express';
import PDFDocument from 'pdfkit';
import { asyncHandler } from '../../lib/asyncHandler';
import { prisma } from '../../lib/prisma';
import { notFound } from '../../lib/errors';

export const getReportSummary = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      points: true,
      dailyStreak: true,
      createdAt: true,
    },
  });
  if (!user) throw notFound('User not found');

  const targets = await prisma.target.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });
  const notesCount = await prisma.note.count({ where: { userId } });
  const coursesCount = await prisma.course.count({ where: { userId } });

  const completedTargets = targets.filter((t) => t.status === 'COMPLETED').length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  return res.json({
    user,
    stats: {
      points: user.points,
      dailyStreak: user.dailyStreak,
      totalTargets: targets.length,
      completedTargets,
      targetCompletionRate: targets.length ? Math.round((completedTargets / targets.length) * 100) : 0,
      totalTasks: tasks.length,
      completedTasks,
      taskCompletionRate: tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0,
      notesCount,
      coursesCount,
    },
  });
});

export const downloadPDFReport = asyncHandler(async (req: Request, res) => {
  const userId = (req as any).user?.id as string;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw notFound('User not found');

  const targets = await prisma.target.findMany({ where: { userId } });
  const tasks = await prisma.task.findMany({ where: { userId } });
  const notesCount = await prisma.note.count({ where: { userId } });
  const coursesCount = await prisma.course.count({ where: { userId } });

  const completedTargets = targets.filter((t) => t.status === 'COMPLETED').length;
  const completedTasks = tasks.filter((t) => t.isCompleted).length;

  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Progress_Report_${user.fullName.replace(/\s+/g, '_')}.pdf"`,
  );

  doc.pipe(res);

  doc
    .fillColor('#7c3aed')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('PROGRESS COPILOT', { align: 'center' });
  doc
    .fontSize(10)
    .fillColor('#64748b')
    .text('A PLATFORM FOR SMARTER PROGRESS', { align: 'center' });
  doc.moveDown(1.5);

  doc
    .strokeColor('#e2e8f0')
    .lineWidth(1)
    .moveTo(50, doc.y)
    .lineTo(545, doc.y)
    .stroke();
  doc.moveDown(1.5);

  doc
    .fontSize(16)
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`User Progress Summary Report`);
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`Generated on: ${new Date().toLocaleDateString()}`);
  doc.moveDown(1);

  doc
    .fontSize(11)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`Name: `, { continued: true })
    .font('Helvetica')
    .text(user.fullName);
  doc
    .font('Helvetica-Bold')
    .text(`Email: `, { continued: true })
    .font('Helvetica')
    .text(user.email);
  doc.moveDown(1.5);

  doc
    .fontSize(14)
    .font('Helvetica-Bold')
    .fillColor('#7c3aed')
    .text('Key Productivity Metrics');
  doc.moveDown(0.5);

  doc
    .fontSize(11)
    .font('Helvetica')
    .fillColor('#1e293b')
    .text(`• Total Productivity Points: ${user.points} pts`)
    .text(`• Daily Streak: ${user.dailyStreak} Days`)
    .text(`• Targets Completed: ${completedTargets} / ${targets.length}`)
    .text(`• Tasks Completed: ${completedTasks} / ${tasks.length}`)
    .text(`• Total Study Notes: ${notesCount}`)
    .text(`• Total Enrolled Courses: ${coursesCount}`);

  doc.moveDown(2);

  if (targets.length > 0) {
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .fillColor('#7c3aed')
      .text('Active Targets Breakdown');
    doc.moveDown(0.5);

    targets.forEach((t, i) => {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#0f172a')
        .text(`${i + 1}. ${t.title} [Priority: ${t.priority}] - Status: ${t.status}`);
      if (t.description) {
        doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(`   Description: ${t.description}`);
      }
      doc.moveDown(0.3);
    });
  }

  doc.moveDown(2);
  doc
    .fontSize(9)
    .fillColor('#94a3b8')
    .font('Helvetica-Oblique')
    .text('Generated automatically by Progress Copilot. Keep tracking your growth!', {
      align: 'center',
    });

  doc.end();
});

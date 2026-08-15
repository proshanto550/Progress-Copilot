/*
  Warnings:

  - You are about to drop the column `internetType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `studentId` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "internetType",
DROP COLUMN "studentId";

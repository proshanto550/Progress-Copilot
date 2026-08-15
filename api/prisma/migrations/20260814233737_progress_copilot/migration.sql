/*
  Warnings:

  - You are about to drop the column `aiBio` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `degree` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hobbies` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `hometown` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `interests` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `university` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `yearSemester` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "aiBio",
DROP COLUMN "degree",
DROP COLUMN "hobbies",
DROP COLUMN "hometown",
DROP COLUMN "interests",
DROP COLUMN "university",
DROP COLUMN "yearSemester";

-- CreateEnum
CREATE TYPE "AddressKind" AS ENUM ('PRESENT', 'PERMANENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ageRange" TEXT,
ADD COLUMN     "aiBio" TEXT,
ADD COLUMN     "areaType" TEXT,
ADD COLUMN     "degree" TEXT,
ADD COLUMN     "employmentRole" TEXT,
ADD COLUMN     "hobbies" TEXT,
ADD COLUMN     "hometown" TEXT,
ADD COLUMN     "interests" TEXT,
ADD COLUMN     "internetType" TEXT,
ADD COLUMN     "mobileNumber" TEXT,
ADD COLUMN     "primaryDeviceType" TEXT,
ADD COLUMN     "studentId" TEXT,
ADD COLUMN     "university" TEXT,
ADD COLUMN     "yearSemester" TEXT;

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "AddressKind" NOT NULL,
    "district" TEXT,
    "streetAddress" TEXT,
    "sameAsPresent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "educationLevel" TEXT,
    "examDegreeTitle" TEXT,
    "institutionName" TEXT,
    "isCurrentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "passingYear" INTEGER,
    "currentYear" TEXT,
    "isCseStudent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "experienceInYear" TEXT,
    "projectLinks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_userId_kind_key" ON "Address"("userId", "kind");

-- CreateIndex
CREATE INDEX "Education_userId_idx" ON "Education"("userId");

-- CreateIndex
CREATE INDEX "Skill_userId_idx" ON "Skill"("userId");

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

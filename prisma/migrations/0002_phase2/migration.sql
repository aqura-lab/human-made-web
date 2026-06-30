-- Feedback: community promotion fields
ALTER TABLE "Feedback" ADD COLUMN "public" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Feedback" ADD COLUMN "publicTitle" TEXT;
ALTER TABLE "Feedback" ADD COLUMN "promotedAt" TIMESTAMP(3);
CREATE INDEX "Feedback_public_idx" ON "Feedback"("public");

-- User: per-user download release gate
ALTER TABLE "User" ADD COLUMN "downloadReleasedAt" TIMESTAMP(3);

-- FeedbackVote
CREATE TABLE "FeedbackVote" (
  "id" TEXT NOT NULL,
  "feedbackId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FeedbackVote_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FeedbackVote_feedbackId_userId_key" ON "FeedbackVote"("feedbackId", "userId");
CREATE INDEX "FeedbackVote_feedbackId_idx" ON "FeedbackVote"("feedbackId");
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_feedbackId_fkey"
  FOREIGN KEY ("feedbackId") REFERENCES "Feedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FeedbackVote" ADD CONSTRAINT "FeedbackVote_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Release
CREATE TABLE "Release" (
  "id" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "blobUrl" TEXT NOT NULL,
  "sizeBytes" INTEGER,
  "sha256" TEXT,
  "notes" TEXT,
  "isCurrent" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Release_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Release_isCurrent_idx" ON "Release"("isCurrent");

-- Setting
CREATE TABLE "Setting" (
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

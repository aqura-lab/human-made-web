-- Published certificates behind the public /c/[id] badge landing page.
CREATE TABLE "Certificate" (
  "id" TEXT NOT NULL,
  "signedJson" TEXT NOT NULL,
  "articleUrl" TEXT,
  "userId" TEXT,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

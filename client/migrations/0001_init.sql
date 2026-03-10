-- CreateTable Typescale
CREATE TABLE IF NOT EXISTS "Typescale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModifiedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "base" TEXT NOT NULL,
    "overrides" TEXT
);
-- CreateIndex
CREATE INDEX "Typescale_authorId_idx" ON "Typescale"("authorId");
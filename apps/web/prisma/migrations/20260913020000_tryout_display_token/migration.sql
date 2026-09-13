-- AlterTable
ALTER TABLE "tryouts" ADD COLUMN "token" TEXT;

-- Seeded demo tryout (hash lookup still uses token_hash)
UPDATE "tryouts" SET "token" = 'cq-demo-photosynthesis' WHERE "id" = 'tryout_demo';

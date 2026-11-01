ALTER TABLE "daily_quests" ADD COLUMN "activity_type" TEXT NOT NULL DEFAULT 'SPEAKING';
ALTER TABLE "daily_quests" ADD COLUMN "resource_url" TEXT;
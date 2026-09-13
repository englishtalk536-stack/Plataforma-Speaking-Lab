-- AlterTable
ALTER TABLE "skill_nodes" ADD COLUMN "cefr_level" TEXT;
ALTER TABLE "skill_nodes" ADD COLUMN "challenge_text" TEXT;
ALTER TABLE "skill_nodes" ADD COLUMN "grammar_hints" TEXT;
ALTER TABLE "skill_nodes" ADD COLUMN "target_vocabulary" TEXT;

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "completed_at" DATETIME,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_lesson_progress_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "skill_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "user_lesson_progress_user_id_idx" ON "user_lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_lesson_progress_node_id_idx" ON "user_lesson_progress"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_user_id_node_id_key" ON "user_lesson_progress"("user_id", "node_id");

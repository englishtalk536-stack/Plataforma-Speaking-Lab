-- AlterTable
ALTER TABLE "classroom_memberships" ADD COLUMN "english_level" TEXT;

-- CreateTable
CREATE TABLE "student_english_level_changes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "membership_id" TEXT NOT NULL,
    "previous_level" TEXT,
    "new_level" TEXT NOT NULL,
    "changed_by_teacher_id" TEXT NOT NULL,
    "changed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "student_english_level_changes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "classroom_memberships" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "student_english_level_changes_changed_by_teacher_id_fkey" FOREIGN KEY ("changed_by_teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "student_english_level_changes_membership_id_changed_at_idx" ON "student_english_level_changes"("membership_id", "changed_at");

-- CreateIndex
CREATE INDEX "student_english_level_changes_changed_by_teacher_id_changed_at_idx" ON "student_english_level_changes"("changed_by_teacher_id", "changed_at");

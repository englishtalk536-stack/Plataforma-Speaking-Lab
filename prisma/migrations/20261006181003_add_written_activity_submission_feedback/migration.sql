-- CreateTable
CREATE TABLE "written_activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "written_activities_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activity_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "response_text" TEXT NOT NULL,
    "submitted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "activity_submissions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "written_activities" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "activity_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "submission_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submission_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "submission_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "activity_submissions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "submission_feedback_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "written_activities_classroom_id_created_at_idx" ON "written_activities"("classroom_id", "created_at");

-- CreateIndex
CREATE INDEX "activity_submissions_activity_id_idx" ON "activity_submissions"("activity_id");

-- CreateIndex
CREATE INDEX "activity_submissions_student_id_idx" ON "activity_submissions"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "activity_submissions_activity_id_student_id_key" ON "activity_submissions"("activity_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "submission_feedback_submission_id_key" ON "submission_feedback"("submission_id");

-- CreateIndex
CREATE INDEX "submission_feedback_teacher_id_idx" ON "submission_feedback"("teacher_id");

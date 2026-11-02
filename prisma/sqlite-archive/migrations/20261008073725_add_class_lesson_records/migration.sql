-- CreateTable
CREATE TABLE "class_lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taught_at" DATETIME NOT NULL,
    "notes" TEXT NOT NULL,
    "improvement_opportunities" TEXT,
    "homework" TEXT,
    "practice_node_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "class_lessons_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms" ("id") ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT "class_lessons_practice_node_id_fkey" FOREIGN KEY ("practice_node_id") REFERENCES "skill_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_lesson_recipients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "class_lesson_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_lesson_recipients_class_lesson_id_fkey" FOREIGN KEY ("class_lesson_id") REFERENCES "class_lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_lesson_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "class_lessons_classroom_id_taught_at_idx" ON "class_lessons"("classroom_id", "taught_at");

-- CreateIndex
CREATE INDEX "class_lessons_practice_node_id_idx" ON "class_lessons"("practice_node_id");

-- CreateIndex
CREATE INDEX "class_lesson_recipients_student_id_created_at_idx" ON "class_lesson_recipients"("student_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "class_lesson_recipients_class_lesson_id_student_id_key" ON "class_lesson_recipients"("class_lesson_id", "student_id");

-- CreateTable
CREATE TABLE "virtual_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "join_url" TEXT NOT NULL,
    "scheduled_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "virtual_classes_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms" ("id") ON DELETE NO ACTION ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "virtual_class_attendances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "virtual_class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "join_clicked_at" DATETIME,
    "attendance_requested_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'NOT_REQUESTED',
    "validated_by_teacher_id" TEXT,
    "validated_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "virtual_class_attendances_virtual_class_id_fkey" FOREIGN KEY ("virtual_class_id") REFERENCES "virtual_classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "virtual_class_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "virtual_class_attendances_validated_by_teacher_id_fkey" FOREIGN KEY ("validated_by_teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "virtual_classes_classroom_id_scheduled_at_idx" ON "virtual_classes"("classroom_id", "scheduled_at");

-- CreateIndex
CREATE INDEX "virtual_classes_classroom_id_status_idx" ON "virtual_classes"("classroom_id", "status");

-- CreateIndex
CREATE INDEX "virtual_class_attendances_virtual_class_id_status_idx" ON "virtual_class_attendances"("virtual_class_id", "status");

-- CreateIndex
CREATE INDEX "virtual_class_attendances_student_id_status_idx" ON "virtual_class_attendances"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "virtual_class_attendances_virtual_class_id_student_id_key" ON "virtual_class_attendances"("virtual_class_id", "student_id");

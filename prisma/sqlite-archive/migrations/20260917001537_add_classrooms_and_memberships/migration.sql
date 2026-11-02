-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "teacher_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "classroom_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classroom_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "classroom_memberships_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "classroom_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "classrooms_teacher_id_idx" ON "classrooms"("teacher_id");

-- CreateIndex
CREATE INDEX "classrooms_status_idx" ON "classrooms"("status");

-- CreateIndex
CREATE INDEX "classrooms_level_idx" ON "classrooms"("level");

-- CreateIndex
CREATE INDEX "classroom_memberships_classroom_id_idx" ON "classroom_memberships"("classroom_id");

-- CreateIndex
CREATE INDEX "classroom_memberships_user_id_idx" ON "classroom_memberships"("user_id");

-- CreateIndex
CREATE INDEX "classroom_memberships_classroom_id_status_idx" ON "classroom_memberships"("classroom_id", "status");

-- CreateIndex
CREATE INDEX "classroom_memberships_user_id_status_idx" ON "classroom_memberships"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "classroom_memberships_classroom_id_user_id_key" ON "classroom_memberships"("classroom_id", "user_id");

CREATE TABLE "teacher_student_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "teacher_student_conversations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_student_conversations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "teacher_student_conversations_teacher_id_student_id_key" ON "teacher_student_conversations"("teacher_id", "student_id");
CREATE INDEX "teacher_student_conversations_teacher_id_updated_at_idx" ON "teacher_student_conversations"("teacher_id", "updated_at");
CREATE INDEX "teacher_student_conversations_student_id_updated_at_idx" ON "teacher_student_conversations"("student_id", "updated_at");

CREATE TABLE "teacher_student_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_student_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "teacher_student_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "teacher_student_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "teacher_student_messages_conversation_id_created_at_idx" ON "teacher_student_messages"("conversation_id", "created_at");
CREATE INDEX "teacher_student_messages_conversation_id_sender_id_read_at_idx" ON "teacher_student_messages"("conversation_id", "sender_id", "read_at");
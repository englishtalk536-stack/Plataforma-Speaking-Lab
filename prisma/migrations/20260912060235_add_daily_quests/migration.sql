-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "radar_fluency" REAL NOT NULL DEFAULT 0,
    "radar_grammar" REAL NOT NULL DEFAULT 0,
    "radar_pronunciation" REAL NOT NULL DEFAULT 0,
    "radar_vocabulary" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" DATETIME NOT NULL,
    "freeze_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "xp_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "xp_amount" INTEGER NOT NULL,
    "source_type" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "xp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_value" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "unlocked_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "skill_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level_required" INTEGER NOT NULL,
    "parent_node_id" TEXT,
    "xp_reward" INTEGER NOT NULL,
    "position_x" REAL NOT NULL,
    "position_y" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "skill_nodes_parent_node_id_fkey" FOREIGN KEY ("parent_node_id") REFERENCES "skill_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_skill_progress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_skill_progress_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "skill_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost_coins" INTEGER NOT NULL,
    "item_type" TEXT NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "purchased_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" DATETIME,
    CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "store_items" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "scenario_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "text_content" TEXT NOT NULL,
    "audio_url" TEXT,
    "feedback" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "class_bookings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "scheduled_at" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "class_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_bookings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "teacher_feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "booking_id" TEXT NOT NULL,
    "fluency_score" REAL NOT NULL,
    "grammar_score" REAL NOT NULL,
    "pronunciation_score" REAL NOT NULL,
    "vocabulary_score" REAL NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "class_bookings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "coin_reward" INTEGER NOT NULL,
    "scenario_type" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_daily_quests" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "assigned_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_daily_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_daily_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "daily_quests" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "streaks_user_id_key" ON "streaks"("user_id");

-- CreateIndex
CREATE INDEX "xp_logs_user_id_idx" ON "xp_logs"("user_id");

-- CreateIndex
CREATE INDEX "xp_logs_created_at_idx" ON "xp_logs"("created_at");

-- CreateIndex
CREATE INDEX "xp_logs_user_id_source_type_idx" ON "xp_logs"("user_id", "source_type");

-- CreateIndex
CREATE INDEX "user_badges_user_id_idx" ON "user_badges"("user_id");

-- CreateIndex
CREATE INDEX "user_badges_badge_id_idx" ON "user_badges"("badge_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "skill_nodes_parent_node_id_idx" ON "skill_nodes"("parent_node_id");

-- CreateIndex
CREATE INDEX "user_skill_progress_user_id_idx" ON "user_skill_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_skill_progress_node_id_idx" ON "user_skill_progress"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_skill_progress_user_id_node_id_key" ON "user_skill_progress"("user_id", "node_id");

-- CreateIndex
CREATE INDEX "store_items_is_active_idx" ON "store_items"("is_active");

-- CreateIndex
CREATE INDEX "user_inventory_user_id_idx" ON "user_inventory"("user_id");

-- CreateIndex
CREATE INDEX "user_inventory_item_id_idx" ON "user_inventory"("item_id");

-- CreateIndex
CREATE INDEX "user_inventory_user_id_status_idx" ON "user_inventory"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_idx" ON "ai_conversations"("user_id");

-- CreateIndex
CREATE INDEX "ai_conversations_user_id_status_idx" ON "ai_conversations"("user_id", "status");

-- CreateIndex
CREATE INDEX "ai_messages_conversation_id_idx" ON "ai_messages"("conversation_id");

-- CreateIndex
CREATE INDEX "ai_messages_created_at_idx" ON "ai_messages"("created_at");

-- CreateIndex
CREATE INDEX "class_bookings_student_id_idx" ON "class_bookings"("student_id");

-- CreateIndex
CREATE INDEX "class_bookings_teacher_id_idx" ON "class_bookings"("teacher_id");

-- CreateIndex
CREATE INDEX "class_bookings_scheduled_at_idx" ON "class_bookings"("scheduled_at");

-- CreateIndex
CREATE INDEX "class_bookings_student_id_status_idx" ON "class_bookings"("student_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_feedback_booking_id_key" ON "teacher_feedback"("booking_id");

-- CreateIndex
CREATE INDEX "daily_quests_is_active_idx" ON "daily_quests"("is_active");

-- CreateIndex
CREATE INDEX "user_daily_quests_user_id_assigned_date_idx" ON "user_daily_quests"("user_id", "assigned_date");

-- CreateIndex
CREATE UNIQUE INDEX "user_daily_quests_user_id_quest_id_assigned_date_key" ON "user_daily_quests"("user_id", "quest_id", "assigned_date");

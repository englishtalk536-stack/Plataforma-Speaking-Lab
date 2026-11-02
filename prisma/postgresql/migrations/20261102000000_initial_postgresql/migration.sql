-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserAccessStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "EnglishLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "XpSource" AS ENUM ('CLASS_ATTENDANCE', 'DAILY_VOICE_QUEST', 'AI_PRACTICE', 'TEACHER_REWARD', 'MODULE_EVALUATION', 'SYSTEM_BONUS');

-- CreateEnum
CREATE TYPE "NodeStatus" AS ENUM ('LOCKED', 'UNLOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('LESSON_VOUCHER', 'STREAK_FREEZE', 'WORKSHOP_PASS', 'CUSTOM_AVATAR');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ScenarioType" AS ENUM ('ROLEPLAY_CAFE', 'JOB_INTERVIEW', 'AIRPORT_CHECKIN', 'FREE_TALK', 'BUSINESS_NEGOTIATION');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'AI');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VirtualClassStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VirtualClassAttendanceStatus" AS ENUM ('NOT_REQUESTED', 'PENDING_VALIDATION', 'ATTENDED', 'ABSENT');

-- CreateEnum
CREATE TYPE "DailyQuestStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ClassroomStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ClassroomMembershipStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "access_status" "UserAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "level" INTEGER NOT NULL DEFAULT 1,
    "current_xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "radar_fluency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "radar_grammar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "radar_pronunciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "radar_vocabulary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "max_streak" INTEGER NOT NULL DEFAULT 0,
    "last_activity_date" TIMESTAMP(3) NOT NULL,
    "freeze_credits" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "xp_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "xp_amount" INTEGER NOT NULL,
    "source_type" "XpSource" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "xp_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon_url" TEXT NOT NULL,
    "condition_type" TEXT NOT NULL,
    "condition_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_nodes" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level_required" INTEGER NOT NULL,
    "parent_node_id" TEXT,
    "xp_reward" INTEGER NOT NULL,
    "coin_reward" INTEGER NOT NULL DEFAULT 0,
    "cefr_level" TEXT,
    "challenge_text" TEXT,
    "target_vocabulary" TEXT,
    "grammar_hints" TEXT,
    "position_x" DOUBLE PRECISION NOT NULL,
    "position_y" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skill_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "status" "NodeStatus" NOT NULL DEFAULT 'LOCKED',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skill_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_lesson_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,

    CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classrooms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" TEXT,
    "teacher_id" TEXT NOT NULL,
    "status" "ClassroomStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classroom_memberships" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "ClassroomMembershipStatus" NOT NULL DEFAULT 'ACTIVE',
    "english_level" "EnglishLevel",
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classroom_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_invitations" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "classroom_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_english_level_changes" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "previous_level" "EnglishLevel",
    "new_level" "EnglishLevel" NOT NULL,
    "changed_by_teacher_id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "student_english_level_changes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "written_activities" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "written_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_submissions" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "response_text" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_feedback" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "score" INTEGER,
    "comment" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submission_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_classes" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "join_url" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "VirtualClassStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "virtual_class_attendances" (
    "id" TEXT NOT NULL,
    "virtual_class_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "join_clicked_at" TIMESTAMP(3),
    "attendance_requested_at" TIMESTAMP(3),
    "status" "VirtualClassAttendanceStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
    "validated_by_teacher_id" TEXT,
    "validated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_class_attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_lessons" (
    "id" TEXT NOT NULL,
    "classroom_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taught_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "improvement_opportunities" TEXT,
    "homework" TEXT,
    "practice_node_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_lesson_recipients" (
    "id" TEXT NOT NULL,
    "class_lesson_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_lesson_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "href" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "cost_coins" INTEGER NOT NULL,
    "item_type" "ItemType" NOT NULL,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_inventory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemed_at" TIMESTAMP(3),

    CONSTRAINT "user_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "scenario_type" "ScenarioType" NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "text_content" TEXT NOT NULL,
    "audio_url" TEXT,
    "feedback" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_bookings" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_feedback" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "fluency_score" DOUBLE PRECISION NOT NULL,
    "grammar_score" DOUBLE PRECISION NOT NULL,
    "pronunciation_score" DOUBLE PRECISION NOT NULL,
    "vocabulary_score" DOUBLE PRECISION NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_quests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "xp_reward" INTEGER NOT NULL,
    "coin_reward" INTEGER NOT NULL,
    "scenario_type" "ScenarioType",
    "activity_type" TEXT NOT NULL DEFAULT 'SPEAKING',
    "resource_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_daily_quests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quest_id" TEXT NOT NULL,
    "assigned_date" TIMESTAMP(3) NOT NULL,
    "status" "DailyQuestStatus" NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_daily_quests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_student_conversations" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_student_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_student_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_student_messages_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "user_lesson_progress_user_id_idx" ON "user_lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "user_lesson_progress_node_id_idx" ON "user_lesson_progress"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_lesson_progress_user_id_node_id_key" ON "user_lesson_progress"("user_id", "node_id");

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

-- CreateIndex
CREATE UNIQUE INDEX "account_invitations_token_hash_key" ON "account_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "account_invitations_email_role_used_at_idx" ON "account_invitations"("email", "role", "used_at");

-- CreateIndex
CREATE INDEX "account_invitations_expires_at_idx" ON "account_invitations"("expires_at");

-- CreateIndex
CREATE INDEX "student_english_level_changes_membership_id_changed_at_idx" ON "student_english_level_changes"("membership_id", "changed_at");

-- CreateIndex
CREATE INDEX "student_english_level_changes_changed_by_teacher_id_changed_idx" ON "student_english_level_changes"("changed_by_teacher_id", "changed_at");

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

-- CreateIndex
CREATE INDEX "class_lessons_classroom_id_taught_at_idx" ON "class_lessons"("classroom_id", "taught_at");

-- CreateIndex
CREATE INDEX "class_lessons_practice_node_id_idx" ON "class_lessons"("practice_node_id");

-- CreateIndex
CREATE INDEX "class_lesson_recipients_student_id_created_at_idx" ON "class_lesson_recipients"("student_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "class_lesson_recipients_class_lesson_id_student_id_key" ON "class_lesson_recipients"("class_lesson_id", "student_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

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

-- CreateIndex
CREATE INDEX "teacher_student_conversations_teacher_id_updated_at_idx" ON "teacher_student_conversations"("teacher_id", "updated_at");

-- CreateIndex
CREATE INDEX "teacher_student_conversations_student_id_updated_at_idx" ON "teacher_student_conversations"("student_id", "updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_student_conversations_teacher_id_student_id_key" ON "teacher_student_conversations"("teacher_id", "student_id");

-- CreateIndex
CREATE INDEX "teacher_student_messages_conversation_id_created_at_idx" ON "teacher_student_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "teacher_student_messages_conversation_id_sender_id_read_at_idx" ON "teacher_student_messages"("conversation_id", "sender_id", "read_at");

-- AddForeignKey
ALTER TABLE "streaks" ADD CONSTRAINT "streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "xp_logs" ADD CONSTRAINT "xp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_parent_node_id_fkey" FOREIGN KEY ("parent_node_id") REFERENCES "skill_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_progress" ADD CONSTRAINT "user_skill_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skill_progress" ADD CONSTRAINT "user_skill_progress_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_lesson_progress" ADD CONSTRAINT "user_lesson_progress_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "skill_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_memberships" ADD CONSTRAINT "classroom_memberships_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classroom_memberships" ADD CONSTRAINT "classroom_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_english_level_changes" ADD CONSTRAINT "student_english_level_changes_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "classroom_memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_english_level_changes" ADD CONSTRAINT "student_english_level_changes_changed_by_teacher_id_fkey" FOREIGN KEY ("changed_by_teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "written_activities" ADD CONSTRAINT "written_activities_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "written_activities"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_submissions" ADD CONSTRAINT "activity_submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "activity_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_feedback" ADD CONSTRAINT "submission_feedback_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_classes" ADD CONSTRAINT "virtual_classes_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_class_attendances" ADD CONSTRAINT "virtual_class_attendances_virtual_class_id_fkey" FOREIGN KEY ("virtual_class_id") REFERENCES "virtual_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_class_attendances" ADD CONSTRAINT "virtual_class_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "virtual_class_attendances" ADD CONSTRAINT "virtual_class_attendances_validated_by_teacher_id_fkey" FOREIGN KEY ("validated_by_teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lessons" ADD CONSTRAINT "class_lessons_practice_node_id_fkey" FOREIGN KEY ("practice_node_id") REFERENCES "skill_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lesson_recipients" ADD CONSTRAINT "class_lesson_recipients_class_lesson_id_fkey" FOREIGN KEY ("class_lesson_id") REFERENCES "class_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_lesson_recipients" ADD CONSTRAINT "class_lesson_recipients_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_inventory" ADD CONSTRAINT "user_inventory_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "store_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_bookings" ADD CONSTRAINT "class_bookings_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_feedback" ADD CONSTRAINT "teacher_feedback_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "class_bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_daily_quests" ADD CONSTRAINT "user_daily_quests_quest_id_fkey" FOREIGN KEY ("quest_id") REFERENCES "daily_quests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_student_conversations" ADD CONSTRAINT "teacher_student_conversations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_student_conversations" ADD CONSTRAINT "teacher_student_conversations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_student_messages" ADD CONSTRAINT "teacher_student_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "teacher_student_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_student_messages" ADD CONSTRAINT "teacher_student_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

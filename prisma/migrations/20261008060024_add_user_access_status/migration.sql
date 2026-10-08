-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "role" TEXT NOT NULL DEFAULT 'STUDENT',
    "access_status" TEXT NOT NULL DEFAULT 'ACTIVE',
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
INSERT INTO "new_users" ("avatar_url", "coins", "created_at", "current_xp", "email", "full_name", "id", "level", "password_hash", "radar_fluency", "radar_grammar", "radar_pronunciation", "radar_vocabulary", "role", "updated_at") SELECT "avatar_url", "coins", "created_at", "current_xp", "email", "full_name", "id", "level", "password_hash", "radar_fluency", "radar_grammar", "radar_pronunciation", "radar_vocabulary", "role", "updated_at" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

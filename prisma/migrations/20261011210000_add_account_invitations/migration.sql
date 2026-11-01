CREATE TABLE "account_invitations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token_hash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "classroom_id" TEXT,
    "created_by_id" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "account_invitations_classroom_id_fkey" FOREIGN KEY ("classroom_id") REFERENCES "classrooms" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "account_invitations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "account_invitations_token_hash_key" ON "account_invitations"("token_hash");
CREATE INDEX "account_invitations_email_role_used_at_idx" ON "account_invitations"("email", "role", "used_at");
CREATE INDEX "account_invitations_expires_at_idx" ON "account_invitations"("expires_at");
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_skill_nodes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level_required" INTEGER NOT NULL,
    "parent_node_id" TEXT,
    "xp_reward" INTEGER NOT NULL,
    "coin_reward" INTEGER NOT NULL DEFAULT 0,
    "position_x" REAL NOT NULL,
    "position_y" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "skill_nodes_parent_node_id_fkey" FOREIGN KEY ("parent_node_id") REFERENCES "skill_nodes" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_skill_nodes" ("created_at", "description", "id", "level_required", "parent_node_id", "position_x", "position_y", "title", "updated_at", "xp_reward") SELECT "created_at", "description", "id", "level_required", "parent_node_id", "position_x", "position_y", "title", "updated_at", "xp_reward" FROM "skill_nodes";
DROP TABLE "skill_nodes";
ALTER TABLE "new_skill_nodes" RENAME TO "skill_nodes";
CREATE INDEX "skill_nodes_parent_node_id_idx" ON "skill_nodes"("parent_node_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

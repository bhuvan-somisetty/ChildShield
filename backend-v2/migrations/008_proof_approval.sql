-- Photo Proof + Parent Approval. Backward-compatible: one new table for proof
-- blobs. Task-level proof/approval fields live in the existing `tasks` JSONB
-- (requireProof, requireApproval, approvalStatus, approvalComment…) so no task
-- schema change is needed.

CREATE TABLE IF NOT EXISTS task_proofs (
  id          TEXT PRIMARY KEY,
  task_id     TEXT,
  family_id   TEXT,
  child_id    TEXT,
  at          BIGINT,
  data        JSONB NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_task_proofs_task ON task_proofs(task_id, at);
CREATE INDEX IF NOT EXISTS idx_task_proofs_family ON task_proofs(family_id, child_id);

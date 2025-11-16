-- Add reflection column to roles table
ALTER TABLE roles ADD COLUMN IF NOT EXISTS reflection TEXT NOT NULL DEFAULT '';
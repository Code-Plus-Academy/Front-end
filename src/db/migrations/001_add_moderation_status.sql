-- Migration: 001_add_moderation_status
-- Adds moderation_status column to content tables

ALTER TABLE IF EXISTS notes 
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'under_review', 'removed', 'restored'));

ALTER TABLE IF EXISTS videos 
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'under_review', 'removed', 'restored'));

ALTER TABLE IF EXISTS articles 
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'under_review', 'removed', 'restored'));

ALTER TABLE IF EXISTS posts 
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'under_review', 'removed', 'restored'));

ALTER TABLE IF EXISTS comments 
  ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) NOT NULL DEFAULT 'active'
  CHECK (moderation_status IN ('active', 'under_review', 'removed', 'restored'));

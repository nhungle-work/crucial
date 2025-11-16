-- Add three separate reflection columns to weekly_planners table
ALTER TABLE weekly_planners 
  ADD COLUMN reflection_goals TEXT DEFAULT '',
  ADD COLUMN reflection_challenges TEXT DEFAULT '',
  ADD COLUMN reflection_decisions TEXT DEFAULT '';

-- Migrate existing reflection data to the first field (goals)
UPDATE weekly_planners 
SET reflection_goals = COALESCE(reflection, '')
WHERE reflection IS NOT NULL;

-- Drop the old reflection column
ALTER TABLE weekly_planners DROP COLUMN reflection;
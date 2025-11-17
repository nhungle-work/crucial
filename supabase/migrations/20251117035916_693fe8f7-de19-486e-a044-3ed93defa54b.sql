-- Remove reflection columns from weekly_planners table
ALTER TABLE weekly_planners 
DROP COLUMN IF EXISTS reflection_goals,
DROP COLUMN IF EXISTS reflection_challenges,
DROP COLUMN IF EXISTS reflection_decisions;
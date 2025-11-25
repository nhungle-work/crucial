-- Add reflection columns to weekly_planners table
ALTER TABLE public.weekly_planners 
ADD COLUMN IF NOT EXISTS reflection_goals_achieved text DEFAULT '',
ADD COLUMN IF NOT EXISTS reflection_challenges_faced text DEFAULT '',
ADD COLUMN IF NOT EXISTS reflection_decisions_made text DEFAULT '';
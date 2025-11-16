-- Add reflection column to weekly_planners table
ALTER TABLE public.weekly_planners ADD COLUMN reflection TEXT DEFAULT '';

-- Remove reflection column from roles table
ALTER TABLE public.roles DROP COLUMN reflection;
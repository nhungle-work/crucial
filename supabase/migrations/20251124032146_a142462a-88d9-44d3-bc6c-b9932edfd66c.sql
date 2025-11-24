-- Add is_priority column to roles table
ALTER TABLE public.roles 
ADD COLUMN is_priority boolean NOT NULL DEFAULT false;

-- Add is_pinned column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_pinned boolean NOT NULL DEFAULT false;

-- Add comment to explain the columns
COMMENT ON COLUMN public.roles.is_priority IS 'Marks role as one of the 3 most important roles for the week';
COMMENT ON COLUMN public.tasks.is_pinned IS 'Marks task as one of the 3 most important tasks for the day';
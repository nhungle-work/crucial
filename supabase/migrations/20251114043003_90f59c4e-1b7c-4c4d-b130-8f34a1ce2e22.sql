-- Create weekly planner tables with user isolation

-- Table for weekly data (stores week start date and user)
CREATE TABLE public.weekly_planners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Table for roles (7 roles per week)
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES public.weekly_planners(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  goal TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  role_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(planner_id, role_index),
  CHECK (role_index >= 0 AND role_index < 7)
);

-- Table for tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID NOT NULL REFERENCES public.weekly_planners(id) ON DELETE CASCADE,
  role_index INTEGER NOT NULL,
  day TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (role_index >= 0 AND role_index < 7),
  CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'))
);

-- Enable RLS
ALTER TABLE public.weekly_planners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for weekly_planners
CREATE POLICY "Users can view their own planners"
  ON public.weekly_planners FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planners"
  ON public.weekly_planners FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planners"
  ON public.weekly_planners FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planners"
  ON public.weekly_planners FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for roles
CREATE POLICY "Users can view their own roles"
  ON public.roles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own roles"
  ON public.roles FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own roles"
  ON public.roles FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own roles"
  ON public.roles FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

-- RLS Policies for tasks
CREATE POLICY "Users can view their own tasks"
  ON public.tasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own tasks"
  ON public.tasks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.weekly_planners
    WHERE id = planner_id AND user_id = auth.uid()
  ));

-- Indexes for better performance
CREATE INDEX idx_weekly_planners_user_week ON public.weekly_planners(user_id, week_start);
CREATE INDEX idx_roles_planner ON public.roles(planner_id);
CREATE INDEX idx_tasks_planner ON public.tasks(planner_id);

-- Triggers for updated_at
CREATE TRIGGER update_weekly_planners_updated_at
  BEFORE UPDATE ON public.weekly_planners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
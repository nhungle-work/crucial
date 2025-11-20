import { supabase } from "./client";
import { Tables, TablesInsert } from "./types";

// Type definitions based on database schema
export type WeeklyPlan = Tables<"weekly_planners"> & {
  roles?: Role[];
  tasks?: Task[];
};

export type Role = Tables<"roles">;
export type Task = Tables<"tasks">;

export type WeeklyPlanInsert = TablesInsert<"weekly_planners">;
export type RoleInsert = TablesInsert<"roles">;
export type TaskInsert = TablesInsert<"tasks">;

// Fetch all weekly plans for a user
export async function fetchPlans(userId: string): Promise<WeeklyPlan[]> {
  const { data: plans, error: plansError } = await supabase
    .from("weekly_planners")
    .select("*")
    .eq("user_id", userId)
    .order("week_start", { ascending: false });

  if (plansError) {
    console.error("Error fetching plans:", plansError);
    throw plansError;
  }

  if (!plans || plans.length === 0) {
    return [];
  }

  // Fetch roles and tasks for each plan
  const plansWithDetails = await Promise.all(
    plans.map(async (plan) => {
      const [rolesResult, tasksResult] = await Promise.all([
        supabase
          .from("roles")
          .select("*")
          .eq("planner_id", plan.id)
          .order("role_index", { ascending: true }),
        supabase
          .from("tasks")
          .select("*")
          .eq("planner_id", plan.id),
      ]);

      return {
        ...plan,
        roles: rolesResult.data || [],
        tasks: tasksResult.data || [],
      };
    })
  );

  return plansWithDetails;
}

// Create a new weekly plan
export async function createPlan(
  userId: string,
  weekStart: string,
  roles: Array<{ name: string; goal: string; note: string; role_index: number }>,
  tasks: Array<{ role_index: number; day: string; text: string; completed: boolean }>
): Promise<WeeklyPlan> {
  // Create the weekly planner
  const { data: planner, error: plannerError } = await supabase
    .from("weekly_planners")
    .insert({
      user_id: userId,
      week_start: weekStart,
    })
    .select()
    .single();

  if (plannerError || !planner) {
    console.error("Error creating planner:", plannerError);
    throw plannerError;
  }

  // Insert roles
  const rolesData = roles.map((role) => ({
    planner_id: planner.id,
    name: role.name,
    goal: role.goal,
    note: role.note,
    role_index: role.role_index,
  }));

  const { data: insertedRoles, error: rolesError } = await supabase
    .from("roles")
    .insert(rolesData)
    .select();

  if (rolesError) {
    console.error("Error creating roles:", rolesError);
    throw rolesError;
  }

  // Insert tasks
  let insertedTasks: Task[] = [];
  if (tasks.length > 0) {
    const tasksData = tasks.map((task) => ({
      planner_id: planner.id,
      role_index: task.role_index,
      day: task.day,
      text: task.text,
      completed: task.completed,
    }));

    const { data: tasksResult, error: tasksError } = await supabase
      .from("tasks")
      .insert(tasksData)
      .select();

    if (tasksError) {
      console.error("Error creating tasks:", tasksError);
      throw tasksError;
    }
    
    insertedTasks = tasksResult || [];
  }

  return {
    ...planner,
    roles: insertedRoles || [],
    tasks: insertedTasks,
  };
}

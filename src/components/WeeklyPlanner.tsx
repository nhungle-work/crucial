import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartyPopper, Calendar, ChevronLeft, ChevronRight, GripVertical, Star, Pin, Moon, Sun, Menu, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface Role {
  name: string;
  goal: string;
  note: string;
  isPriority: boolean;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  roleIndex: number;
  day: string;
  isPinned: boolean;
}

interface WeekData {
  roles: Role[];
  tasks: Task[];
  weekStart: string;
  plannerId?: string;
  reflectionGoalsAchieved?: string;
  reflectionChallengesFaced?: string;
  reflectionDecisionsMade?: string;
}

interface WeeklyPlannerProps {
  onOpenTutorial: () => void;
  onOpenFeedback: () => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  username: string;
  email: string;
  theme: string | undefined;
  onThemeToggle: () => void;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CELEBRATION_MESSAGES = [
  "🌟 Amazing! You're crushing it!",
  "✨ Way to go! Keep it up!",
  "🎉 Fantastic work!",
  "💪 You're on fire!",
  "🚀 Unstoppable!",
  "⭐ Keep shining!",
  "🎯 Nailed it!",
];

export default function WeeklyPlanner({ 
  onOpenTutorial, 
  onOpenFeedback,
  onOpenProfile,
  onLogout,
  username,
  email,
  theme,
  onThemeToggle
}: WeeklyPlannerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    const monday = getMonday(new Date());
    return formatLocalDate(monday);
  });

  const [weekData, setWeekData] = useState<WeekData>({
    roles: Array(7).fill(null).map(() => ({ name: "", goal: "", note: "", isPriority: false })),
    tasks: [],
    weekStart: currentWeekStart,
  });

  const [loading, setLoading] = useState(true);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [draggedRoleIndex, setDraggedRoleIndex] = useState<number | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>("Monday");
  const [newTaskInput, setNewTaskInput] = useState<{ roleIndex: number; day: string; text: string } | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskText, setEditingTaskText] = useState<string>("");
  
  // Editing states for Role, Goal, Note
  const [editingField, setEditingField] = useState<{ roleIndex: number; field: 'name' | 'goal' | 'note'; value: string } | null>(null);
  
  // Editing states for Weekly Reflection
  const [editingReflection, setEditingReflection] = useState<{ field: 'reflectionGoalsAchieved' | 'reflectionChallengesFaced' | 'reflectionDecisionsMade'; value: string } | null>(null);
  
  const isMobile = useIsMobile();

  // Load week data from database
  useEffect(() => {
    loadWeekData(currentWeekStart);
  }, [currentWeekStart]);

  // Auto-resize all textareas when data changes
  useEffect(() => {
    const resizeAllTextareas = () => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    };
    
    setTimeout(resizeAllTextareas, 10);
  }, [weekData]);

  function formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function getMonday(date: Date) {
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function formatDateRange(startDate: string) {
    const start = parseLocalDate(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
  }

  function getDayDate(dayIndex: number): string {
    const start = parseLocalDate(currentWeekStart);
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + dayIndex);
    const day = String(dayDate.getDate()).padStart(2, '0');
    const month = String(dayDate.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  async function loadWeekData(weekStart: string) {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to access your planner");
        return;
      }

      // Get or create planner for this week
      let { data: planner, error: plannerError } = await supabase
        .from('weekly_planners')
        .select('id, reflection_goals_achieved, reflection_challenges_faced, reflection_decisions_made')
        .eq('user_id', user.id)
        .eq('week_start', weekStart)
        .maybeSingle();

      if (plannerError) {
        console.error('Error loading planner:', plannerError);
        toast.error("Failed to load planner");
        return;
      }

      let plannerId: string;

      if (!planner) {
        // Create new planner
        const { data: newPlanner, error: createError } = await (supabase as any)
          .from('weekly_planners')
          .insert({ user_id: user.id, week_start: weekStart })
          .select('id')
          .single();

        if (createError || !newPlanner) {
          console.error('Error creating planner:', createError);
          toast.error("Failed to create planner");
          return;
        }

        plannerId = newPlanner.id;

        // Initialize 7 empty roles
        const emptyRoles = Array(7).fill(null).map((_, index) => ({
          planner_id: plannerId,
          role_index: index,
          name: '',
          goal: '',
          note: '',
          is_priority: false
        }));

        await supabase.from('roles').insert(emptyRoles);
      } else {
        plannerId = planner.id;
      }

      // Load roles and tasks
      const [rolesResult, tasksResult] = await Promise.all([
        supabase
          .from('roles')
          .select('*')
          .eq('planner_id', plannerId)
          .order('role_index'),
        supabase
          .from('tasks')
          .select('*')
          .eq('planner_id', plannerId)
      ]);

      if (rolesResult.error) {
        console.error('Error loading roles:', rolesResult.error);
        toast.error("Failed to load roles");
        return;
      }

      if (tasksResult.error) {
        console.error('Error loading tasks:', tasksResult.error);
        toast.error("Failed to load tasks");
        return;
      }

      const roles: Role[] = rolesResult.data.map(r => ({
        name: r.name,
        goal: r.goal,
        note: r.note,
        isPriority: r.is_priority || false
      }));

      const tasks: Task[] = tasksResult.data.map(t => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        roleIndex: t.role_index,
        day: t.day,
        isPinned: t.is_pinned || false
      }));

      setWeekData({
        roles,
        tasks,
        weekStart,
        plannerId,
        reflectionGoalsAchieved: planner?.reflection_goals_achieved || '',
        reflectionChallengesFaced: planner?.reflection_challenges_faced || '',
        reflectionDecisionsMade: planner?.reflection_decisions_made || '',
      });

    } catch (error) {
      console.error('Error loading week data:', error);
      toast.error("Failed to load week data");
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(index: number, field: keyof Role, value: string | boolean) {
    if (!weekData.plannerId) return;

    const updatedRoles = [...weekData.roles];
    updatedRoles[index] = { ...updatedRoles[index], [field]: value };
    setWeekData({ ...weekData, roles: updatedRoles });

    // Map field names to database column names
    const dbFieldMap: Record<string, string> = {
      'name': 'name',
      'goal': 'goal',
      'note': 'note',
      'isPriority': 'is_priority'
    };
    
    const dbField = dbFieldMap[field] || field;

    // Update in database
    const { error } = await supabase
      .from('roles')
      .update({ [dbField]: value })
      .eq('planner_id', weekData.plannerId)
      .eq('role_index', index);

    if (error) {
      console.error('Error updating role:', error);
      toast.error("Failed to update role");
    }
  }

  // Functions for editing Role/Goal/Note fields
  function startEditField(roleIndex: number, field: 'name' | 'goal' | 'note') {
    const currentValue = weekData.roles[roleIndex][field];
    setEditingField({ roleIndex, field, value: currentValue });
  }

  async function confirmEditField() {
    if (!editingField) return;
    await updateRole(editingField.roleIndex, editingField.field, editingField.value);
    setEditingField(null);
  }

  function cancelEditField() {
    setEditingField(null);
  }

  // Functions for editing Reflection fields
  function startEditReflection(field: 'reflectionGoalsAchieved' | 'reflectionChallengesFaced' | 'reflectionDecisionsMade') {
    const currentValue = weekData[field] || '';
    setEditingReflection({ field, value: currentValue });
  }

  async function confirmEditReflection() {
    if (!editingReflection) return;
    await updateReflection(editingReflection.field, editingReflection.value);
    setEditingReflection(null);
  }

  function cancelEditReflection() {
    setEditingReflection(null);
  }

  function startNewTask(roleIndex: number, day: string) {
    setNewTaskInput({ roleIndex, day, text: '' });
  }

  async function confirmNewTask() {
    if (!newTaskInput || !weekData.plannerId || !newTaskInput.text.trim()) {
      setNewTaskInput(null);
      return;
    }

    const newTaskData = {
      planner_id: weekData.plannerId,
      role_index: newTaskInput.roleIndex,
      day: newTaskInput.day,
      text: newTaskInput.text.trim(),
      completed: false
    };

    const { data, error } = await (supabase as any)
      .from('tasks')
      .insert(newTaskData)
      .select()
      .single();

    if (error || !data) {
      console.error('Error adding task:', error);
      toast.error("Failed to add task");
      return;
    }

    const newTask: Task = {
      id: data.id,
      text: data.text,
      completed: data.completed,
      roleIndex: data.role_index,
      day: data.day,
      isPinned: false
    };

    setWeekData({ ...weekData, tasks: [...weekData.tasks, newTask] });
    setNewTaskInput(null);
  }

  function cancelNewTask() {
    setNewTaskInput(null);
  }

  function startEditTask(taskId: string, currentText: string) {
    setEditingTaskId(taskId);
    setEditingTaskText(currentText);
  }

  async function confirmEditTask() {
    if (!editingTaskId || !editingTaskText.trim()) {
      setEditingTaskId(null);
      setEditingTaskText("");
      return;
    }

    await updateTask(editingTaskId, editingTaskText.trim());
    setEditingTaskId(null);
    setEditingTaskText("");
  }

  function cancelEditTask() {
    setEditingTaskId(null);
    setEditingTaskText("");
  }

  async function updateTask(taskId: string, text: string) {
    const updatedTasks = weekData.tasks.map(task =>
      task.id === taskId ? { ...task, text } : task
    );
    setWeekData({ ...weekData, tasks: updatedTasks });

    const { error } = await (supabase as any)
      .from('tasks')
      .update({ text })
      .eq('id', taskId);

    if (error) {
      console.error('Error updating task:', error);
      toast.error("Failed to update task");
    }
  }

  async function toggleTask(taskId: string) {
    const task = weekData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompleted = !task.completed;
    const updatedTasks = weekData.tasks.map(t =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    setWeekData({ ...weekData, tasks: updatedTasks });

    const { error } = await (supabase as any)
      .from('tasks')
      .update({ completed: newCompleted })
      .eq('id', taskId);

    if (error) {
      console.error('Error toggling task:', error);
      toast.error("Failed to update task");
      return;
    }

    if (newCompleted) {
      const randomMessage = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      setCelebration(randomMessage);
      setTimeout(() => setCelebration(null), 3000);
    }
  }

  async function deleteTask(taskId: string) {
    const updatedTasks = weekData.tasks.filter(t => t.id !== taskId);
    setWeekData({ ...weekData, tasks: updatedTasks });

    const { error } = await (supabase as any)
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      toast.error("Failed to delete task");
    }
  }

  async function toggleRolePriority(roleIndex: number) {
    if (!weekData.plannerId) return;

    const role = weekData.roles[roleIndex];
    const newPriority = !role.isPriority;

    // Count current priority roles
    const priorityCount = weekData.roles.filter(r => r.isPriority).length;

    // If trying to add a 4th priority role, prevent it
    if (newPriority && priorityCount >= 3) {
      toast.error("You can only highlight 3 roles at a time");
      return;
    }

    await updateRole(roleIndex, 'isPriority', newPriority);
  }

  async function toggleTaskPin(taskId: string, day: string) {
    const task = weekData.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newPinned = !task.isPinned;

    // Count current pinned tasks for this day
    const pinnedCount = weekData.tasks.filter(t => t.day === day && t.isPinned).length;

    // If trying to add a 4th pinned task, prevent it
    if (newPinned && pinnedCount >= 3) {
      toast.error("You can only pin 3 tasks per day");
      return;
    }

    const updatedTasks = weekData.tasks.map(t =>
      t.id === taskId ? { ...t, isPinned: newPinned } : t
    );
    setWeekData({ ...weekData, tasks: updatedTasks });

    const { error } = await (supabase as any)
      .from('tasks')
      .update({ is_pinned: newPinned })
      .eq('id', taskId);

    if (error) {
      console.error('Error toggling task pin:', error);
      toast.error("Failed to update task");
    }
  }

  async function updateReflection(field: 'reflectionGoalsAchieved' | 'reflectionChallengesFaced' | 'reflectionDecisionsMade', value: string) {
    if (!weekData.plannerId) return;

    setWeekData({ ...weekData, [field]: value });

    // Map field names to database column names
    const dbFieldMap = {
      'reflectionGoalsAchieved': 'reflection_goals_achieved',
      'reflectionChallengesFaced': 'reflection_challenges_faced',
      'reflectionDecisionsMade': 'reflection_decisions_made'
    };

    const dbField = dbFieldMap[field];

    const { error } = await supabase
      .from('weekly_planners')
      .update({ [dbField]: value })
      .eq('id', weekData.plannerId);

    if (error) {
      console.error('Error updating reflection:', error);
      toast.error("Failed to update reflection");
    }
  }

  function changeWeek(direction: "prev" | "next") {
    const current = parseLocalDate(currentWeekStart);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(formatLocalDate(newDate));
  }

  function handleDragStart(e: React.DragEvent, roleIndex: number) {
    setDraggedRoleIndex(roleIndex);
    e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  async function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    
    if (draggedRoleIndex === null || draggedRoleIndex === targetIndex || !weekData.plannerId) {
      setDraggedRoleIndex(null);
      return;
    }

    const newRoles = [...weekData.roles];
    const [draggedRole] = newRoles.splice(draggedRoleIndex, 1);
    newRoles.splice(targetIndex, 0, draggedRole);

    const newTasks = weekData.tasks.map(task => {
      if (task.roleIndex === draggedRoleIndex) {
        return { ...task, roleIndex: targetIndex };
      } else if (draggedRoleIndex < targetIndex && task.roleIndex > draggedRoleIndex && task.roleIndex <= targetIndex) {
        return { ...task, roleIndex: task.roleIndex - 1 };
      } else if (draggedRoleIndex > targetIndex && task.roleIndex >= targetIndex && task.roleIndex < draggedRoleIndex) {
        return { ...task, roleIndex: task.roleIndex + 1 };
      }
      return task;
    });

    setWeekData({ ...weekData, roles: newRoles, tasks: newTasks });
    setDraggedRoleIndex(null);

    // Update roles in database
    const roleUpdates = newRoles.map((role, index) =>
      (supabase as any)
        .from('roles')
        .update({ 
          name: role.name,
          goal: role.goal,
          note: role.note,
          role_index: index,
          is_priority: role.isPriority
        })
        .eq('planner_id', weekData.plannerId!)
        .eq('role_index', index)
    );

    await Promise.all(roleUpdates);

    // Update tasks in database
    const taskUpdates = newTasks.map(task =>
      (supabase as any)
        .from('tasks')
        .update({ role_index: task.roleIndex })
        .eq('id', task.id)
    );

    await Promise.all(taskUpdates);
    toast.success("Role order updated!");
  }

  const totalTasks = weekData.tasks.length;
  const completedTasks = weekData.tasks.filter(t => t.completed).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <p className="text-lg">Loading your planner...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className={isMobile ? "p-2" : "min-w-max p-2 sm:p-4 md:p-8 overflow-x-auto"}>
        <div className={`text-center mb-4 sm:mb-6 md:mb-8 relative ${!isMobile && "min-w-[2900px]"}`}>
          {/* Mobile: Drawer Menu */}
          {isMobile && (
            <div className="flex items-center justify-between mb-4 px-2">
              <Drawer>
                <DrawerTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Menu</DrawerTitle>
                    <DrawerDescription>Access your planner options</DrawerDescription>
                  </DrawerHeader>
                  <div className="flex flex-col gap-2 p-4">
                    <DrawerClose asChild>
                      <Button 
                        variant="outline" 
                        onClick={onOpenTutorial} 
                        className="justify-start"
                      >
                        <span className="mr-2">?</span>
                        How to design your week with Crucial
                      </Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Button 
                        variant="outline" 
                        onClick={onOpenFeedback} 
                        className="justify-start"
                      >
                        <span className="mr-2">✨</span>
                        Tell me your wish
                      </Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Button
                        variant="outline"
                        onClick={onOpenProfile}
                        className="justify-start"
                      >
                        <span className="font-semibold">{username}</span>
                        <span className="text-muted-foreground text-xs ml-2">({email})</span>
                      </Button>
                    </DrawerClose>
                    <DrawerClose asChild>
                      <Button variant="outline" onClick={onLogout}>
                        Logout
                      </Button>
                    </DrawerClose>
                  </div>
                </DrawerContent>
              </Drawer>
              <Button
                variant="outline"
                size="icon"
                onClick={onThemeToggle}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          )}
          
          {/* Desktop: Fixed Buttons */}
          {!isMobile && (
            <div className="absolute top-0 left-0 right-0 flex items-start justify-between mb-4 pointer-events-none">
              <div className="flex flex-col gap-2 pointer-events-auto">
                <Button 
                  variant="outline" 
                  onClick={onOpenTutorial} 
                  className="text-sm justify-start hover:bg-primary/10 hover:border-primary/30 transition-all hover:shadow-md"
                >
                  <span className="mr-2">?</span>
                  How to design your week with Crucial
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onOpenFeedback} 
                  className="text-sm justify-start hover:bg-secondary/10 hover:border-secondary/30 transition-all hover:shadow-md"
                >
                  <span className="mr-2">✨</span>
                  Tell me your wish
                </Button>
              </div>
              <div className="flex items-center gap-3 pointer-events-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onThemeToggle}
                  className="hover:bg-accent/20 hover:border-accent/30 transition-all hover:shadow-md"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                <Button
                  variant="outline"
                  onClick={onOpenProfile}
                  className="flex flex-col items-end text-sm hover:bg-accent/20 hover:border-primary/30 transition-all hover:shadow-md h-auto py-2 px-3"
                >
                  <span className="font-semibold text-foreground">{username}</span>
                  <span className="text-muted-foreground text-xs">{email}</span>
                </Button>
                <Button variant="outline" onClick={onLogout} className="hover:bg-destructive/10 hover:border-destructive/30 transition-all hover:shadow-md">
                  Logout
                </Button>
              </div>
            </div>
          )}

          <h1 className={`font-bold mb-2 sm:mb-3 ${isMobile ? "text-xl mt-2" : "text-2xl sm:text-3xl md:text-5xl mt-2"}`}>
            <span className="bg-gradient-to-r from-pink-400 to-green-300 bg-clip-text text-transparent">
              Weekly Planner
            </span>
          </h1>

          <div className="flex items-center justify-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeWeek("prev")}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className={`font-semibold text-foreground ${isMobile ? "text-sm" : "text-base sm:text-lg md:text-2xl"}`}>
                Week of: {formatDateRange(currentWeekStart)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeWeek("next")}
              className="hover:bg-primary/10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground italic mb-3 sm:mb-4">
            Keep important things important
          </p>

          <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </span>
            <span className="font-semibold text-primary">{completionPercentage}%</span>
          </div>
          <div className="w-full max-w-md mx-auto mt-2 bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {celebration && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
            <div className={`font-bold text-primary animate-bounce flex items-center gap-2 sm:gap-4 ${isMobile ? "text-2xl" : "text-3xl sm:text-4xl md:text-6xl"}`}>
              <PartyPopper className={isMobile ? "w-6 h-6" : "w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16"} />
              {celebration}
              <PartyPopper className={isMobile ? "w-6 h-6" : "w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16"} />
            </div>
          </div>
        )}

        {/* Mobile: Tabs for Days */}
        {isMobile ? (
          <div className="space-y-4">
            <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
              <TabsList className="grid grid-cols-4 w-full mb-4">
                {DAYS.slice(0, 4).map((day, index) => (
                  <TabsTrigger key={day} value={day} className="text-xs">
                    {day.substring(0, 3)} ({getDayDate(index)})
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsList className="grid grid-cols-3 w-full mb-4">
                {DAYS.slice(4, 7).map((day, index) => (
                  <TabsTrigger key={day} value={day} className="text-xs">
                    {day.substring(0, 3)} ({getDayDate(index + 4)})
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {DAYS.map((day) => (
                <TabsContent key={day} value={day} className="space-y-3">
                  {weekData.roles.map((role, roleIndex) => (
                    <Card key={roleIndex} className={`p-3 ${
                      role.isPriority 
                        ? 'bg-gradient-to-r from-primary/40 via-secondary/35 to-accent/40 border-primary border-2' 
                        : ''
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleRolePriority(roleIndex)}
                            className={`h-6 w-6 flex-shrink-0 ${
                              role.isPriority ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          >
                            <Star className={`w-4 h-4 ${role.isPriority ? 'fill-current' : ''}`} />
                          </Button>
                          <div className="flex-1">
                            <Textarea
                              value={role.name}
                              onChange={(e) => updateRole(roleIndex, "name", e.target.value)}
                              placeholder={`Role ${roleIndex + 1}`}
                              className="text-sm font-semibold mb-1"
                            />
                            <Textarea
                              value={role.goal}
                              onChange={(e) => updateRole(roleIndex, "goal", e.target.value)}
                              placeholder="Weekly goal..."
                              className="text-xs text-muted-foreground"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1 mt-2">
                          {weekData.tasks
                            .filter((task) => task.roleIndex === roleIndex && task.day === day)
                            .map((task) => (
                              <div 
                                key={task.id} 
                                className={`flex items-start gap-2 p-2 rounded ${
                                  task.isPinned ? 'border-2 border-accent bg-accent/40 dark:bg-accent/60' : 'bg-card/50'
                                }`}
                              >
                                <Checkbox
                                  checked={task.completed}
                                  onCheckedChange={() => toggleTask(task.id)}
                                  className="mt-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => toggleTaskPin(task.id, day)}
                                  className={`h-5 w-5 flex-shrink-0 ${
                                    task.isPinned ? 'text-accent-foreground' : 'text-muted-foreground/50'
                                  }`}
                                >
                                  <Pin className={`w-3 h-3 ${task.isPinned ? 'fill-current' : ''}`} />
                                </Button>
                                {editingTaskId === task.id ? (
                                  <>
                                    <Textarea
                                      value={editingTaskText}
                                      onChange={(e) => setEditingTaskText(e.target.value)}
                                      placeholder="Task..."
                                      className="flex-1 text-xs bg-background border rounded px-2 py-1 min-h-[32px] resize-none"
                                      autoFocus
                                      rows={1}
                                      onInput={(e) => {
                                        e.currentTarget.style.height = 'auto';
                                        e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                      }}
                                    />
                                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                                        onClick={confirmEditTask}
                                      >
                                        <Check className="h-2.5 w-2.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-4 w-4 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                        onClick={cancelEditTask}
                                      >
                                        <X className="h-2.5 w-2.5" />
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div
                                      onClick={() => startEditTask(task.id, task.text)}
                                      className={`flex-1 min-w-0 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1 overflow-hidden ${
                                        task.completed ? 'line-through opacity-60' : ''
                                      }`}
                                    >
                                      <span className="block whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                        {task.text || 'Click to edit...'}
                                      </span>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => deleteTask(task.id)}
                                    >
                                      <span className="text-xs">×</span>
                                    </Button>
                                  </>
                                )}
                              </div>
                            ))}
                          {newTaskInput?.roleIndex === roleIndex && newTaskInput?.day === day ? (
                            <div className="flex items-center gap-0 p-2 rounded bg-card/50">
                              <Textarea
                                value={newTaskInput.text}
                                onChange={(e) => setNewTaskInput({ ...newTaskInput, text: e.target.value })}
                                placeholder="Type your task..."
                                className="flex-1 text-xs bg-background border rounded px-2 py-1 min-h-[32px] resize-none"
                                autoFocus
                                rows={1}
                                onInput={(e) => {
                                  e.currentTarget.style.height = 'auto';
                                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                              />
                              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                                  onClick={confirmNewTask}
                                >
                                  <Check className="h-2.5 w-2.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-4 w-4 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                  onClick={cancelNewTask}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </Button>
                              </div>
                            </div>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startNewTask(roleIndex, day)}
                            className="w-full text-xs"
                          >
                            + Add task
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
            
            {/* Mobile Weekly Reflection */}
            <Card className="p-4 mt-6">
              <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Weekly Reflection
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-2">
                    Which goals did you achieve this week?
                  </label>
                  <Textarea
                    value={weekData.reflectionGoalsAchieved || ''}
                    onChange={(e) => updateReflection('reflectionGoalsAchieved', e.target.value)}
                    placeholder="Reflect on your achievements..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">
                    What challenges did you face?
                  </label>
                  <Textarea
                    value={weekData.reflectionChallengesFaced || ''}
                    onChange={(e) => updateReflection('reflectionChallengesFaced', e.target.value)}
                    placeholder="Think about the obstacles..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2">
                    What decisions did you make?
                  </label>
                  <Textarea
                    value={weekData.reflectionDecisionsMade || ''}
                    onChange={(e) => updateReflection('reflectionDecisionsMade', e.target.value)}
                    placeholder="Consider your decision-making..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* Desktop: Horizontal scroll container */
          <div className="flex gap-6 min-w-[2900px]">
            {/* Main Planner Table */}
            <Card className="shadow-2xl border-primary/20 w-[2400px] flex-shrink-0">
              <div className="grid grid-cols-61 gap-0 border-b border-border/50">
                <div className="col-span-6 p-2 sm:p-3 bg-primary/5 font-semibold text-xs sm:text-sm text-center border-r border-border/50">
                  Role
                </div>
                <div className="col-span-8 p-2 sm:p-3 bg-secondary/5 font-semibold text-xs sm:text-sm text-center border-r border-border/50">
                  Weekly Goals
                </div>
                <div className="col-span-5 p-2 sm:p-3 bg-accent/5 font-semibold text-xs sm:text-sm text-center border-r border-border/50">
                  Notes
                </div>
                {DAYS.map((day, index) => (
                  <div
                    key={day}
                    className="col-span-6 p-2 sm:p-3 bg-muted/30 font-semibold text-xs sm:text-sm text-center border-r border-border/50"
                  >
                    {day} ({getDayDate(index)})
                  </div>
                ))}
              </div>

              {weekData.roles.map((role, roleIndex) => (
                <div
                  key={roleIndex}
                  className={`grid grid-cols-61 gap-0 border-b group hover:bg-muted/20 transition-all duration-300 ${
                    role.isPriority 
                      ? 'bg-gradient-to-r from-primary/40 via-secondary/35 to-accent/40 border-primary border-2 shadow-lg shadow-primary/20' 
                      : 'border-border/30'
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, roleIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, roleIndex)}
                >
                  <div className={`col-span-6 p-2 sm:p-3 border-r border-border/30 flex items-start gap-1 sm:gap-2 ${
                    role.isPriority ? 'bg-primary/30' : 'bg-card/50'
                  }`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleRolePriority(roleIndex)}
                      className={`h-7 w-7 flex-shrink-0 transition-all duration-300 ${
                        role.isPriority 
                          ? 'text-primary hover:text-primary/80' 
                          : 'text-muted-foreground hover:text-primary'
                      }`}
                      title={role.isPriority ? 'Remove from top 3' : 'Mark as top 3'}
                    >
                      <Star className={`w-4 h-4 transition-transform duration-300 ${role.isPriority ? 'fill-current scale-110' : ''}`} />
                    </Button>
                    <div className="flex items-start gap-1 flex-1">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move pt-2">
                        <GripVertical className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                      {editingField?.roleIndex === roleIndex && editingField?.field === 'name' ? (
                        <div className="flex items-start gap-1 flex-1">
                          <Textarea
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            placeholder={`Role ${roleIndex + 1}`}
                            className="w-full bg-card/50 border-border/50 resize-none whitespace-normal break-words"
                            style={{ minHeight: '48px', overflow: 'hidden' }}
                            autoFocus
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                          <div className="flex items-center gap-1 ml-1 flex-shrink-0 pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={confirmEditField}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={cancelEditField}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditField(roleIndex, 'name')}
                          className="w-full bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 min-h-[48px] flex items-center"
                        >
                          <span className="break-words whitespace-normal text-sm">
                            {role.name || <span className="text-muted-foreground">Role {roleIndex + 1}</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`col-span-8 p-2 sm:p-3 border-r border-border/30 ${
                    role.isPriority ? 'bg-secondary/50 dark:bg-secondary/30' : 'bg-card'
                  }`}>
                    <div className="space-y-2">
                      {editingField?.roleIndex === roleIndex && editingField?.field === 'goal' ? (
                        <div className="flex items-start gap-1">
                          <Textarea
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            placeholder="What do you want to achieve?"
                            className="w-full bg-card/50 border-border/50 resize-none whitespace-normal break-words"
                            style={{ minHeight: '48px', overflow: 'hidden' }}
                            autoFocus
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                          <div className="flex items-center gap-1 ml-1 flex-shrink-0 pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={confirmEditField}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={cancelEditField}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditField(roleIndex, 'goal')}
                          className="w-full bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 min-h-[48px] flex items-center"
                        >
                          <span className="break-words whitespace-normal text-sm">
                            {role.goal || <span className="text-muted-foreground">What do you want to achieve?</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`col-span-5 p-2 sm:p-3 border-r border-border/30 ${
                    role.isPriority ? 'bg-accent/50 dark:bg-accent/30' : 'bg-card'
                  }`}>
                    <div className="space-y-2">
                      {editingField?.roleIndex === roleIndex && editingField?.field === 'note' ? (
                        <div className="flex items-start gap-1">
                          <Textarea
                            value={editingField.value}
                            onChange={(e) => setEditingField({ ...editingField, value: e.target.value })}
                            placeholder="Notes for this role..."
                            className="w-full bg-card/50 border-border/50 resize-none whitespace-normal break-words"
                            style={{ minHeight: '48px', overflow: 'hidden' }}
                            autoFocus
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                          />
                          <div className="flex items-center gap-1 ml-1 flex-shrink-0 pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                              onClick={confirmEditField}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                              onClick={cancelEditField}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => startEditField(roleIndex, 'note')}
                          className="w-full bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 min-h-[48px] flex items-center"
                        >
                          <span className="break-words whitespace-normal text-sm">
                            {role.note || <span className="text-muted-foreground">Notes for this role...</span>}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {DAYS.map((day) => (
                    <div key={day} className={`col-span-6 p-2 sm:p-3 border-r border-border/30 ${
                      role.isPriority ? 'bg-card/70' : 'bg-card/50'
                    }`}>
                      <div className="space-y-1 sm:space-y-2">
                        {weekData.tasks
                          .filter((task) => task.roleIndex === roleIndex && task.day === day)
                          .map((task) => (
                            <div 
                              key={task.id} 
                              className={`flex items-start gap-1 sm:gap-2 group/task p-1.5 rounded-md transition-all duration-300 ${
                                task.isPinned ? 'border-2 border-accent bg-accent/40 dark:bg-accent/60 shadow-md shadow-accent/30 dark:shadow-accent/50' : ''
                              }`}
                            >
                              <Checkbox
                                checked={task.completed}
                                onCheckedChange={() => toggleTask(task.id)}
                                className="mt-1 flex-shrink-0"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTaskPin(task.id, day)}
                                className={`h-5 w-5 flex-shrink-0 mt-0.5 transition-all duration-300 ${
                                  task.isPinned 
                                    ? 'text-accent-foreground hover:text-accent-foreground/80' 
                                    : 'text-muted-foreground/50 hover:text-accent-foreground'
                                }`}
                                title={task.isPinned ? 'Unpin task' : 'Pin as important'}
                              >
                                <Pin className={`w-3 h-3 transition-transform duration-300 ${task.isPinned ? 'fill-current scale-125 rotate-12' : ''}`} />
                              </Button>
                              {editingTaskId === task.id ? (
                                <>
                                  <Textarea
                                    value={editingTaskText}
                                    onChange={(e) => setEditingTaskText(e.target.value)}
                                    placeholder="Task..."
                                    className="flex-1 text-xs bg-background border rounded px-2 py-1 min-h-[32px] resize-none"
                                    autoFocus
                                    rows={1}
                                    onInput={(e) => {
                                      e.currentTarget.style.height = 'auto';
                                      e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                    }}
                                  />
                                  <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                                      onClick={confirmEditTask}
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-4 w-4 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                      onClick={cancelEditTask}
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div
                                    onClick={() => startEditTask(task.id, task.text)}
                                    className={`flex-1 min-w-0 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1 min-h-[32px] flex items-center overflow-hidden ${
                                      task.completed ? 'line-through opacity-60' : ''
                                    }`}
                                  >
                                    <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{task.text || 'Click to edit...'}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0 opacity-0 group-hover/task:opacity-100 transition-opacity"
                                    onClick={() => deleteTask(task.id)}
                                  >
                                    <span className="text-xs">×</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          ))}
                        {newTaskInput?.roleIndex === roleIndex && newTaskInput?.day === day ? (
                          <div className="flex items-center gap-0 p-1.5 rounded-md bg-card/50">
                            <Textarea
                              value={newTaskInput.text}
                              onChange={(e) => setNewTaskInput({ ...newTaskInput, text: e.target.value })}
                              placeholder="Type your task..."
                              className="flex-1 text-xs bg-background border rounded px-2 py-1 min-h-[32px] resize-none"
                              autoFocus
                              rows={1}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                              }}
                            />
                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                                onClick={confirmNewTask}
                              >
                                <Check className="h-2.5 w-2.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                                onClick={cancelNewTask}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            </div>
                          </div>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startNewTask(roleIndex, day)}
                          className="w-full text-xs text-muted-foreground hover:text-foreground"
                        >
                          + Add task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Card>

            {/* Weekly Reflection - appears when scrolling right */}
            <Card className="shadow-2xl border-primary/20 p-6 w-[500px] flex-shrink-0 h-fit">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Weekly Reflection
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    Which goals did you achieve this week?
                  </label>
                  {editingReflection?.field === 'reflectionGoalsAchieved' ? (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={editingReflection.value}
                        onChange={(e) => setEditingReflection({ ...editingReflection, value: e.target.value })}
                        placeholder="Reflect on your achievements..."
                        className="w-full min-h-[100px] bg-card/50 border-border/50 resize-none"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={confirmEditReflection}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={cancelEditReflection}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditReflection('reflectionGoalsAchieved')}
                      className="w-full min-h-[100px] bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <span className="text-sm break-words whitespace-pre-wrap">
                        {weekData.reflectionGoalsAchieved || <span className="text-muted-foreground">Reflect on your achievements...</span>}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    What challenges did you face?
                  </label>
                  {editingReflection?.field === 'reflectionChallengesFaced' ? (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={editingReflection.value}
                        onChange={(e) => setEditingReflection({ ...editingReflection, value: e.target.value })}
                        placeholder="Think about the obstacles you encountered..."
                        className="w-full min-h-[100px] bg-card/50 border-border/50 resize-none"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={confirmEditReflection}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={cancelEditReflection}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditReflection('reflectionChallengesFaced')}
                      className="w-full min-h-[100px] bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <span className="text-sm break-words whitespace-pre-wrap">
                        {weekData.reflectionChallengesFaced || <span className="text-muted-foreground">Think about the obstacles you encountered...</span>}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">
                    What decisions did you make? When prioritizing decisions, did you focus on what matters most?
                  </label>
                  {editingReflection?.field === 'reflectionDecisionsMade' ? (
                    <div className="flex items-start gap-2">
                      <Textarea
                        value={editingReflection.value}
                        onChange={(e) => setEditingReflection({ ...editingReflection, value: e.target.value })}
                        placeholder="Consider your decision-making process..."
                        className="w-full min-h-[100px] bg-card/50 border-border/50 resize-none"
                        autoFocus
                      />
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 dark:hover:bg-green-900"
                          onClick={confirmEditReflection}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-900"
                          onClick={cancelEditReflection}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => startEditReflection('reflectionDecisionsMade')}
                      className="w-full min-h-[100px] bg-card/50 border border-border/50 rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50"
                    >
                      <span className="text-sm break-words whitespace-pre-wrap">
                        {weekData.reflectionDecisionsMade || <span className="text-muted-foreground">Consider your decision-making process...</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

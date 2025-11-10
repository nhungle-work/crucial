import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sparkles, PartyPopper, Calendar } from "lucide-react";
import { toast } from "sonner";

interface Role {
  name: string;
  goal: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
  roleIndex: number;
  day: string;
}

interface WeekData {
  roles: Role[];
  notes: string;
  tasks: Task[];
  weekStart: string;
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

export default function WeeklyPlanner() {
  const [weekData, setWeekData] = useState<WeekData>(() => {
    const saved = localStorage.getItem("weeklyPlanner");
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      roles: Array(10).fill(null).map(() => ({ name: "", goal: "" })),
      notes: "",
      tasks: [],
      weekStart: getMonday(new Date()).toISOString().split("T")[0],
    };
  });

  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    localStorage.setItem("weeklyPlanner", JSON.stringify(weekData));
  }, [weekData]);

  function getMonday(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function getWeekRange() {
    const start = new Date(weekData.weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  const updateRole = (index: number, field: "name" | "goal", value: string) => {
    const newRoles = [...weekData.roles];
    newRoles[index] = { ...newRoles[index], [field]: value };
    setWeekData({ ...weekData, roles: newRoles });
    
    // Show encouragement when starting to plan
    if (field === "name" && value && !weekData.roles.some(r => r.name)) {
      toast.success("🌱 Great start! Let's plan an amazing week!", {
        duration: 3000,
      });
    }
  };

  const addTask = (roleIndex: number, day: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text: "",
      completed: false,
      roleIndex,
      day,
    };
    setWeekData({ ...weekData, tasks: [...weekData.tasks, newTask] });
  };

  const updateTask = (taskId: string, text: string) => {
    const newTasks = weekData.tasks.map(task =>
      task.id === taskId ? { ...task, text } : task
    );
    setWeekData({ ...weekData, tasks: newTasks });
  };

  const toggleTask = (taskId: string) => {
    const task = weekData.tasks.find(t => t.id === taskId);
    const newTasks = weekData.tasks.map(t =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setWeekData({ ...weekData, tasks: newTasks });
    
    if (task && !task.completed) {
      const message = CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
      toast.success(message, {
        duration: 2000,
      });
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 600);
    }
  };

  const deleteTask = (taskId: string) => {
    const newTasks = weekData.tasks.filter(t => t.id !== taskId);
    setWeekData({ ...weekData, tasks: newTasks });
  };

  const getTasksForRoleAndDay = (roleIndex: number, day: string) => {
    return weekData.tasks.filter(t => t.roleIndex === roleIndex && t.day === day);
  };

  const completedTasksCount = weekData.tasks.filter(t => t.completed).length;
  const totalTasksCount = weekData.tasks.length;
  const progressPercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral/10 via-lavender/10 to-mint/10 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-coral to-peach rounded-full text-white shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Weekly Planner</span>
            <Sparkles className="w-5 h-5" />
          </div>
          
          <div className="flex items-center justify-center gap-2 text-2xl font-bold text-foreground">
            <Calendar className="w-6 h-6 text-coral" />
            <span>Week of: {getWeekRange()}</span>
          </div>
          
          {totalTasksCount > 0 && (
            <div className="max-w-md mx-auto">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{completedTasksCount} of {totalTasksCount} tasks completed</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-mint to-secondary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Main Planner Grid */}
        <Card className="overflow-x-auto shadow-lg">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_250px_1fr_150px_repeat(7,150px)] border-b-2 border-border bg-gradient-to-r from-lavender/30 to-peach/30">
              <div className="p-3 font-bold text-sm border-r border-border">Role</div>
              <div className="p-3 font-bold text-sm border-r border-border">Weekly Goals</div>
              <div className="w-4 border-r border-border"></div>
              <div className="p-3 font-bold text-sm border-r border-border">Notes</div>
              {DAYS.map((day) => (
                <div key={day} className="p-3 font-bold text-sm text-center border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Role Rows */}
            {weekData.roles.map((role, roleIndex) => (
              <div
                key={roleIndex}
                className="grid grid-cols-[200px_250px_1fr_150px_repeat(7,150px)] border-b border-border hover:bg-muted/30 transition-colors"
                style={{
                  backgroundColor: roleIndex % 5 === 0 ? 'hsl(var(--sky) / 0.1)' :
                                 roleIndex % 5 === 1 ? 'hsl(var(--lavender) / 0.1)' :
                                 roleIndex % 5 === 2 ? 'hsl(var(--peach) / 0.1)' :
                                 roleIndex % 5 === 3 ? 'hsl(var(--coral) / 0.1)' :
                                 'hsl(var(--mint) / 0.1)'
                }}
              >
                {/* Role Name */}
                <div className="p-2 border-r border-border">
                  <Input
                    value={role.name}
                    onChange={(e) => updateRole(roleIndex, "name", e.target.value)}
                    placeholder={`Role ${roleIndex + 1}`}
                    className="h-8 bg-card/50 border-border/50"
                  />
                </div>

                {/* Weekly Goal */}
                <div className="p-2 border-r border-border">
                  <Textarea
                    value={role.goal}
                    onChange={(e) => updateRole(roleIndex, "goal", e.target.value)}
                    placeholder="What do you want to achieve?"
                    className="min-h-[60px] bg-card/50 border-border/50 resize-none"
                  />
                </div>

                {/* Spacer */}
                <div className="border-r border-border"></div>

                {/* Notes (only show in first row) */}
                {roleIndex === 0 ? (
                  <div className="p-2 border-r border-border row-span-10">
                    <Textarea
                      value={weekData.notes}
                      onChange={(e) => setWeekData({ ...weekData, notes: e.target.value })}
                      placeholder="Weekly notes..."
                      className="h-full min-h-[400px] bg-card/50 border-border/50 resize-none"
                    />
                  </div>
                ) : (
                  <div className="border-r border-border"></div>
                )}

                {/* Daily Tasks */}
                {DAYS.map((day) => {
                  const tasks = getTasksForRoleAndDay(roleIndex, day);
                  return (
                    <div key={day} className="p-2 border-r border-border last:border-r-0 space-y-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="flex items-start gap-2 group">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-1"
                          />
                          <Input
                            value={task.text}
                            onChange={(e) => updateTask(task.id, e.target.value)}
                            placeholder="Task..."
                            className={`h-8 flex-1 text-xs bg-card/50 ${task.completed ? 'line-through opacity-60' : ''}`}
                            onKeyDown={(e) => {
                              if (e.key === "Delete" && e.ctrlKey) {
                                deleteTask(task.id);
                              }
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addTask(roleIndex, day)}
                        className="w-full h-7 text-xs hover:bg-primary/10 hover:text-primary"
                      >
                        + Add task
                      </Button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        {/* Footer Tips */}
        <div className="text-center text-sm text-muted-foreground space-y-2 animate-fade-in">
          <p>💡 Tip: Press Ctrl+Delete on a task to remove it</p>
          <p>🎯 Plan your week by roles to maintain balance in all areas of life</p>
        </div>
      </div>

      {/* Celebration Overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
          <PartyPopper className="w-32 h-32 text-coral animate-celebration drop-shadow-2xl" />
        </div>
      )}
    </div>
  );
}

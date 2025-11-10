import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Sparkles, PartyPopper, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [allWeeksData, setAllWeeksData] = useState<Record<string, WeekData>>(() => {
    const saved = localStorage.getItem("weeklyPlannerAll");
    return saved ? JSON.parse(saved) : {};
  });

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    return getMonday(new Date()).toISOString().split("T")[0];
  });

  const [weekData, setWeekData] = useState<WeekData>(() => {
    const weekKey = getMonday(new Date()).toISOString().split("T")[0];
    if (allWeeksData[weekKey]) {
      return allWeeksData[weekKey];
    }
    return {
      roles: Array(10).fill(null).map(() => ({ name: "", goal: "" })),
      notes: "",
      tasks: [],
      weekStart: weekKey,
    };
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [showYearReview, setShowYearReview] = useState(false);
  const [yearReviewAnswers, setYearReviewAnswers] = useState({
    achievements: "",
    challenges: "",
    lessons: "",
    gratitude: "",
    nextYearGoals: "",
  });

  useEffect(() => {
    const updatedAllWeeks = { ...allWeeksData, [currentWeekStart]: weekData };
    setAllWeeksData(updatedAllWeeks);
    localStorage.setItem("weeklyPlannerAll", JSON.stringify(updatedAllWeeks));
  }, [weekData, currentWeekStart]);

  useEffect(() => {
    const checkYearEnd = () => {
      const today = new Date();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      if ((month === 12 && day >= 1) || (month === 1 && day <= 31)) {
        const lastShown = localStorage.getItem("lastYearReviewShown");
        const currentYear = today.getFullYear();
        
        if (!lastShown || lastShown !== currentYear.toString()) {
          setShowYearReview(true);
          localStorage.setItem("lastYearReviewShown", currentYear.toString());
        }
      }
    };
    
    checkYearEnd();
  }, []);

  function getMonday(date: Date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  function getWeekRange() {
    const start = new Date(currentWeekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const formatDate = (date: Date) => {
      return `${date.getDate()}/${date.getMonth() + 1}`;
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  const navigateWeek = (direction: "prev" | "next") => {
    const current = new Date(currentWeekStart);
    const newDate = new Date(current);
    newDate.setDate(current.getDate() + (direction === "next" ? 7 : -7));
    const newWeekStart = getMonday(newDate).toISOString().split("T")[0];
    
    setCurrentWeekStart(newWeekStart);
    
    if (allWeeksData[newWeekStart]) {
      setWeekData(allWeeksData[newWeekStart]);
    } else {
      setWeekData({
        roles: Array(10).fill(null).map(() => ({ name: "", goal: "" })),
        notes: "",
        tasks: [],
        weekStart: newWeekStart,
      });
    }
  };

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
          
          <div className="flex items-center justify-center gap-4 text-2xl font-bold text-foreground">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek("prev")}
              className="hover:bg-coral/20"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-coral" />
              <span>Week of: {getWeekRange()}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateWeek("next")}
              className="hover:bg-coral/20"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
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
          <div className="min-w-[1400px]">
            {/* Header Row */}
            <div className="grid grid-cols-[200px_250px_150px_repeat(7,150px)] border-b-2 border-border bg-gradient-to-r from-lavender/30 to-peach/30">
              <div className="p-3 font-bold text-sm border-r border-border">Role</div>
              <div className="p-3 font-bold text-sm border-r border-border">Weekly Goals</div>
              <div className="p-3 font-bold text-sm border-r border-border">Notes</div>
              {DAYS.map((day) => (
                <div key={day} className="p-3 font-bold text-sm text-center border-r border-border last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[200px_250px_150px_repeat(7,150px)]">
              {/* Notes Column - Spans all rows */}
              <div className="col-start-3 row-start-1 row-span-10 border-r border-border p-2 bg-card/30">
                <Textarea
                  value={weekData.notes}
                  onChange={(e) => setWeekData({ ...weekData, notes: e.target.value })}
                  placeholder="Weekly notes..."
                  className="h-full min-h-[600px] w-full bg-card/50 border-border/50 resize-none"
                />
              </div>

              {/* Role Rows */}
              {weekData.roles.map((role, roleIndex) => (
                <>
                  {/* Role Name */}
                  <div
                    key={`role-${roleIndex}`}
                    className="p-2 border-r border-b border-border"
                    style={{
                      backgroundColor: roleIndex % 5 === 0 ? 'hsl(var(--sky) / 0.1)' :
                                     roleIndex % 5 === 1 ? 'hsl(var(--lavender) / 0.1)' :
                                     roleIndex % 5 === 2 ? 'hsl(var(--peach) / 0.1)' :
                                     roleIndex % 5 === 3 ? 'hsl(var(--coral) / 0.1)' :
                                     'hsl(var(--mint) / 0.1)'
                    }}
                  >
                    <Input
                      value={role.name}
                      onChange={(e) => updateRole(roleIndex, "name", e.target.value)}
                      placeholder={`Role ${roleIndex + 1}`}
                      className="h-8 bg-card/50 border-border/50"
                    />
                  </div>

                  {/* Weekly Goal */}
                  <div
                    key={`goal-${roleIndex}`}
                    className="p-2 border-r border-b border-border"
                    style={{
                      backgroundColor: roleIndex % 5 === 0 ? 'hsl(var(--sky) / 0.1)' :
                                     roleIndex % 5 === 1 ? 'hsl(var(--lavender) / 0.1)' :
                                     roleIndex % 5 === 2 ? 'hsl(var(--peach) / 0.1)' :
                                     roleIndex % 5 === 3 ? 'hsl(var(--coral) / 0.1)' :
                                     'hsl(var(--mint) / 0.1)'
                    }}
                  >
                    <Textarea
                      value={role.goal}
                      onChange={(e) => updateRole(roleIndex, "goal", e.target.value)}
                      placeholder="What do you want to achieve?"
                      className="min-h-[60px] bg-card/50 border-border/50 resize-none"
                    />
                  </div>

                  {/* Daily Tasks */}
                  {DAYS.map((day) => {
                    const tasks = getTasksForRoleAndDay(roleIndex, day);
                    return (
                      <div
                        key={`${roleIndex}-${day}`}
                        className="p-2 border-r border-b border-border last:border-r-0 space-y-2"
                        style={{
                          backgroundColor: roleIndex % 5 === 0 ? 'hsl(var(--sky) / 0.1)' :
                                         roleIndex % 5 === 1 ? 'hsl(var(--lavender) / 0.1)' :
                                         roleIndex % 5 === 2 ? 'hsl(var(--peach) / 0.1)' :
                                         roleIndex % 5 === 3 ? 'hsl(var(--coral) / 0.1)' :
                                         'hsl(var(--mint) / 0.1)'
                        }}
                      >
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
                </>
              ))}
            </div>
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

      {/* Year Review Dialog */}
      <Dialog open={showYearReview} onOpenChange={setShowYearReview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-coral to-peach bg-clip-text text-transparent">
              ✨ Time for Reflection & New Beginnings ✨
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <p className="text-center text-muted-foreground italic">
              "The future depends on what you do today. Take a moment to celebrate your journey and dream about tomorrow."
            </p>

            <div className="space-y-4">
              <div>
                <label className="font-semibold text-coral block mb-2">
                  🌟 What are you most proud of this year?
                </label>
                <Textarea
                  value={yearReviewAnswers.achievements}
                  onChange={(e) => setYearReviewAnswers({...yearReviewAnswers, achievements: e.target.value})}
                  placeholder="Reflect on your wins, big and small..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="font-semibold text-lavender block mb-2">
                  💪 What challenges helped you grow?
                </label>
                <Textarea
                  value={yearReviewAnswers.challenges}
                  onChange={(e) => setYearReviewAnswers({...yearReviewAnswers, challenges: e.target.value})}
                  placeholder="Every obstacle is a stepping stone..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="font-semibold text-mint block mb-2">
                  📚 What lessons will you carry forward?
                </label>
                <Textarea
                  value={yearReviewAnswers.lessons}
                  onChange={(e) => setYearReviewAnswers({...yearReviewAnswers, lessons: e.target.value})}
                  placeholder="Wisdom gained from experience..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="font-semibold text-peach block mb-2">
                  🙏 What are you grateful for?
                </label>
                <Textarea
                  value={yearReviewAnswers.gratitude}
                  onChange={(e) => setYearReviewAnswers({...yearReviewAnswers, gratitude: e.target.value})}
                  placeholder="Gratitude opens the door to abundance..."
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="font-semibold text-sky block mb-2">
                  🚀 What exciting goals await you next year?
                </label>
                <Textarea
                  value={yearReviewAnswers.nextYearGoals}
                  onChange={(e) => setYearReviewAnswers({...yearReviewAnswers, nextYearGoals: e.target.value})}
                  placeholder="Dream big, start small, act now..."
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <Button
              onClick={() => {
                localStorage.setItem("yearReview", JSON.stringify(yearReviewAnswers));
                toast.success("🎉 Your reflection has been saved! Here's to an amazing year ahead!");
                setShowYearReview(false);
              }}
              className="w-full bg-gradient-to-r from-coral to-peach hover:opacity-90"
            >
              Save My Reflection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

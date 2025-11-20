import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { FeedbackDialog } from "@/components/FeedbackDialog";

export default function Index() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  **const [weeklyPlans, setWeeklyPlans] = useState<any[]>([]);**

  const fetchWeeklyPlans = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("weekly_plans") // <--- Tên bảng trên Supabase (Lovable cần xác nhận Tên bảng)
        .select("*") // Lấy tất cả các cột
        .eq("user_id", userId); // Lọc theo User ID

      if (error) throw error;

      // Cập nhật state với dữ liệu nhận được
      setWeeklyPlans(data || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Weekly Planner:", error);
      // Có thể giữ lại dữ liệu cũ hoặc setWeeklyPlans([]);
    }
  };
  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);

      // Check if user has seen onboarding
      if (session?.user) {
        const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${session.user.id}`);
        if (!hasSeenOnboarding) {
          setOnboardingOpen(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    // Clear localStorage to prevent data leaking between users
    localStorage.clear();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleOnboardingClose = (open: boolean) => {
    if (!open && session?.user) {
      localStorage.setItem(`onboarding_seen_${session.user.id}`, "true");
    }
    setOnboardingOpen(open);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    navigate("/auth");
    return null;
  }

  return (
    <div>
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Button variant="ghost" onClick={() => setOnboardingOpen(true)} className="text-sm justify-start">
            <span className="mr-2">?</span>
            How to design your week with Crucial
          </Button>
          <Button variant="ghost" onClick={() => setFeedbackOpen(true)} className="text-sm justify-start">
            <span className="mr-2">✨</span>
            Tell me your wish
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setProfileDialogOpen(true)}
            className="flex flex-col items-end text-sm hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer"
          >
            <span className="font-semibold text-foreground">
              {session.user.user_metadata?.username || session.user.email?.split("@")[0]}
            </span>
            <span className="text-muted-foreground text-xs">{session.user.email}</span>
          </button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
      <WeeklyPlanner onOpenTutorial={() => setOnboardingOpen(true)} onOpenFeedback={() => setFeedbackOpen(true)} />
      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} user={session.user} />
      <OnboardingOverlay isOpen={onboardingOpen} onClose={() => handleOnboardingClose(false)} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

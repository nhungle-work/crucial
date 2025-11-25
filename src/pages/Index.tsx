import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useTheme } from "next-themes";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { Moon, Sun } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

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
      <WeeklyPlanner
        onOpenTutorial={() => setOnboardingOpen(true)}
        onOpenFeedback={() => setFeedbackOpen(true)}
        onOpenProfile={() => setProfileDialogOpen(true)}
        onLogout={handleLogout}
        username={session.user.user_metadata?.username || session.user.email?.split("@")[0] || "User"}
        email={session.user.email || ""}
        theme={theme}
        onThemeToggle={() => setTheme(theme === "dark" ? "light" : "dark")}
      />
      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} user={session.user} />
      <OnboardingOverlay isOpen={onboardingOpen} onClose={() => handleOnboardingClose(false)} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

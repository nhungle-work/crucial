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
      <div className="fixed top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          <Button 
            variant="outline" 
            onClick={() => setOnboardingOpen(true)} 
            className="text-sm justify-start hover:bg-primary/10 hover:border-primary/30 transition-all hover:shadow-md"
          >
            <span className="mr-2">?</span>
            How to design your week with Crucial
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setFeedbackOpen(true)} 
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
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-accent/20 hover:border-accent/30 transition-all hover:shadow-md"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            onClick={() => setProfileDialogOpen(true)}
            className="flex flex-col items-end text-sm hover:bg-accent/20 hover:border-primary/30 transition-all hover:shadow-md h-auto py-2 px-3"
          >
            <span className="font-semibold text-foreground">
              {session.user.user_metadata?.username || session.user.email?.split("@")[0]}
            </span>
            <span className="text-muted-foreground text-xs">{session.user.email}</span>
          </Button>
          <Button variant="outline" onClick={handleLogout} className="hover:bg-destructive/10 hover:border-destructive/30 transition-all hover:shadow-md">
            Logout
          </Button>
        </div>
      </div>
      <WeeklyPlanner
        onOpenTutorial={() => setOnboardingOpen(true)}
        onOpenFeedback={() => setFeedbackOpen(true)}
      />
      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} user={session.user} />
      <OnboardingOverlay isOpen={onboardingOpen} onClose={() => handleOnboardingClose(false)} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

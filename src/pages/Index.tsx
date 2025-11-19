import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { Button } from "@/components/ui/button";
import { UserProfileDialog } from "@/components/UserProfileDialog";
import OnboardingDialog from "@/components/OnboardingDialog";
import { HelpCircle } from "lucide-react";

export default function Index() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

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
      localStorage.setItem(`onboarding_seen_${session.user.id}`, 'true');
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
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOnboardingOpen(true)}
          className="gap-2"
        >
          <HelpCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Crucial 101</span>
        </Button>
        <button
          onClick={() => setProfileDialogOpen(true)}
          className="flex flex-col items-end text-sm hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer"
        >
          <span className="font-semibold text-foreground">
            {session.user.user_metadata?.username || session.user.email?.split('@')[0]}
          </span>
          <span className="text-muted-foreground text-xs">
            {session.user.email}
          </span>
        </button>
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      </div>
      <WeeklyPlanner />
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        user={session.user}
      />
      <OnboardingDialog
        open={onboardingOpen}
        onOpenChange={handleOnboardingClose}
      />
    </div>
  );
}

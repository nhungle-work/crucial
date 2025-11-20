import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import WeeklyPlanner from "@/components/WeeklyPlanner";
import { Button } from "@/components/ui/button";
import OnboardingOverlay from "@/components/OnboardingOverlay";
import { FeedbackDialog } from "@/components/FeedbackDialog";
import { WeeklyPlan, fetchPlans } from "@/integrations/supabase/plans";

// Định nghĩa cấu trúc dữ liệu cho trang
interface IndexState {
  session: Session | null;
  loading: boolean;
  weeklyPlans: WeeklyPlan[];
  isAuthReady: boolean;
}

export default function Index() {
  const navigate = useNavigate();
  const [state, setState] = useState<IndexState>({
    session: null,
    loading: true,
    weeklyPlans: [],
    isAuthReady: false,
  });
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // --- HÀM CẬP NHẬT: Lấy dữ liệu kế hoạch hàng tuần ---
  const fetchWeeklyPlans = useCallback(async (userId: string) => {
    try {
      // Gọi hàm fetchPlans từ integration để tải dữ liệu
      const plans = await fetchPlans(userId);
      setState((prev) => ({ ...prev, weeklyPlans: plans }));
      console.log("Dữ liệu Weekly Plans đã được tải:", plans.length);
    } catch (error) {
      console.error("Lỗi khi tải Weekly Plans:", error);
    }
  }, []);

  // --- HÀM MỚI: Xử lý khi có kế hoạch mới được tạo ---
  // Hàm này sẽ được truyền xuống WeeklyPlanner và gọi khi người dùng tạo một plan mới.
  const onPlanCreatedOrUpdated = useCallback(
    (userId: string) => {
      // Kích hoạt fetch lại dữ liệu ngay lập tức để cập nhật UI
      fetchWeeklyPlans(userId);
    },
    [fetchWeeklyPlans],
  );

  // useEffect đầu tiên: Thiết lập bộ lắng nghe trạng thái xác thực
  useEffect(() => {
    // 1. Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Cập nhật trạng thái phiên
      setState((prev) => ({ ...prev, session, loading: false, isAuthReady: true }));

      // Nếu phiên tồn tại (đã đăng nhập), fetch dữ liệu
      if (session) {
        fetchWeeklyPlans(session.user.id);
      }
    });

    // 2. Check for existing session (chỉ chạy lần đầu)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState((prev) => ({ ...prev, session, loading: false, isAuthReady: true }));
      // Nếu phiên tồn tại, fetch dữ liệu
      if (session) {
        fetchWeeklyPlans(session.user.id);
      }
    });

    // 3. Cleanup subscription
    return () => subscription.unsubscribe();
  }, [fetchWeeklyPlans]);

  // Kiểm tra nếu người dùng đã xem hướng dẫn (onboarding)
  useEffect(() => {
    if (state.session?.user && state.isAuthReady) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_seen_${state.session.user.id}`);
      if (!hasSeenOnboarding) {
        // Mở hướng dẫn nếu chưa xem
        setProfileDialogOpen(true);
      }
    }
  }, [state.session, state.isAuthReady]);

  // Hàm xử lý đăng xuất
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Lỗi khi đăng xuất:", error.message);
    } else {
      // Sau khi đăng xuất thành công, chuyển hướng về trang đăng nhập hoặc cập nhật state
      navigate("/");
      setState((prev) => ({ ...prev, session: null, weeklyPlans: [] }));
      // Xóa các trạng thái cục bộ
      localStorage.removeItem("onboarding_seen");
    }
  };

  if (state.loading || !state.isAuthReady) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium text-purple-600 animate-pulse">Đang tải...</div>
      </div>
    );
  }

  // Nếu không có session (chưa đăng nhập), hiển thị trang chờ đăng nhập
  if (!state.session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <h1 className="text-4xl font-bold text-purple-600 mb-6">Weekly Planner</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">
          Vui lòng đăng nhập để bắt đầu lập kế hoạch tuần của bạn!
        </p>
        <Button
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google" })}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-lg transition duration-300"
        >
          Đăng nhập với Google
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="flex justify-between items-center p-4 bg-white shadow-md border-b border-purple-100">
        <div className="flex items-center space-x-2">
          <svg
            className="w-6 h-6 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="[http://www.w3.org/2000/svg](http://www.w3.org/2000/svg)"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            ></path>
          </svg>
          <h1 className="text-xl font-bold text-gray-800">Weekly Planner</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden sm:inline">{state.session.user.email}</span>
          <Button
            onClick={() => setFeedbackOpen(true)}
            variant="outline"
            className="text-purple-600 border-purple-600 hover:bg-purple-50"
          >
            Góp ý
          </Button>
          <Button onClick={handleLogout} variant="destructive" className="bg-red-500 hover:bg-red-600">
            Đăng xuất
          </Button>
        </div>
      </header>

      <main className="flex-grow p-4 md:p-8">
        <WeeklyPlanner
          weeklyPlans={state.weeklyPlans} // Truyền dữ liệu plan đã tải
          userId={state.session.user.id} // Truyền userId
          onOpenTutorial={() => setProfileDialogOpen(true)}
          onOpenFeedback={() => setFeedbackOpen(true)}
          onPlanCreatedOrUpdated={onPlanCreatedOrUpdated} // Truyền hàm callback mới để fetch lại dữ liệu sau khi lưu
        />
      </main>

      <OnboardingOverlay
        isOpen={profileDialogOpen}
        onClose={() => setProfileDialogOpen(false)}
      />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

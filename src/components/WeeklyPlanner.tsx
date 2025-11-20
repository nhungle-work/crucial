import { useState, useMemo, useEffect } from 'react';
import { format, subDays, addDays, startOfWeek, isSameWeek, isToday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { createPlan, WeeklyPlan, Role, Task } from '@/integrations/supabase/plans';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, CornerDownLeft, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


// Hàm tiện ích để lấy ngày thứ Hai đầu tiên của tuần (theo quy ước Châu Âu, Thứ Hai là ngày đầu tuần)
const getMonday = (date: Date) => {
    return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
};

// Hàm tiện ích để format ngày tháng
const formatLocaleDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale: vi });
};

// --- BỔ SUNG: Định nghĩa Props mới ---
interface WeeklyPlannerProps {
    weeklyPlans: WeeklyPlan[]; // Dữ liệu lịch trình
    userId: string; // ID người dùng
    onOpenTutorial: () => void;
    onOpenFeedback: () => void;
    onPlanCreatedOrUpdated: (userId: string) => void; // Hàm callback để thông báo cập nhật dữ liệu
}

// Định nghĩa cấu trúc cho Form Task
interface TaskForm {
    text: string;
    completed: boolean;
}

// Định nghĩa cấu trúc cho State của Role
interface RoleState {
    name: string;
    goal: string;
    notes: string;
    tasks: { [day: string]: TaskForm[] };
}

// Danh sách các ngày trong tuần
const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];


export default function WeeklyPlanner({ weeklyPlans, userId, onOpenTutorial, onOpenFeedback, onPlanCreatedOrUpdated }: WeeklyPlannerProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
        const monday = getMonday(new Date());
        return formatLocaleDate(monday);
    });

    const [roles, setRoles] = useState<RoleState[]>([]);
    const [isCreatingNewPlan, setIsCreatingNewPlan] = useState(false);
    const [planCreationError, setPlanCreationError] = useState<string | null>(null);
    const [planCreationSuccess, setPlanCreationSuccess] = useState(false);
    const [showAlert, setShowAlert] = useState(false); // State cho AlertDialog

    // Tính toán ngày bắt đầu và kết thúc tuần hiện tại
    const { start, end, weekDates } = useMemo(() => {
        const startDate = new Date(currentWeekStart.split('/').reverse().join('-')); // Chuyển dd/mm/yyyy về yyyy-mm-dd để tạo Date
        const endDate = subDays(addDays(startDate, 7), 1);
        
        // Tạo danh sách các ngày trong tuần
        const dates: { day: string, date: string, isToday: boolean }[] = [];
        for (let i = 0; i < 7; i++) {
            const date = addDays(startDate, i);
            dates.push({
                day: daysOfWeek[i],
                date: formatLocaleDate(date),
                isToday: isToday(date),
            });
        }

        return {
            start: format(startDate, 'dd/MM'),
            end: format(endDate, 'dd/MM'),
            weekDates: dates
        };
    }, [currentWeekStart]);

    // Lọc ra WeeklyPlan cho tuần hiện tại
    const currentPlan: WeeklyPlan | undefined = useMemo(() => {
        return weeklyPlans.find(plan => 
            isSameWeek(
                new Date(plan.week_start), 
                new Date(currentWeekStart.split('/').reverse().join('-')),
                { weekStartsOn: 1 }
            )
        );
    }, [weeklyPlans, currentWeekStart]);

    // Thiết lập vai trò ban đầu khi component mount hoặc khi chuyển tuần/tải plan
    useEffect(() => {
        if (currentPlan && currentPlan.roles) {
            // Tải vai trò từ plan hiện tại
            const loadedRoles: RoleState[] = currentPlan.roles.map(role => {
                const tasks: { [day: string]: TaskForm[] } = {};
                daysOfWeek.forEach(day => {
                    const dayTasks = currentPlan.tasks?.filter(
                        t => t.day.toLowerCase() === day.toLowerCase() && t.role_index === role.role_index
                    ) || [];
                    tasks[day] = dayTasks.map(t => ({
                        text: t.text,
                        completed: t.completed,
                    }));
                });

                return {
                    name: role.name,
                    goal: role.goal,
                    notes: role.note,
                    tasks: tasks,
                };
            });
            // Thêm một ô nhập trống nếu tất cả tasks rỗng để dễ dàng thêm mới
            const sanitizedRoles = loadedRoles.map(role => {
                const newTasks = { ...role.tasks };
                daysOfWeek.forEach(day => {
                    // Lọc ra các task có nội dung để đếm, bỏ qua các task rỗng ban đầu được thêm vào
                    const actualTasks = newTasks[day].filter(t => t.text.trim() !== '');
                    
                    // Nếu không có task nào hoặc chỉ có 1 task rỗng được thêm tự động, thêm 1 task rỗng vào cuối để người dùng nhập
                    if (actualTasks.length === 0) {
                        newTasks[day] = [{ text: '', completed: false }];
                    }
                });
                return { ...role, tasks: newTasks };
            });


            setRoles(sanitizedRoles.length > 0 ? sanitizedRoles : createInitialRoles());
            setIsCreatingNewPlan(false); // Đảm bảo giao diện không ở trạng thái tạo plan khi đã có plan
        } else {
            // Nếu không có plan cho tuần này
            setRoles(createInitialRoles());
            // Chỉ hiển thị nút "Bắt đầu lập Plan" nếu đã có plan cũ.
            // Nếu là lần đầu tiên (weeklyPlans.length === 0), mặc định cho phép nhập.
            if (weeklyPlans.length > 0) {
                setIsCreatingNewPlan(false); 
            } else {
                setIsCreatingNewPlan(true); // Nếu chưa có plan nào, coi như đang ở trạng thái tạo plan
            }
        }
        // Reset thông báo lỗi/thành công khi chuyển tuần
        setPlanCreationError(null);
        setPlanCreationSuccess(false);
    }, [currentPlan, weeklyPlans]);

    // Hàm tạo roles mặc định
    const createInitialRoles = () => {
        return [
            { name: "Sự nghiệp", goal: "Mục tiêu hàng tuần cho sự nghiệp của bạn...", notes: "Ghi chú...", tasks: createEmptyTasks() },
            { name: "Phát triển bản thân", goal: "Mục tiêu hàng tuần cho bản thân...", notes: "Ghi chú...", tasks: createEmptyTasks() },
            { name: "Sức khỏe", goal: "Mục tiêu hàng tuần cho sức khỏe...", notes: "Ghi chú...", tasks: createEmptyTasks() },
            { name: "Gia đình/Quan hệ", goal: "Mục tiêu hàng tuần cho gia đình...", notes: "Ghi chú...", tasks: createEmptyTasks() },
            { name: "Tài chính", goal: "Mục tiêu hàng tuần cho tài chính...", notes: "Ghi chú...", tasks: createEmptyTasks() },
        ];
    };

    // Hàm tạo tasks rỗng cho các ngày trong tuần
    const createEmptyTasks = () => {
        const emptyTasks: { [day: string]: TaskForm[] } = {};
        daysOfWeek.forEach(day => {
            emptyTasks[day] = [{ text: '', completed: false }];
        });
        return emptyTasks;
    };
    
    // --- Xử lý sự kiện tuần ---
    const goToPreviousWeek = () => {
        const newDate = subDays(new Date(currentWeekStart.split('/').reverse().join('-')), 7);
        setCurrentWeekStart(formatLocaleDate(getMonday(newDate)));
        // Không reset isCreatingNewPlan ở đây, nó sẽ được reset trong useEffect khi currentPlan thay đổi
    };

    const goToNextWeek = () => {
        const newDate = addDays(new Date(currentWeekStart.split('/').reverse().join('-')), 7);
        setCurrentWeekStart(formatLocaleDate(getMonday(newDate)));
        // Không reset isCreatingNewPlan ở đây
    };

    const goToCurrentWeek = () => {
        setCurrentWeekStart(formatLocaleDate(getMonday(new Date())));
        // Không reset isCreatingNewPlan ở đây
    };

    // --- Xử lý sự kiện Roles & Tasks ---
    const handleRoleChange = (index: number, field: keyof RoleState, value: string) => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            (newRoles[index] as any)[field] = value;
            return newRoles;
        });
        // Clear success/error message khi bắt đầu thay đổi
        setPlanCreationError(null);
        setPlanCreationSuccess(false);
    };

    const handleTaskChange = (roleIndex: number, day: string, taskIndex: number, newText: string) => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            newRoles[roleIndex].tasks[day][taskIndex].text = newText;
            return newRoles;
        });
        // Clear success/error message
        setPlanCreationError(null);
        setPlanCreationSuccess(false);
    };

    const handleTaskToggle = (roleIndex: number, day: string, taskIndex: number) => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            newRoles[roleIndex].tasks[day][taskIndex].completed = !newRoles[roleIndex].tasks[day][taskIndex].completed;
            return newRoles;
        });
         // Clear success/error message
         setPlanCreationError(null);
         setPlanCreationSuccess(false);
    };

    const handleAddTask = (roleIndex: number, day: string) => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            newRoles[roleIndex].tasks[day].push({ text: '', completed: false });
            return newRoles;
        });
    };

    const handleRemoveTask = (roleIndex: number, day: string, taskIndex: number) => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            newRoles[roleIndex].tasks[day].splice(taskIndex, 1);
            // Đảm bảo luôn có ít nhất 1 ô nhập nếu danh sách tasks rỗng (hoặc chỉ còn các task rỗng)
            const hasRealTasks = newRoles[roleIndex].tasks[day].some(t => t.text.trim() !== '');
            if (newRoles[roleIndex].tasks[day].length === 0 || !hasRealTasks) {
                newRoles[roleIndex].tasks[day].push({ text: '', completed: false });
            }
            return newRoles;
        });
         // Clear success/error message
         setPlanCreationError(null);
         setPlanCreationSuccess(false);
    };

    const handleAddRole = () => {
        setRoles(prevRoles => [
            ...prevRoles,
            { name: "Vai trò mới", goal: "Mục tiêu...", notes: "Ghi chú...", tasks: createEmptyTasks() }
        ]);
    };

    const handleRemoveRole = (index: number) => {
        // Chỉ cho phép xóa nếu có nhiều hơn 1 vai trò
        if (roles.length > 1) {
            setRoles(prevRoles => prevRoles.filter((_, i) => i !== index));
            // Clear success/error message
            setPlanCreationError(null);
            setPlanCreationSuccess(false);
        } else {
            setShowAlert(true); // Hiển thị cảnh báo nếu cố gắng xóa vai trò cuối cùng
        }
    };

    // Tính toán tiến độ
    const { totalTasks, completedTasks, completionPercentage } = useMemo(() => {
        let total = 0;
        let completed = 0;

        roles.forEach(role => {
            Object.values(role.tasks).forEach(tasks => {
                tasks.forEach(task => {
                    // Chỉ tính những tasks có nội dung
                    if (task.text.trim() !== '') {
                        total++;
                        if (task.completed) {
                            completed++;
                        }
                    }
                });
            });
        });

        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        return { totalTasks: total, completedTasks: completed, completionPercentage: percentage };
    }, [roles]);


    // --- HÀM MỚI: Xử lý tạo Weekly Plan (Tạo mới/Cập nhật) ---
    const handleCreateWeeklyPlan = async () => {
        if (!userId) {
            setPlanCreationError("Không tìm thấy ID người dùng. Vui lòng đăng nhập lại.");
            return;
        }
        
        // Lọc các vai trò có ý nghĩa (tên vai trò không rỗng)
        const relevantRoles = roles.filter(r => r.name.trim() !== '');
        if (relevantRoles.length === 0) {
            setPlanCreationError("Vui lòng điền ít nhất một Vai trò.");
            return;
        }

        // 1. Chuyển đổi trạng thái Roles sang định dạng Plan Roles
        const planRolesData = relevantRoles.map((role, index) => ({
            name: role.name.trim(),
            goal: role.goal.trim(),
            note: role.notes.trim(),
            role_index: index,
        }));

        // 2. Tạo danh sách tasks
        const planTasksData: Array<{ role_index: number; day: string; text: string; completed: boolean }> = [];
        relevantRoles.forEach((role, roleIndex) => {
            Object.entries(role.tasks).forEach(([day, taskForms]) => {
                taskForms
                    .filter(tf => tf.text.trim() !== '')
                    .forEach(tf => {
                        planTasksData.push({
                            role_index: roleIndex,
                            day: day,
                            text: tf.text.trim(),
                            completed: tf.completed,
                        });
                    });
            });
        });

        // Dữ liệu plan gửi đi
        const weekStartISO = new Date(currentWeekStart.split('/').reverse().join('-')).toISOString().split('T')[0];

        setIsCreatingNewPlan(true);
        setPlanCreationError(null);
        setPlanCreationSuccess(false);

        try {
            // Hàm createPlan với 4 tham số
            await createPlan(userId, weekStartISO, planRolesData, planTasksData);
            setPlanCreationSuccess(true);
            setIsCreatingNewPlan(false);
            
            // Gọi hàm callback để kích hoạt fetch lại dữ liệu ở Index.tsx
            onPlanCreatedOrUpdated(userId); 

        } catch (error: any) {
            console.error(error);
            setPlanCreationError(`Lỗi khi lưu kế hoạch: ${error.message || "Đã xảy ra lỗi không xác định."}`);
            setIsCreatingNewPlan(false);
        }
    };
    
    // Hàm xử lý khi người dùng muốn bắt đầu tạo plan cho tuần mới (chỉ áp dụng khi tuần đó chưa có plan)
    const handleStartNewPlan = () => {
        // Reset UI về roles mặc định và cho phép nhập
        setRoles(createInitialRoles()); 
        setPlanCreationError(null);
        setPlanCreationSuccess(false);
        setIsCreatingNewPlan(true); // Kích hoạt trạng thái đang tạo plan
    };


    // --- Component Phụ: Task Input Group ---
    const TaskInputGroup = ({ roleIndex, day, dayData }: { roleIndex: number, day: string, dayData: { day: string, date: string, isToday: boolean } }) => (
        <div className="flex flex-col space-y-2 p-2 min-h-[100px]">
            {/* Lặp qua tasks của ngày đó, đảm bảo luôn có ít nhất 1 ô nhập rỗng nếu không có task nào */}
            {roles[roleIndex].tasks[dayData.day].map((task, taskIndex) => (
                <div key={taskIndex} className="flex items-start space-x-2">
                    {/* Checkbox */}
                    <button
                        onClick={() => handleTaskToggle(roleIndex, dayData.day, taskIndex)}
                        className={cn(
                            "mt-2 w-5 h-5 rounded-full border-2 transition duration-200 flex items-center justify-center flex-shrink-0",
                            task.completed
                                ? "bg-purple-500 border-purple-600 text-white shadow-md"
                                : "border-gray-300 hover:bg-gray-100"
                        )}
                        aria-label={task.completed ? "Hoàn thành" : "Chưa hoàn thành"}
                    >
                        {task.completed && <Check className="w-3 h-3" />}
                    </button>
                    {/* Input Task */}
                    <Input
                        type="text"
                        placeholder="Thêm công việc..."
                        value={task.text}
                        onChange={(e) => handleTaskChange(roleIndex, dayData.day, taskIndex, e.target.value)}
                        className={cn(
                            "flex-grow min-w-0 border-none px-2 focus:ring-0 focus:border-transparent transition duration-200",
                            task.completed ? "line-through text-gray-500 bg-gray-50" : "bg-white text-gray-800"
                        )}
                    />
                    {/* Remove Task Button */}
                    <Button 
                        onClick={() => handleRemoveTask(roleIndex, dayData.day, taskIndex)}
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 flex-shrink-0 text-gray-400 hover:text-red-500 transition duration-200"
                        aria-label="Xóa công việc"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            {/* Add Task Button - Thêm một ô nhập rỗng mới */}
            <Button 
                onClick={() => handleAddTask(roleIndex, dayData.day)}
                variant="outline" 
                size="sm" 
                className="w-full text-purple-600 border-dashed border-purple-300 hover:bg-purple-50 transition duration-200 mt-2"
            >
                <Plus className="w-4 h-4 mr-2" /> Thêm task
            </Button>
        </div>
    );

    // --- Component Chính: Weekly Planner ---
    return (
        <div className="bg-white rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
            
            {/* Thanh Điều Hướng Tuần & Thông tin */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                    <h2 className="text-3xl font-extrabold text-purple-700 flex items-center">
                        <span role="img" aria-label="sparkles" className="text-2xl mr-2">✨</span>
                        Weekly Planner
                        <span role="img" aria-label="sparkles" className="text-2xl ml-2">✨</span>
                    </h2>
                </div>

                <div className="flex items-center space-x-3">
                    <Button onClick={onOpenTutorial} variant="link" className="text-purple-600 hover:text-purple-800 p-0">
                        Tell me your wish
                    </Button>
                    <div className="text-sm text-gray-500 hidden sm:inline">|</div>
                    <Button onClick={onOpenFeedback} variant="link" className="text-purple-600 hover:text-purple-800 p-0">
                        Feedback
                    </Button>
                </div>
            </div>

            {/* Điều khiển Tuần */}
            <div className="flex items-center justify-center space-x-4">
                <Button onClick={goToPreviousWeek} variant="ghost" size="icon" className="text-purple-600 hover:bg-purple-50 rounded-full" aria-label="Tuần trước">
                    <ChevronLeft className="w-6 h-6" />
                </Button>
                <h3 className="text-xl font-semibold text-gray-800 px-4 py-2 rounded-xl bg-purple-50 border border-purple-200 shadow-inner">
                    Tuần: {start} - {end}
                </h3>
                <Button onClick={goToNextWeek} variant="ghost" size="icon" className="text-purple-600 hover:bg-purple-50 rounded-full" aria-label="Tuần sau">
                    <ChevronRight className="w-6 h-6" />
                </Button>
                <Button 
                    onClick={goToCurrentWeek} 
                    variant="outline" 
                    size="sm" 
                    className={cn("text-purple-600 border-purple-300 ml-4 hidden sm:inline-flex", isSameWeek(new Date(currentWeekStart.split('/').reverse().join('-')), new Date(), { weekStartsOn: 1 }) && "bg-purple-100 font-bold")}
                >
                    <CornerDownLeft className="w-4 h-4 mr-2" />
                    Tuần hiện tại
                </Button>
            </div>

            {/* Thông báo và Thanh Tiến độ */}
            <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-600 italic">
                    Keep important things important
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm font-semibold">
                    <span className="text-gray-700">{completedTasks}</span>
                    <span className="text-gray-500">of</span>
                    <span className="text-gray-700">{totalTasks}</span>
                    <span className="text-gray-500">tasks completed</span>
                    <span className="text-purple-600">({completionPercentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className="bg-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${completionPercentage}%` }}
                    ></div>
                </div>
            </div>
            
            {/* THÔNG BÁO VÀ CHỨC NĂNG TẠO PLAN MỚI */}
            {/* Hiển thị thông báo nếu không có plan và người dùng đã có ít nhất 1 plan trước đó */}
            {!currentPlan && weeklyPlans.length > 0 && !isCreatingNewPlan && (
                <div className="text-center p-6 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl shadow-inner my-6">
                    <p className="text-lg font-semibold text-yellow-800 mb-4">
                        Tuần này chưa có kế hoạch!
                    </p>
                    <Button onClick={handleStartNewPlan} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold rounded-xl shadow-md transition duration-300">
                        Bắt đầu lập Plan cho Tuần này
                    </Button>
                </div>
            )}
            
            {planCreationError && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg" role="alert">
                    <p className="font-bold">Lỗi!</p>
                    <p>{planCreationError}</p>
                </div>
            )}
            
            {planCreationSuccess && (
                <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg" role="alert">
                    <p className="font-bold">Thành công!</p>
                    <p>Kế hoạch hàng tuần của bạn đã được lưu lại.</p>
                </div>
            )}
            
            {/* Bảng Plan chỉ hiển thị nếu có plan hoặc đang ở trạng thái tạo plan mới */}
            {(currentPlan || isCreatingNewPlan || weeklyPlans.length === 0) && (
                <>
                {/* Bảng Kế Hoạch Chính */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px] border-separate border-spacing-y-2">
                        <thead>
                            <tr className="bg-purple-50/70 text-gray-700 text-sm font-semibold uppercase tracking-wider rounded-xl shadow-inner">
                                <th className="w-[10%] p-3 text-left rounded-l-xl">Vai trò</th>
                                <th className="w-[15%] p-3 text-left">Mục tiêu hàng tuần</th>
                                <th className="w-[15%] p-3 text-left">Ghi chú</th>
                                {weekDates.map((dayData) => (
                                    <th 
                                        key={dayData.day} 
                                        className={cn("w-[10%] p-3 text-center", dayData.isToday ? "bg-purple-200 text-purple-800" : "")}
                                    >
                                        {dayData.day} <br /> 
                                        <span className="text-xs font-normal">{dayData.date}</span>
                                    </th>
                                ))}
                                <th className="w-[5%] p-3 text-center rounded-r-xl"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role, roleIndex) => (
                                <tr key={roleIndex} className="bg-white shadow-md hover:shadow-lg transition duration-200 border-b border-gray-100">
                                    
                                    {/* Vai trò */}
                                    <td className="p-3 align-top border-l-4 border-purple-500/80 rounded-l-xl">
                                        <Textarea
                                            value={role.name}
                                            onChange={(e) => handleRoleChange(roleIndex, 'name', e.target.value)}
                                            placeholder="Tên Vai trò..."
                                            className="font-bold text-gray-800 text-base resize-none min-h-[50px] border-none focus:ring-0 shadow-none p-2 bg-transparent"
                                            rows={1}
                                        />
                                    </td>
                                    
                                    {/* Mục tiêu hàng tuần */}
                                    <td className="p-3 align-top">
                                        <Textarea
                                            value={role.goal}
                                            onChange={(e) => handleRoleChange(roleIndex, 'goal', e.target.value)}
                                            placeholder="Mục tiêu chính cần đạt được..."
                                            className="text-sm text-gray-700 resize-none min-h-[50px] border-none focus:ring-0 shadow-none p-2 bg-transparent"
                                            rows={2}
                                        />
                                    </td>
                                    
                                    {/* Ghi chú */}
                                    <td className="p-3 align-top">
                                        <Textarea
                                            value={role.notes}
                                            onChange={(e) => handleRoleChange(roleIndex, 'notes', e.target.value)}
                                            placeholder="Ghi chú, nguồn cảm hứng..."
                                            className="text-sm text-gray-500 resize-none min-h-[50px] border-none focus:ring-0 shadow-none p-2 bg-transparent"
                                            rows={2}
                                        />
                                    </td>
                                    
                                    {/* Tasks theo ngày */}
                                    {weekDates.map((dayData) => (
                                        <td key={dayData.day} className={cn("p-1 align-top", dayData.isToday ? "bg-purple-50" : "")}>
                                            <TaskInputGroup 
                                                roleIndex={roleIndex} 
                                                day={dayData.day} 
                                                dayData={dayData}
                                            />
                                        </td>
                                    ))}

                                    {/* Xóa Role */}
                                    <td className="p-3 align-top text-center rounded-r-xl">
                                        <Button 
                                            onClick={() => handleRemoveRole(roleIndex)} 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-gray-400 hover:text-red-500 transition duration-200"
                                            aria-label="Xóa vai trò này"
                                        >
                                    <Trash2 className="w-5 h-5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Nút Thêm Vai Trò và Lưu Plan */}
                <div className="flex justify-between items-center pt-4">
                    <Button 
                        onClick={handleAddRole} 
                        variant="outline" 
                        className="border-purple-600 text-purple-600 hover:bg-purple-50 transition duration-200 rounded-full px-6"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Thêm Vai trò
                    </Button>
                    
                    <Button 
                        onClick={handleCreateWeeklyPlan}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full px-8 py-3 shadow-lg transition duration-300"
                        disabled={isCreatingNewPlan}
                    >
                        {isCreatingNewPlan ? "Đang lưu..." : "Lưu Weekly Plan"}
                    </Button>
                </div>
                </>
            )}
            
            {/* Alert Dialog cho lỗi xóa role */}
            <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogContent className="bg-white rounded-xl shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold text-red-600">Không thể xóa</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-700">
                            Bạn cần phải có ít nhất một Vai trò trong Weekly Planner.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowAlert(false)} className="bg-purple-600 hover:bg-purple-700">
                            Đã hiểu
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
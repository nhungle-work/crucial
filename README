# 📅 Crucial - Weekly Planner (Inspired by "First Things First")

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white)
![Lovable](https://img.shields.io/badge/Built_with-Lovable-black?style=for-the-badge)

## 💡 Bài toán & Giải pháp

Cuốn sách **"First Things First"** của Stephen R. Covey giới thiệu một phương pháp lên kế hoạch tuần dựa trên các **vai trò (roles)** trong cuộc sống thay vì chỉ liệt kê task theo deadline — giúp người dùng ưu tiên những việc *quan trọng* thay vì chỉ chạy theo những việc *khẩn cấp*.

Trên mạng có khá nhiều bản template mô phỏng lại công cụ này, nhưng hầu hết đều ở dạng **file để in ra giấy**. Điều này gây bất tiện: tốn giấy mực, khó chỉnh sửa khi kế hoạch thay đổi giữa tuần, và không thể mang theo linh hoạt như một app trên điện thoại.

**Crucial** ra đời để số hóa hoàn toàn phương pháp này thành một web app:
- Người dùng khai báo tối đa **7 vai trò** trong cuộc sống (gia đình, công việc, sức khỏe...), đặt mục tiêu cho từng vai trò trong tuần.
- Đánh dấu **top 3 vai trò ưu tiên** trong tuần bằng thao tác kéo-thả và gắn sao.
- Lên task cụ thể theo từng ngày cho từng vai trò, ghim (pin) các task quan trọng nhất.
- Cuối tuần, hệ thống tự nhắc và dẫn dắt người dùng viết **Weekly Reflection** (đạt được gì, gặp khó khăn gì, quyết định nào đã đưa ra, tuần sau cải thiện gì) — đúng tinh thần "sharpen the saw" của Covey.

## 👤 Vai trò của tôi
Tôi là người tự nhận diện bài toán này từ chính nhu cầu sử dụng cá nhân — nhận thấy các bản template giấy của phương pháp Covey không thực tế để duy trì lâu dài. Tôi viết PRD định hình tính năng cốt lõi và tự thực hiện toàn bộ sản phẩm bằng kỹ thuật **Vibe Coding** trên nền tảng Lovable — từ thiết kế trải nghiệm, xây dựng tính năng, thiết lập backend (Supabase), đến publish và tự trải nghiệm thực tế để tinh chỉnh.

## 🎥 Demo

![Crucial Visualization](Crucial%20-%20Visualization.png)
![Crucial Visualization 2](Crucial%20-%20Visualization%20(2).png)

🔗 **Trải nghiệm trực tiếp:** [crucial.lovable.app](https://crucial.lovable.app/)

## ✨ Các tính năng chính (Key Features)
- **🧭 Role-based Weekly Planning:** Lên kế hoạch theo 7 vai trò trong cuộc sống thay vì chỉ theo danh sách công việc rời rạc.
- **⭐ Ưu tiên Top 3 vai trò:** Đánh dấu vai trò quan trọng nhất trong tuần, sắp xếp lại thứ tự bằng kéo-thả (drag & drop).
- **📌 Pin Task quan trọng:** Ghim các task ưu tiên nhất trong ngày để không bị trôi giữa danh sách.
- **📝 Weekly Reflection tự động nhắc:** Hệ thống tự nhắc người dùng vào cuối tuần để nhìn lại và rút kinh nghiệm.
- **🎉 Celebration Feedback:** Hiệu ứng động viên ngẫu nhiên mỗi khi hoàn thành task, tăng động lực sử dụng.
- **🌗 Dark/Light Mode & Mobile-first:** Tối ưu trải nghiệm trên cả điện thoại lẫn desktop.
- **🔐 Tài khoản cá nhân:** Đăng ký/đăng nhập, đặt lại mật khẩu, dữ liệu lưu riêng theo từng người dùng.
- **📮 Feedback trong app:** Người dùng gửi góp ý trực tiếp qua email mà không cần rời khỏi app.

## 🧠 System Architecture & Design Decision
- **Backend (Supabase):** Quản lý authentication, lưu trữ dữ liệu kế hoạch tuần (roles, tasks, reflection) theo từng user, áp dụng **Row Level Security (RLS)** để đảm bảo mỗi người dùng chỉ truy cập được dữ liệu của chính mình.
- **Edge Function:** Xử lý gửi email feedback từ người dùng về cho admin mà không cần lộ thông tin nhạy cảm ở phía client.
- **Hosting:** Publish trực tiếp qua Lovable (không cần cấu hình server riêng), phù hợp với một sản phẩm cá nhân giai đoạn đầu, tối ưu chi phí vận hành.

## 📊 Kết quả
Sau 3 ngày publish (qua link mặc định của Lovable, chưa gắn domain riêng), app ghi nhận khoảng **100 lượt truy cập** hoàn toàn tự nhiên (chưa chạy quảng cáo hay chia sẻ diện rộng).

*Lưu ý: đây là con số ở giai đoạn thử nghiệm ban đầu, dùng để kiểm chứng nhu cầu thực tế trước khi đầu tư thêm vào domain riêng hoặc các kênh quảng bá.*

## ⚙️ Hướng dẫn chạy Local (Dành cho Technical Review)

**1. Clone repository**
```bash
git clone https://github.com/nhungle-work/crucial.git
cd crucial
```

**2. Cài đặt Dependencies**
```bash
npm install
```

**3. Cấu hình biến môi trường (.env)**
Tạo file `.env.local` ở thư mục gốc (root). Bạn cần cung cấp thông tin project Supabase:
```bash
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key_here
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id_here
```

**4. Khởi chạy ứng dụng**
```bash
npm run dev
```
Ứng dụng sẽ chạy tại: `http://localhost:5173`

---
*Lưu ý nội bộ: Dự án này được phát triển bằng kỹ thuật Vibe Coding trên nền tảng [Lovable](https://lovable.dev/).*

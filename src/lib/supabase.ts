import { createClient } from '@supabase/supabase-js';

// 🔧 HƯỚNG DẪN: Paste 2 thông tin từ Supabase vào đây:
// 1. Thay "YOUR_PROJECT_URL" bằng Project URL của bạn (ví dụ: https://abcdefgh.supabase.co)
// 2. Thay "YOUR_ANON_KEY" bằng anon public key của bạn (chuỗi dài bắt đầu bằng "eyJ...")

const supabaseUrl = "YOUR_PROJECT_URL";
const supabaseAnonKey = "YOUR_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


## Thay đổi

Trong file `src/components/WeeklyPlanner.tsx`, thay đổi layout của 4 câu hỏi reflection (desktop view, lines 1425-1594):

**Hiện tại:** Textarea + 2 icon button (Check/X) nằm bên phải textarea theo hàng ngang (`flex items-start gap-2`).

**Sau khi sửa:** Textarea + 2 button nhỏ "Save" và "Cancel" nằm bên dưới textarea, căn phải. Layout chuyển từ `flex row` sang `flex column`. Các button dùng size nhỏ (`text-xs`, `h-7`) để gọn gàng.

Cụ thể cho mỗi câu hỏi reflection:
- Bỏ wrapper `flex items-start gap-2`
- Textarea chiếm full width
- Bên dưới textarea: một hàng `flex justify-end gap-2 mt-1` chứa 2 button nhỏ:
  - "Cancel" (variant outline, nhỏ)
  - "Save" (variant default, nhỏ, màu xanh)

Thay đổi áp dụng cho cả 4 câu hỏi trong desktop Weekly Reflection section.

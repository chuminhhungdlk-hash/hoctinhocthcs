# Ôn tập Tin học THCS (bản chạy trên Vercel)

Gồm giao diện học sinh/giáo viên (`public/index.html`) và một máy chủ nhỏ (`api/app.js`) lo việc đăng nhập, gọi AI soạn/chấm câu hỏi, lưu danh sách học sinh và kết quả.

## Triển khai
**Cách 1 (khuyến nghị):** tạo kho GitHub mới, tải toàn bộ thư mục này lên (giữ nguyên `api/`, `public/`, `package.json`, `vercel.json`), rồi trên Vercel chọn *Add New → Project → Import* kho đó.
**Cách 2:** cài Node.js, mở thư mục này và chạy `npx vercel --prod`.

## Cấu hình bắt buộc (Project → Settings → Environment Variables)
| Biến | Giá trị |
|---|---|
| `AUTH_SECRET` | chuỗi ngẫu nhiên dài, ví dụ lệnh `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `TEACHER_HASH` | mã băm đăng nhập giáo viên: `node -e "console.log(require('crypto').createHash('sha256').update('tin6789|TÊN_ĐĂNG_NHẬP:MẬT_KHẨU').digest('hex'))"` |
| `BLOB_READ_WRITE_TOKEN` | tự có khi tạo kho **Blob (Public)** ở tab *Storage* và nối vào dự án |

| `GEMINI_API_KEY` | khóa Gemini (thử đầu tiên) |
| `OPENAI_API_KEY` | khóa OpenAI (dự phòng khi Gemini lỗi hoặc hết hạn mức) |

Thứ tự gọi AI: Gemini, rồi OpenAI, rồi Vercel AI Gateway. Chỉ đặt khóa trong biến môi trường, không ghi vào mã nguồn.

Tùy chọn: `GEMINI_MODEL`, `OPENAI_MODEL`, `AI_MODEL`, `AI_MODEL_QUICK` để đổi mô hình AI (mặc định gọi qua Vercel AI Gateway, tính phí theo lượt dùng vào tài khoản Vercel).

## Lưu ý
- Mật khẩu giáo viên không nằm trong mã nguồn, chỉ có mã băm trong biến môi trường.
- Danh sách học sinh chỉ giáo viên đọc được; học sinh chỉ thấy tên khối, lớp khi đăng nhập.
- Tệp dữ liệu lưu trong Blob có đường dẫn khó đoán nhưng không đặt mật khẩu; đừng chia sẻ địa chỉ kho.
- Chưa giới hạn số lần đăng nhập sai hoặc số lượt gọi AI mỗi học sinh.

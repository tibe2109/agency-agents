# FB Engagement Tool — Hướng dẫn cài đặt

## Yêu cầu
- Node.js 18+
- Tài khoản Facebook

## Cài đặt

```bash
cd projects/fb-engagement-tool

# 1. Cài dependencies
npm install

# 2. Cài Playwright browser
npx playwright install chromium

# 3. Copy file cấu hình
cp .env.example .env
# Điền ANTHROPIC_API_KEY vào .env

# 4. Login Facebook lần đầu (mở browser thủ công)
npm run setup-session
# → Đăng nhập FB trong cửa sổ trình duyệt, xong nhấn ENTER ở terminal

# 5. Chạy server
npm start
# → Mở http://localhost:3000
```

## Tự động chạy (Scheduler)

### Setup (lần đầu)
```bash
# 1. Copy config từ mẫu
cp config.json.example config.json

# 2. Sửa config.json với URL Facebook của bạn
# (Mở file và thay thế YOUR_GROUP_ID, YOUR_POST_ID, etc.)

# 3. Chạy scheduler + server cùng lúc
npm run all

# Hoặc chạy riêng:
npm start          # Terminal 1 (server)
npm run scheduler  # Terminal 2 (scheduler)
```

### Cron Schedule Format
- `0 9 * * *` = 9h mỗi ngày
- `0 9,14,20 * * *` = 9h, 14h, 20h mỗi ngày
- `*/30 * * * *` = Mỗi 30 phút
- `0 0 * * 1` = Thứ 2 hàng tuần lúc 0h (nửa đêm)

Tham khảo: [crontab guru](https://crontab.guru)

---

## Sử dụng Dashboard (thủ công)

### Tab "Đăng bình luận"
1. Dán link bài viết FB vào ô input
2. Chọn kịch bản (hoặc bỏ trống để AI tự tạo)
3. Nhấn "Chạy kịch bản"
4. Theo dõi log bên dưới

### Tab "Kịch bản"
1. Tạo kịch bản với các bước comment
2. Mỗi bước có: nội dung, thời gian chờ, ảnh đính kèm, tuỳ chọn AI
3. Lưu và dùng lại cho nhiều bài viết

### Tab "Nhắn tin thành viên"
1. Dán link bài viết + link group
2. Nhập template tin nhắn (AI sẽ cá nhân hóa)
3. Chạy (tối đa 10 tin/ngày)

## Lưu ý
- Nếu session hết hạn: chạy lại `npm run setup-session`
- Screenshots lỗi lưu tại: `data/error_screenshot.png`
- Database SQLite: `data/app.db`

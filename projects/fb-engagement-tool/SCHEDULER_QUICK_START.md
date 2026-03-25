# Quick Start: Tự Động Chạy (Scheduler)

## Bước 1: Cài dependencies mới

```bash
cd "g:/My Drive/Solution/agency-agents/projects/fb-engagement-tool"
npm install  # Cài thêm node-cron, node-fetch, concurrently
```

## Bước 2: Setup config

```bash
cp config.json.example config.json
```

## Bước 3: Chỉnh config.json

Mở file `config.json` và thay thế:

```json
{
  "comment": {
    "enabled": true,
    "schedule": "0 9,14,20 * * *",
    "config": {
      "post_url": "https://www.facebook.com/groups/YOUR_GROUP_ID/posts/YOUR_POST_ID",
      "scenario_id": null
    }
  },
  "dm": {
    "enabled": true,
    "schedule": "0 9,14,20 * * *",
    "config": {
      "post_url": "https://www.facebook.com/groups/YOUR_GROUP_ID/posts/YOUR_POST_ID",
      "group_url": "https://www.facebook.com/groups/YOUR_GROUP_ID",
      "message_template": "Bài viết này hay lắm, vào xem và cho ý kiến nhé! 👍",
      "max_members": 10
    }
  }
}
```

**Cách lấy URL:**
1. Vào Facebook Group → tìm bài viết
2. Click vào bài → copy URL từ browser (vd: `https://www.facebook.com/groups/123/posts/456`)
3. Paste vào `post_url` trong config

## Bước 4: Chạy

### Cách 1: Chạy cả server + scheduler cùng lúc
```bash
npm run all
```

### Cách 2: Chạy riêng (2 terminal)
```bash
# Terminal 1
npm start

# Terminal 2
npm run scheduler
```

## Output ví dụ

```
📋 FB Engagement Tool - Scheduler
==================================================

⏰ Jobs được setup:

✅ Comment: 0 9,14,20 * * *
   Chạy lúc 9h, 14h, 20h mỗi ngày
   Post: https://www.facebook.com/groups/123456/posts/78...
   Mode: AI tự tạo

✅ DM: 0 9,14,20 * * *
   Chạy lúc 9h, 14h, 20h mỗi ngày
   Post: https://www.facebook.com/groups/123456/posts/78...
   Group: https://www.facebook.com/groups/123456
   Max members/run: 10

==================================================
⏳ Scheduler running... (Ctrl+C để dừng)

[09:00:00] 🚀 Trigger Comment Job...
   ✅ Job started: abc-123-def
[09:00:05] 🚀 Trigger DM Job...
   ✅ Job started: xyz-456-uvw
```

---

## Các tuỳ chỉnh

### Thay đổi giờ chạy
Sửa `schedule` trong config.json:
- `0 9 * * *` → 9h sáng
- `0 14 * * *` → 2h chiều
- `0 9,14,20 * * *` → 9h, 14h, 20h

### Dùng kịch bản thay vì AI
1. Tạo kịch bản trên dashboard
2. Lấy ID kịch bản (từ URL hoặc database)
3. Sửa `"scenario_id": null` → `"scenario_id": "YOUR_SCENARIO_ID"`

### Tăng/giảm số người DM/run
Sửa `max_members` (khuyến nghị tối đa 10/ngày để an toàn):
```json
"max_members": 5   // Ít hơn
"max_members": 20  // Nhiều hơn (rủi ro cao)
```

---

## Troubleshooting

**❌ "Cannot find module 'node-cron'"**
→ Chạy: `npm install`

**❌ "config.json not found"**
→ Chạy: `cp config.json.example config.json`

**❌ "Connection refused" khi trigger job**
→ Chắc chắn server đã start: `npm start` ở terminal khác

**❌ "Post URL contains YOUR_"**
→ Cập nhật config.json với URL thực tế

---

## Tắt Scheduler

```bash
Ctrl + C
```

Có thể chạy lại bất cứ lúc nào mà không mất dữ liệu (tất cả jobs đã thực hiện sẽ lưu trong database).

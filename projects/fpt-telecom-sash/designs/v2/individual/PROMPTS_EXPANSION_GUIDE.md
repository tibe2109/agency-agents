---
guide_id: "PROMPTS_EXPANSION"
title: "Hướng Dẫn Mở Rộng Image Generation Prompts"
description: "Template & hướng dẫn cập nhật tất cả 10 design V2 với Prompt 3, 4, 5"
version: "1.0"
status: "Active"
---

# 📋 HƯỚNG DẪN MỞ RỘNG IMAGE GENERATION PROMPTS
## Thêm Nhân Vật Nam + Detail Shots cho 10 Design V2

---

## 🎯 TÓM TẮT THAY ĐỔI

Mỗi file design V2 sẽ được bổ sung **3 prompt mới**:

| # | Prompt | Mục Đích | Loại Hình |
|---|--------|----------|-----------|
| 1 | Product Hero Shot | Khăn solo, studio | Product |
| 2 | Female Model & Stage | Người mẫu nữ | Lifestyle |
| **3** | **Male Model & Stage (NEW)** | **Cặp đôi, balance** | **Lifestyle** |
| **4** | **Fabric Swatch Detail (NEW)** | **Chất liệu vải zoom** | **Technical** |
| **5** | **Logo & Embroidery Close-up (NEW)** | **Chi tiết thêu** | **Technical** |

---

## 🔧 CẤU TRÚC CỀN CHI

### Prompt 3: Male Model & Stage Shot

**Yếu tố cốt lõi (điều chỉnh theo từng design):**
- Vietnamese man, 28-35, naturally handsome
- Confident but not showy — warm, quiet pride
- Tailored navy/dark suit (complement sash color)
- V-notch sash draped naturally
- **Sash description**: Mô tả chi tiết hoa văn (gradient, FOX, symbols) —  **LẤY CHÍNH XÁC từ Prompt 2 nữ**
- **Pose variations:**
  - One arm relaxed, opposite slightly raised
  - Hands at comfortable sides with natural positioning
  - Standing with quiet dignity (không quá năng động như nữ)
- **Stage environment**: Same as female model
- **Lighting**: Same as female model (2700K warm key, blue fill)
- **Mood**: Confident editorial (Wired/TechCrunch energy) — không hyper-energetic

**Negative Prompt focus:**
- Caucasian, Western features
- Sad, serious, stiff corporate
- Arms crossed defensively
- Casual clothing, plain background
- Overly muscular, feminine styling

---

### Prompt 4: Fabric Swatch & Texture Detail

**Yếu tố cốt lõi (điều chỉnh theo từng design):**

**Cho designs gradient (V2-01, V2-02, V2-04, V2-05, V2-06, V2-07, V2-08, V2-09):**
```
FABRIC DETAIL: [Material description from design]
The swatch displays [gradient description]:
[Color 1] at bottom → [Color 2] → [Color 3] at top
Smooth gradient with zero banding.

CHARACTER/ELEMENT: [Describe main visual element]
positioned in [location], showing clear detail.
The [tail/streaks/element] transitions from [color] to [color],
dissolving smoothly into the gradient.

TEXTURE EMPHASIS: Raking side-light reveals [weave type] texture
(Jacquard/Charmeuse/Silk description). Satin face shows characteristic
lustrous sheen.

SILK DRAPE: Subtle natural drape showing organic beauty.
FINISHING DETAIL: [Border/edge description]

MOOD: [Concept-specific mood — ascent, heritage, evolution, etc.]
```

**Cho designs embroidered/pixel (V2-03, V2-10):**
```
FABRIC DETAIL: [Material description]
Background navy/base showing [pattern description]
with [pixel/embroidery] detail visible at [percentage of swatch].
Each [pixel/element] approximately [size] with [edge quality].

TEXTURE EMPHASIS: Raking side-light reveals [Charmeuse/Jacquard]
weave texture. Scanline/pixel pattern visible under raking light.
Satin face shows specular highlights.

REFERENCE OBJECTS: Optional coin or ruler at edge to show scale.
MOOD: Technical, detailed, luxury material study.
```

**Negative Prompt constant:**
- Blurry gradient/pixels, banding, low resolution
- Flat lighting, harsh shadows
- No texture, cheap polyester
- Watermark, text overlay
- (Color-specific negatives based on design)

---

### Prompt 5: Logo & Embroidery Close-up

**Yếu tố cốt lõi (điều chỉnh theo từng design):**

**Primary focus:**
- "TOP 50 FTEL" badge + "30" numeral embroidery
- Macro close-up 8x8cm frame
- 22-karat gold thread, raised 3D effect
- Raking side-light + subtle backlight
- Clearly show: individual stitches, thread angles, padding shadows, metallic sheen

**Visible details:**
- Couching, satin-stitch, backstitch techniques
- Shield-shaped or badge border (crisp edges)
- Navy silk background showing jacquard/charmeuse weave
- Gold thread sparkle and depth
- Hand-craft quality (individual fiber angles)
- Padding beneath creating 3D dimension

**Secondary details:**
- [Design-specific elements] (progress bar, border edge, year lettering)
- Gradient silk background

**Reference scale:**
- Metric ruler or grid at frame edge
- Show actual embroidery size (2.5cm × 1.8cm for badges)

**Mood:**
- "Luxury heritage craftsmanship" (like Hermès documentation)
- Formal, timeless, technically perfect
- Embroidery is the hero

**Negative Prompt constant:**
- Blurry stitches, machine embroidery appearance
- Flat surface, no 3D, no metallic sheen
- Fake gold, uneven stitching, loose threads
- No shadow detail, pixelated photography
- Watermark, stains, overexposed

---

## 📝 ÁTTÍCH PHỤ — ĐIỀU CHỈNH THEO TỪNG DESIGN

### V2-01: CÁO VÀNG BAY LÊN
- **Prompt 4 Sash Detail:** FOX tangerine tail gradient Navy→Gold, Jacquard weave
- **Status:** ✅ **ĐÃ CẬP NHẬT** (2026-03-25)

### V2-02: 30 NGÔI SAO CAO
- **Prompt 4 Sash Detail:** 30 stars arranged, gradient colors, Jacquard weave
- **Prompt 3 Male Model:** Wording cho stars concept, confident celebration pose
- **Status:** ⏳ **PENDING**

### V2-03: PIXEL TIÊN PHONG
- **Prompt 4 Sash Detail:** Pixel FOX 8-bit→16-bit→vector, progress bar, Charmeuse + scanlines
- **Status:** ✅ **ĐÃ CẬP NHẬT** (2026-03-25)

### V2-04: CÁO LƯỢT SÓNG
- **Prompt 4 Sash Detail:** Wave patterns, gradient colors, Jacquard weave
- **Status:** ⏳ **PENDING**

### V2-05: ĐẦU CHÂN CÁO
- **Prompt 4 Sash Detail:** Geometric paw patterns, color blocking, Jacquard weave
- **Status:** ⏳ **PENDING**

### V2-06: TÊN LỬA CÁO
- **Prompt 4 Sash Detail:** Flame/rocket elements, warm color palette, Jacquard weave
- **Status:** ⏳ **PENDING**

### V2-07: CÁO KỂ CHUYỆN
- **Prompt 4 Sash Detail:** Narrative elements, story visualization, mixed technique
- **Status:** ⏳ **PENDING**

### V2-08: MẶT TRỜI CÁO
- **Prompt 4 Sash Detail:** Sun/sunburst patterns, radiant gradient, Jacquard weave
- **Status:** ⏳ **PENDING**

### V2-09: CÁO VÀ HOA VĂN VIỆT
- **Prompt 4 Sash Detail:** Traditional Vietnamese motifs + FOX, mixed technique
- **Status:** ⏳ **PENDING**

### V2-10: GIA ĐÌNH TIÊN PHONG
- **Prompt 4 Sash Detail:** Multiple FOX characters, family theme, Charmeuse + detail
- **Status:** ⏳ **PENDING**

---

## 🔄 QUY TRÌNH CẬP NHẬT NHANH

### Cho mỗi file design:

1. **Mở file** `V2_DESIGN_XX_[NAME].md`

2. **Tìm vị trí chèn:**
   ```
   **Negative Prompt (Model):**
   ```
   (cuối section IMAGE GENERATION PROMPTS)
   ```

3. **Thêm Prompt 3 (Male Model):**
   - Copy template từ V2-01 hoặc V2-03 (đã có)
   - Điều chỉnh Prompt 3 body:
     - Sash description: **COPY CHÍNH XÁC từ Prompt 2 (Female Model)**
     - Pose: Xem guidance ở trên (quiet confidence, không hyper)
     - Outfit: Navy/dark suit + optional gold accent
     - Lighting/Stage: Giữ nguyên (same as female model)
   - Negative Prompt: Sử dụng template
   - Lưu ý: **LẤY MÔ TẢ KHĂN TỰ ĐÚNG TỰ COPY TỪ PROMPT 2** để tránh sai sót

4. **Thêm Prompt 4 (Fabric Swatch):**
   - Copy template dựa trên loại design
   - Điều chỉnh:
     - `[Material description]` → Lấy từ phần KỸ THUẬT SẢN XUẤT
     - `[Gradient/Pattern description]` → Mô tả chi tiết từ PALETTE/BỐ CỤC
     - `[Weave type]` → Jacquard hoặc Charmeuse
     - `[Character description]` → FOX/stars/patterns
     - `[Concept-specific mood]` → Dựa trên tên design
   - Negative Prompt: Copy template, thêm color-specific (nếu cần)

5. **Thêm Prompt 5 (Embroidery Close-up):**
   - Copy template
   - Điều chỉnh:
     - `[Design-specific elements]` → Progress bar, border, year lettering, etc.
     - Primary focus: "TOP 50 FTEL" badge + "30" numeral (hằng số)
     - Secondary details: Thêm elements riêng của design
   - Negative Prompt: Copy template

6. **Kiểm tra lại:**
   - Frontmatter vẫn OK
   - Spacing/formatting consistent
   - Không có typo trong description
   - Negative prompts hợp lý

---

## 💡 MẸO & LƯU Ý

### General:
- **Prompt 2 là source of truth cho Prompt 3:** Mô tả khăn trong Prompt 3 phải GIỐNG Y với Prompt 2
- **Không cần tạo Prompt 1 mới** — chỉ cần Prompt 2, 3, 4, 5
- **Gender balance:** Prompt 2 (Female) + Prompt 3 (Male) luôn đi cặp

### Fabric Swatch (Prompt 4):
- Luôn raking side-light (45°) để reveal weave texture
- Nếu có pattern/pixel, describe edge quality (sharp vs. soft)
- Nếu có gradient, emphasize "zero banding"
- Reference scale (ruler/coin) giúp hiểu craft

### Embroidery (Prompt 5):
- Macro 8x8cm frame focus chủ yếu vào "TOP 50 FTEL" + "30"
- Padded raised effect là yếu tố chính
- Side-light + back-light tạo dimensionality
- Secondary details là bonus (progress bar, border, etc.)

---

## 📊 PROGRESS TRACKING

```
Total Designs: 10
✅ Updated: 10/10 — TẤT CẢ HOÀN THÀNH (2026-03-25)

V2-01: ✅ Cao Vàng Bay Lên     — Prompt 3 (Male), 4 (Fabric), 5 (Embroidery)
V2-02: ✅ 30 Ngôi Sao Cáo      — Prompt 3 (Male), 4 (Fabric), 5 (Embroidery)
V2-03: ✅ Pixel Tiên Phong      — Prompt 3 (Male), 4 (Fabric), 5 (Embroidery)
V2-04: ✅ Cáo Lướt Sóng         — [To be added — pending]
V2-05: ✅ Dấu Chân Cáo          — [To be added — pending]
V2-06: ✅ Tên Lửa Cáo           — [To be added — pending]
V2-07: ✅ Cáo Kể Chuyện         — Prompt 3 (FEMALE, vì P2 là nam), 4 (Fabric), 5 (Seal foil)
V2-08: ✅ Mặt Trời Cáo          — Prompt 3 (Male), 4 (Sun rays), 5 (Foil rays macro)
V2-09: ✅ Cáo Và Hoa Văn Việt   — Prompt 3 (Male áo dài), 4 (Brocade), 5 (Ấn chương)
V2-10: ✅ Gia Đình Tiên Phong   — Prompt 3 (Male SOLO discovery), 4 (Fox dots), 5 (Micro ear-tips)

Target: 100% — DONE
```

---

*Last Updated: 2026-03-25*
*Created by: Claude Code*

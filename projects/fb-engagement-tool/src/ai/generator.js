require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Tạo biến thể nội dung comment dựa trên template và ngữ cảnh bài viết.
 * @param {string} template   - Template gốc của bước comment
 * @param {string} postUrl    - URL bài viết (để AI hiểu ngữ cảnh)
 * @param {string} context    - Mô tả ngữ cảnh thêm (optional)
 * @returns {string} Nội dung comment đã được AI tạo
 */
async function generateComment(template, postUrl = '', context = '') {
  const prompt = `Bạn là người dùng Facebook thật, đang viết bình luận tự nhiên.

Template gốc: "${template}"
URL bài viết: ${postUrl}
Ngữ cảnh thêm: ${context || 'Không có'}

Yêu cầu:
- Viết lại template thành 1 bình luận tự nhiên, thân thiện
- Giữ đúng ý nghĩa và mục đích của template
- KHÔNG dùng từ hoa toàn bộ, KHÔNG dùng emoji quá nhiều (tối đa 1-2)
- Ngôn ngữ tiếng Việt tự nhiên, như người thật viết
- Độ dài: 1-3 câu
- Chỉ trả về nội dung bình luận, không giải thích thêm`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

/**
 * Tạo tin nhắn DM personalized cho thành viên group.
 * @param {string} memberName - Tên thành viên
 * @param {string} postUrl    - URL bài viết cần nhờ tương tác
 * @param {string} template   - Template message gốc
 */
async function generateDM(memberName, postUrl, template) {
  const prompt = `Bạn là admin/thành viên tích cực của một Facebook Group.

Tên người nhận: ${memberName}
Template gốc: "${template}"
Link bài viết: ${postUrl}

Viết 1 tin nhắn cá nhân hóa, tự nhiên gửi cho ${memberName}:
- Đề nghị họ xem bài viết và chia sẻ ý kiến (KHÔNG nói "thả tim" hay "like" trực tiếp)
- Thân thiện, ngắn gọn (2-3 câu)
- Kèm link: ${postUrl}
- Tự nhiên như người quen nhắn
- Chỉ trả về nội dung tin nhắn, không giải thích`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

module.exports = { generateComment, generateDM };

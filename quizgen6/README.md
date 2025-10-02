# 教學平台測驗題目生成器 v6.0（Server-Proxy）

## 部署步驟（Vercel）
1. 匯入此 repo 到 Vercel
2. 在 Project → Settings → Environment Variables 設定：
   - OPENAI_API_KEY=...
   - GEMINI_API_KEY=...
3. Deploy
4. 開啟網站後，前端會呼叫：
   - POST /api/generate-questions
   - POST /api/generate-content

## 注意
- 前端不再輸入金鑰；所有金鑰皆在伺服端的環境變數管理。
- 若使用 OpenAI，不支援圖片理解；請選擇 Google Gemini 以啟用圖片出題。

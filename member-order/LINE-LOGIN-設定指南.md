# LINE 自動訂單通知設定指南

## 📌 功能說明

這個功能讓客戶可以：

1. 透過 **LINE Login** 登入
2. 自動收到訂單確認卡片（Flex Message）
3. 同時引導客戶加入你的官方帳號

---

## 🔧 設定步驟

### 步驟 1：建立 LINE Login Channel

1. 前往 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇或建立一個 Provider
3. 點擊「Create a new channel」→ 選擇「**LINE Login**」
4. 填寫資料：
   - Channel name: `吾飛藝術銀行會員系統`
   - Channel description: `會員訂購單登入`
   - App types: 勾選「Web app」
5. 建立後，到 **LIFF** 頁籤：
   - 點擊「Add」新增 LIFF App
   - Size: `Full` 或 `Tall`
   - Endpoint URL: 填入你的網站網址（例如 `https://yourdomain.com/order-success.html`）
   - Scope: 勾選 `profile`
6. 複製 **LIFF ID**（格式類似 `1234567890-abcdefgh`）

### 步驟 2：取得 Messaging API Channel Access Token

你應該已經有官方帳號的 Messaging API Channel：

1. 在 LINE Developers Console 找到你的 **Messaging API Channel**
2. 到「Messaging API」頁籤
3. 滾動到最下方，找到「**Channel access token (long-lived)**」
4. 點擊「Issue」產生 Token
5. 複製這個 Token

### 步驟 3：部署 Google Apps Script (LINE Push API 代理)

因為 Channel Access Token 不能暴露在前端，我們用 Google Apps Script 當作中間層：

1. 前往 [Google Apps Script](https://script.google.com/)
2. 建立新專案，命名為「LINE Push API」
3. 將 `doPost-line-push.txt` 的內容貼入
4. 設定腳本屬性：
   - 點擊「設定」(⚙️) → 「腳本屬性」
   - 新增屬性：
     - 屬性：`LINE_CHANNEL_ACCESS_TOKEN`
     - 值：貼上步驟 2 取得的 Token
5. 部署為網路應用程式：
   - 點擊「部署」→「新增部署」
   - 類型：網路應用程式
   - 執行身分：我自己
   - 誰可存取：**任何人**
6. 複製部署的網址

### 步驟 4：更新 config.js

打開 `config.js`，填入以下設定：

```javascript
LINE: {
    OFFICIAL_ACCOUNT_ID: '@324vsvvv',
    ADD_FRIEND_URL: 'https://line.me/R/ti/p/@324vsvvv',
    QR_CODE_URL: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://line.me/R/ti/p/@324vsvvv',

    // 填入步驟 1 取得的 LIFF ID
    LOGIN_CHANNEL_ID: '1234567890-abcdefgh',

    // 這個留空，Token 存在 Google Apps Script 中
    CHANNEL_ACCESS_TOKEN: '',

    // 填入步驟 3 的 Google Apps Script 部署網址
    PUSH_API_ENDPOINT: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'
},
```

---

## 🎯 流程說明

```
┌─────────────────────────────────────────────────────────────┐
│                    客戶點擊按鈕                               │
│              「用 LINE 登入並接收訂單」                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    LINE Login 授權                           │
│              客戶用 LINE 帳號登入                             │
│              (自動取得 userId)                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                發送訂單卡片到客戶 LINE                        │
│              透過 Push Message API                           │
│              客戶直接在 LINE 收到精美訂單卡片                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚠️ 注意事項

1. **Push Message 限制**：
   - 客戶必須先加入你的官方帳號好友，才能收到推播
   - 如果客戶尚未加好友，系統會引導他們加入

2. **LIFF 網址設定**：
   - LIFF 的 Endpoint URL 必須是 HTTPS
   - 測試時可以用 ngrok 等工具產生 HTTPS 網址

3. **安全性**：
   - Channel Access Token 一定要存在後端（Google Apps Script）
   - 前端不應該直接存取 Token

4. **備用方案**：
   - 如果 LINE Login 失敗，系統會自動顯示 QR Code
   - 客戶可以手動掃碼加好友並貼上訂單資訊

---

## 📱 測試方式

1. 在本機啟動網頁伺服器
2. 使用 ngrok 產生 HTTPS 網址
3. 更新 LIFF 的 Endpoint URL
4. 用手機開啟網頁測試完整流程

---

## 🔗 相關連結

- [LINE Developers Console](https://developers.line.biz/console/)
- [LIFF 文件](https://developers.line.biz/en/docs/liff/)
- [Messaging API - Push Message](https://developers.line.biz/en/docs/messaging-api/sending-messages/#send-push-messages)
- [Flex Message Simulator](https://developers.line.biz/flex-simulator/)

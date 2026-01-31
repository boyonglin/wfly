# SHOPLINE Payments 串接手冊

## 目錄

1. [概述](#概述)
2. [申請流程](#申請流程)
3. [設定步驟](#設定步驟)
4. [Google Apps Script 部署](#google-apps-script-部署)
5. [前端設定](#前端設定)
6. [Webhook 設定](#webhook-設定)
7. [測試流程](#測試流程)
8. [上線檢查清單](#上線檢查清單)

---

## 概述

SHOPLINE Payments 提供整合式金流服務，支援以下付款方式：

| 付款方式     | 說明                    | 手續費參考  |
| ------------ | ----------------------- | ----------- |
| 信用卡       | VISA / Mastercard / JCB | 2.0% ~ 2.5% |
| LINE Pay     | 行動支付                | 2.0% ~ 2.5% |
| ATM 虛擬帳號 | 銀行轉帳                | 固定費用    |
| 信用卡分期   | 3/6/12 期               | 依期數不同  |

### 串接方式

本專案採用**導轉式**串接：

1. 透過 API 建立結帳交易 (Checkout Session)
2. 取得付款頁面 URL (sessionUrl)
3. 將客戶導轉至 SHOPLINE 付款頁面
4. 付款完成後導回指定 returnUrl
5. 透過 Webhook 接收付款通知

---

## 申請流程

### 1. 聯繫 SHOPLINE Payments

- 網站：https://www.shoplinepayments.com/
- 準備資料：
  - 公司登記資料
  - 負責人身分證明
  - 銀行帳戶資料
  - 網站資訊

### 2. 審核通過後取得金鑰

| 金鑰         | 用途                 |
| ------------ | -------------------- |
| `merchantId` | 特店 ID              |
| `apiKey`     | API 介面金鑰         |
| `signKey`    | Webhook 簽章驗證金鑰 |

---

## 設定步驟

### 1. 建立 Google Apps Script 專案

1. 開啟 Google Apps Script：https://script.google.com/
2. 建立新專案
3. 複製 `shopline-payments.txt` 內容貼上
4. 儲存專案

### 2. 設定腳本屬性

在 GAS 編輯器中：

1. 點擊 ⚙️ 專案設定
2. 展開「腳本屬性」
3. 新增以下屬性：

| 屬性名稱               | 值                   |
| ---------------------- | -------------------- |
| `SHOPLINE_MERCHANT_ID` | 您的特店 ID          |
| `SHOPLINE_API_KEY`     | 您的 API 金鑰        |
| `SHOPLINE_SIGN_KEY`    | 您的簽章金鑰         |
| `GOOGLE_SHEET_ID`      | 訂單 Google Sheet ID |

### 3. 部署為網頁應用程式

1. 點擊「部署」→「新增部署」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - 執行身分：我
   - 存取權限：任何人
4. 點擊「部署」
5. 複製部署 URL

---

## Google Apps Script 部署

### 檔案位置

```
member-order/google-apps-script/shopline-payments.txt
```

### 主要函數

| 函數                      | 說明              |
| ------------------------- | ----------------- |
| `createCheckoutSession()` | 建立結帳交易      |
| `queryCheckoutSession()`  | 查詢交易狀態      |
| `doGet()`                 | 處理前端 API 請求 |
| `doPost()`                | 處理 Webhook 通知 |

### API 呼叫格式

```
GET {部署URL}?action=createSession&data={BASE64_JSON}
```

**data 參數內容：**

```json
{
  "orderId": "WFB-20260126-1234",
  "amount": 7888,
  "returnUrl": "https://example.com/success",
  "paymentMethods": ["CreditCard", "LinePay"],
  "paymentOptions": {
    "creditCardInstallments": ["0", "3", "6"]
  },
  "customer": {
    "name": "王小明",
    "email": "test@example.com",
    "phone": "0912345678"
  },
  "sandbox": true
}
```

---

## 前端設定

### 1. 更新 config-api.js

```javascript
SHOPLINE_PAYMENTS: {
  ENABLED: true,           // 啟用 SHOPLINE Payments
  SANDBOX: true,           // 測試模式（上線改 false）
  ENDPOINT: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",

  PAYMENT_METHODS: {
    CREDIT_CARD: true,     // 信用卡
    LINE_PAY: true,        // LINE Pay
    VIRTUAL_ACCOUNT: true, // ATM 虛擬帳號
    INSTALLMENT: true,     // 分期付款
  },

  INSTALLMENT_OPTIONS: ["0", "3", "6", "12"],
  VIRTUAL_ACCOUNT_EXPIRE: 1440,  // 24 小時
  SESSION_EXPIRE: 60,            // 60 分鐘

  getReturnUrl: () =>
    isLocalEnv()
      ? "http://127.0.0.1:5500/member-order/order-success.html"
      : "https://your-domain.com/member-order/order-success.html",
},
```

### 2. 付款方式顯示邏輯

- SHOPLINE Payments 啟用時，顯示完整付款選項
- 未啟用時，顯示原生 LINE Pay 選項
- 銀行轉帳作為備用選項

---

## Webhook 設定

### 1. 向 SHOPLINE 申請設定

聯繫 SHOPLINE 串接窗口，提供：

- 您的 merchantId
- Webhook URL（即 GAS 部署 URL）
- 需訂閱的事件類型

### 2. 事件類型

| 事件                     | 說明     | 處理動作            |
| ------------------------ | -------- | ------------------- |
| `trade.succeeded`        | 付款成功 | 更新 Sheet 付款狀態 |
| `trade.failed`           | 付款失敗 | 記錄錯誤            |
| `trade.expired`          | 付款逾時 | 通知客戶            |
| `session.succeeded`      | 結帳成功 | 同付款成功          |
| `trade.refund.succeeded` | 退款成功 | 更新退款狀態        |

### 3. 簽章驗證

Webhook 通知會包含簽章，用於驗證來源：

```
Header:
  timestamp: 1629169157000
  sign: 873c40ac22fc8bd19674b9b778cc42d2

驗證方式:
  payload = timestamp + "." + bodyString
  expectedSign = HMAC-SHA256(payload, signKey)
```

---

## 測試流程

### 1. 沙盒環境測試

1. 確認 `SANDBOX: true`
2. 使用測試信用卡號：
   - 成功：4000-0000-0000-0002
   - 失敗：4000-0000-0000-0011
3. 完成付款流程測試

### 2. 測試項目

- [ ] 建立結帳交易成功
- [ ] 導轉至付款頁面
- [ ] 信用卡付款成功
- [ ] LINE Pay 付款成功
- [ ] ATM 轉帳取得帳號
- [ ] 分期付款選擇
- [ ] 付款完成導回成功頁
- [ ] Webhook 接收通知
- [ ] Google Sheet 更新狀態

---

## 上線檢查清單

### 1. 環境切換

- [ ] `config-api.js` 的 `SANDBOX` 改為 `false`
- [ ] GAS 腳本重新部署（若有修改）
- [ ] 更新 returnUrl 為正式網域

### 2. 安全檢查

- [ ] API Key 未暴露在前端程式碼
- [ ] signKey 僅存於 GAS 腳本屬性
- [ ] Webhook 簽章驗證已啟用

### 3. 功能驗證

- [ ] 正式環境小額付款測試
- [ ] 退款功能測試
- [ ] 錯誤處理測試

---

## 常見問題

### Q: 建立結帳交易失敗？

1. 檢查 merchantId、apiKey 是否正確
2. 確認 GAS 部署權限為「任何人」
3. 查看 GAS 執行記錄

### Q: Webhook 收不到通知？

1. 確認已向 SHOPLINE 申請設定 Webhook URL
2. 檢查 GAS doPost 函數是否正確
3. 查看 SHOPLINE 後台通知記錄

### Q: 付款成功但 Sheet 未更新？

1. 檢查 GOOGLE_SHEET_ID 設定
2. 確認 Sheet 欄位對應正確
3. 查看 GAS 執行錯誤記錄

---

## 技術支援

- SHOPLINE Payments 文件：https://docs.shoplinepayments.com/
- SHOPLINE Payments 串接窗口：聯繫業務取得

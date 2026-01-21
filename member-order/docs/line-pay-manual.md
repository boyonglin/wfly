# LINE Pay 串接指南

## 📋 概述

本指南說明如何在保留原有「銀行轉帳」的情況下，新增「LINE Pay」線上支付選項。

**部署環境**：

- 本地開發：`http://127.0.0.1:5500/member-order/`
- 正式環境：`https://boyonglin.github.io/wfly/member-order/`

---

## 🔑 你需要提供的資訊

請到 [LINE Pay Merchant Center](https://pay.line.me/portal/tw/merchant) 取得以下資訊：

| 項目                   | 說明       | 你的資料（請填寫）              |
| ---------------------- | ---------- | ------------------------------- |
| **Channel ID**         | 商家識別碼 | `__________________`            |
| **Channel Secret Key** | 商家密鑰   | ⚠️ 不要貼在這裡！直接設定到 GAS |

⚠️ **重要安全提醒**：Channel Secret Key 必須保存在後端（Google Apps Script），絕對不能放在前端！

---

## 🔧 步驟一：設定 Google Apps Script

### 1. 開啟你的 Google Apps Script 專案

目前你有兩個 GAS 端點：

- **主表單 API**：`GOOGLE_SCRIPT_URL`（寫入訂單）
- **代理 API**：`API.PROXY_ENDPOINT`（LINE Push、Calendar）

建議在 **代理 API** 的專案中新增 LINE Pay 功能。

### 2. 新增腳本屬性

1. 在 GAS 編輯器中，點擊左側「⚙️ 專案設定」
2. 向下捲動到「腳本屬性」
3. 新增以下屬性：

| 屬性名稱                 | 值                                 |
| ------------------------ | ---------------------------------- |
| `LINEPAY_CHANNEL_ID`     | 你的 Channel ID                    |
| `LINEPAY_CHANNEL_SECRET` | 你的 Channel Secret Key            |
| `LINEPAY_SANDBOX`        | `true`（測試用）或 `false`（正式） |

### 3. 新增 LINE Pay 處理程式碼

在你的 GAS 專案中新增：gas-line-pay.txt

---

## 🔧 步驟二：更新 config.js

完成 GAS 設定後，告訴我你的 **Channel ID**（不是 Secret），我會幫你更新 `config.js`，新增以下設定：

```javascript
// 在 PAYMENT 區塊下方新增
LINE_PAY: {
  ENABLED: true,
  SANDBOX: true, // 測試時設為 true，正式上線改為 false

  // 回傳網址設定
  CONFIRM_URL: {
    LOCAL: 'http://127.0.0.1:5500/member-order/order-success.html',
    PRODUCTION: 'https://boyonglin.github.io/wfly/member-order/order-success.html'
  },
  CANCEL_URL: {
    LOCAL: 'http://127.0.0.1:5500/member-order/order-form.html',
    PRODUCTION: 'https://boyonglin.github.io/wfly/member-order/order-form.html'
  }
}
```

---

## 🔧 步驟三：更新前端表單

我會修改 `order-form.html`，新增付款方式選擇：

- ✅ 銀行轉帳（保留原有功能）
- ✅ LINE Pay（新增）

---

## 📱 付款流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                    客戶選擇付款方式                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
   ┌──────────────────┐            ┌──────────────────┐
   │   銀行轉帳       │            │    LINE Pay      │
   │  （原有流程）     │            │   （新增流程）    │
   └──────────────────┘            └──────────────────┘
              │                               │
              ▼                               ▼
   ┌──────────────────┐            ┌──────────────────┐
   │ 顯示銀行帳號      │            │ 呼叫 GAS API     │
   │ 等待客戶轉帳      │            │ linePayRequest   │
   └──────────────────┘            └──────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │ 導向 LINE Pay    │
                                   │ 付款頁面         │
                                   └──────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │ 客戶完成付款     │
                                   │ 自動導回網站     │
                                   └──────────────────┘
                                              │
                                              ▼
                                   ┌──────────────────┐
                                   │ 呼叫 GAS API     │
                                   │ linePayConfirm   │
                                   └──────────────────┘
                                              │
              ┌───────────────────────────────┘
              ▼
   ┌──────────────────────────────────────────────────────────┐
   │                order-success.html 顯示結果               │
   │  • 銀行轉帳：顯示「待付款」+ 銀行帳號                     │
   │  • LINE Pay：顯示「已付款」                              │
   └──────────────────────────────────────────────────────────┘
```

---

## ✅ 確認清單

請完成以下步驟：

- [ ] 1. 取得 LINE Pay **Channel ID**：`__________________`
- [ ] 2. 取得 LINE Pay **Channel Secret Key**（先記好，待會設定到 GAS）
- [ ] 3. 將 GAS 程式碼貼到你的 Apps Script 專案
- [ ] 4. 在 GAS 設定腳本屬性（3 個）
- [ ] 5. 重新部署 GAS（取得新版本 URL）

完成後請告訴我：

1. 你的 **Channel ID**
2. 是否要先用 **Sandbox 測試環境**？

我會幫你完成前端程式碼的修改：

- config.js - 新增 LINE Pay 設定
- order-form.html - 新增付款方式選擇 UI
- order-success.html - 處理 LINE Pay 付款結果

---

## 💡 測試建議

### Sandbox 測試環境

- LINE Pay 提供 Sandbox 測試環境，不會真的扣款
- 建議先用 Sandbox 測試，確認流程正常後再切換到正式環境
- Sandbox 的 Channel ID/Secret 與正式環境不同

### 本地測試注意事項

- `http://127.0.0.1:5500` 可以作為 confirmUrl/cancelUrl
- LINE Pay 會正常導回本地網址

---

## 💰 手續費資訊（參考）

| 項目       | 費率           |
| ---------- | -------------- |
| 交易手續費 | 約 2.5% - 3.0% |
| 最低收費   | 依合約         |
| 撥款週期   | 月結           |

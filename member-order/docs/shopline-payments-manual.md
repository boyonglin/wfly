# Shopline Payments 串接指南

## 📋 概述

本指南說明如何串接 Shopline Payments 的信用卡付款與分期付款功能。

**部署環境**：

- 本地開發：`http://127.0.0.1:5500/member-order/`
- 正式環境：`https://boyonglin.github.io/wfly/member-order/`

---

## 🔑 你需要提供的資訊

請到 [SHOPLINE Payments 台灣](https://shopline.tw/payments) 申請商家帳號，並取得以下資訊：

| 項目                         | 說明       | 你的資料（請填寫）           |
| ---------------------------- | ---------- | ---------------------------- |
| **商家識別碼 (Merchant ID)** | 商家識別碼 | `__________________`         |
| **API Key**                  | API 金鑰   | 不要貼在這裡！直接設定到 GAS |
| **API Secret**               | API 密鑰   | 不要貼在這裡！直接設定到 GAS |

**重要安全提醒**：API Key 和 Secret 必須保存在後端（Google Apps Script），絕對不能放在前端！

---

## 💳 支援的付款方式

### 1. 信用卡付款 (CREDIT_CARD)

支援國內外主要信用卡：

- VISA
- Mastercard
- JCB
- UnionPay (銀聯卡)

**手續費**：約 2.2% - 2.8%（依合約而定）

### 2. 信用卡分期付款 (INSTALLMENT)

支援台灣主要銀行的信用卡分期服務：

- 中國信託
- 國泰世華
- 玉山銀行
- 台新銀行
- 永豐銀行
- 聯邦銀行
- 凱基銀行
- 星展銀行

**分期期數與手續費**：

| 期數  | 手續費率 | 說明        |
| ----- | -------- | ----------- |
| 3 期  | 2.4%     | 3 期 0 利率 |
| 6 期  | 4.8%     | 6 期 0 利率 |
| 12 期 | 7.2%     | 12 期       |
| 18 期 | 9.0%     | 18 期       |
| 24 期 | 10.8%    | 24 期       |

**分期最低金額**：NT$ 3,000

---

## 🔧 步驟一：設定 Google Apps Script

### 1. 開啟你的 Google Apps Script 專案

建議使用現有的 **代理 API** 專案（`API.PROXY_ENDPOINT`）。

### 2. 新增腳本屬性

1. 在 GAS 編輯器中，點擊左側「⚙️ 專案設定」
2. 向下捲動到「腳本屬性」
3. 新增以下屬性：

| 屬性名稱               | 值                                     |
| ---------------------- | -------------------------------------- |
| `SHOPLINE_MERCHANT_ID` | 你的商家識別碼                         |
| `SHOPLINE_API_KEY`     | 你的 API Key                           |
| `SHOPLINE_API_SECRET`  | 你的 API Secret                        |
| `SHOPLINE_SANDBOX`     | `true`（測試用）或 `false`（正式環境） |

### 3. 新增 Shopline Payments 處理程式碼

在你的 GAS 專案中新增以下程式碼：

```javascript
/**
 * Shopline Payments - 信用卡付款請求
 */
function creditCardPayment(data) {
  const merchantId = PropertiesService.getScriptProperties().getProperty("SHOPLINE_MERCHANT_ID");
  const apiKey = PropertiesService.getScriptProperties().getProperty("SHOPLINE_API_KEY");
  const apiSecret = PropertiesService.getScriptProperties().getProperty("SHOPLINE_API_SECRET");
  const sandbox =
    PropertiesService.getScriptProperties().getProperty("SHOPLINE_SANDBOX") === "true";

  const apiUrl = sandbox
    ? "https://sandbox-api.shoplinepayments.com/v1/payments"
    : "https://api.shoplinepayments.com/v1/payments";

  const payload = {
    merchant_id: merchantId,
    order_id: data.orderId,
    amount: data.amount,
    currency: "TWD",
    product_name: data.productName,
    return_url: data.confirmUrl,
    cancel_url: data.cancelUrl,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const result = JSON.parse(response.getContentText());

    return {
      success: true,
      paymentUrl: result.payment_url,
      transactionId: result.transaction_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * Shopline Payments - 分期付款請求
 */
function installmentPayment(data) {
  const merchantId = PropertiesService.getScriptProperties().getProperty("SHOPLINE_MERCHANT_ID");
  const apiKey = PropertiesService.getScriptProperties().getProperty("SHOPLINE_API_KEY");
  const apiSecret = PropertiesService.getScriptProperties().getProperty("SHOPLINE_API_SECRET");
  const sandbox =
    PropertiesService.getScriptProperties().getProperty("SHOPLINE_SANDBOX") === "true";

  const apiUrl = sandbox
    ? "https://sandbox-api.shoplinepayments.com/v1/installments"
    : "https://api.shoplinepayments.com/v1/installments";

  const payload = {
    merchant_id: merchantId,
    order_id: data.orderId,
    amount: data.amount,
    currency: "TWD",
    installment_period: data.installmentPeriod,
    product_name: data.productName,
    return_url: data.confirmUrl,
    cancel_url: data.cancelUrl,
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(apiUrl, options);
    const result = JSON.parse(response.getContentText());

    return {
      success: true,
      paymentUrl: result.payment_url,
      transactionId: result.transaction_id,
    };
  } catch (error) {
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * 處理前端請求
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.action === "creditCardPayment") {
      return ContentService.createTextOutput(JSON.stringify(creditCardPayment(data))).setMimeType(
        ContentService.MimeType.JSON
      );
    }

    if (data.action === "installmentPayment") {
      return ContentService.createTextOutput(JSON.stringify(installmentPayment(data))).setMimeType(
        ContentService.MimeType.JSON
      );
    }

    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: "Unknown action" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ success: false, error: error.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 4. 部署 Google Apps Script

1. 點擊「部署」→「新增部署」
2. 選擇「網頁應用程式」
3. 執行身分：選擇「我」
4. 存取權限：選擇「任何人」
5. 點擊「部署」
6. 複製部署 URL

---

## 🔧 步驟二：更新 config-api.js

將 GAS 部署 URL 填入 `config-api.js` 的對應欄位：

```javascript
CREDIT_CARD: {
  ENABLED: true,
  SANDBOX: true, // 測試時設為 true，正式上線改為 false
  ENDPOINT: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  // ...
},

INSTALLMENT: {
  ENABLED: true,
  SANDBOX: true,
  ENDPOINT: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  // ...
},
```

---

## 📱 付款流程圖

```
┌─────────────────────────────────────────────────────────────┐
│                    客戶選擇付款方式                           │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┬───────────────┐
              ▼               ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  銀行轉帳    │ │  LINE Pay    │ │   信用卡     │ │   分期付款   │
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
              │               │               │               │
              ▼               ▼               ▼               ▼
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │ 顯示銀行帳號 │ │ 呼叫 LINE    │ │ 呼叫 Shopline│ │ 選擇分期期數 │
   │ 等待客戶轉帳 │ │ Pay API      │ │ Payments API │ │ 呼叫 API     │
   └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
                              │               │               │
                              ▼               ▼               ▼
                   ┌──────────────────────────────────────────┐
                   │         導向第三方付款頁面               │
                   └──────────────────────────────────────────┘
                                      │
                                      ▼
                   ┌──────────────────────────────────────────┐
                   │         客戶完成付款，自動導回           │
                   └──────────────────────────────────────────┘
                                      │
              ┌───────────────────────┴───────────────────────┐
              ▼                                               ▼
   ┌──────────────────────────────────────┐  ┌──────────────────────────────┐
   │ order-success.html 顯示「待付款」     │  │ order-success.html           │
   │ + 銀行帳號資訊                        │  │ 顯示「已付款」               │
   └──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## ✅ 啟用/停用付款方式

在 `config-api.js` 中，你可以透過 `ENABLED` 開關控制每種付款方式的顯示：

```javascript
CREDIT_CARD: {
  ENABLED: true,  // 設為 false 可隱藏信用卡選項
  // ...
},

INSTALLMENT: {
  ENABLED: true,  // 設為 false 可隱藏分期付款選項
  // ...
},
```

---

## 💡 測試建議

### Sandbox 測試環境

- Shopline Payments 提供 Sandbox 測試環境，不會真的扣款
- 建議先用 Sandbox 測試，確認流程正常後再切換到正式環境
- Sandbox 的 API Key/Secret 與正式環境不同

### 測試卡號（Sandbox 環境）

請參考 Shopline Payments 官方文件提供的測試卡號。

---

## 🔒 安全性注意事項

1. **絕對不要**將 API Key 和 Secret 放在前端程式碼中
2. **必須**透過 Google Apps Script 後端處理所有付款請求
3. **建議**使用 HTTPS 加密傳輸所有資料
4. **定期**更新 API Key 和 Secret

---

## 📞 技術支援

如有問題，請聯繫：

- Shopline Payments 客服：[SHOPLINE 常見問題](https://support.shoplineapp.com/hc/zh-tw/categories/4444418190489-SHOPLINE-Payments-%E5%8F%B0%E7%81%A3)
- 技術文件：[SHOPLINE Payments 官網](https://shopline.tw/payments)

---

## 📚 相關文件

- [LINE Pay 串接指南](./line-pay-manual.md)
- [自動流程說明](./auto-flow.md)
- [需求說明](./requirement.md)

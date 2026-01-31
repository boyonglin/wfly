# 訂單自動化流程

1. 客戶下單
2. 資料寫入 Google Sheets (https://docs.google.com/spreadsheets/d/1meOTrdwXBi9CNjp3OyPRNFBHPTct_PYzOCagvbPBbE0)
3. 客戶付款 (https://docs.shoplinepayments.com/)
   ├─ SHOPLINE Payments 整合金流
   │ ├─ 信用卡刷卡（VISA / Mastercard / JCB）
   │ ├─ LINE Pay
   │ ├─ ATM 虛擬帳號
   │ └─ 信用卡分期付款（3/6/12期）
   └─ LINE Pay（4 月前先用原生 API）
4. 付款成功（Webhook 回傳）
   ├─ trade.succeeded
   ├─ trade.failed
   ├─ trade.expired
   ├─ trade.processing
   ├─ trade.cancelled
   ├─ trade.customer_action
   ├─ trade.refund.succeeded
   └─ trade.refund.failed
5. 自動開立發票（https://inv.ezpay.com.tw/）
6. 更新 Google Sheets（付款狀態 + 發票號碼）
7. 推送訂單確認卡片至 LINE、發票寄送至 Email
8. 確認訂單（人工）
   ├─ 確認訂單資料無誤
   ├─ 確認顧問時段可行
   └─ 點擊「確認」按鈕
9. 自動寫入 Google Calendar
   ├─ 建立預約事件
   └─ 通知服務顧問
10. 推送 LINE 通知給客戶
    "您的訂單及預約已完成！"
    預約時間：2026/01/25 14:00"

---

## 各步驟整合說明

### Step 2: Google Sheets 寫入

- 手冊：[external-setting.md](external-setting.md)
- GAS：[api-proxy.txt](../google-apps-script/api-proxy.txt)

### Step 3-4: 付款整合

| 付款方式          | 手冊                                                       | GAS                                                                  |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------------------- |
| LINE Pay          | [line-pay-manual.md](line-pay-manual.md)                   | [line-pay.txt](../google-apps-script/line-pay.txt)                   |
| SHOPLINE Payments | [shopline-payments-manual.md](shopline-payments-manual.md) | [shopline-payments.txt](../google-apps-script/shopline-payments.txt) |

### Step 5: ezPay 電子發票

- 手冊：[ezpay-invoice-manual.md](ezpay-invoice-manual.md)
- GAS：[ezpay-invoice.txt](../google-apps-script/ezpay-invoice.txt)

### Step 7: LINE 推播通知

- LINE Login (LIFF) 手冊：[line-login-manual.md](line-login-manual.md)
- LINE Messaging API（待整合）

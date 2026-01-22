1. 客戶下單
2. 資料寫入 Google Sheets (https://docs.google.com/spreadsheets/d/1meOTrdwXBi9CNjp3OyPRNFBHPTct_PYzOCagvbPBbE0)
3. 客戶付款 (https://docs.shoplinepayments.com/)
   └─ LINE Pay / 刷卡 / 銀行轉帳 / 分期付款
4. 付款成功（Webhook 回傳）
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

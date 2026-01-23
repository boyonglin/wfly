1. 客戶下單
2. 資料寫入 Google Sheets (https://docs.google.com/spreadsheets/d/1meOTrdwXBi9CNjp3OyPRNFBHPTct_PYzOCagvbPBbE0)
3. 客戶付款 (支援多種付款方式)
   ├─ LINE Pay（線上即時付款）✅ 已串接
   ├─ 信用卡付款（支援 VISA/Mastercard/JCB/UnionPay）✅ 已實作 UI（待串接 Shopline Payments API）
   ├─ 信用卡分期（3/6/12/18/24 期，最低 NT$3,000）✅ 已實作 UI（待串接 Shopline Payments API）
   └─ 銀行轉帳（24 小時內完成匯款）✅ 已串接
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

---

## 付款方式詳細說明

### 已實作的付款方式

1. **LINE Pay** ✅
   - 狀態：已完整串接
   - 功能：線上即時付款，快速安全
   - 文件：[LINE Pay 串接指南](./line-pay-manual.md)

2. **銀行轉帳** ✅
   - 狀態：已完整串接
   - 功能：顯示虛擬帳號，24 小時內完成匯款
   - 銀行：中國信託（822）

3. **信用卡付款** ⚠️
   - 狀態：前端 UI 已完成，待串接 Shopline Payments API
   - 支援卡別：VISA / Mastercard / JCB / UnionPay
   - 下一步：參考 [Shopline Payments 串接指南](./shopline-payments-manual.md)

4. **信用卡分期付款** ⚠️
   - 狀態：前端 UI 已完成，待串接 Shopline Payments API
   - 分期期數：3 / 6 / 12 / 18 / 24 期
   - 最低金額：NT$ 3,000
   - 手續費率：2.4% ~ 10.8%（依期數而定）
   - 下一步：參考 [Shopline Payments 串接指南](./shopline-payments-manual.md)

### 付款方式優先順序

系統會根據以下優先順序預選付款方式：

1. LINE Pay（如果已啟用且已設定）
2. 信用卡付款（如果已啟用且已設定）
3. 信用卡分期（如果已啟用且已設定）
4. 銀行轉帳（預設選項）

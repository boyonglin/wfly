/**
 * =====================================================================
 * 吾飛藝術銀行 - API 端點設定檔
 * =====================================================================
 *
 * 📁 檔案結構:
 *   1. Google Apps Script - 訂單寫入端點
 *   2. LINE Pay 設定
 *   3. LINE Login 設定
 *   4. API 代理端點
 *
 * =====================================================================
 */

const CONFIG_API = {
  // ─────────────────────────────────────────────────────────────────────
  // 1. Google Apps Script - 訂單寫入端點
  // ─────────────────────────────────────────────────────────────────────
  // 部署步驟：
  //   1) 試算表 → 擴充功能 → Apps Script
  //   2) 貼上 get-post.txt 程式碼
  //   3) 設定腳本屬性：GOOGLE_SHEET_ID
  //   4) 部署 → 新增部署 → 網頁應用程式 → 任何人皆可存取
  //   5) 複製部署 URL 貼到下方
  GOOGLE_SCRIPT_URL:
    "https://script.google.com/macros/s/AKfycbyinJN8ZSrPfDLO4MyQOJ3HOQbeEvPukJFhsqewpeKZedRajUcWiv6XHSpvivejMkax4A/exec",

  // ─────────────────────────────────────────────────────────────────────
  // 2. LINE Pay 設定
  // ─────────────────────────────────────────────────────────────────────
  // 部署步驟：
  //   1) 將 line-pay.txt 程式碼貼到 GAS
  //   2) 設定腳本屬性：LINEPAY_CHANNEL_ID、LINEPAY_CHANNEL_SECRET
  //   3) 部署 → 新增部署 → 網頁應用程式 → 任何人皆可存取
  //   4) 複製部署 URL 貼到 ENDPOINT
  LINE_PAY: {
    ENABLED: true, // 啟用開關
    SANDBOX: true, // 測試模式（正式上線請改 false）
    ENDPOINT:
      "https://script.google.com/macros/s/AKfycbxOauRcjZjhi22ah0LxCktmRpl4NejZTevjj1adv-Pz09TbjAVqX2N2CdTkQjGlu83U5Q/exec",

    // 付款完成/取消後的跳轉網址（自動偵測本機或正式環境）
    getConfirmUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-success.html"
        : "https://boyonglin.github.io/wfly/member-order/order-success.html",
    getCancelUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-form.html"
        : "https://boyonglin.github.io/wfly/member-order/order-form.html",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3. 信用卡付款設定（Shopline Payments）
  // ─────────────────────────────────────────────────────────────────────
  // 部署步驟：
  //   1) 串接 Shopline Payments API
  //   2) 設定商家帳號與密鑰
  //   3) 部署 → 新增部署 → 網頁應用程式
  //   4) 複製部署 URL 貼到 ENDPOINT
  CREDIT_CARD: {
    ENABLED: true, // 啟用開關
    SANDBOX: true, // 測試模式（正式上線請改 false）
    ENDPOINT: "", // Shopline Payments API endpoint (待設定)

    // 支援的卡別
    SUPPORTED_CARDS: ["VISA", "Mastercard", "JCB", "UnionPay"],

    // 付款完成/取消後的跳轉網址
    getConfirmUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-success.html"
        : "https://boyonglin.github.io/wfly/member-order/order-success.html",
    getCancelUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-form.html"
        : "https://boyonglin.github.io/wfly/member-order/order-form.html",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. 信用卡分期付款設定（Shopline Payments）
  // ─────────────────────────────────────────────────────────────────────
  // 支援台灣主要銀行分期付款服務
  INSTALLMENT: {
    ENABLED: true, // 啟用開關
    SANDBOX: true, // 測試模式（正式上線請改 false）
    ENDPOINT: "", // Shopline Payments API endpoint (待設定)

    // 支援的分期期數與手續費率
    PERIODS: [
      { months: 3, fee: 2.4, label: "3 期 0 利率" },
      { months: 6, fee: 4.8, label: "6 期 0 利率" },
      { months: 12, fee: 7.2, label: "12 期" },
      { months: 18, fee: 9.0, label: "18 期" },
      { months: 24, fee: 10.8, label: "24 期" },
    ],

    // 支援的銀行
    SUPPORTED_BANKS: [
      "中國信託",
      "國泰世華",
      "玉山銀行",
      "台新銀行",
      "永豐銀行",
      "聯邦銀行",
      "凱基銀行",
      "星展銀行",
    ],

    // 分期最低金額限制（新台幣）
    MIN_AMOUNT: 3000,

    // 付款完成/取消後的跳轉網址
    getConfirmUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-success.html"
        : "https://boyonglin.github.io/wfly/member-order/order-success.html",
    getCancelUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-form.html"
        : "https://boyonglin.github.io/wfly/member-order/order-form.html",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 5. LINE Login 設定（用於自動推播訂單給客戶）
  // ─────────────────────────────────────────────────────────────────────
  // 申請位置：https://developers.line.biz/console/
  LINE_LOGIN: {
    CHANNEL_ID: "2008930980-bjQhoGJN", // LIFF ID
  },

  // ─────────────────────────────────────────────────────────────────────
  // 6. API 代理端點（Google Apps Script）
  // ─────────────────────────────────────────────────────────────────────
  // 用途：
  //   - action=pushOrderCard      → LINE Push 推播訂單卡片
  //   - action=getCalendarEvents  → 讀取 Google Calendar 行事曆
  API: {
    PROXY_ENDPOINT:
      "https://script.google.com/macros/s/AKfycbwazweHXIEcursFmwhUQfIaLGsICL0TA1OB4x-Td3I6mIMt_4s7My1vGoq3x8GNngpviA/exec",
  },
};

// ─────────────────────────────────────────────────────────────────────
// 工具函式
// ─────────────────────────────────────────────────────────────────────
function isLocalEnv() {
  return window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
}

// ═══════════════════════════════════════════════════════════════════════
// 匯出至全域
// ═══════════════════════════════════════════════════════════════════════
window.CONFIG_API = CONFIG_API;

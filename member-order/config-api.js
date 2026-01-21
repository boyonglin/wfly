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
      "https://script.google.com/macros/s/AKfycbztB2V8fneuecDge_LU2Tw1R8cergFnpt_JF4Zao2sKG-mhvqLXW0lBkbRfLoj37Ck_wQ/exec",

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
  // 3. LINE Login 設定（用於自動推播訂單給客戶）
  // ─────────────────────────────────────────────────────────────────────
  // 申請位置：https://developers.line.biz/console/
  LINE_LOGIN: {
    CHANNEL_ID: "2008930980-bjQhoGJN", // LIFF ID
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. API 代理端點（Google Apps Script）
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

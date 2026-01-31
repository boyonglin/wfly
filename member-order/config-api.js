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
  // 1.1 付款期限設定
  // ─────────────────────────────────────────────────────────────────────
  PAYMENT: {
    DEADLINE_MS: 24 * 60 * 60 * 1000, // 24小時（毫秒）
  },

  // ─────────────────────────────────────────────────────────────────────
  // 2. LINE Pay 設定（原生 LINE Pay API）
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
  // 2.1 SHOPLINE Payments 設定（整合金流：刷卡/LINE Pay/ATM/分期）
  // ─────────────────────────────────────────────────────────────────────
  // 文件：https://docs.shoplinepayments.com/
  // 部署步驟：
  //   1) 將 shopline-payments.txt 程式碼貼到 GAS
  //   2) 設定 GAS 腳本屬性（見下方 CREDENTIALS 說明）
  //   3) 部署 → 新增部署 → 網頁應用程式 → 任何人皆可存取
  //   4) 複製部署 URL 貼到 ENDPOINT
  //   5) 將 Webhook URL 提供給 SHOPLINE 設定（格式：{GAS_URL}?action=webhook）
  //   6) SHOPLINE 回覆 signKey 後，更新 GAS 腳本屬性
  SHOPLINE_PAYMENTS: {
    ENABLED: true, // 啟用開關（啟用後優先於 LINE Pay）
    SANDBOX: true, // 測試模式（正式上線請改 false）
    ENDPOINT:
      "https://script.google.com/macros/s/AKfycbyqHZggZZd_N3ypKSS3-5kuW8x-oa8StwI_aFumG9J5SXK18vD4sth_eZNChUi3scAB/exec", // GAS 部署 URL（部署後填入）

    // GAS 腳本屬性需設定（憑證請勿寫在程式碼中）：
    //   - SHOPLINE_MERCHANT_ID: 特店 ID
    //   - SHOPLINE_API_KEY: API 金鑰（sk_ 開頭）
    //   - SHOPLINE_CLIENT_KEY: 客戶端金鑰（pk_ 開頭）
    //   - SHOPLINE_SIGN_KEY: 簽章金鑰（設定 Webhook 後取得）

    // 支援的付款方式
    PAYMENT_METHODS: {
      CREDIT_CARD: true, // 信用卡
      LINE_PAY: true, // LINE Pay
      VIRTUAL_ACCOUNT: true, // ATM 虛擬帳號
      INSTALLMENT: true, // 分期付款
    },

    // 分期期數設定（0 = 一次付清）
    INSTALLMENT_OPTIONS: ["0", "3", "6", "12"],

    // ATM 虛擬帳號付款期限（分鐘）
    VIRTUAL_ACCOUNT_EXPIRE: 1440, // 24 小時

    // 結帳交易逾時時間（分鐘）
    SESSION_EXPIRE: 60,

    // 付款完成後的跳轉網址
    getReturnUrl: () =>
      isLocalEnv()
        ? "http://127.0.0.1:5500/member-order/order-success.html"
        : "https://boyonglin.github.io/wfly/member-order/order-success.html",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3. LINE Login 設定（用於自動推播訂單給客戶）
  // ─────────────────────────────────────────────────────────────────────
  // 申請位置：https://developers.line.biz/console/
  LINE_LOGIN: {
    CHANNEL_ID: "2008930980-bjQhoGJN", // LIFF ID
  },

  // ─────────────────────────────────────────────────────────────────────
  // 3.1 ezPay 電子發票設定
  // ─────────────────────────────────────────────────────────────────────
  // 文件：https://inv.ezpay.com.tw/dw_files/info_api/EZP_INVI_1_2_2.pdf
  // 部署步驟：
  //   1) 將 ezpay-invoice.txt 程式碼貼到 GAS
  //   2) 設定 GAS 腳本屬性（見下方說明）
  //   3) 部署 → 新增部署 → 網頁應用程式 → 任何人皆可存取
  //   4) 複製部署 URL 貼到 ENDPOINT
  EZPAY_INVOICE: {
    ENABLED: false, // 啟用開關
    SANDBOX: true, // 測試模式（正式上線請改 false）
    ENDPOINT: "", // GAS 部署 URL（部署後填入）

    // GAS 腳本屬性需設定（憑證請勿寫在程式碼中）：
    //   - EZPAY_MERCHANT_ID: 商店代號
    //   - EZPAY_HASH_KEY: 串接金鑰 HashKey（32 字元）
    //   - EZPAY_HASH_IV: 串接金鑰 HashIV（16 字元）
    //   - EZPAY_SANDBOX: 是否為測試環境（true/false）

    // 測試平台：https://cinv.ezpay.com.tw/
    // 正式平台：https://inv.ezpay.com.tw/
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

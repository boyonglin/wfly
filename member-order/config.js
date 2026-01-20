/**
 * 吾飛藝術銀行 - 會員服務訂購單 設定檔
 * =============================================
 * 結構:
 * 1. API 設定 (Google Apps Script)
 * 2. LocalStorage Keys
 * 3. 服務據點選項
 * 4. 付款資訊
 * 5. Line 官方帳號資訊
 * 6. 產品資料定義
 */

// =============================================
// 1. API 設定 (Google Apps Script)
// =============================================
// 【工程師設定區】請填入部署好的 Google Apps Script URL 與目標 Sheet ID
// 1) 在試算表「182ZsNsbZNhF7RmgW3egw9Zg2Z3Tp-XCclHZgGmSvI34」-> 擴充功能 -> Apps Script
// 2) 貼上 doPost 範例，並部署為網路應用程式 (任何人皆可存取)
// 3) 將部署後的 URL 貼到 GOOGLE_SCRIPT_URL
const CONFIG = {
    // Google Apps Script API
    GOOGLE_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxFg58LVYjkO5TlXvs5FRyGzw6e0B2785ecxthP91_IgAFveai-NiaHn-hy8WHKV4P_DA/exec",
    GOOGLE_SHEET_ID: "182ZsNsbZNhF7RmgW3egw9Zg2Z3Tp-XCclHZgGmSvI34",

    // =============================================
    // 2. LocalStorage Keys
    // =============================================
    STORAGE_KEY: 'wufei_prod_v1_order',
    DRAFT_KEY: 'wufei_prod_v1_draft',

    // =============================================
    // 3. 服務據點選項
    // =============================================
    LOCATIONS: [
        { value: '桃園館', label: '桃園館' },
        { value: '大安館', label: '大安館' }
    ],

    // 預設據點
    DEFAULT_LOCATION: '桃園館',

    // =============================================
    // 4. 付款資訊
    // =============================================
    PAYMENT: {
        BANK_CODE: '822',
        BANK_NAME: '中國信託',
        ACCOUNT_NUMBER: '1234-5678-9012',
        // 付款期限 (毫秒) - 24 小時
        DEADLINE_MS: 24 * 60 * 60 * 1000
    },

    // =============================================
    // 5. Line 官方帳號資訊
    // =============================================
    LINE: {
        OFFICIAL_ACCOUNT_ID: '@324vsvvv',
        ADD_FRIEND_URL: 'https://line.me/R/ti/p/@324vsvvv',
        QR_CODE_URL: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://line.me/R/ti/p/@324vsvvv',

        // =============================================
        // LINE Login 設定 (用於自動發送訂單給客戶)
        // =============================================
        // 請到 LINE Developers Console 建立 LINE Login Channel
        // https://developers.line.biz/console/
        LOGIN_CHANNEL_ID: '2008930980-bjQhoGJN',  // 【請填入】LINE Login Channel ID

        // 推播 API Endpoint (建議透過後端代理，避免 Token 暴露)
        // 如果你有後端服務，請填入你的 API 端點
        // 如果沒有，可以透過 Google Apps Script 代理
        PUSH_API_ENDPOINT: 'https://script.google.com/macros/s/AKfycbyWzPpd1zYzaQHZqSYJ-Ei_sjurFf0HWcEnXXnoLllgJdNrcCLqcYj1gWwGctmOHLw-FQ/exec'  // 【可選】填入後端 API 端點，或留空使用 Google Apps Script
    },

    // =============================================
    // 6. 訂單編號前綴
    // =============================================
    ORDER_ID_PREFIX: 'WFB'
};

// =============================================
// 7. 產品資料定義
// =============================================
// 注意：icon 屬性需要在 React 中動態賦值，這裡僅提供資料結構
const PRODUCTS = [
    {
        id: 1,
        name: '個人光譜檢測',
        subName: 'Spectrum',
        price: 3888,
        period: '/30min',
        description: '透過獨家光譜技術，快速掃描個人當下的能量狀態與色彩頻率。',
        features: ['個人能量場分析', '專屬色彩頻率解碼', '提供平衡建議方案'],
        iconName: 'Sparkles', // 對應 Lucide icon 名稱
        color: 'from-pink-400 to-rose-500'
    },
    {
        id: 2,
        name: '個人軌跡盤點',
        subName: 'Individual',
        price: 7888,
        period: '/1H',
        description: '深入探索個人生命歷程，釐清核心價值與潛意識動力。',
        features: ['生命歷程回顧', '潛能天賦挖掘', '核心價值觀釐清', '未來路徑規劃'],
        iconName: 'User',
        popular: true,
        color: 'from-violet-500 to-purple-600'
    },
    {
        id: 3,
        name: '家庭軌跡盤點',
        subName: 'Family',
        price: 22800,
        period: '/2H',
        description: '解析家庭成員間的能量互動與關係動力，修復連結並建立和諧氛圍。',
        features: ['親子/伴侶關係解碼', '家庭動力系統排列', '居家能量場調整'],
        iconName: 'Heart',
        color: 'from-orange-400 to-amber-500'
    },
    {
        id: 4,
        name: '企業軌跡盤點',
        subName: 'Corporate',
        price: 68000,
        period: '/3H',
        description: '為企業組織進行全面性的能量診斷，優化團隊動能。',
        features: ['組織動能分析', '領導力與決策優化', '團隊共識凝聚'],
        iconName: 'Briefcase',
        color: 'from-slate-600 to-slate-800'
    },
    {
        id: 5,
        name: '家族軌跡盤點',
        subName: 'Genealogy',
        price: 98000,
        period: '/4H',
        description: '跨越世代的家族系統深度盤點，轉化家族傳承的印記。',
        features: ['家族系統排列深度諮詢', '跨世代連結修復', '根源力量整合'],
        iconName: 'Network',
        color: 'from-emerald-500 to-teal-700'
    }
];

// 匯出設定 (供 ES Module 使用)
// 由於是在瀏覽器端直接使用，這裡將設定掛載到 window 全域物件
window.APP_CONFIG = CONFIG;
window.APP_PRODUCTS = PRODUCTS;

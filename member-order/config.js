/**
 * =====================================================================
 * 吾飛藝術銀行 - 前端設定檔
 * =====================================================================
 *
 * 📁 檔案結構:
 *   1. LocalStorage 鍵值
 *   2. 服務據點
 *   3. LINE 官方帳號
 *   4. 訂單編號前綴
 *   5. 產品資料
 *
 * =====================================================================
 */

/* global CONFIG_API */

const CONFIG = {
  // ─────────────────────────────────────────────────────────────────────
  // 1. LocalStorage 鍵值
  // ─────────────────────────────────────────────────────────────────────
  STORAGE_KEY: "wufei_prod_v1_order", // 已完成訂單
  DRAFT_KEY: "wufei_prod_v1_draft", // 表單草稿

  // ─────────────────────────────────────────────────────────────────────
  // 2. 服務據點
  // ─────────────────────────────────────────────────────────────────────
  LOCATIONS: [
    { value: "桃園館", label: "桃園館" },
    { value: "大安館", label: "大安館" },
  ],
  DEFAULT_LOCATION: "桃園館",

  // ─────────────────────────────────────────────────────────────────────
  // 3. LINE 官方帳號
  // ─────────────────────────────────────────────────────────────────────
  LINE: {
    OFFICIAL_ACCOUNT_ID: "@324vsvvv",
    ADD_FRIEND_URL: "https://line.me/R/ti/p/@324vsvvv",
    QR_CODE_URL:
      "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://line.me/R/ti/p/@324vsvvv",
  },

  // ─────────────────────────────────────────────────────────────────────
  // 4. 訂單編號前綴
  // ─────────────────────────────────────────────────────────────────────
  ORDER_ID_PREFIX: "WFB",
};

// ═══════════════════════════════════════════════════════════════════════
// 6. 產品資料
// ═══════════════════════════════════════════════════════════════════════
// iconName 對應 Lucide 圖標名稱，會在 React 中動態轉換成元件
// 產品分類定義
const PRODUCT_CATEGORIES = [
  { id: "inventory", name: "內資產盤點" },
  { id: "art", name: "配置藝術" },
];

const PRODUCTS = [
  {
    id: 1,
    name: "個人光譜檢測",
    subName: "Spectrum",
    price: 3888,
    period: "/30min",
    description: "透過獨家光譜技術，快速掃描個人當下的能量狀態與色彩頻率。",
    features: ["個人能量場分析", "專屬色彩頻率解碼", "提供平衡建議方案"],
    iconName: "Sparkles",
    color: "from-pink-400 to-rose-500",
    category: "inventory",
  },
  {
    id: 2,
    name: "個人軌跡盤點",
    subName: "Individual",
    price: 7888,
    period: "/1H",
    description: "深入探索個人生命歷程，釐清核心價值與潛意識動力。",
    features: ["生命歷程回顧", "潛能天賦挖掘", "核心價值觀釐清", "未來路徑規劃"],
    iconName: "User",
    popular: true,
    color: "from-violet-500 to-purple-600",
    category: "inventory",
  },
  {
    id: 3,
    name: "家庭軌跡盤點",
    subName: "Family",
    price: 22800,
    period: "/2H",
    description: "解析家庭成員間的能量互動與關係動力，修復連結並建立和諧氛圍。",
    features: ["親子/伴侶關係解碼", "家庭動力系統排列", "居家能量場調整"],
    iconName: "Heart",
    color: "from-orange-400 to-amber-500",
    category: "inventory",
  },
  {
    id: 4,
    name: "企業軌跡盤點",
    subName: "Corporate",
    price: 68000,
    period: "/3H",
    description: "為企業組織進行全面性的能量診斷，優化團隊動能。",
    features: ["組織動能分析", "領導力與決策優化", "團隊共識凝聚"],
    iconName: "Briefcase",
    color: "from-slate-600 to-slate-800",
    category: "inventory",
  },
  {
    id: 5,
    name: "家族軌跡盤點",
    subName: "Genealogy",
    price: 98000,
    period: "/4H",
    description: "跨越世代的家族系統深度盤點，轉化家族傳承的印記。",
    features: ["家族系統排列深度諮詢", "跨世代連結修復", "根源力量整合"],
    iconName: "Network",
    color: "from-emerald-500 to-teal-700",
    category: "inventory",
  },
  // ─────────────────────────────────────────────────────────────────────
  // 配置藝術分類
  // ─────────────────────────────────────────────────────────────────────
  {
    id: 6,
    name: "藝術療癒燈畫",
    subName: "燈畫專區",
    price: 69800,
    period: "/件",
    description: "結合光影與藝術的療癒燈畫，為空間注入溫暖與能量。",
    features: ["獨特光影藝術", "療癒氛圍營造", "空間能量提升"],
    iconName: "Sparkles",
    color: "from-amber-400 to-orange-500",
    category: "art",
  },
  {
    id: 7,
    name: "收藏畫作",
    subName: "畫作專區",
    price: 300000,
    period: "/件",
    description: "精選藝術收藏畫作，為您的空間增添獨特的藝術價值。",
    features: ["精選藝術品", "收藏價值", "專業藝術諮詢"],
    iconName: "PenTool",
    color: "from-indigo-500 to-purple-600",
    category: "art",
  },
];

// ═══════════════════════════════════════════════════════════════════════
// 合併 API 設定並匯出至全域
// ═══════════════════════════════════════════════════════════════════════
// 將 CONFIG_API 的屬性合併到 CONFIG（需在 config-api.js 之後載入）
if (typeof CONFIG_API !== "undefined") {
  Object.assign(CONFIG, CONFIG_API);
  // 合併 LINE Login 到 LINE 物件
  if (CONFIG_API.LINE_LOGIN) {
    CONFIG.LINE.LOGIN_CHANNEL_ID = CONFIG_API.LINE_LOGIN.CHANNEL_ID;
  }
}

window.APP_CONFIG = CONFIG;
window.APP_PRODUCTS = PRODUCTS;
window.APP_PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;

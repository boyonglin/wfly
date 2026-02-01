// =============================================
// 引入 React 與 Lucide 圖標庫
// =============================================
import React, { useState, useEffect, useRef } from "https://esm.sh/react@18.2.0";
import { createRoot } from "https://esm.sh/react-dom@18.2.0/client";
import { createPortal } from "https://esm.sh/react-dom@18.2.0";
import {
  ChevronDown,
  Check,
  Send,
  User,
  Info,
  Plus,
  Minus,
  Sparkles,
  Heart,
  Briefcase,
  Network,
  PenTool,
  Eraser,
  X,
  Edit3,
  Loader2,
  ShieldCheck,
  Save,
  Trash2,
  CreditCard,
  Wallet,
  Building2,
  Calendar,
  AlertCircle,
} from "https://esm.sh/lucide-react@0.263.1";

// =============================================
// 從全域設定取得常數
// =============================================
const {
  GOOGLE_SCRIPT_URL,
  STORAGE_KEY,
  DRAFT_KEY,
  LOCATIONS,
  DEFAULT_LOCATION,
  PAYMENT,
  LINE_PAY,
  SHOPLINE_PAYMENTS,
  ORDER_ID_PREFIX,
  API,
} = window.APP_CONFIG;

// Icon 映射表 - Lucide 圖標
const ICON_MAP = {
  Sparkles,
  User,
  Heart,
  Briefcase,
  Network,
  PenTool,
};

// 將產品資料轉換為包含 Icon 元件的版本
const initialProducts = window.APP_PRODUCTS.map(product => ({
  ...product,
  Icon: ICON_MAP[product.iconName] || Sparkles,
}));

// =============================================
// 訂單填寫表單元件
// =============================================
const OrderFormPage = () => {
  // =============================================
  // 狀態管理
  // =============================================
  const [consultantInfo, setConsultantInfo] = useState({
    name: "",
    id: "",
    location: DEFAULT_LOCATION,
  });
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    birthday: "",
    email: "",
    address: "",
    company: "",
    taxId: "",
    source: "",
    notes: "",
    appointmentDate: "",
    appointmentTime: "",
    appointmentPeriod: "morning",
  });
  const [errors, setErrors] = useState({});
  const [expandedCards, setExpandedCards] = useState({});
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // 產品分類頁籤
  const productCategories = window.APP_PRODUCT_CATEGORIES || [];
  const [activeCategory, setActiveCategory] = useState(productCategories[0]?.id || "inventory");

  // 簽名板相關
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [modalHasSignature, setModalHasSignature] = useState(false);

  // 編輯模式 - 保留原訂單編號
  const [editingOrderId, setEditingOrderId] = useState(null);

  // 付款取消提示
  const [paymentCancelledNotice, setPaymentCancelledNotice] = useState(false);

  // 付款方式選擇
  // 優先順序：SHOPLINE Payments > LINE Pay
  const getDefaultPaymentMethod = () => {
    if (SHOPLINE_PAYMENTS?.ENABLED && SHOPLINE_PAYMENTS?.ENDPOINT) {
      return "shopline"; // SHOPLINE Payments（多種付款方式）
    }
    if (LINE_PAY?.ENABLED && LINE_PAY?.ENDPOINT) {
      return "linepay"; // 原生 LINE Pay
    }
    return "shopline"; // 預設使用 SHOPLINE Payments
  };
  const [paymentMethod, setPaymentMethod] = useState(getDefaultPaymentMethod());

  // SHOPLINE Payments 子選項
  const [shoplinePaymentType, setShoplinePaymentType] = useState("creditcard");
  const [installmentCount, setInstallmentCount] = useState("3"); // 預設 3 期

  // 自定義下拉選單狀態
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const periodRef = useRef(null);
  const timeRef = useRef(null);
  const locationRef = useRef(null);

  // 自定義行事曆狀態
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const isPastDate = date => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateString = date => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // =============================================
  // Dropdown 位置計算 - 自動偵測視窗邊界
  // =============================================
  const getDropdownPosition = (ref, maxHeight = 240) => {
    if (!ref?.current) {
      return { top: "auto", left: "16px", width: "auto" };
    }
    const rect = ref.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUpwards = spaceBelow < maxHeight && spaceAbove > spaceBelow;

    if (openUpwards) {
      return {
        bottom: viewportHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
      };
    }
    return {
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    };
  };

  // =============================================
  // 自定義行事曆 - 透過 Apps Script 代理 Google Calendar
  // =============================================
  const fetchCalendarEvents = async month => {
    const endpoint = API?.PROXY_ENDPOINT;
    if (!endpoint) {
      setCalendarError("尚未設定 API 代理端點。");
      setCalendarLoading(false);
      return;
    }

    setCalendarLoading(true);
    try {
      const year = month.getFullYear();
      const m = month.getMonth();
      const timeMin = new Date(year, m, 1).toISOString();
      const timeMax = new Date(year, m + 1, 0, 23, 59, 59).toISOString();
      const payload = window.WFLYUtils.encodeToBase64({ timeMin, timeMax });
      const url = `${endpoint}?action=getCalendarEvents&data=${encodeURIComponent(payload)}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Calendar proxy 回應錯誤");
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Calendar proxy 回應錯誤");
      }

      const events = (data.events || []).map(it => ({
        id: it.id,
        title: it.summary || "(無標題)",
        start: it.start?.dateTime || it.start?.date,
        end: it.end?.dateTime || it.end?.date,
        allDay: Boolean(it.start?.date),
      }));

      setCalendarEvents(events);
      setCalendarError("");
    } catch (err) {
      console.error("GCAL 代理讀取失敗:", err);
      setCalendarError("行事曆載入失敗，請稍後再試。");
    }
    setCalendarLoading(false);
  };

  useEffect(() => {
    fetchCalendarEvents(calendarMonth);
  }, [calendarMonth]);

  // 取得當月日期陣列（用於行事曆格線）
  const getCalendarDays = date => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    // 週一開始 (0=Mon, 6=Sun)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    const days = [];
    // 上月補空
    for (let i = 0; i < adjustedStart; i++) {
      const prevDate = new Date(year, month, -adjustedStart + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    // 本月
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // 補滿至該週結束（只補到包含當月最後一天的那週）
    const lastDayOfWeek = lastDay.getDay();
    // 週一開始，計算該週剩餘天數 (週日=0 -> 需補0天, 週一=1 -> 需補6天, ...)
    const daysToFillWeek = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    for (let i = 1; i <= daysToFillWeek; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  };

  // 取得某日的事件
  const getEventsForDay = date => {
    return calendarEvents.filter(ev => {
      const evDate = new Date(ev.start);
      return (
        evDate.getFullYear() === date.getFullYear() &&
        evDate.getMonth() === date.getMonth() &&
        evDate.getDate() === date.getDate()
      );
    });
  };

  // =============================================
  // 初始化 Effect - 載入草稿
  // =============================================
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlConsultant = {
      name: params.get("c_name"),
      id: params.get("c_id"),
      location: params.get("loc"),
    };

    // 檢查是否從付款取消返回
    const isPaymentCancelled = params.get("paymentCancelled") === "true";
    if (isPaymentCancelled) {
      setPaymentCancelledNotice(true);
      // 清除 URL 參數
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 檢查是否有已完成的訂單
    try {
      const savedOrder = localStorage.getItem(STORAGE_KEY);
      if (savedOrder) {
        const parsedOrder = JSON.parse(savedOrder);
        if (parsedOrder.deadline && parsedOrder.deadline > Date.now()) {
          // 只有當訂單已付款或處理中時才跳轉到成功頁
          // pending 狀態留在表單頁或先不處理（讓 order-success 顯示付款按鈕）
          if (parsedOrder.paymentStatus === "paid" || parsedOrder.paymentStatus === "processing") {
            window.location.href = "order-success.html?new=1";
            return;
          }
          // pending 狀態：有 sessionUrl 表示訂單已建立，跳轉到 order-success 顯示付款按鈕
          if (parsedOrder.sessionUrl) {
            window.location.href = "order-success.html?new=1";
            return;
          }
          // 沒有 sessionUrl 的 pending 訂單（理論上不該出現），清除讓用戶重新填寫
          localStorage.removeItem(STORAGE_KEY);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Failed to check saved order:", error);
      localStorage.removeItem(STORAGE_KEY);
    }

    // 載入草稿
    let draftLoaded = false;
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        setConsultantInfo(prev => ({
          name: urlConsultant.name || draft.consultantInfo?.name || prev.name,
          id: urlConsultant.id || draft.consultantInfo?.id || prev.id,
          location: urlConsultant.location || draft.consultantInfo?.location || prev.location,
        }));
        if (draft.customerInfo) setCustomerInfo(draft.customerInfo);
        if (draft.cart) setCart(draft.cart);
        if (draft.signatureData) setSignatureData(draft.signatureData);
        if (draft.editingOrderId) setEditingOrderId(draft.editingOrderId); // 載入原訂單編號
        draftLoaded = true;
      }
    } catch (e) {
      console.error("Draft load failed", e);
    }

    if (!draftLoaded) {
      setConsultantInfo(prev => ({
        name: urlConsultant.name || prev.name,
        id: urlConsultant.id || prev.id,
        location: urlConsultant.location || prev.location,
      }));
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      // 捲動時關閉所有下拉選單
      setShowPeriodDropdown(false);
      setShowTimeDropdown(false);
      setShowLocationDropdown(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // =============================================
  // 檢查表單是否為空
  // =============================================
  const isFormEmpty = () => {
    // 檢查顧問資料（排除 location，因為有預設值）
    const consultantEmpty = !consultantInfo.name && !consultantInfo.id;

    // 檢查客戶資料（排除 appointmentPeriod，因為有預設值）
    const fieldsToCheck = Object.entries(customerInfo)
      .filter(([key]) => key !== "appointmentPeriod")
      .map(([, val]) => val);
    const customerEmpty = fieldsToCheck.every(val => !val);

    // 檢查購物車
    const cartEmpty = Object.keys(cart).length === 0;

    // 檢查簽名
    const signatureEmpty = !signatureData;

    return consultantEmpty && customerEmpty && cartEmpty && signatureEmpty;
  };

  // =============================================
  // 自動儲存 Effect
  // =============================================
  useEffect(() => {
    const draftData = {
      consultantInfo,
      customerInfo,
      cart,
      signatureData,
      editingOrderId, // 保存編輯中的訂單編號
      updatedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }, [consultantInfo, customerInfo, cart, signatureData, editingOrderId]);

  // =============================================
  // 點擊外部關閉下拉選單
  // =============================================
  useEffect(() => {
    const handleClickOutside = event => {
      // 檢查是否點擊在時段下拉選單區域內
      const periodDropdown = document.querySelector('[data-dropdown="period"]');
      const timeDropdown = document.querySelector('[data-dropdown="time"]');
      const locationDropdown = document.querySelector('[data-dropdown="location"]');

      const isInsidePeriodRef = periodRef.current?.contains(event.target);
      const isInsidePeriodDropdown = periodDropdown?.contains(event.target);
      const isInsideTimeRef = timeRef.current?.contains(event.target);
      const isInsideTimeDropdown = timeDropdown?.contains(event.target);
      const isInsideLocationRef = locationRef.current?.contains(event.target);
      const isInsideLocationDropdown = locationDropdown?.contains(event.target);

      if (showPeriodDropdown && !isInsidePeriodRef && !isInsidePeriodDropdown) {
        setShowPeriodDropdown(false);
      }
      if (showTimeDropdown && !isInsideTimeRef && !isInsideTimeDropdown) {
        setShowTimeDropdown(false);
      }
      if (showLocationDropdown && !isInsideLocationRef && !isInsideLocationDropdown) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPeriodDropdown, showTimeDropdown, showLocationDropdown]);

  // =============================================
  // 簽名板 Canvas Effects
  // =============================================
  useEffect(() => {
    if (showSignatureModal) {
      document.body.style.overflow = "hidden";
      setTimeout(initCanvas, 100);
    } else {
      document.body.style.overflow = "";
    }
  }, [showSignatureModal]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showSignatureModal) return;

    const preventDefault = e => {
      if (e.target === canvas) e.preventDefault();
    };

    canvas.addEventListener("touchmove", preventDefault, { passive: false });
    canvas.addEventListener("touchstart", preventDefault, { passive: false });
    canvas.addEventListener("touchend", preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener("touchmove", preventDefault);
      canvas.removeEventListener("touchstart", preventDefault);
      canvas.removeEventListener("touchend", preventDefault);
    };
  }, [showSignatureModal]);

  // =============================================
  // Canvas 繪圖函式
  // =============================================
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const parent = canvas.parentElement;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      const ctx = canvas.getContext("2d");
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#ffffff";
      setModalHasSignature(false);
    }
  };

  const getPoint = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.type.includes("mouse") ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes("mouse") ? e.clientY : e.touches[0].clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = e => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getPoint(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = e => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getPoint(e, canvas);
    const ctx = canvas.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!modalHasSignature) setModalHasSignature(true);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setModalHasSignature(false);
    }
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (canvas && modalHasSignature) {
      setSignatureData(canvas.toDataURL());
      setShowSignatureModal(false);
      setErrors(prev => ({ ...prev, signature_area: false }));
    } else {
      alert("請先進行簽名");
    }
  };

  // =============================================
  // 表單處理函式
  // =============================================
  const handleConsultantChange = e => {
    const { name, value } = e.target;
    setConsultantInfo(prev => ({ ...prev, [name]: value }));
    if (errors[`consultant_${name}`]) {
      setErrors(prev => ({ ...prev, [`consultant_${name}`]: false }));
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    if (name === "birthday") {
      const numericValue = value.replace(/\D/g, "").slice(0, 8);
      setCustomerInfo(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setCustomerInfo(prev => ({ ...prev, [name]: value }));
    }
    if (errors[`customer_${name}`]) {
      setErrors(prev => ({ ...prev, [`customer_${name}`]: false }));
    }
  };

  const toggleExpand = id => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

  const updateQuantity = (id, delta) => {
    setCart(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      const newCart = { ...prev };
      if (newQty === 0) delete newCart[id];
      else newCart[id] = newQty;
      return newCart;
    });
  };

  const calculateTotal = () => {
    return Object.entries(cart).reduce((total, [id, qty]) => {
      const product = initialProducts.find(p => p.id === parseInt(id));
      return total + (product ? product.price * qty : 0);
    }, 0);
  };

  // =============================================
  // 訂單處理函式
  // =============================================
  const generateOrderId = () => {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 9000 + 1000);
    return `${ORDER_ID_PREFIX}-${dateStr}-${random}`;
  };

  const sendToGoogleSheets = async finalOrder => {
    if (!GOOGLE_SCRIPT_URL) throw new Error("請先設定 GOOGLE_SCRIPT_URL");

    const itemsSummary = Object.entries(finalOrder.items)
      .map(([id, qty]) => {
        const product = initialProducts.find(p => p.id === parseInt(id));
        return `${product.name} x${qty}`;
      })
      .join(", ");

    // 判斷收入類型：有統編為 B2B，無統編為 B2C
    const revenueType = finalOrder.customer.taxId ? "B2B" : "B2C";

    const payload = {
      // 【安全性】sheetId 已移至後端腳本屬性
      isUpdate: finalOrder.isUpdate || false, // 標記是否為更新

      // ═══════════════════════════════════════════════════════════════
      // 【基本資訊區】A~D
      // ═══════════════════════════════════════════════════════════════
      timestamp: finalOrder.date, // A. 填單時間
      orderId: finalOrder.id, // B. 訂單編號
      itemsSummary, // C. 訂購品項
      total: finalOrder.total, // D. 總金額

      // ═══════════════════════════════════════════════════════════════
      // 【客戶資料區】E~L
      // ═══════════════════════════════════════════════════════════════
      customerName: finalOrder.customer.name, // E. 顧客姓名（客戶名稱）
      customerPhone: finalOrder.customer.phone, // F. 聯絡電話
      customerEmail: finalOrder.customer.email, // G. 電子郵箱
      customerBirthday: finalOrder.customer.birthday, // H. 生日
      customerAddress: finalOrder.customer.address, // I. 地址
      revenueType: revenueType, // J. 收入類型（B2B/B2C）
      customerCompany: finalOrder.customer.company, // K. 公司名稱
      customerTaxId: finalOrder.customer.taxId, // L. 統一編號

      // ═══════════════════════════════════════════════════════════════
      // 【付款資訊區】M~R（部分由 Webhook 回填）
      // ═══════════════════════════════════════════════════════════════
      paymentMethod: finalOrder.paymentMethod || "", // M. 付款方式
      installmentCount: finalOrder.installmentCount || "", // M2. 分期期數（0 或空 = 一次付清）
      paymentStatus: "待付款", // N. 付款狀態（預設，由 Webhook 更新）
      paidAt: "", // O. 入帳時間（由 Webhook 回填）
      invoiceNumber: "", // P. 發票號碼（由發票系統回填）
      invoiceDate: "", // Q. 發票日期（由發票系統回填）
      invoiceAmount: "", // R. 發票總額（由發票系統回填）

      // ═══════════════════════════════════════════════════════════════
      // 【服務安排區】S~Y
      // ═══════════════════════════════════════════════════════════════
      appointmentDate: finalOrder.customer.appointmentDate, // S. 預約日期
      appointmentPeriod: finalOrder.customer.appointmentPeriod, // T. 預約時段
      appointmentTime: finalOrder.customer.appointmentTime, // U. 預約時間
      serviceLocation: finalOrder.consultant.location, // V. 服務據點
      businessSource: "", // W. 業務來源（人工填寫）
      consultantAssigned: finalOrder.consultant.name, // X. 顧問指派（顧問姓名）
      consultantId: finalOrder.consultant.id, // Y. 顧問編號

      // ═══════════════════════════════════════════════════════════════
      // 【稽核管理區】Z~AE（人工填寫）
      // ═══════════════════════════════════════════════════════════════
      accountCheck: "", // Z. 帳務檢核
      orderCheck: "", // AA. 開戶與訂購單檢核
      deliveryCheck: "", // AB. 點交單檢核
      deliveryDate: "", // AC. 點交日期
      accompanyCheck: "", // AD. 陪跑檢核
      accompanyAssigned: "", // AE. 陪跑指派（陪跑姓名）

      // ═══════════════════════════════════════════════════════════════
      // 【其他資訊區】AF~AH
      // ═══════════════════════════════════════════════════════════════
      infoSource: finalOrder.customer.source, // AF. 資訊來源
      signature: finalOrder.signature, // AG. 客戶簽名
      notes: finalOrder.customer.notes, // AH. 備註說明

      // 保留原始資料供系統使用
      items: finalOrder.items,
    };

    console.log("Sending to Google Sheets:", payload);

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text || "{}");
    } catch (err) {
      throw new Error("Google Apps Script 回傳格式錯誤");
    }

    if (!response.ok || data.status !== "ok") {
      throw new Error(data.message || "寫入 Google Sheet 失敗");
    }

    return data;
  };

  const getInputClass = isError => {
    const baseClass =
      "w-full p-3 sm:p-4 rounded-xl border outline-none transition-all placeholder:text-slate-500 text-sm sm:text-base text-white gcg-input";
    if (isError) {
      return `${baseClass} border-red-500 ring-2 ring-red-500/20`;
    }
    return `${baseClass}`;
  };

  // =============================================
  // 表單提交處理
  // =============================================
  const handleSubmit = async e => {
    e.preventDefault();

    // 驗證必填欄位
    const newErrors = {};
    if (!consultantInfo.name) newErrors.consultant_name = true;
    if (!consultantInfo.id) newErrors.consultant_id = true;
    if (!consultantInfo.location) newErrors.consultant_location = true;
    if (!customerInfo.name) newErrors.customer_name = true;
    if (!customerInfo.phone) newErrors.customer_phone = true;
    if (!customerInfo.email) newErrors.customer_email = true;
    if (!customerInfo.appointmentDate) newErrors.customer_appointmentDate = true;
    if (!customerInfo.appointmentPeriod) newErrors.customer_appointmentPeriod = true;
    if (!customerInfo.appointmentTime) newErrors.customer_appointmentTime = true;
    if (!signatureData) newErrors.signature_area = true;

    if (customerInfo.birthday && customerInfo.birthday.length !== 8) {
      newErrors.customer_birthday = true;
      alert("生日格式錯誤！請輸入完整的 8 位數西元生日 (例如 19900101)");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorId = Object.keys(newErrors)[0];
      const element = document.getElementById(firstErrorId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.focus();
      }
      return;
    }

    if (calculateTotal() === 0) {
      alert("請至少選擇一項服務！");
      return;
    }

    setIsSubmitting(true);

    // 如果是編輯模式則使用原訂單編號，否則產生新編號
    const isUpdate = !!editingOrderId;
    const orderId = editingOrderId || generateOrderId();
    const deadline = Date.now() + PAYMENT.DEADLINE_MS;
    const finalOrder = {
      id: orderId,
      isUpdate: isUpdate, // 標記是否為更新
      consultant: consultantInfo,
      customer: customerInfo,
      items: cart,
      total: calculateTotal(),
      date: new Date().toLocaleString("zh-TW"),
      signature: signatureData,
      deadline: deadline,
      paymentMethod: paymentMethod, // 付款方式
      shoplinePaymentType: paymentMethod === "shopline" ? shoplinePaymentType : null,
      installmentCount:
        paymentMethod === "shopline" && shoplinePaymentType === "installment"
          ? installmentCount
          : null,
    };

    try {
      await sendToGoogleSheets(finalOrder);
    } catch (err) {
      console.error(err);
      alert(err.message || "無法寫入 Google Sheet，請稍後再試。");
      setIsSubmitting(false);
      return;
    }

    // =============================================
    // SHOPLINE Payments 付款流程（優先）
    // =============================================
    if (paymentMethod === "shopline" && SHOPLINE_PAYMENTS?.ENABLED && SHOPLINE_PAYMENTS?.ENDPOINT) {
      try {
        // 產生商品資訊
        const products = Object.entries(cart)
          .filter(([_, qty]) => qty > 0)
          .map(([id, qty]) => {
            const product = initialProducts.find(p => p.id === parseInt(id));
            return product
              ? {
                  id: String(product.id),
                  name: product.name,
                  quantity: qty,
                  price: product.price,
                  description: product.description,
                }
              : null;
          })
          .filter(Boolean);

        // 根據選擇的付款類型決定允許的付款方式
        let allowPaymentMethods = [];
        let paymentOptions = {};

        switch (shoplinePaymentType) {
          case "creditcard":
            allowPaymentMethods = ["CreditCard"];
            paymentOptions.creditCardInstallments = ["0"]; // 一次付清
            break;
          case "linepay":
            allowPaymentMethods = ["LinePay"];
            break;
          case "atm":
            allowPaymentMethods = ["VirtualAccount"];
            paymentOptions.virtualAccountExpireTime =
              SHOPLINE_PAYMENTS.VIRTUAL_ACCOUNT_EXPIRE || 1440;
            break;
          case "installment":
            allowPaymentMethods = ["CreditCard"];
            // 傳入使用者選擇的分期期數
            paymentOptions.creditCardInstallments = installmentCount
              ? [installmentCount]
              : SHOPLINE_PAYMENTS.INSTALLMENT_OPTIONS || ["3", "6", "12"];
            break;
          default:
            // 預設開啟所有付款方式
            allowPaymentMethods = ["CreditCard", "LinePay", "VirtualAccount"];
        }

        // 建立 SHOPLINE Payments 請求資料
        const payloadData = {
          orderId: orderId,
          amount: calculateTotal(),
          returnUrl: SHOPLINE_PAYMENTS.getReturnUrl(),
          paymentMethods: allowPaymentMethods,
          paymentOptions: paymentOptions,
          expireTime: SHOPLINE_PAYMENTS.SESSION_EXPIRE || 60,
          customer: {
            id: orderId,
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone,
          },
          order: { products },
          sandbox: SHOPLINE_PAYMENTS.SANDBOX,
        };

        // Base64 編碼（支援 UTF-8）
        const payload = window.WFLYUtils.encodeToBase64(payloadData);

        const response = await fetch(
          `${SHOPLINE_PAYMENTS.ENDPOINT}?action=createSession&data=${encodeURIComponent(payload)}`
        );
        const result = await response.json();

        if (result.success && result.sessionUrl) {
          // 儲存訂單資訊（含 SHOPLINE sessionId 和 sessionUrl）
          finalOrder.shoplineSessionId = result.sessionId;
          finalOrder.sessionUrl = result.sessionUrl; // 保存付款頁 URL
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrder));
          localStorage.removeItem(DRAFT_KEY);

          // 導向 SHOPLINE Payments 付款頁面
          window.location.href = result.sessionUrl;
          return;
        } else {
          throw new Error(result.error || "建立結帳交易失敗");
        }
      } catch (err) {
        console.error("SHOPLINE Payments Error:", err);
        alert(`付款建立失敗：${err.message}\n\n請稍後再試或聯繫客服`);
        setIsSubmitting(false);
        return;
      }
    }

    // =============================================
    // LINE Pay 付款流程（原生 LINE Pay API）
    // =============================================
    if (paymentMethod === "linepay" && LINE_PAY.ENABLED && LINE_PAY.ENDPOINT) {
      try {
        // 產生商品名稱
        const productNames = Object.entries(cart)
          .filter(([_, qty]) => qty > 0)
          .map(([id, qty]) => {
            const product = initialProducts.find(p => p.id === parseInt(id));
            return product ? `${product.name}x${qty}` : "";
          })
          .filter(Boolean)
          .join(", ");

        // 呼叫 GAS 建立 LINE Pay 付款請求
        // Base64 編碼（支援 UTF-8）
        const payloadData = {
          orderId: orderId,
          amount: calculateTotal(),
          productName: productNames || "吾飛藝術銀行服務",
          confirmUrl: LINE_PAY.getConfirmUrl(),
          cancelUrl: LINE_PAY.getCancelUrl(),
          sandbox: LINE_PAY.SANDBOX,
        };
        const payload = window.WFLYUtils.encodeToBase64(payloadData);

        const response = await fetch(
          `${LINE_PAY.ENDPOINT}?action=linePayRequest&data=${encodeURIComponent(payload)}`
        );
        const responseText = await response.text();
        const fixedText = responseText.replace(
          /"transactionId"\s*:\s*(\d+)/g,
          '"transactionId":"$1"'
        );
        const result = JSON.parse(fixedText);

        if (result.success && result.paymentUrl) {
          // 儲存訂單資訊（含 LINE Pay transactionId）
          finalOrder.linePayTransactionId = String(result.transactionId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(finalOrder));
          localStorage.removeItem(DRAFT_KEY);

          // 導向 LINE Pay 付款頁面
          window.location.href = result.paymentUrl;
          return;
        } else {
          throw new Error(result.error || "LINE Pay 建立付款請求失敗");
        }
      } catch (err) {
        console.error("LINE Pay Error:", err);
        alert(`LINE Pay 付款失敗：${err.message}\n\n請稍後再試或聯繫客服`);
        setIsSubmitting(false);
        return;
      }
    }

    // 若沒有任何付款方式可用，顯示錯誤
    alert("目前沒有可用的付款方式，請聯繫客服");
    setIsSubmitting(false);
  };

  // =============================================
  // 渲染
  // =============================================
  return (
    <div
      className="min-h-screen font-sans pb-28 sm:pb-32"
      style={{ fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}
    >
      {/* Top Bar - GCG Glass Style */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-area-top ${scrolled ? "gcg-glass" : ""}`}
      >
        <div className="max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between min-h-[48px] sm:min-h-[56px]">
          <div className="flex items-center gap-2 sm:gap-3">
            <img
              src="../logo.svg"
              alt="吾飛藝術銀行"
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl"
            />
            <span className="font-bold text-sm sm:text-base text-white tracking-tight">
              吾飛藝術銀行
            </span>
          </div>
          {!isFormEmpty() && (
            <div className="text-[8px] sm:text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-wider">
              <Save className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 草稿已暫存
            </div>
          )}
        </div>
      </div>

      {/* Hero Section - GCG Style */}
      <div className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-10 md:pb-12 px-4 sm:px-6 text-center max-w-xl lg:max-w-2xl mx-auto">
        <div className="text-[10px] sm:text-xs text-blue-400 uppercase tracking-[0.2em] mb-3 sm:mb-4 font-medium">
          Member Service
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
          會員服務
          <br className="sm:hidden" />
          <span>訂購單</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-md mx-auto">
          盤點過去，啟動未來無限潛能
        </p>
      </div>

      <div className="max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-6 space-y-8 sm:space-y-10">
        {/* 付款取消提示 */}
        {paymentCancelledNotice && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">付款已取消</p>
              <p className="text-amber-300/70 text-xs mt-1">
                您的訂單資料已保留，您可以修改資訊後重新提交，或選擇其他付款方式。
              </p>
            </div>
            <button
              onClick={() => setPaymentCancelledNotice(false)}
              className="text-amber-400/60 hover:text-amber-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 顧問資料區塊 */}
        <section className="space-y-4 sm:space-y-5">
          <h3 className="text-base sm:text-lg font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            服務顧問
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                顧問姓名 <span className="text-red-400">*</span>
              </label>
              <input
                id="consultant_name"
                type="text"
                name="name"
                value={consultantInfo.name}
                onChange={handleConsultantChange}
                className={getInputClass(errors.consultant_name)}
                placeholder="請輸入"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                顧問編號 <span className="text-red-400">*</span>
              </label>
              <input
                id="consultant_id"
                type="text"
                name="id"
                value={consultantInfo.id}
                onChange={handleConsultantChange}
                className={getInputClass(errors.consultant_id)}
                placeholder="C001"
              />
            </div>
            <div className="sm:col-span-2 space-y-2" id="consultant_location">
              <label className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                服務據點 <span className="text-red-400">*</span>
              </label>
              <div className="relative" ref={locationRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationDropdown(!showLocationDropdown);
                    setShowPeriodDropdown(false);
                    setShowTimeDropdown(false);
                  }}
                  className={`${getInputClass(errors.consultant_location)} text-sm sm:text-base text-left flex items-center justify-between w-full`}
                >
                  <span>
                    {LOCATIONS.find(loc => loc.value === consultantInfo.location)?.label ||
                      "請選擇據點"}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showLocationDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showLocationDropdown &&
                  createPortal(
                    <div
                      data-dropdown="location"
                      className="fixed z-[110] gcg-dropdown rounded-xl overflow-hidden animate-slide-down"
                      style={getDropdownPosition(locationRef, 200)}
                    >
                      {LOCATIONS.map(loc => (
                        <button
                          key={loc.value}
                          type="button"
                          onClick={() => {
                            setConsultantInfo(prev => ({
                              ...prev,
                              location: loc.value,
                            }));
                            setShowLocationDropdown(false);
                            if (errors.consultant_location) {
                              setErrors(prev => ({
                                ...prev,
                                consultant_location: false,
                              }));
                            }
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between group ${
                            consultantInfo.location === loc.value ? "bg-blue-500/10" : ""
                          }`}
                        >
                          <div className="text-sm sm:text-base font-medium text-white">
                            {loc.label}
                          </div>
                          {consultantInfo.location === loc.value && (
                            <Check className="w-4 h-4 text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>,
                    document.body
                  )}
              </div>
            </div>
          </div>
        </section>

        {/* 客戶資料區塊 */}
        <section className="space-y-4 sm:space-y-5">
          <h3 className="text-base sm:text-lg font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            客戶資料
          </h3>
          <div className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                id="customer_name"
                type="text"
                name="name"
                value={customerInfo.name}
                onChange={handleInputChange}
                placeholder="客戶姓名 *"
                className={getInputClass(errors.customer_name)}
              />
              <input
                id="customer_phone"
                type="tel"
                name="phone"
                value={customerInfo.phone}
                onChange={handleInputChange}
                placeholder="聯絡電話 *"
                className={getInputClass(errors.customer_phone)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                id="customer_birthday"
                type="tel"
                name="birthday"
                value={customerInfo.birthday}
                onChange={handleInputChange}
                maxLength={8}
                placeholder="生日（YYYYMMDD）*"
                className={getInputClass(errors.customer_birthday)}
              />
              <input
                id="customer_email"
                type="email"
                name="email"
                value={customerInfo.email}
                onChange={handleInputChange}
                placeholder="電子信箱 *"
                className={getInputClass(errors.customer_email)}
              />
            </div>
            <div>
              <input
                type="text"
                name="address"
                value={customerInfo.address}
                onChange={handleInputChange}
                placeholder="地址"
                className={getInputClass()}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <input
                type="text"
                name="company"
                value={customerInfo.company}
                onChange={handleInputChange}
                placeholder="公司名稱"
                className={getInputClass()}
              />
              <input
                type="text"
                name="taxId"
                value={customerInfo.taxId}
                onChange={handleInputChange}
                placeholder="統一編號"
                className={getInputClass()}
              />
            </div>
            <div>
              <input
                id="customer_source"
                type="text"
                name="source"
                value={customerInfo.source}
                onChange={handleInputChange}
                placeholder="資訊來源（例：網路搜尋）"
                className={getInputClass()}
              />
            </div>
          </div>
        </section>

        {/* 產品選擇區塊 */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-shrink-0">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              <span className="hidden sm:inline">選擇服務方案</span>
              <span className="sm:hidden">服務方案</span>
            </h3>
            {productCategories.length > 1 && (
              <div className="gcg-tabs">
                {productCategories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`gcg-tab ${activeCategory === cat.id ? "active" : ""}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4 sm:space-y-5">
            {initialProducts
              .filter(p => p.category === activeCategory)
              .map(product => {
                const qty = cart[product.id] || 0;
                const isSelected = qty > 0;
                const isExpanded = expandedCards[product.id];
                return (
                  <div
                    key={product.id}
                    onClick={() => toggleExpand(product.id)}
                    className={`gcg-card rounded-2xl sm:rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden relative gcg-hover-lift ${isSelected ? "gcg-card-selected" : ""}`}
                  >
                    {product.popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-[8px] sm:text-[10px] font-bold px-3 sm:px-4 py-1 sm:py-1.5 rounded-bl-xl z-10 uppercase tracking-wider">
                        Popular
                      </div>
                    )}
                    <div className="p-4 sm:p-6 flex items-center justify-between">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${product.color} flex items-center justify-center`}
                        >
                          <product.Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                          <div className="text-[9px] sm:text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-0.5">
                            {product.subName}
                          </div>
                          <div className="text-base sm:text-lg font-bold text-white">
                            {product.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        {!isSelected && (
                          <div className="text-right hidden md:block">
                            <div className="font-bold text-sm sm:text-base text-white">
                              NT$ {product.price.toLocaleString()}
                            </div>
                          </div>
                        )}
                        <ChevronDown
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden transition-all duration-300 border-t ${isExpanded ? "max-h-[500px] opacity-100 border-white/10" : "max-h-0 opacity-0 border-transparent"}`}
                    >
                      <div className="p-4 sm:p-6 pt-2">
                        <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-5 leading-relaxed">
                          {product.description}
                        </p>
                        <div className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-5">
                          {product.features.map((f, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm text-slate-300"
                            >
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />{" "}
                              {f}
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0 gcg-glass-calendar p-4 rounded-xl">
                          <div>
                            <div className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wider">
                              費用
                            </div>
                            <div className="font-bold text-lg sm:text-xl text-white">
                              <span className="text-slate-500 text-sm mr-1">NT$</span>
                              {product.price.toLocaleString()}
                            </div>
                          </div>
                          {qty === 0 ? (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                updateQuantity(product.id, 1);
                              }}
                              className="gcg-btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base font-bold active:scale-95 transition-transform w-full sm:w-auto"
                            >
                              購買
                            </button>
                          ) : (
                            <div className="flex items-center justify-center gap-3 gcg-glass-input rounded-full p-1.5">
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, -1);
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 gcg-glass-input border border-white/10 rounded-full flex items-center justify-center active:scale-95 transition-transform text-white hover:border-blue-500/50"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-bold w-5 text-center text-white text-lg">
                                {qty}
                              </span>
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, 1);
                                }}
                                className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 text-white rounded-full flex items-center justify-center active:scale-95 transition-transform hover:bg-blue-500"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* 預約行事曆區塊 - GCG Dark Theme */}
        <section className="space-y-4 sm:space-y-5">
          <h3 className="text-base sm:text-lg font-bold text-white pb-3 border-b border-white/10 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            預約行事曆
          </h3>
          <div
            className="gcg-card rounded-xl sm:rounded-2xl overflow-hidden relative"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {/* 行事曆頂部：月份與導航 */}
            <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex items-center justify-between">
              <h4 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                {calendarMonth.toLocaleDateString("zh-TW", {
                  year: "numeric",
                  month: "long",
                })}
              </h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1)
                    )
                  }
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 text-sm"
                >
                  ←
                </button>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1)
                    )
                  }
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-slate-400 text-sm"
                >
                  →
                </button>
              </div>
            </div>

            {/* 星期標題列 */}
            <div className="grid grid-cols-7 border-t border-white/10">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                <div
                  key={i}
                  className="py-2 sm:py-2.5 text-center text-[9px] sm:text-[10px] font-medium text-slate-500 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日期格線 */}
            <div className="grid grid-cols-7 border-t border-white/10">
              {getCalendarDays(calendarMonth).map((dayObj, idx) => {
                const { date, isCurrentMonth } = dayObj;
                const dayEvents = getEventsForDay(date);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected =
                  customerInfo.appointmentDate &&
                  date.toDateString() === new Date(customerInfo.appointmentDate).toDateString();

                const isPast = isPastDate(date);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isCurrentMonth && !isPastDate(date)) {
                        setCustomerInfo(prev => ({
                          ...prev,
                          appointmentDate: formatDateString(date),
                        }));
                        if (errors.customer_appointmentDate) {
                          setErrors(prev => ({ ...prev, customer_appointmentDate: false }));
                        }
                      }
                    }}
                    className={`min-h-[60px] sm:min-h-[72px] md:min-h-[85px] p-1.5 sm:p-2 border-b border-r border-white/5 transition-colors ${
                      !isCurrentMonth
                        ? "bg-black/20"
                        : isPast
                          ? ""
                          : "cursor-pointer hover:bg-white/5"
                    } ${isSelected ? "bg-blue-500/20 ring-2 ring-blue-500 ring-inset rounded-lg" : ""} ${
                      idx % 7 === 6 ? "border-r-0" : ""
                    }`}
                  >
                    {/* 日期數字 */}
                    <div
                      className={`text-lg sm:text-xl md:text-2xl font-light leading-none mb-1 ${
                        !isCurrentMonth
                          ? "text-slate-700"
                          : isToday
                            ? "text-blue-400 font-normal"
                            : "text-white"
                      } ${isPastDate(date) ? "line-through decoration-1 opacity-40" : ""}`}
                    >
                      {date.getDate()}
                    </div>

                    {/* 事件列表 */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev, i) => (
                        <div
                          key={ev.id || i}
                          className="text-[8px] sm:text-[10px] leading-tight truncate text-slate-400"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] sm:text-[9px] text-slate-600">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 載入中提示 */}
            {calendarLoading && (
              <div className="absolute inset-0 gcg-glass-subtle flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            )}

            {/* 預約區域 */}
            <div className="p-4 sm:p-5 space-y-4 border-t border-white/10">
              {calendarError && (
                <div className="text-xs sm:text-sm text-red-400 flex items-center gap-2 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  {calendarError}
                </div>
              )}

              {/* 已選擇日期顯示 */}
              <div className="space-y-2" id="customer_appointmentDate">
                <label className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">
                  預約日期 <span className="text-red-400">*</span>
                </label>
                <div
                  className={`p-3 sm:p-4 rounded-xl ${errors.customer_appointmentDate ? "border-red-500 bg-red-500/10 border" : "gcg-glass-calendar"} flex items-center justify-between`}
                >
                  <span
                    className={
                      customerInfo.appointmentDate
                        ? "text-white font-medium text-sm sm:text-base"
                        : "text-slate-500 text-sm sm:text-base"
                    }
                  >
                    {customerInfo.appointmentDate
                      ? new Date(customerInfo.appointmentDate).toLocaleDateString("zh-TW", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          weekday: "long",
                        })
                      : "請從上方行事曆點選日期"}
                  </span>
                  {customerInfo.appointmentDate && (
                    <button
                      type="button"
                      onClick={() => setCustomerInfo(prev => ({ ...prev, appointmentDate: "" }))}
                      className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                    >
                      清除
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {/* 時段選擇 - 自定義下拉選單 */}
                <div className="space-y-2" id="customer_appointmentPeriod">
                  <label className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">
                    時段 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative" ref={periodRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPeriodDropdown(!showPeriodDropdown);
                        setShowTimeDropdown(false);
                      }}
                      className={`${errors.customer_appointmentPeriod ? getInputClass(errors.customer_appointmentPeriod) : "gcg-glass-calendar p-3 sm:p-4 rounded-xl"} text-sm sm:text-base text-left flex items-center justify-between w-full`}
                    >
                      <span>
                        {customerInfo.appointmentPeriod === "morning" && "上午"}
                        {customerInfo.appointmentPeriod === "afternoon" && "下午"}
                        {customerInfo.appointmentPeriod === "evening" && "晚上"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showPeriodDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showPeriodDropdown &&
                      createPortal(
                        <div
                          data-dropdown="period"
                          className="fixed z-[110] gcg-dropdown rounded-xl overflow-hidden animate-slide-down"
                          style={getDropdownPosition(periodRef, 200)}
                        >
                          {[
                            { value: "morning", label: "上午", time: "09:00 - 12:00" },
                            { value: "afternoon", label: "下午", time: "13:00 - 17:00" },
                            { value: "evening", label: "晚上", time: "18:00 - 21:00" },
                          ].map(period => (
                            <button
                              key={period.value}
                              type="button"
                              onClick={() => {
                                setCustomerInfo(prev => ({
                                  ...prev,
                                  appointmentPeriod: period.value,
                                  appointmentTime: "",
                                }));
                                setShowPeriodDropdown(false);
                                if (errors.customer_appointmentPeriod) {
                                  setErrors(prev => ({
                                    ...prev,
                                    customer_appointmentPeriod: false,
                                  }));
                                }
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between group ${
                                customerInfo.appointmentPeriod === period.value
                                  ? "bg-blue-500/10"
                                  : ""
                              }`}
                            >
                              <div>
                                <div className="text-sm sm:text-base font-medium text-white">
                                  {period.label}
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-500">
                                  {period.time}
                                </div>
                              </div>
                              {customerInfo.appointmentPeriod === period.value && (
                                <Check className="w-4 h-4 text-blue-500" />
                              )}
                            </button>
                          ))}
                        </div>,
                        document.body
                      )}
                  </div>
                </div>

                {/* 時間選擇 - 自定義下拉選單 */}
                <div className="space-y-2" id="customer_appointmentTime">
                  <label className="text-[10px] sm:text-xs text-slate-500 font-medium uppercase tracking-wider">
                    時間 <span className="text-red-400">*</span>
                  </label>
                  <div className="relative" ref={timeRef}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTimeDropdown(!showTimeDropdown);
                        setShowPeriodDropdown(false);
                      }}
                      className={`${errors.customer_appointmentTime ? getInputClass(errors.customer_appointmentTime) : "gcg-glass-calendar p-3 sm:p-4 rounded-xl"} text-sm sm:text-base text-left flex items-center justify-between w-full`}
                    >
                      <span
                        className={customerInfo.appointmentTime ? "text-white" : "text-slate-500"}
                      >
                        {customerInfo.appointmentTime || "選擇時間"}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${showTimeDropdown ? "rotate-180" : ""}`}
                      />
                    </button>

                    {showTimeDropdown &&
                      createPortal(
                        <div
                          data-dropdown="time"
                          className="fixed z-[110] gcg-dropdown rounded-xl max-h-[240px] overflow-y-auto animate-slide-down custom-scrollbar"
                          style={getDropdownPosition(timeRef, 240)}
                        >
                          {(() => {
                            const times = [];
                            if (customerInfo.appointmentPeriod === "morning") {
                              times.push("09:00", "09:30", "10:00", "10:30", "11:00", "11:30");
                            } else if (customerInfo.appointmentPeriod === "afternoon") {
                              times.push(
                                "13:00",
                                "13:30",
                                "14:00",
                                "14:30",
                                "15:00",
                                "15:30",
                                "16:00",
                                "16:30"
                              );
                            } else if (customerInfo.appointmentPeriod === "evening") {
                              times.push(
                                "18:00",
                                "18:30",
                                "19:00",
                                "19:30",
                                "20:00",
                                "20:30",
                                "21:00"
                              );
                            }

                            return times.map(time => (
                              <button
                                key={time}
                                type="button"
                                onClick={() => {
                                  setCustomerInfo(prev => ({
                                    ...prev,
                                    appointmentTime: time,
                                  }));
                                  setShowTimeDropdown(false);
                                  if (errors.customer_appointmentTime) {
                                    setErrors(prev => ({
                                      ...prev,
                                      customer_appointmentTime: false,
                                    }));
                                  }
                                }}
                                className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors flex items-center justify-between ${
                                  customerInfo.appointmentTime === time ? "bg-blue-500/10" : ""
                                }`}
                              >
                                <span className="text-sm sm:text-base font-medium text-white">
                                  {time}
                                </span>
                                {customerInfo.appointmentTime === time && (
                                  <Check className="w-4 h-4 text-blue-500" />
                                )}
                              </button>
                            ));
                          })()}
                        </div>,
                        document.body
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 簽名板區塊 */}
        <section id="signature_area">
          <h3 className="text-base sm:text-lg font-bold text-white pb-3 border-b border-white/10 mb-4 sm:mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            客戶簽名
          </h3>
          <div
            className={`gcg-card rounded-xl sm:rounded-2xl border-2 border-dashed p-5 sm:p-6 flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] relative overflow-hidden ${errors.signature_area ? "border-red-500" : "border-white/20"}`}
          >
            {signatureData ? (
              <div className="flex flex-col items-center w-full">
                <img
                  src={signatureData}
                  alt="Sign"
                  className="h-16 sm:h-20 mb-3 sm:mb-4 object-contain"
                />
                <div className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => setShowSignatureModal(true)}
                    className="text-[10px] sm:text-xs text-blue-400 font-bold bg-blue-500/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-500/20 active:scale-95 transition-all border border-blue-500/30"
                  >
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 重簽
                  </button>
                  <button
                    onClick={() => setSignatureData(null)}
                    className="text-[10px] sm:text-xs text-red-400 font-bold bg-red-500/10 px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg flex items-center gap-1.5 hover:bg-red-500/20 active:scale-95 transition-all border border-red-500/30"
                  >
                    <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 刪除
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSignatureModal(true)}
                className="w-full h-full absolute inset-0 flex flex-col items-center justify-center text-slate-500 hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                <PenTool className="w-6 h-6 sm:w-7 sm:h-7 mb-2 sm:mb-3" />
                <span className="text-sm sm:text-base font-medium">點此開啟簽名板</span>
              </button>
            )}
          </div>
          <div className="mt-4 sm:mt-5 flex gap-3 p-4 gcg-glass-subtle rounded-xl text-[10px] sm:text-xs text-slate-400 leading-relaxed border border-white/5">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 text-blue-500 mt-0.5" />
            <div>
              <p>1. 以上資料皆用於公司內部建檔及紀錄。</p>
              <p className="mt-1">2. 公司嚴格遵守隱私權、個資保護。</p>
              <p className="mt-1">
                3. 本公司絕不向第三方揭露您的任何資訊，並確認以上填寫資料無誤。
              </p>
            </div>
          </div>
        </section>

        {/* 付款方式選擇區塊 */}
        <section>
          <h3 className="text-base sm:text-lg font-bold text-white pb-3 border-b border-white/10 mb-4 sm:mb-5 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
            付款方式
          </h3>
          <div className="space-y-3 sm:space-y-4">
            {/* SHOPLINE Payments 整合選項（優先顯示） */}
            {SHOPLINE_PAYMENTS?.ENABLED && (
              <div className="space-y-3">
                {/* 信用卡刷卡 */}
                {SHOPLINE_PAYMENTS.PAYMENT_METHODS?.CREDIT_CARD && (
                  <label
                    className={`relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all overflow-hidden gcg-card ${
                      paymentMethod === "shopline" && shoplinePaymentType === "creditcard"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="shopline-creditcard"
                      checked={paymentMethod === "shopline" && shoplinePaymentType === "creditcard"}
                      onChange={() => {
                        setPaymentMethod("shopline");
                        setShoplinePaymentType("creditcard");
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === "shopline" && shoplinePaymentType === "creditcard"
                          ? "border-blue-500 bg-blue-500"
                          : "border-slate-600"
                      }`}
                    >
                      {paymentMethod === "shopline" && shoplinePaymentType === "creditcard" && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                        <span className="font-bold text-sm sm:text-base text-white">
                          信用卡付款
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        VISA / Mastercard / JCB，安全加密
                      </p>
                    </div>
                  </label>
                )}

                {/* LINE Pay（透過 SHOPLINE） */}
                {SHOPLINE_PAYMENTS.PAYMENT_METHODS?.LINE_PAY && (
                  <label
                    className={`relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all overflow-hidden gcg-card ${
                      paymentMethod === "shopline" && shoplinePaymentType === "linepay"
                        ? "border-[#06C755] bg-[#06C755]/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="shopline-linepay"
                      checked={paymentMethod === "shopline" && shoplinePaymentType === "linepay"}
                      onChange={() => {
                        setPaymentMethod("shopline");
                        setShoplinePaymentType("linepay");
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === "shopline" && shoplinePaymentType === "linepay"
                          ? "border-[#06C755] bg-[#06C755]"
                          : "border-slate-600"
                      }`}
                    >
                      {paymentMethod === "shopline" && shoplinePaymentType === "linepay" && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#06C755]" />
                        <span className="font-bold text-sm sm:text-base text-white">LINE Pay</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        立即線上付款，快速安全
                      </p>
                    </div>
                  </label>
                )}

                {/* ATM 銀行轉帳（虛擬帳號） */}
                {SHOPLINE_PAYMENTS.PAYMENT_METHODS?.VIRTUAL_ACCOUNT && (
                  <label
                    className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all gcg-card ${
                      paymentMethod === "shopline" && shoplinePaymentType === "atm"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="shopline-atm"
                      checked={paymentMethod === "shopline" && shoplinePaymentType === "atm"}
                      onChange={() => {
                        setPaymentMethod("shopline");
                        setShoplinePaymentType("atm");
                      }}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        paymentMethod === "shopline" && shoplinePaymentType === "atm"
                          ? "border-purple-500 bg-purple-500"
                          : "border-slate-600"
                      }`}
                    >
                      {paymentMethod === "shopline" && shoplinePaymentType === "atm" && (
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        <span className="font-bold text-sm sm:text-base text-white">ATM 轉帳</span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                        取得虛擬帳號，24 小時內完成匯款
                      </p>
                    </div>
                  </label>
                )}

                {/* 分期付款 */}
                {SHOPLINE_PAYMENTS.PAYMENT_METHODS?.INSTALLMENT && (
                  <div>
                    <label
                      className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all gcg-card ${
                        paymentMethod === "shopline" && shoplinePaymentType === "installment"
                          ? "border-orange-500 bg-orange-500/10"
                          : "border-white/10 hover:border-white/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="shopline-installment"
                        checked={
                          paymentMethod === "shopline" && shoplinePaymentType === "installment"
                        }
                        onChange={() => {
                          setPaymentMethod("shopline");
                          setShoplinePaymentType("installment");
                          // 選擇分期付款時自動滾動到底部以顯示期數選項
                          setTimeout(() => {
                            window.scrollTo({
                              top: document.body.scrollHeight,
                              behavior: "smooth",
                            });
                          }, 100);
                        }}
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          paymentMethod === "shopline" && shoplinePaymentType === "installment"
                            ? "border-orange-500 bg-orange-500"
                            : "border-slate-600"
                        }`}
                      >
                        {paymentMethod === "shopline" && shoplinePaymentType === "installment" && (
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                          <span className="font-bold text-sm sm:text-base text-white">
                            分期付款
                          </span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                          信用卡分期，輕鬆付款
                        </p>
                      </div>
                    </label>

                    {/* 分期期數選擇 */}
                    {paymentMethod === "shopline" && shoplinePaymentType === "installment" && (
                      <div className="p-4 sm:p-5 border-t border-white/10">
                        <p className="text-xs text-slate-300 mb-3">選擇分期期數：</p>
                        <div className="flex flex-wrap gap-2">
                          {(SHOPLINE_PAYMENTS.INSTALLMENT_OPTIONS || ["3", "6", "12"])
                            .filter(count => count !== "0")
                            .map(count => (
                              <button
                                key={count}
                                type="button"
                                onClick={() => setInstallmentCount(count)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  installmentCount === count
                                    ? "bg-orange-500 text-white"
                                    : "gcg-glass-calendar text-slate-300 hover:border-orange-500/50"
                                }`}
                              >
                                {`${count} 期`}
                              </button>
                            ))}
                        </div>
                        <p className="mt-3 text-[10px] text-slate-500">
                          每期約 NT${" "}
                          {Math.ceil(
                            calculateTotal() / parseInt(installmentCount || "3")
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* SHOPLINE 未設定提示 */}
                {!SHOPLINE_PAYMENTS.ENDPOINT && (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-400">
                    SHOPLINE Payments 尚未設定完成，請先完成 GAS 部署並填入 ENDPOINT
                  </div>
                )}
              </div>
            )}

            {/* 原生 LINE Pay 選項（SHOPLINE 未啟用時顯示） */}
            {!SHOPLINE_PAYMENTS?.ENABLED && LINE_PAY?.ENABLED && (
              <label
                className={`relative flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border cursor-pointer transition-all overflow-hidden gcg-card ${
                  paymentMethod === "linepay"
                    ? "border-[#06C755] bg-[#06C755]/10"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="linepay"
                  checked={paymentMethod === "linepay"}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    paymentMethod === "linepay"
                      ? "border-[#06C755] bg-[#06C755]"
                      : "border-slate-600"
                  }`}
                >
                  {paymentMethod === "linepay" && (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-[#06C755]" />
                    <span className="font-bold text-sm sm:text-base text-white">LINE Pay</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1">
                    立即線上付款，快速安全
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* LINE Pay 未設定提示 */}
          {!SHOPLINE_PAYMENTS?.ENABLED &&
            LINE_PAY?.ENABLED &&
            !LINE_PAY?.ENDPOINT &&
            paymentMethod === "linepay" && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-400">
                LINE Pay 尚未設定完成，請先完成 GAS 部署並填入 ENDPOINT
              </div>
            )}
        </section>
      </div>

      {/* Footer CTA - GCG Dark Style */}
      <div className="fixed bottom-0 left-0 right-0 gcg-bottom-bar p-4 sm:p-5 z-40 safe-area-bottom">
        <div className="max-w-3xl lg:max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex-shrink-0">
            <div className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">
              Total
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              <span className="text-slate-500 text-sm sm:text-base mr-1">NT$</span>
              {calculateTotal().toLocaleString()}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center gap-2 active:scale-95 transition-all ${
              isSubmitting ? "bg-slate-700 text-slate-400" : "gcg-btn-primary"
            }`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send className="w-4 h-4 sm:w-5 sm:h-5" /> 送出訂購單
              </>
            )}
          </button>
        </div>
      </div>

      {/* Signature Modal - GCG Dark Style */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[60] gcg-modal-overlay flex items-end sm:items-center justify-center">
          <div className="gcg-modal w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl sm:rounded-2xl rounded-t-2xl flex flex-col h-[80vh] sm:h-[550px] md:h-[600px] ipad-landscape-fix animate-slide-up">
            <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-base sm:text-lg text-white">請簽名</h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
              </button>
            </div>
            <div className="flex-1 signature-canvas relative m-4 sm:m-5 rounded-xl border-2 border-dashed border-white/20 touch-none overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="block w-full h-full cursor-crosshair"
                style={{ background: "var(--gcg-bg-secondary)" }}
              />
              {!modalHasSignature && !isDrawing && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-500 gap-2 text-sm sm:text-base">
                  <PenTool className="w-5 h-5 sm:w-6 sm:h-6" /> 請在此區域簽名
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5 border-t border-white/10 flex gap-3 sm:gap-4 safe-area-bottom">
              <button
                onClick={clearCanvas}
                className="flex-1 py-3 sm:py-3.5 gcg-glass-input border border-white/10 rounded-xl font-bold text-sm sm:text-base text-slate-300 flex justify-center items-center gap-2 active:scale-95 transition-transform hover:border-white/20"
              >
                <Eraser className="w-4 h-4 sm:w-5 sm:h-5" /> 清除
              </button>
              <button
                onClick={confirmSignature}
                className="flex-[2] py-3 sm:py-3.5 gcg-btn-primary rounded-xl font-bold text-sm sm:text-base flex justify-center items-center gap-2 active:scale-95 transition-transform"
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" /> 確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// 掛載 React 應用
// =============================================
const root = createRoot(document.getElementById("root"));
root.render(<OrderFormPage />);

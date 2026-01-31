/**
 * =====================================================================
 * 吾飛藝術銀行 - 共用工具函式
 * =====================================================================
 *
 * 📁 函式列表:
 *   1. encodeToBase64 - UTF-8 安全的 Base64 編碼
 *   2. safeAsyncCall - 安全的非同步呼叫包裝器（防止 UI 崩潰）
 *
 * =====================================================================
 */

window.WFLYUtils = (function () {
  "use strict";

  /**
   * UTF-8 安全的 Base64 編碼
   * 原生 btoa() 無法處理 UTF-8 字元，此函式解決此問題
   *
   * @param {string|object} data - 要編碼的資料（字串或物件）
   * @returns {string} Base64 編碼後的字串
   *
   * @example
   * const encoded = WFLYUtils.encodeToBase64({ name: "王小明", amount: 3888 });
   */
  function encodeToBase64(data) {
    try {
      const jsonString = typeof data === "string" ? data : JSON.stringify(data);
      const encoder = new TextEncoder();
      const payloadBytes = encoder.encode(jsonString);
      let binaryString = "";
      for (let i = 0; i < payloadBytes.length; i++) {
        binaryString += String.fromCharCode(payloadBytes[i]);
      }
      return btoa(binaryString);
    } catch (error) {
      console.error("encodeToBase64 error:", error);
      throw new Error("Base64 編碼失敗: " + error.message);
    }
  }

  /**
   * 安全的非同步呼叫包裝器
   * 用於防止 API 呼叫失敗時導致 UI 崩潰
   *
   * @param {Function} asyncFn - 非同步函式
   * @param {object} options - 選項
   * @param {Function} options.onError - 錯誤處理函式
   * @param {*} options.fallback - 發生錯誤時的回傳值
   * @param {string} options.errorMessage - 自訂錯誤訊息
   * @returns {Promise<*>} 函式執行結果或 fallback 值
   *
   * @example
   * const result = await WFLYUtils.safeAsyncCall(
   *   () => fetchPaymentStatus(orderId),
   *   {
   *     onError: (err) => setError(err.message),
   *     fallback: null,
   *     errorMessage: "付款狀態查詢失敗"
   *   }
   * );
   */
  async function safeAsyncCall(asyncFn, options = {}) {
    const { onError, fallback = null, errorMessage } = options;

    try {
      return await asyncFn();
    } catch (error) {
      const message = errorMessage || error.message || "操作失敗";
      console.error("[safeAsyncCall]", message, error);

      if (typeof onError === "function") {
        onError(new Error(message));
      }

      return fallback;
    }
  }

  // 公開 API
  return {
    encodeToBase64,
    safeAsyncCall,
  };
})();

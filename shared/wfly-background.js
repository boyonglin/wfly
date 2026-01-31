(function () {
  const DEFAULTS = {
    maxDpr: 1.25,
    noiseSeed: 12345,
    noiseOpacity: 0.35,
    noiseBlend: "overlay",
    waveConfigs: [
      { amplitude: 80, frequency: 0.0015, speed: 0.8, direction: 1, yPos: 0.15, opacity: 0.18 },
      { amplitude: 120, frequency: 0.001, speed: -0.5, direction: -1, yPos: 0.35, opacity: 0.15 },
      { amplitude: 100, frequency: 0.0018, speed: 1.2, direction: 1, yPos: 0.5, opacity: 0.12 },
      { amplitude: 90, frequency: 0.0012, speed: -0.7, direction: -1, yPos: 0.68, opacity: 0.1 },
      { amplitude: 110, frequency: 0.002, speed: 0.9, direction: 1, yPos: 0.82, opacity: 0.08 },
      { amplitude: 75, frequency: 0.0022, speed: -1.0, direction: -1, yPos: 0.92, opacity: 0.06 },
    ],
  };

  let animationId = null;
  let time = 0;

  function ensureStyles() {
    if (document.getElementById("wfly-background-style")) {
      return;
    }
    const style = document.createElement("style");
    style.id = "wfly-background-style";
    style.textContent = `
      #gradient-canvas {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -2;
      }
      #noise-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: -1;
        pointer-events: none;
        opacity: 0.35;
        mix-blend-mode: overlay;
        background-repeat: repeat;
        background-size: cover;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureElements() {
    let canvas = document.getElementById("gradient-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "gradient-canvas";
      document.body.prepend(canvas);
    }

    let noiseOverlay = document.getElementById("noise-overlay");
    if (!noiseOverlay) {
      noiseOverlay = document.createElement("div");
      noiseOverlay.id = "noise-overlay";
      document.body.prepend(noiseOverlay);
    }

    return { canvas, noiseOverlay };
  }

  function createNoiseCanvas(width, height, seed) {
    const offscreen = document.createElement("canvas");
    offscreen.width = width;
    offscreen.height = height;
    const offCtx = offscreen.getContext("2d");

    const imageData = offCtx.createImageData(width, height);
    const data = imageData.data;

    let seedValue = seed * 10000;
    const random = () => {
      seedValue = (seedValue * 9301 + 49297) % 233280;
      return seedValue / 233280;
    };

    const noiseIntensity = 0.3;
    for (let i = 0; i < data.length; i += 4) {
      const noise = (random() - 0.5) * 255 * noiseIntensity;
      data[i] = 128 + noise;
      data[i + 1] = 128 + noise;
      data[i + 2] = 128 + noise;
      data[i + 3] = 255;
    }

    offCtx.putImageData(imageData, 0, 0);
    return offscreen;
  }

  function drawWaveBackground(ctx, width, height, timeValue, waveConfigs) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a1628");
    gradient.addColorStop(0.4, "#1e3a5f");
    gradient.addColorStop(0.7, "#0f2744");
    gradient.addColorStop(1, "#081220");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    waveConfigs.forEach((config, i) => {
      const yOffset = height * config.yPos;
      const { amplitude, frequency, speed, direction } = config;

      ctx.beginPath();
      ctx.moveTo(0, yOffset);

      for (let x = 0; x <= width; x += 2) {
        const wave1 = Math.sin(x * frequency + timeValue * speed + i * 0.5) * amplitude;
        const wave2 = Math.sin(x * frequency * 1.3 - timeValue * speed * 0.7 + i) * amplitude * 0.3;
        const y = yOffset + (wave1 + wave2) * direction;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const waveGradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, yOffset + amplitude);
      const color1 = i % 2 === 0 ? "rgba(30, 58, 138," : "rgba(37, 99, 235,";
      const color2 = i % 2 === 0 ? "rgba(59, 130, 246," : "rgba(96, 165, 250,";
      waveGradient.addColorStop(0, `${color1} ${config.opacity})`);
      waveGradient.addColorStop(1, `${color2} ${config.opacity * 0.5})`);
      ctx.fillStyle = waveGradient;
      ctx.fill();
    });
  }

  function init(options) {
    const settings = { ...DEFAULTS, ...(options || {}) };

    ensureStyles();
    const { canvas, noiseOverlay } = ensureElements();
    const ctx = canvas.getContext("2d");

    let cssWidth = 0;
    let cssHeight = 0;
    let noiseCanvas = null;

    function setCanvasSize() {
      cssWidth = window.innerWidth;
      cssHeight = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, settings.maxDpr);

      canvas.width = Math.floor(cssWidth * dpr);
      canvas.height = Math.floor(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      noiseCanvas = createNoiseCanvas(canvas.width, canvas.height, settings.noiseSeed);
      if (noiseOverlay && noiseCanvas) {
        const noiseDataUrl = noiseCanvas.toDataURL("image/png");
        noiseOverlay.style.backgroundImage = `url(${noiseDataUrl})`;
        noiseOverlay.style.opacity = String(settings.noiseOpacity);
        noiseOverlay.style.mixBlendMode = settings.noiseBlend;
      }
    }

    function drawBackground() {
      drawWaveBackground(ctx, cssWidth, cssHeight, time, settings.waveConfigs);
    }

    function animate() {
      time += 0.008;
      drawBackground();
      animationId = requestAnimationFrame(animate);
    }

    function start() {
      if (animationId === null) {
        animationId = requestAnimationFrame(animate);
      }
    }

    function stop() {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    setCanvasSize();
    window.addEventListener("resize", () => {
      setCanvasSize();
      if (prefersReducedMotion.matches) {
        drawBackground();
      }
    });

    function handleReducedMotionChange() {
      if (prefersReducedMotion.matches) {
        stop();
        drawBackground();
      } else {
        start();
      }
    }

    if (prefersReducedMotion.addEventListener) {
      prefersReducedMotion.addEventListener("change", handleReducedMotionChange);
    } else if (prefersReducedMotion.addListener) {
      prefersReducedMotion.addListener(handleReducedMotionChange);
    }

    handleReducedMotionChange();
  }

  window.WFLYBackground = {
    init,
  };
})();

(function () {
  const e = {
      targetLanguage: "es",
      apiUrl: "https://libretranslate.de/translate",
      debounceDelay: 300,
      translationTimeout: 8e3,
    },
    t = {
      info: (...e) =>
        console.log(
          "%c[Premium Lyrics]",
          "color: #9c27b0; font-weight: bold",
          ...e
        ),
      success: (...e) =>
        console.log(
          "%c[Premium Lyrics]",
          "color: #4caf50; font-weight: bold",
          "✅",
          ...e
        ),
    },
    n = new Map();
  let a = !1;
  async function o(t, a = e.targetLanguage) {
    if (n.has(t)) return n.get(t);
    try {
      const o = await fetch(e.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: t, source: "en", target: a, format: "text" }),
        signal: AbortSignal.timeout(e.translationTimeout),
      });
      if (!o.ok) throw new Error("Network error");
      const s = await o.json(),
        r = s.translatedText || t;
      return n.set(t, r), r;
    } catch (e) {
      return t;
    }
  }
  function s() {
    for (const e of [
      '[data-testid="lyrics"] span',
      '[data-testid="lyrics"] p',
      '[data-testid="lyrics"] div',
      ".lyrics span",
      ".lyrics p",
      ".lyrics div",
      '[class*="lyric"] span',
    ]) {
      const n = document.querySelectorAll(e);
      if (n.length > 2) {
        const e = Array.from(n).filter((e) => {
          const t = e.textContent?.trim();
          return (
            t &&
            t.length > 2 &&
            t.length < 100 &&
            !t.includes("[") &&
            !t.includes("]") &&
            !t.includes("Verse") &&
            !t.includes("Chorus") &&
            !t.includes("Bridge")
          );
        });
        if (e.length > 1)
          return t.info(`Found ${e.length} lyrics using: ${e}`), e;
      }
    }
    return [];
  }
  async function r() {
    if (a) return;
    a = !0;
    const e = s();
    if (0 === e.length) return void (a = !1);
    t.info(`Translating ${e.length} lines...`);
    await Promise.all(
      e.map(async (e, t) => {
        const n = e.textContent?.trim();
        if (!n || n.length < 3) return;
        if (e.nextElementSibling?.dataset?.bltIndex === t.toString())
          return void (a = !1);
        const s = await o(n);
        let r = e.nextElementSibling;
        if (r && r.classList.contains("blt-translation")) r.textContent = s;
        else {
          (r = document.createElement("div")),
            (r.dataset.bltIndex = t.toString()),
            (r.className = "blt-translation");
          const n = document.createElement("style");
          (n.id = "blt-styles"),
            (n.textContent =
              "\n          .blt-translation {\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            color: white;\n            padding: 6px 12px;\n            margin: 2px 0;\n            border-radius: 8px;\n            font-size: 12px;\n            font-weight: 500;\n            max-width: 85%;\n            box-shadow: 0 2px 8px rgba(0,0,0,0.2);\n            border: 1px solid rgba(255,255,255,0.2);\n            position: relative;\n            z-index: 9999;\n            opacity: 0;\n            animation: blt-slideIn 0.4s ease-out forwards;\n          }\n          .blt-translation:nth-child(even) {\n            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);\n          }\n          @keyframes blt-slideIn {\n            from { opacity: 0; transform: translateY(10px); }\n            to { opacity: 1; transform: translateY(0); }\n          }\n          @keyframes blt-slideIn:nth-child(even) {\n            from { opacity: 0; transform: translateY(5px); }\n            to { opacity: 1; transform: translateY(0); }\n        "),
            document.getElementById("blt-styles") ||
              document.head.appendChild(n),
            (e.style.position = "relative"),
            e.parentElement?.insertBefore(r, e.nextSibling),
            (r.textContent = s);
        }
      })
    );
    (a = !1), t.success(`✅ Injected ${e.length} translations!`);
  }
  new MutationObserver((e) => {
    if (a) return;
    for (const t of e)
      if (
        "childList" === t.type &&
        t.addedNodes.length > 0 &&
        Array.from(t.addedNodes).some(
          (e) =>
            1 === e.nodeType &&
            e.querySelector &&
            null !== e.querySelector('[data-testid="lyrics"]')
        )
      ) {
        setTimeout(r, 500);
        break;
      }
  }).observe(document.body, { childList: !0, subtree: !0 });
  let i = null;
  setInterval(() => {
    const e = Spicetify?.Player?.data?.item;
    e &&
      e.uri !== i &&
      ((i = e.uri),
      document.querySelectorAll(".blt-translation").forEach((e) => {
        (e.style.opacity = "0"), setTimeout(() => e.remove(), 300);
      }),
      t.info("🎵 Song changed - waiting for lyrics..."),
      setTimeout(() => {
        r();
      }, 1500));
  }, 1e3),
    window.Spicetify &&
      (t.success("🚀 Spotify Premium Lyrics Translator loaded!"),
      setTimeout(r, 2e3));
})();

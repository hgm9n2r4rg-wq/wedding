/* みんなの写真(Dropboxに送られた写真の一覧)。ふだんは触らなくて大丈夫です */
const $ = (id) => document.getElementById(id);
const PAGE_SIZE = 50;

(async function init() {
  $("main").hidden = false;
  if (!DBX.enabled()) { $("albumCount").textContent = "写真の準備中です。もうしばらくお待ちください。"; return; }
  let items;
  try { items = await DBX.list(); }
  catch (e) { $("albumCount").textContent = "写真を読み込めませんでした。時間をおいて、もう一度開いてください。"; return; }
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  $("albumCount").textContent = items.length ? `全${items.length}枚 ・ タップで拡大、左右にスライドで次の写真、「写真に保存」でスマホの写真に入ります` : "まだ写真がありません。最初の1枚を送ってみてください！";
  const q = new URLSearchParams(location.search);

  // ---------- 小さい写真は、見える範囲だけ順に読み込む ----------
  const queue = []; let running = 0;
  const pump = () => {
    while (running < 6 && queue.length) {
      const im = queue.shift(); running++;
      DBX.thumb(im.dataset.id, "w640h480").then((b) => { im.src = URL.createObjectURL(b); })
        .catch(() => { im.closest("figure").classList.add("nothumb"); })
        .finally(() => { running--; pump(); });
    }
  };
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { io.unobserve(e.target); queue.push(e.target); pump(); }
  }), { rootMargin: "400px" });

  function go(p) {
    const page = Math.min(Math.max(1, p), pages), from = (page - 1) * PAGE_SIZE;
    $("albumGrid").innerHTML = items.slice(from, page * PAGE_SIZE).map((it, k) =>
      `<figure class="tile"><button class="ph-btn" type="button" data-i="${from + k}" aria-label="写真を拡大"><img data-id="${it.id}" alt="" decoding="async"></button>` +
      `<button class="dl" type="button" data-save="${from + k}" aria-label="写真に保存">↓</button></figure>`).join("");
    $("albumGrid").querySelectorAll("img").forEach((im) => io.observe(im));
    const nums = Array.from({ length: pages }, (_, k) => `<button type="button" data-p="${k + 1}"${k + 1 === page ? ' aria-current="page"' : ""}>${k + 1}</button>`).join("");
    $("pager").innerHTML = pages > 1 ? `<button type="button" data-p="${page - 1}"${page === 1 ? " disabled" : ""}>←</button>${nums}<button type="button" data-p="${page + 1}"${page === pages ? " disabled" : ""}>→</button>` : "";
    history.replaceState(history.state, "", `?p=${page}`);
    window.scrollTo(0, 0);
  }
  $("pager").addEventListener("click", (e) => { const b = e.target.closest("button[data-p]"); if (b && !b.disabled) go(Number(b.dataset.p)); });

  // ---------- 写真に保存(スマホでは共有メニューの「画像を保存」=写真アプリへ) ----------
  const toast = (msg, ms) => {
    const t = $("toast"); clearTimeout(toast.t); t.hidden = !msg; t.textContent = msg || "";
    if (msg && ms) toast.t = setTimeout(() => { t.hidden = true; }, ms);
  };
  const files = new Map();
  function getFile(i) {
    const it = items[i];
    if (!files.has(i)) {
      const p = DBX.download(it.id).then((b) => new File([b], it.name, { type: b.type && b.type.startsWith("image/") ? b.type : "image/jpeg" }));
      p.catch(() => files.delete(i)); files.set(i, p);
      if (files.size > 4) files.delete(files.keys().next().value);
    }
    return files.get(i);
  }
  const coarse = () => matchMedia("(pointer: coarse)").matches;
  async function savePhoto(i) {
    try {
      toast("保存の準備中…");
      const file = await getFile(i);
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file] }); toast(""); return; }
      throw new Error("share-unsupported");
    } catch (e) {
      if (e && e.name === "AbortError") { toast(""); return; }
      if (coarse()) { if (lb.hidden) openLb(i); toast("写真を長押しして「写真に追加」または「画像を保存」を選んでください", 7000); return; }
      try {
        const f = await getFile(i), a = document.createElement("a");
        a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); toast("");
      } catch (e2) { toast("保存できませんでした。もう一度お試しください。", 4000); }
    }
  }

  // ---------- 拡大表示(左右にスライドで前後の写真へ) ----------
  const lb = $("lb"), img = $("lbImg"), stage = $("lbStage");
  let cur = 0;
  const views = new Map();
  function view(i) {
    const it = items[i]; if (!it) return Promise.reject();
    if (!views.has(i)) {
      const p = DBX.thumb(it.id, "w2048h1536").then((b) => URL.createObjectURL(b));
      p.catch(() => views.delete(i)); views.set(i, p);
      if (views.size > 8) views.delete(views.keys().next().value);
    }
    return views.get(i);
  }
  async function setImg(i) {
    cur = i;
    $("lbCount").textContent = `${i + 1} / ${items.length}`;
    $("lbPrev").disabled = i === 0; $("lbNext").disabled = i === items.length - 1;
    view(i - 1).catch(() => {}); view(i + 1).catch(() => {});
    setTimeout(() => { if (cur === i && !lb.hidden) getFile(i).catch(() => {}); }, 600);
    try { const u = await view(i); if (cur === i) img.src = u; }
    catch (e) { if (cur === i) { img.removeAttribute("src"); toast("この写真は表示できません(保存はできます)", 4000); } }
  }
  function openLb(i) { setImg(i); lb.hidden = false; document.body.style.overflow = "hidden"; history.pushState({ lb: 1 }, ""); }
  function hideLb() { lb.hidden = true; document.body.style.overflow = ""; toast(""); }
  function closeLb() { if (history.state && history.state.lb) history.back(); else hideLb(); }
  window.addEventListener("popstate", () => { if (!lb.hidden) hideLb(); });
  function step(dir) {
    const j = cur + dir;
    if (j < 0 || j >= items.length) { img.style.transition = "transform .18s"; img.style.transform = ""; return; }
    img.style.transition = "transform .16s ease, opacity .16s ease";
    img.style.transform = `translateX(${dir > 0 ? -60 : 60}%)`; img.style.opacity = "0";
    setTimeout(() => {
      setImg(j); img.style.transition = "none"; img.style.transform = `translateX(${dir > 0 ? 60 : -60}%)`;
      void img.offsetWidth; img.style.transition = "transform .16s ease, opacity .16s ease"; img.style.transform = ""; img.style.opacity = "1";
    }, 160);
  }
  let sx = 0, sy = 0, dx = 0, lock = null, down = false;
  stage.addEventListener("pointerdown", (e) => { if (e.target.closest("button")) return; down = true; sx = e.clientX; sy = e.clientY; dx = 0; lock = null; img.style.transition = "none"; });
  stage.addEventListener("pointermove", (e) => {
    if (!down) return;
    dx = e.clientX - sx; const dy = e.clientY - sy;
    if (!lock && Math.max(Math.abs(dx), Math.abs(dy)) > 8) lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (lock === "x") img.style.transform = `translateX(${dx}px)`;
  });
  const end = (e) => {
    if (!down) return; down = false;
    if (lock === "x" && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
    else { img.style.transition = "transform .18s"; img.style.transform = ""; if (!lock && e.type === "pointerup" && e.target === stage) closeLb(); }
  };
  stage.addEventListener("pointerup", end); stage.addEventListener("pointercancel", end);
  $("lbPrev").addEventListener("click", () => step(-1)); $("lbNext").addEventListener("click", () => step(1));
  $("lbClose").addEventListener("click", closeLb); $("lbSave").addEventListener("click", () => savePhoto(cur));
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb(); else if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1);
  });
  $("albumGrid").addEventListener("click", (e) => {
    const s = e.target.closest("[data-save]"); if (s) { savePhoto(Number(s.dataset.save)); return; }
    const b = e.target.closest("[data-i]"); if (b) openLb(Number(b.dataset.i));
  });
  go(Number(q.get("p")) || 1);
})();

/* 写真一覧ページ(50枚ずつ表示)。ふだんは触らなくて大丈夫です */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "wedding-unlocked";
const enc = (p) => String(p).split("/").map(encodeURIComponent).join("/");   // 日本語や空白の入った名前でも表示できるようにする
const PAGE_SIZE = 50;   // 1ページに表示する枚数

// 自動で作られる軽い写真(thumb=一覧用 / view=拡大用)。まだ無いときは元の写真を使います
const PHOTO_SET = new Set(typeof PHOTOS !== "undefined" ? Object.values(PHOTOS).flat() : []);
const variant = (src, kind) => {
  if (!PHOTO_SET.has(src)) return src;
  const i = src.lastIndexOf("/");
  return src.slice(0, i) + "/" + kind + "/" + src.slice(i + 1).replace(/\.[^./]+$/, "") + ".jpg";
};
// 軽い写真が読めなかったら元の写真に切り替え、それもだめなら枠ごと消す
function tileFail(el) {
  if (el.dataset.o && !el.dataset.t) { el.dataset.t = "1"; el.src = el.dataset.o; return; }
  const f = el.closest("figure"); if (f) f.remove();
}

function photoList(g) {
  if (g.files && g.files.length) return g.files;
  if (typeof PHOTOS !== "undefined" && PHOTOS[g.folder] && PHOTOS[g.folder].length) return PHOTOS[g.folder];
  return Array.from({ length: g.count || 0 }, (_, k) => `${g.folder}/${String(k + 1).padStart(3, "0")}.${g.ext || "jpg"}`);
}

let unlocked = false;
try { unlocked = sessionStorage.getItem(KEY) === "1"; } catch (e) {}
if (!unlocked) location.replace("index.html");   // 合言葉を入力していない場合はトップへ
else init();

function init() {
  $("main").hidden = false;
  const q = new URLSearchParams(location.search);
  const gi = Math.min(Math.max(0, Number(q.get("g")) || 0), CONFIG.photoGroups.length - 1);
  const g = CONFIG.photoGroups[gi];
  const list = photoList(g);
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const fileName = (i) => decodeURIComponent(list[i].split("/").pop());

  document.title = `${g.title} | ${CONFIG.groom} & ${CONFIG.bride}`;
  $("albumTitle").textContent = g.title;
  $("albumCount").textContent = list.length ? `全${list.length}枚 ・ タップで拡大、左右にスライドで次の写真、「写真に保存」でスマホの写真に入ります` : "";

  function go(p) {
    const page = Math.min(Math.max(1, p), pages);
    const from = (page - 1) * PAGE_SIZE;
    const items = list.slice(from, page * PAGE_SIZE);
    $("albumGrid").innerHTML = items.length ? items.map((src, k) => {
      const i = from + k, o = esc(enc(src)), t = esc(enc(variant(src, "thumb")));
      return `<figure class="tile"><button class="ph-btn" type="button" data-i="${i}" aria-label="写真を拡大">` +
        `<img src="${t}" data-o="${o}" alt="" loading="lazy" decoding="async" onerror="tileFail(this)"></button>` +
        `<button class="dl" type="button" data-save="${i}" aria-label="写真に保存">↓</button></figure>`;
    }).join("") : `<p class="empty">写真は準備中です。もうしばらくお待ちください。</p>`;

    const nums = Array.from({ length: pages }, (_, k) =>
      `<button type="button" data-p="${k + 1}"${k + 1 === page ? ' aria-current="page"' : ""}>${k + 1}</button>`).join("");
    $("pager").innerHTML = pages > 1
      ? `<button type="button" data-p="${page - 1}"${page === 1 ? " disabled" : ""}>←</button>${nums}<button type="button" data-p="${page + 1}"${page === pages ? " disabled" : ""}>→</button>`
      : "";
    history.replaceState(history.state, "", `?g=${gi}&p=${page}`);
    window.scrollTo(0, 0);
  }

  $("pager").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-p]");
    if (b && !b.disabled) go(Number(b.dataset.p));
  });

  // ---------- 写真に保存(スマホでは共有メニューの「画像を保存」=写真アプリへ) ----------
  const toast = (msg, ms) => {
    const t = $("toast"); clearTimeout(toast.t);
    t.hidden = !msg; t.textContent = msg || "";
    if (msg && ms) toast.t = setTimeout(() => { t.hidden = true; }, ms);
  };
  const files = new Map();   // 開いている写真は先に読み込んでおく(タップ直後に共有メニューを出すため)
  function getFile(i) {
    if (!files.has(i)) {
      const p = fetch(enc(list[i])).then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
        .then((b) => new File([b], fileName(i), { type: b.type && b.type.startsWith("image/") ? b.type : "image/jpeg" }));
      p.catch(() => files.delete(i));
      files.set(i, p);
      if (files.size > 4) files.delete(files.keys().next().value);
    }
    return files.get(i);
  }
  const coarse = () => matchMedia("(pointer: coarse)").matches;
  function longPressHint(i) {
    if (lb.hidden) openLb(i);
    toast("写真を長押しして「写真に追加」または「画像を保存」を選んでください", 7000);
  }
  async function savePhoto(i) {
    try {
      toast("保存の準備中…");
      const file = await getFile(i);
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file] });   // 「画像を保存」を選ぶと写真アプリに入ります
        toast(""); return;
      }
      throw new Error("share-unsupported");
    } catch (e) {
      if (e && e.name === "AbortError") { toast(""); return; }   // 共有メニューを閉じただけ
      if (coarse()) { longPressHint(i); return; }
      toast("");
      const a = document.createElement("a");   // パソコンでは普通にダウンロード
      a.href = enc(list[i]); a.download = fileName(i);
      document.body.appendChild(a); a.click(); a.remove();
    }
  }

  // ---------- 拡大表示(左右にスライドで前後の写真へ) ----------
  const lb = $("lb"), img = $("lbImg"), stage = $("lbStage");
  let cur = 0;
  function setImg(i) {
    cur = i;
    img.dataset.t = "";
    img.dataset.o = enc(list[i]);
    img.src = enc(variant(list[i], "view"));
    $("lbCount").textContent = `${i + 1} / ${list.length}`;
    $("lbPrev").disabled = i === 0;
    $("lbNext").disabled = i === list.length - 1;
    [i - 1, i + 1].forEach((j) => { if (list[j]) new Image().src = enc(variant(list[j], "view")); });   // 前後を先に読み込む
    setTimeout(() => { if (cur === i && !lb.hidden) getFile(i).catch(() => {}); }, 400);
  }
  img.addEventListener("error", () => {
    if (!img.dataset.t && img.dataset.o) { img.dataset.t = "1"; img.src = img.dataset.o; }
  });
  function openLb(i) {
    setImg(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    history.pushState({ lb: 1 }, "");   // スマホの「戻る」で閉じられるように
  }
  function hideLb() { lb.hidden = true; document.body.style.overflow = ""; toast(""); }
  function closeLb() { if (history.state && history.state.lb) history.back(); else hideLb(); }
  window.addEventListener("popstate", () => { if (!lb.hidden) hideLb(); });

  function step(dir) {   // dir: +1 次 / -1 前
    const j = cur + dir;
    if (j < 0 || j >= list.length) { img.style.transition = "transform .18s"; img.style.transform = ""; return; }
    img.style.transition = "transform .16s ease, opacity .16s ease";
    img.style.transform = `translateX(${dir > 0 ? -60 : 60}%)`; img.style.opacity = "0";
    setTimeout(() => {
      setImg(j);
      img.style.transition = "none";
      img.style.transform = `translateX(${dir > 0 ? 60 : -60}%)`;
      void img.offsetWidth;
      img.style.transition = "transform .16s ease, opacity .16s ease";
      img.style.transform = ""; img.style.opacity = "1";
    }, 160);
  }

  let sx = 0, sy = 0, dx = 0, lock = null, down = false;
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    down = true; sx = e.clientX; sy = e.clientY; dx = 0; lock = null;
    img.style.transition = "none";
  });
  stage.addEventListener("pointermove", (e) => {
    if (!down) return;
    dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (!lock && Math.max(Math.abs(dx), Math.abs(dy)) > 8) lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (lock === "x") img.style.transform = `translateX(${dx}px)`;
  });
  const end = (e) => {
    if (!down) return;
    down = false;
    if (lock === "x" && Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);   // 左へスライド=次の写真 / 右へスライド=前の写真
    else {
      img.style.transition = "transform .18s"; img.style.transform = "";
      if (!lock && e.type === "pointerup" && e.target === stage) closeLb();   // 写真の外をタップで閉じる
    }
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  $("lbPrev").addEventListener("click", () => step(-1));
  $("lbNext").addEventListener("click", () => step(1));
  $("lbClose").addEventListener("click", closeLb);
  $("lbSave").addEventListener("click", () => savePhoto(cur));
  document.addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });

  $("albumGrid").addEventListener("click", (e) => {
    const s = e.target.closest("[data-save]");
    if (s) { savePhoto(Number(s.dataset.save)); return; }
    const b = e.target.closest("[data-i]");
    if (b) openLb(Number(b.dataset.i));
  });

  go(Number(q.get("p")) || 1);
}

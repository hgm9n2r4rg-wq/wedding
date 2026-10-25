/* 合言葉・メニュー・内容の表示。ふだんは触らなくて大丈夫です */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const put = (id, html) => { const e = $(id); if (e) e.innerHTML = html; };
const KEY = "wedding-unlocked";
const enc = (p) => String(p).split("/").map(encodeURIComponent).join("/");   // 日本語や空白の入った名前でも表示できるようにする
// 写真ファイルがまだ無いときは、仮の枠に差し替える
const FALLBACK = `onerror="this.outerHTML='&lt;div class=&quot;ph&quot;&gt;写真&lt;/div&gt;'"`;

// 写真の一覧を作る(files を直接書く方法と、folder + count の連番の方法に対応)
function photoList(g) {
  if (g.files && g.files.length) return g.files;
  // photos.js(自動で作られる一覧)にフォルダの写真があれば、それを使う
  if (typeof PHOTOS !== "undefined" && PHOTOS[g.folder] && PHOTOS[g.folder].length) return PHOTOS[g.folder];
  return Array.from({ length: g.count || 0 }, (_, k) => `${g.folder}/${String(k + 1).padStart(3, "0")}.${g.ext || "jpg"}`);
}
const SECTIONS = [
  ["#top", "トップ"],
  ["#info", "日時・アクセス"],
  ["#schedule", "当日の流れ"],
  ["#about", "二人の生い立ち"],
  ["#story", "これまでのあゆみ"],
  ["#photos", "ギャラリー"],
  ["#share", "当日の写真"]
];

function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const w = "日月火水木金土"[new Date(y, m - 1, d).getDay()];
  return { long: `${y}年${m}月${d}日(${w})`, dots: `${y}.${String(m).padStart(2, "0")}.${String(d).padStart(2, "0")}` };
}

function render() {
  const c = CONFIG, dt = formatDate(c.date);
  const t = document.body.dataset.title;
  document.title = (t ? t + " | " : "") + `${c.groom} & ${c.bride}`;
  const gt = $("gateTitle"); if (gt) gt.textContent = `${c.groom} & ${c.bride}`;
  const hn = c.heroNames || [c.bride, c.groom];
  put("names", `<span>${esc(hn[0])}</span><span class="amp" aria-hidden="true">&amp;</span><span>${esc(hn[1])}</span>`);
  const hd = $("heroDate"); if (hd) hd.textContent = dt.dots;
  put("infoList",
    `<dt>日にち</dt><dd>${esc(dt.long)}</dd><dt>会場</dt><dd>${esc(c.venueName)}</dd><dt>住所</dt><dd>${esc(c.address)}</dd>`);
  const ml = $("mapLink");
  if (ml) ml.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.venueName + " " + c.address);
  put("access", c.access.map((a) => `<li>${esc(a)}</li>`).join(""));
  put("timeline", c.schedule.map((s) => `<li><time>${esc(s.time)}</time><span>${esc(s.text)}</span></li>`).join(""));
  put("profiles", c.profiles.map((p) =>
    `<div class="profile"><div class="pf-photo"><img src="${esc(p.photo)}" alt="" loading="lazy" ${FALLBACK}></div>` +
    `<p class="role">${esc(p.role)}</p><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p></div>`).join(""));
  put("strip", (c.stripPhotos || []).map((src) =>
    `<img class="zoom" data-src="${esc(src)}" src="${esc(src)}" alt="" loading="lazy" ${FALLBACK}>`).join(""));
  const groups = c.photoGroups;
  put("gallery", `<div class="tabs" role="tablist">${groups.map((g, k) =>
    `<button type="button" role="tab" data-i="${k}">${esc(g.tab || g.title)}</button>`).join("")}</div><div id="tabPanel"></div>`);
  const gal = $("gallery");
  if (gal) {
    const setTab = (k) => {
      gal.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(+b.dataset.i === k)));
      const g = groups[k], list = photoList(g), cover = g.cover || list[0] || `${g.folder}/001.jpg`;
      put("tabPanel", `<a class="cover" href="album.html?g=${k}"><img src="${esc(enc(cover))}" alt="" ${FALLBACK}>` +
        `<span class="cover-cap">${list.length ? `写真をすべて見る・保存する(${list.length}枚)` : "写真を準備中です"} →</span></a>`);
    };
    gal.addEventListener("click", (e) => { const b = e.target.closest(".tabs button"); if (b) setTab(+b.dataset.i); });
    setTab(0);
  }
  const side = (v) => v ? `<p>${esc(v)}</p>` : "";
  const pic = (src) => src ? `<img class="zoom" data-src="${esc(src)}" src="${esc(src)}" alt="" loading="lazy" ${FALLBACK}>` : "";
  put("life", `<li class="vt-head"><div class="l">${esc(c.groom)}</div><div class="r">${esc(c.bride)}</div></li>` +
    (c.life || []).map((e) => e.photo
      ? `<li class="vt-ph"><span class="chip chip-ph">${esc(e.photo)}</span><div class="l">${pic(e.left)}</div><div class="r">${pic(e.right)}</div></li>`
      : `<li><time class="chip">${esc(e.year)}</time><div class="l">${side(e.left)}</div><div class="r">${side(e.right)}</div></li>`).join("") +
    `<li class="vt-ph"><span class="chip chip-ph">ここから二人で</span></li>` +
    (c.history || []).map((x) =>
      `<li class="vt-both"><time class="chip">${esc(x.year)}</time><p>${esc(x.text)}</p></li>`).join(""));
  const links = [];
  if (c.upload.uploadUrl) links.push(`<a class="btn" href="${esc(c.upload.uploadUrl)}" target="_blank" rel="noopener">写真を送る</a>`);
  if (c.upload.albumUrl) links.push(`<a class="btn" href="${esc(c.upload.albumUrl)}" target="_blank" rel="noopener">みんなの写真を見る</a>`);
  put("shareLinks", links.join("") || "<p>当日までに、写真の送り方をここでご案内します。</p>");
  const f = $("footer"); if (f) f.textContent = c.footerMessage;
  const hs = $("heroSlides");
  if (hs) {
    const list = c.heroPhotos || [];
    hs.innerHTML = list.map((src, i) =>
      `<div class="slide${i === 0 ? " on" : ""}"><div class="bg" style="background-image:url('${esc(src)}')"></div>` +
      `<img src="${esc(src)}" alt="" onerror="this.closest('.slide').remove()"></div>`).join("");
    // 画面の形に近い写真は画面いっぱいに、形が違う写真は全体が見えるように表示する
    window.fitHero = () => {
      const portrait = matchMedia("(max-aspect-ratio: 1/1)").matches;
      const bw = hs.clientWidth, bh = hs.clientHeight * (portrait ? 0.56 : 1);
      if (!bw || !bh) return;
      hs.querySelectorAll(".slide img").forEach((im) => {
        if (!im.naturalWidth) return;
        const r = (im.naturalWidth / im.naturalHeight) / (bw / bh);
        im.classList.toggle("fill", r > 0.88 && r < 1.14);
      });
    };
    hs.addEventListener("load", window.fitHero, true);
    window.addEventListener("resize", window.fitHero);
    let i = 0;
    if (list.length > 1) setInterval(() => {
      const imgs = hs.querySelectorAll(".slide");   // 読み込めなかった写真は自動で外れます
      if (imgs.length < 2) return;
      imgs.forEach((im) => im.classList.remove("on"));
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, c.heroInterval || 3000);
  }
}

function buildMenu() {
  const items = SECTIONS.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join("");
  $("main").insertAdjacentHTML("afterbegin",
    `<button class="menu-btn" id="menuBtn" type="button" aria-label="メニュー" aria-expanded="false" aria-controls="drawer"><span></span><span></span><span></span></button>` +
    `<nav class="drawer" id="drawer" aria-label="ページメニュー" hidden><ul>${items}</ul></nav>` +
    `<div class="lb" id="lb" hidden><img id="lbImg" alt=""></div>`);
  const drawer = $("drawer"), menuBtn = $("menuBtn"), lb = $("lb");
  const setMenu = (open) => {
    drawer.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "メニューを閉じる" : "メニュー");
    document.body.style.overflow = open ? "hidden" : "";
  };
  menuBtn.addEventListener("click", () => setMenu(drawer.hidden));
  drawer.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  $("main").addEventListener("click", (e) => {
    const b = e.target.closest("[data-src]");
    if (!b) return;
    $("lbImg").src = b.dataset.src;
    lb.hidden = false;
  });
  lb.addEventListener("click", () => { lb.hidden = true; });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    lb.hidden = true;
    setMenu(false);
  });
}

function show() {
  const g = $("gate"); if (g) g.hidden = true;
  $("main").hidden = false;
  if (window.fitHero) window.fitHero();
  const h = location.hash && document.querySelector(location.hash);
  if (h) h.scrollIntoView(); else window.scrollTo(0, 0);
}

const norm = (s) => s.normalize("NFKC").trim();

render();
buildMenu();

let ok = false;
try { ok = sessionStorage.getItem(KEY) === "1"; } catch (e) {}

if (ok) {
  show();
} else if ($("gate")) {
  $("gateForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (norm($("pw").value) === norm(CONFIG.password)) {
      try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
      show();
    } else {
      $("err").textContent = "合言葉が違います。もう一度お試しください。";
      $("pw").select();
    }
  });
}

/* 合言葉・メニュー・内容の表示。ふだんは触らなくて大丈夫です */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const put = (id, html) => { const e = $(id); if (e) e.innerHTML = html; };
const KEY = "wedding-unlocked";
const SECTIONS = [
  ["#top", "トップ"],
  ["#info", "日時・アクセス"],
  ["#schedule", "当日の流れ"],
  ["#about", "二人の生い立ち"],
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
  put("names", `<span>${esc(c.groom)}</span><span class="bar" aria-hidden="true"></span><span>${esc(c.bride)}</span>`);
  const hd = $("heroDate"); if (hd) hd.textContent = dt.dots;
  put("infoList",
    `<dt>日にち</dt><dd>${esc(dt.long)}</dd><dt>会場</dt><dd>${esc(c.venueName)}</dd><dt>住所</dt><dd>${esc(c.address)}</dd>`);
  const ml = $("mapLink");
  if (ml) ml.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.venueName + " " + c.address);
  put("access", c.access.map((a) => `<li>${esc(a)}</li>`).join(""));
  put("timeline", c.schedule.map((s) => `<li><time>${esc(s.time)}</time><span>${esc(s.text)}</span></li>`).join(""));
  put("profiles", c.profiles.map((p) =>
    `<div class="profile"><p class="role">${esc(p.role)}</p><h3>${esc(p.name)}</h3><p>${esc(p.text)}</p></div>`).join(""));
  put("gallery", c.photoGroups.map((g) => {
    const tiles = g.files.length
      ? g.files.map((src) => `<button class="ph-btn" type="button" data-src="${esc(src)}" aria-label="写真を拡大"><img src="${esc(src)}" alt="" loading="lazy"></button>`).join("")
      : Array.from({ length: 3 }, () => `<div class="ph">写真</div>`).join("");
    return `<h3 class="sub">${esc(g.title)}</h3><div class="gallery">${tiles}</div>`;
  }).join(""));
  put("history", c.history.map((h) =>
    `<li><time>${esc(h.year)}</time><span><span class="who">${esc(h.who)}</span>${esc(h.text)}</span></li>`).join(""));
  const links = [];
  if (c.upload.uploadUrl) links.push(`<a class="btn" href="${esc(c.upload.uploadUrl)}" target="_blank" rel="noopener">写真を送る</a>`);
  if (c.upload.albumUrl) links.push(`<a class="btn" href="${esc(c.upload.albumUrl)}" target="_blank" rel="noopener">みんなの写真を見る</a>`);
  put("shareLinks", links.join("") || "<p>当日までに、写真の送り方をここでご案内します。</p>");
  const f = $("footer"); if (f) f.textContent = c.footerMessage;
  const hs = $("heroSlides");
  if (hs) {
    const list = c.heroPhotos || [];
    hs.innerHTML = list.map((src, i) => `<img src="${esc(src)}" alt=""${i === 0 ? ' class="on"' : ""} onerror="this.remove()">`).join("");
    let i = 0;
    if (list.length > 1) setInterval(() => {
      const imgs = hs.querySelectorAll("img");   // 読み込めなかった写真は自動で外れます
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
  const g = $("gallery");
  if (g) g.addEventListener("click", (e) => {
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
  window.scrollTo(0, 0);
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

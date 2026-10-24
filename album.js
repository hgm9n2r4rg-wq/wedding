/* 写真一覧ページ(50枚ずつ表示)。ふだんは触らなくて大丈夫です */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const KEY = "wedding-unlocked";
const PAGE_SIZE = 50;   // 1ページに表示する枚数

function photoList(g) {
  if (g.files && g.files.length) return g.files;
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

  document.title = `${g.title} | ${CONFIG.groom} & ${CONFIG.bride}`;
  $("albumTitle").textContent = g.title;
  $("albumCount").textContent = list.length ? `全${list.length}枚 ・ タップで拡大、右下の ↓ で保存できます` : "";

  function go(p) {
    const page = Math.min(Math.max(1, p), pages);
    const items = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    $("albumGrid").innerHTML = items.length ? items.map((src) => {
      const name = src.split("/").pop();
      return `<figure class="tile"><button class="ph-btn" type="button" data-src="${esc(src)}" aria-label="写真を拡大">` +
        `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.closest('figure').remove()"></button>` +
        `<a class="dl" href="${esc(src)}" download="${esc(name)}" aria-label="ダウンロード">↓</a></figure>`;
    }).join("") : `<p class="empty">写真は準備中です。もうしばらくお待ちください。</p>`;

    const nums = Array.from({ length: pages }, (_, k) =>
      `<button type="button" data-p="${k + 1}"${k + 1 === page ? ' aria-current="page"' : ""}>${k + 1}</button>`).join("");
    $("pager").innerHTML = pages > 1
      ? `<button type="button" data-p="${page - 1}"${page === 1 ? " disabled" : ""}>←</button>${nums}<button type="button" data-p="${page + 1}"${page === pages ? " disabled" : ""}>→</button>`
      : "";
    history.replaceState(null, "", `?g=${gi}&p=${page}`);
    window.scrollTo(0, 0);
  }

  $("pager").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-p]");
    if (b && !b.disabled) go(Number(b.dataset.p));
  });

  const lb = $("lb");
  $("albumGrid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-src]");
    if (!b) return;
    const src = b.dataset.src;
    $("lbImg").src = src;
    $("lbDl").href = src;
    $("lbDl").download = src.split("/").pop();
    lb.hidden = false;
  });
  lb.addEventListener("click", () => { lb.hidden = true; });
  $("lbDl").addEventListener("click", (e) => e.stopPropagation());
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") lb.hidden = true; });

  go(Number(q.get("p")) || 1);
}

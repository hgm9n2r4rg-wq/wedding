/* Dropbox とやりとりする部品(写真を送る・みんなの写真を見る)。ふだんは触らなくて大丈夫です */
const DBX = (() => {
  const cfg = () => (typeof CONFIG !== "undefined" && CONFIG.dropbox) || {};
  const folder = () => "/" + String(cfg().folder || "guests").replace(/^\/+|\/+$/g, "");
  const enabled = () => !!(cfg().appKey && cfg().refreshToken);
  // Dropbox-API-Arg は半角のみ通るので、日本語などは \uXXXX に直す
  const arg = (o) => JSON.stringify(o).replace(/[\u007f-￿]/g, (c) => "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4));

  let tok = "", exp = 0, pend = null;
  const refresh = () => pend || (pend = fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: cfg().refreshToken, client_id: cfg().appKey })
    }).then(async (r) => {
      if (!r.ok) throw new Error("auth " + r.status);
      const j = await r.json();
      tok = j.access_token; exp = Date.now() + (j.expires_in - 120) * 1000;
      return tok;
    }).finally(() => { pend = null; }));
  const token = () => (tok && Date.now() < exp ? Promise.resolve(tok) : refresh());

  async function call(url, init, retry = 0) {
    const t = await token();
    const r = await fetch(url, { ...init, headers: { ...init.headers, Authorization: "Bearer " + t } });
    if (r.status === 401 && !retry) { tok = ""; return call(url, init, 1); }
    if (r.status === 429 && retry < 3) {
      await new Promise((s) => setTimeout(s, (Number(r.headers.get("Retry-After")) || 2) * 1000));
      return call(url, init, retry + 1);
    }
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      const e = new Error(txt || String(r.status));
      e.status = r.status; e.space = /insufficient_space/.test(txt); e.notFound = /not_found/.test(txt);
      throw e;
    }
    return r;
  }
  const rpc = (ep, body) => call("https://api.dropboxapi.com/2/" + ep, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());
  const content = (ep, a, body) => call("https://content.dropboxapi.com/2/" + ep, {
    method: "POST", headers: Object.assign({ "Dropbox-API-Arg": arg(a) }, body ? { "Content-Type": "application/octet-stream" } : {}), body });

  // 写真を1枚送る(名前は日時+乱数にするので、同じ名前でも上書きされません)
  function upload(file) {
    const ext = (((file.name || "").match(/\.([A-Za-z0-9]+)$/) || [])[1] || (file.type || "image/jpeg").split("/")[1] || "jpg")
      .toLowerCase().replace("jpeg", "jpg");
    const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    const name = `${stamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    return content("files/upload", { path: folder() + "/" + name, mode: "add", autorename: true, mute: true }, file).then((r) => r.json());
  }
  // 送られた写真の一覧(新しい順)
  async function list() {
    let res, out = [];
    try { res = await rpc("files/list_folder", { path: folder(), limit: 2000 }); }
    catch (e) { if (e.notFound) return []; throw e; }
    for (;;) {
      out = out.concat(res.entries.filter((e) => e[".tag"] === "file"));
      if (!res.has_more) break;
      res = await rpc("files/list_folder/continue", { cursor: res.cursor });
    }
    return out.filter((e) => /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(e.name))
      .sort((a, b) => (a.server_modified < b.server_modified ? 1 : -1))
      .map((e) => ({ id: e.id, name: e.name, size: e.size }));
  }
  const thumb = (id, size) => content("files/get_thumbnail_v2", { resource: { ".tag": "path", path: id }, format: "jpeg", size, mode: "bestfit" }).then((r) => r.blob());
  const download = (id) => content("files/download", { path: id }).then((r) => r.blob());
  return { enabled, upload, list, thumb, download };
})();

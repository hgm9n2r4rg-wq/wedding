/* ============================================================
   ここを書き換えるだけでサイトの内容が変わります
   ============================================================ */
const CONFIG = {
  password: "wedding",              // 合言葉(半角英数字がおすすめ)
  groom: "司",
  bride: "里紗",
  date: "2026-11-22",               // 挙式日 (YYYY-MM-DD)
  heroNames: ["Risa", "Tsukasa"],     // トップに大きく出る英語表記(上から順に表示)
  venueName: "小さな結婚式 お台場店",
  address: "東京都港区台場1-6-1 デックス東京ビーチ6F(シーサイドモール)",
  access: [
    "ゆりかもめ「お台場海浜公園駅」、りんかい線「東京テレポート駅」が最寄り駅です"
  ],
  // トップ画面の背景写真(複数入れると自動で切り替わります)
  heroPhotos: ["images/hero1.jpg", "images/hero2.jpg", "images/hero3.jpg"],
  heroInterval: 3000,               // 切り替え間隔(ミリ秒)。3000 = 3秒
  // 日時・アクセスの下の、横にスクロールできる写真(5枚くらい)
  stripPhotos: ["images/strip1.jpg", "images/strip2.jpg", "images/strip3.jpg", "images/strip4.jpg", "images/strip5.jpg"],
  schedule: [
    { time: "15:20", text: "集合" },
    { time: "16:00", text: "開場" },
    { time: "17:00", text: "閉会" },
    { time: "18:30", text: "ご飯会＠新居" }
  ],
  profiles: [
    { role: "新郎", name: "司（つかさ）", photo: "images/tsukasa.jpg",
      text: "長野県岡谷市生まれ。バスケ部では部長を務め、中央大学理工学部を卒業後、ベイカレントコンサルティングに入社。趣味はバスケ観戦、寿司、妻と猫との時間。妻いわく「人の3倍食べる」。可愛い笑顔がチャームポイントです！" },
    { role: "新婦", name: "里紗", photo: "images/risa.jpg",
      text: "東京生まれ、京都育ち。京都市立の中高を経て京都大学経済学部に進学し、ボストンコンサルティンググループに入社。学生時代は勉強に励みつつ、ピアノ・新体操・アニメも満喫。現在は猫、美味しいもの、韓国アイドルに夢中です！" }
  ],
  // 写真は images フォルダに入れて、ファイル名を書きます(空のままだと仮の枠が出ます)
  // 例: files: ["images/futari-01.jpg", "images/futari-02.jpg"]
  photoGroups: [
    { title: "二人の写真", files: [] },
    { title: "猫と二人の写真", files: [] },
    { title: "猫だけの写真", files: [] }
  ],
  history: [
    { year: "2000.9.16", who: "新郎", text: "長野県岡谷市で生まれる" },
    { year: "2001.3.13", who: "新婦", text: "東京都で生まれ、京都府京都市で育つ" },
    { year: "2023.11.23", who: "二人", text: "友達の紹介で付き合う" },
    { year: "2026.3.14", who: "二人", text: "プロポーズ♡" },
    { year: "2026.9.30", who: "二人", text: "翡翠・パールが家族になる" },
    { year: "2026.11.22", who: "二人", text: "結婚式" }
  ],
  upload: {
    uploadUrl: "",   // 写真を送るためのURL(Googleドライブの共有フォルダなど)
    albumUrl: ""     // みんなの写真を見るためのURL
  },
  footerMessage: "当日お会いできるのを楽しみにしています"
};

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
    { role: "新郎", name: "司", photo: "images/tsukasa.jpg",
      text: "長野県岡谷市生まれ。信州大学教育大学附属松本中学校、駿台甲府高校を経て、中央大学理工学部を卒業。その後、ベイカレント・コンサルティングに入社。学生時代はバスケ部の部長を務め、持ち前のリーダーシップを発揮（していたはず）。趣味はバスケ観戦、寿司を食べること、そして愛する妻と猫と戯れること。里紗いわく「人の3倍食べる」。可愛い笑顔もチャームポイントです！" },
    { role: "新婦", name: "里紗", photo: "images/risa.jpg",
      text: "東京都生まれ、京都府京都市育ち。京都市立衣笠中学校、京都市立西京高等学校を経て、京都大学経済学部に進学。卒業後はボストン・コンサルティンググループに入社。司コメント「中高公立で親孝行、えらい！」。学生時代は勉強に励むガリ勉でありながら、ピアノや新体操にも取り組み、趣味のアニメも満喫。現在の趣味は猫と遊ぶこと、寝ること（ずっと寝てるよ！）、美味しいものを食べること、韓国アイドルを愛でること。" }
  ],
  // ギャラリー: タブごとに代表の1枚が出て、タップすると写真一覧ページ(50枚ずつ)が開きます
  // 写真は folder の中に 001.jpg, 002.jpg ... と連番で入れて、count に枚数を書きます
  // 例: 二人の写真が120枚なら  folder: "images/futari", count: 120
  // 代表写真を変えたいときは cover を足します (例: cover: "images/futari/010.jpg")
  photoGroups: [
    { tab: "二人",     title: "二人の写真",     folder: "images/futari",      count: 0 },
    { tab: "猫と二人", title: "猫と二人の写真", folder: "images/neko-futari", count: 0 },
    { tab: "猫だけ",   title: "猫だけの写真",   folder: "images/neko",        count: 0 }
  ],
  // ■ 出会うまで(司=左 / 里紗=右)。同じ学年なので入学・入社の時期をそろえて並べています
  //   【出来事の行】 { year, left(司), right(里紗) }  片方だけでもOK
  //        写真を添えたいときは leftPhoto / rightPhoto を足します
  //   【写真だけの行】 { photo: "小学生時代", left: 写真, right: 写真 }
  //   ◆写真の書き方(年表の写真は、複数枚あるとタップするたびに次の写真へスライドします)
  //     { folder: "images/life/koko-tsukasa" }   ← おすすめ。そのフォルダに写真を入れるだけ(名前はそのままでOK、何枚でも)
  //                                                  写真が1枚も無いときは、その枠は表示されません
  //     "images/life/a.jpg"                       ← 1枚だけ、ファイル名で指定
  //     ["images/life/a.jpg", "images/life/b.jpg"] ← 複数枚を、ファイル名で指定
  //     { src: "images/life/a.jpg", cap: "運動会" } ← 写真の下に一言(並びの中に混ぜてOK)
  //   ※「幼い頃」「小学校」などは仮の書き方です。園名・学校名・思い出を書き足してください
  //   ※入学・入社の年は、同学年・現役で進学した前提で入れています。違うところは直してください
  life: [
    { year: "2000.9.16", left: "長野県岡谷市で生まれる" },
    { year: "2001.3.13", right: "東京都で生まれ、京都府京都市で育つ" },
    { year: "幼い頃", left: "保育園に入園", right: "保育園に入園" },
    { photo: "幼少期", left: { folder: "images/life/youji-tsukasa" }, right: { folder: "images/life/youji-risa" } },
    { year: "2007.4", left: "小学校に入学", right: "小学校に入学" },
    { photo: "小学生時代", left: { folder: "images/life/shogaku-tsukasa" }, right: { folder: "images/life/shogaku-risa" } },
    { year: "2013.4", left: "信州大学教育大学附属松本中学校に入学", right: "京都市立衣笠中学校に入学" },
    { photo: "中学時代", left: { folder: "images/life/chugaku-tsukasa" }, right: { folder: "images/life/chugaku-risa" } },
    { year: "2016.4", left: "駿台甲府高校に入学", right: "京都市立西京高等学校に入学" },
    { photo: "高校時代", left: { folder: "images/life/koko-tsukasa" }, right: { folder: "images/life/koko-risa" } },
    { year: "2019.4", left: "中央大学理工学部に入学", right: "京都大学経済学部に入学" },
    { year: "2023.4", left: "ベイカレント・コンサルティングに入社", right: "ボストン・コンサルティング・グループに入社" }
  ],
  // ■ 出会ってから(二人の出来事)
  //   photo を足すと、その出来事の下に写真が出ます(書き方は上と同じ。フォルダ指定がおすすめ)
  //   写真を載せない出来事は、photo の部分を消してください
  history: [
    { year: "2024.10.19", who: "二人", text: "友人の紹介で初デート" },
    { year: "2024.11.9", who: "二人", text: "3回目のデート（館山ドライブ）で軽く司に告白されるも、一旦保留する" },
    { year: "2024.11.23", who: "二人", text: "司からの熱烈なアプローチを経て、付き合う" },
    { year: "2025.10.25", who: "二人", text: "同棲開始" },
    { year: "2025.12.18～2026.1.2", who: "二人", text: "大ヨーロッパ旅行でスペイン・フランス・スイス・イタリアに行く", photo: { folder: "images/story/europe" } },
    { year: "2026.3.14", who: "二人", text: "プロポーズ♡", photo: { folder: "images/story/propose" } },
    { year: "2026.9.18～2026.9.29", who: "二人", text: "新婚旅行でバリ・オーストラリアに行く（コアラタッチできたよ！）", photo: { folder: "images/story/honeymoon" } },
    { year: "2026.9.30", who: "二人", text: "翡翠・パールが家族になる", photo: { folder: "images/story/family" } },
    { year: "2026.11.22", who: "二人", text: "結婚式" }
  ],
  upload: {
    uploadUrl: "",   // 写真を送るためのURL(Googleドライブの共有フォルダなど)
    albumUrl: ""     // みんなの写真を見るためのURL
  },
  footerMessage: "当日お会いできるのを楽しみにしています"
};

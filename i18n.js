/* 辰星商務中心 — 共用多語系引擎 (中 / EN / 日)
   所有頁面共用這一支：以後改翻譯只改這個檔。
   用法：頁面 <body> 結尾前加 <script src="i18n.js"></script>（posts/ 子目錄用 ../i18n.js），
   並在導覽列放一個地球切換鈕：
   <div class="langsw"><button class="lang-btn" aria-label="Language" onclick="toggleLangMenu(event)"><svg ...globe...></svg></button>
     <div class="lang-menu" id="langMenu"><a data-l="zh" onclick="setLang('zh')">中文</a><a data-l="en" onclick="setLang('en')">English</a><a data-l="ja" onclick="setLang('ja')">日本語</a></div></div>
*/
(function(){
  /* ---- 注入樣式（地球鈕＋下拉＋主視覺多語換行）---- */
  var CSS = `
  .langsw{position:relative;display:inline-flex;align-items:center;flex-shrink:0}
  .lang-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:0;background:none;color:#C8A24A;cursor:pointer;opacity:.9;transition:.2s;padding:0}
  .lang-btn:hover{opacity:1;color:#E0BE72}
  .lang-btn svg{width:21px;height:21px}
  .lang-menu{position:absolute;right:0;top:calc(100% + 10px);min-width:132px;background:var(--navbg,#1A1712);border:1px solid rgba(183,154,106,.3);border-radius:10px;padding:6px;flex-direction:column;gap:2px;display:none;box-shadow:0 12px 30px rgba(0,0,0,.32);z-index:140}
  .lang-menu.open{display:flex}
  .lang-menu a{cursor:pointer;font-size:.82rem;letter-spacing:.04em;padding:9px 14px;border-radius:7px;color:#D8D2C4;text-decoration:none;white-space:nowrap;transition:.2s}
  .lang-menu a:hover{background:rgba(255,255,255,.08);color:#fff}
  .lang-menu a.cur{color:#D4AE72;background:rgba(169,128,63,.18)}
  html[lang="en"] .hero h1 span,html[lang="ja"] .hero h1 span{white-space:normal!important}
  html[lang="en"] .hero h1,html[lang="ja"] .hero h1{font-size:clamp(2rem,5.2vw,4.2rem)!important;letter-spacing:.02em!important}
  .nav>.menu{margin-left:auto}
  .nav>.langsw{margin-left:14px}
  `;
  var st=document.createElement('style'); st.id='ms-i18n-css'; st.textContent=CSS;
  (document.head||document.documentElement).appendChild(st);

  /* ---- 字典 zh -> [en, ja] ---- */
  var T={
  "關於辰星":["About Us","辰星について"],
  "場館":["Venues","拠点"],
  "服務":["Services","サービス"],
  "一站式":["One-Stop","ワンストップ"],
  "費用方案":["Pricing","料金プラン"],
  "用戶評價":["Reviews","お客様の声"],
  "會議室":["Meeting Rooms","会議室"],
  "最新貼文":["Journal","お知らせ"],
  "合作夥伴":["Partners","パートナー"],
  "常見問題":["FAQ","よくあるご質問"],
  "預約參觀":["Book a Tour","見学予約"],
  "台北信義":["Taipei Xinyi","台北・信義"],
  "黃金地段":["Prime Location","一等地"],
  "小坪數":["Compact ","コンパクト"],
  "共享辦公空間":["Shared Office Space","シェアオフィス"],
  "探索兩處據點":["Explore Our Venues","拠点を見る"],
  "或預約參觀 ↓":["or Book a Tour ↓","または見学予約 ↓"],
  "給您一個位於市區黃金地段的小坪數辦公方案。":["A compact office solution in the heart of the city.","都心の一等地にある、小規模オフィスのご提案。"],
  "辰星的使命，是成為您事業的夥伴。我們以共享經濟為核心概念，配置貼心優質的全新設施，營造舒適、自由有效率，又像第二個家般溫馨的工作空間。":["Morning Stars’ mission is to be your business partner. Built on the sharing economy, we provide thoughtfully designed, brand-new facilities and a workspace that is comfortable, free, efficient, and as warm as a second home.","辰星の使命は、お客様の事業のパートナーとなることです。シェアリングエコノミーを核に、行き届いた新しい設備を備え、快適で自由かつ効率的、そして第二の我が家のような温かい仕事空間をご提供します。"],
  "無論您是個人自由業者、初創企業，或六人以下的團隊，這裡都能滿足您短中長期或臨時專案期間的多元工作樣貌——私人辦公、客戶會晤、開放共享、會議活動與虛擬辦公室。":["Whether you are a freelancer, a startup, or a team of six or fewer, we meet your needs across short-, mid-, and long-term or temporary projects — private offices, client meetings, open co-working, meetings and events, and virtual offices.","フリーランス、スタートアップ、6名以下のチームまで。短期・中長期・スポットのプロジェクトまで多様な働き方に対応します——個室オフィス、来客対応、オープンなコワーキング、会議・イベント、バーチャルオフィス。"],
  "兩處據點":["Our Venues","2つの拠点"],
  "信義館":["Xinyi Branch","信義館"],
  "世貿館":["WTC Branch","世貿館"],
  "基隆路二段 145 號 10 樓．近捷運六張犁站":["10F, No.145, Sec.2, Keelung Rd. · Near Liuzhangli MRT","基隆路二段145号10階・MRT六張犁駅近く"],
  "基隆路一段 398 號 4 樓．近捷運台北 101／世貿站":["4F, No.398, Sec.1, Keelung Rd. · Near Taipei 101 / WTC MRT","基隆路一段398号4階・MRT台北101／世貿駅近く"],
  "進入場館 →":["Enter →","館内を見る →"],
  "📍 導航前往":["📍 Directions","📍 ナビで行く"],
  "服務項目":["Our Services","サービス内容"],
  "收發服務":["Mail Handling","郵便・荷物受付"],
  "茶水空間":["Pantry","給湯スペース"],
  "清潔服務":["Cleaning","清掃サービス"],
  "其他設備":["Facilities","その他設備"],
  "代收郵件、包裹或快遞，並透過 Line 即時通知處理情形，為您分擔繁瑣庶務。":["We receive your mail, parcels and couriers and notify you in real time via LINE, handling the everyday details for you.","郵便・荷物・宅配を代理受領し、LINEでリアルタイムにご連絡。煩雑な雑務を代行します。"],
  "飲水機、電冰箱、微波爐等設備，備有免費咖啡茶包，休憩或招待訪客都輕鬆。":["Water dispenser, refrigerator, microwave and more, with complimentary coffee and tea — ideal for a break or hosting guests.","ウォーターサーバー・冷蔵庫・電子レンジ等を完備し、無料のコーヒー・お茶もご用意。休憩や来客対応も快適です。"],
  "每日公共環境打掃、垃圾清理及不定期消毒，隨時保持辦公環境清新舒適。":["Daily cleaning of common areas, waste removal and periodic disinfection keep the workspace fresh and comfortable.","共用部の毎日清掃、ゴミ回収、不定期の消毒で、いつも清潔で快適なオフィス環境を保ちます。"],
  "24 小時獨立冷氣、多功能事務機與高速 Wi-Fi，確保高效率的工作環境。":["24-hour independent air conditioning, multifunction printers and high-speed Wi-Fi ensure an efficient work environment.","24時間個別空調、複合機、高速Wi-Fiを備え、効率的な仕事環境を実現します。"],
  "選擇辰星，還有更多":["More Than a Desk","デスク以上の価値"],
  "人脈與社群":["Network & Community","人脈とコミュニティ"],
  "記帳與登記協助":["Accounting & Registration","記帳・登記サポート"],
  "跨館彈性使用":["Cross-Venue Access","拠点間の相互利用"],
  "進駐多元的專業夥伴，從會計、工程到企業顧問，自然形成可互相引薦的商務聚落。":["A diverse community of professionals — from accounting and engineering to business consulting — forms a network where referrals come naturally.","会計から工事、経営コンサルまで多様な専門家が集い、互いに紹介し合えるビジネスコミュニティが自然に生まれます。"],
  "配合專業記帳士，協助公司登記與記帳流程，讓初創事業少走冤枉路。":["Working with professional bookkeepers, we support company registration and accounting so startups avoid costly detours.","専門の記帳士と連携し、会社登記や記帳をサポート。スタートアップの遠回りを防ぎます。"],
  "信義館客戶可跨館使用世貿館會議室，依需求自由調度，空間隨事業一起成長。":["Xinyi members can use the WTC meeting rooms across venues, flexibly as needed — space that grows with your business.","信義館のお客様は世貿館の会議室も拠点を越えてご利用可能。必要に応じて自由に使い分け、事業とともに成長できます。"],
  "公司設立一站式服務":["One-Stop Company Setup","会社設立ワンストップ"],
  "在辰星，一個窗口辦到好。從公司設立到日常營運，核心服務由辰星自營，專業項目由長期配合的會計師、記帳士、地政士承接，全程由辰星統一窗口為您安排。":["At Morning Stars, one window handles it all. From company formation to daily operations, core services are run by us while specialized matters are handled by our long-term partner accountants, bookkeepers and land agents — all coordinated through a single point of contact.","辰星なら、一つの窓口ですべて完結。会社設立から日常運営まで、コアサービスは辰星が自社運営し、専門領域は長年提携する会計士・記帳士・土地家屋調査士が担当。すべて辰星の統一窓口で手配します。"],
  "設立前 · 諮詢評估":["Before · Consulting","設立前・相談評価"],
  "設立中 · 設立登記":["During · Registration","設立中・登記"],
  "設立後 · 營運必要":["After · Operations","設立後・運営必須"],
  "持續營運 · 加值變更":["Ongoing · Add-ons & Changes","継続運営・追加変更"],
  "公司型態諮詢":["Entity Type Consulting","会社形態の相談"],
  "公司命名與核名":["Naming & Name Check","商号の決定・確認"],
  "資本額・營業項目規劃":["Capital & Scope Planning","資本金・事業目的の設計"],
  "公司設立登記全代辦":["Full Incorporation Service","会社設立登記の全代行"],
  "公司設址登記":["Registered Address","本店所在地登記"],
  "稅籍（營業）登記":["Tax Registration","税籍（営業）登記"],
  "遷址代辦":["Address Change Service","本店移転代行"],
  "記帳與報稅":["Bookkeeping & Tax Filing","記帳・税務申告"],
  "營業稅・營所稅申報":["VAT & Income Tax Filing","営業税・法人税の申告"],
  "電子發票字軌申請":["E-Invoice Track Application","電子インボイス番号の申請"],
  "大小章・商標・簽證":["Seals, Trademark & Attestation","印鑑・商標・証明"],
  "小型辦公室出租":["Small Office Rental","小規模オフィス賃貸"],
  "會議室租借":["Meeting Room Rental","会議室レンタル"],
  "變更登記代辦":["Change Registration Service","変更登記代行"],
  "公司形象官網製作":["Corporate Website Design","コーポレートサイト制作"],
  "歇業 / 補助諮詢":["Closure / Subsidy Consulting","廃業・補助金相談"],
  "免費":["Free","無料"],
  "請洽專員":["By Quote","お見積り"],
  "$8,500 起":["From $8,500","$8,500〜"],
  "年 18,000＋押金 1,500":["$18,000/yr + $1,500 deposit","年18,000＋保証金1,500"],
  "$2,000 起":["From $2,000","$2,000〜"],
  "每小時 400":["$400 / hour","1時間400"],
  "月租 10,000 起":["From $10,000/mo","月額10,000〜"],
  "登記享優惠":["Discount for Members","登記者は優待"],
  "立即諮詢 / 預約參觀":["Inquire / Book a Tour","今すぐ相談・見学予約"],
  "借址登記":["Virtual Office","バーチャルオフィス"],
  "獨立辦公室":["Private Office","個室オフィス"],
  "共享座位":["Co-working Seat","コワーキング席"],
  "因應公司行號成立、營運上無需實體辦公室，僅需借址做工商登記之用。辰星地址符合專業形象，並有專業記帳士配合辦理記帳。":["For businesses that need a registered address for company registration without a physical office. Our address conveys a professional image, with partner bookkeepers available for accounting.","実オフィスは不要で、会社登記のための住所のみが必要な方に。辰星の住所はプロフェッショナルな印象を与え、提携記帳士による記帳にも対応します。"],
  "年繳 NT$18,000 元起":["From NT$18,000 / year","年額NT$18,000〜"],
  "平均每月 1,500 元起":["About NT$1,500 / month","月あたり約1,500〜"],
  "適合一人到六人以下使用，採光美、可塑度高，能依需求自由佈置。租用夥伴可另外使用共享空間與各項免費設備。":["Ideal for 1–6 people, with great natural light and high flexibility to arrange as you like. Members may also use the shared spaces and complimentary facilities.","1〜6名向け。採光が良く自由度が高く、ニーズに合わせて自由にレイアウト可能。共用スペースや各種無料設備もご利用いただけます。"],
  "月租 NT$10,000 元起":["From NT$10,000 / month","月額NT$10,000〜"],
  "視空間大小而定":["Depending on size","広さにより異なります"],
  "臨時辦公、會議、與客戶面談，或短期專案、出差同事的彈性需求。以座位為單位，依使用時間計費。":["For ad-hoc work, meetings, client visits, short-term projects or visiting colleagues. Priced per seat by time used.","スポット利用、会議、来客対応、短期プロジェクトや出張者の柔軟なニーズに。席単位・利用時間に応じた料金です。"],
  "月租 NT$4,500 元起":["From NT$4,500 / month","月額NT$4,500〜"],
  "了解借址登記 →":["Learn about Virtual Office →","詳しく見る →"],
  "了解獨立辦公室 →":["Learn about Private Office →","詳しく見る →"],
  "看會議室租借 →":["Meeting Room Rental →","会議室レンタル →"],
  "會議室線上預約":["Reserve a Meeting Room","会議室オンライン予約"],
  "信義館與世貿館會議室皆可線上預約：進入預約頁後，選擇館別與日期、查看即時空檔並送出預約即可。如需協助，歡迎來電 0903-368-856 或加 LINE @mstars。":["Both the Xinyi and WTC meeting rooms can be booked online: open the booking page, choose a venue and date, view real-time availability, and submit. For help, call 0903-368-856 or add LINE @mstars.","信義館・世貿館の会議室はオンライン予約が可能です。予約ページで拠点と日付を選び、空き状況を確認して送信するだけ。サポートが必要な場合は 0903-368-856 またはLINE @mstars までご連絡ください。"],
  "前往會議室線上預約 →":["Go to Online Booking →","オンライン予約へ →"],
  "查看更多文章 →":["View All Posts →","記事一覧へ →"],
  "會計・稅務顧問":["Accounting & Tax Advisory","会計・税務顧問"],
  "空間工程・裝修":["Construction & Fit-out","内装・工事"],
  "企業服務":["Corporate Services","企業サービス"],
  "商務管理顧問":["Business Management Consulting","経営コンサルティング"],
  "室內裝修・空間設計":["Interior Design","内装・空間デザイン"],
  "辦公室空間適合哪類行業租用？":["What types of businesses are suited to the office space?","どんな業種の利用に向いていますか？"],
  "辰星歡迎各行業。我們規劃的個別空間功能具彈性，可依需求自由佈置。除了六人以下的辦公空間，個人專業諮詢、創意設計工作室、商品展示、網路影像直播等也都十分適合。":["Morning Stars welcomes all industries. Our individual spaces are flexible and can be arranged freely. Besides offices for six or fewer, they suit professional consulting, creative studios, product display, and live streaming.","辰星はあらゆる業種を歓迎します。各スペースは機能が柔軟で、ニーズに応じて自由にレイアウト可能。6名以下のオフィスのほか、個人コンサル、クリエイティブスタジオ、商品展示、ライブ配信などにも最適です。"],
  "租金包含哪些？之後會有額外費用嗎？":["What does the rent include? Are there extra charges later?","賃料には何が含まれますか？追加費用はありますか？"],
  "租金已包含水電管理、辦公桌椅、空間設施及基本服務。若有公司借址登記需求，租金也已包含在內，無需額外費用。":["Rent includes utilities and management, desks and chairs, facilities, and basic services. A registered business address, if needed, is also included at no extra cost.","賃料には水道光熱・管理費、デスク・椅子、設備、基本サービスが含まれます。会社の住所登記が必要な場合も賃料に含まれ、追加費用はかかりません。"],
  "是否有提供免費的會議或活動空間？":["Do you offer free meeting or event space?","無料の会議・イベントスペースはありますか？"],
  "是的，世貿館提供會議室租借服務，信義館進駐客戶也可跨館使用，依需求預約即可。":["Yes. The WTC venue offers meeting room rental, and Xinyi members may also use it across venues — just book as needed.","はい。世貿館では会議室レンタルを提供しており、信義館のお客様も拠点を越えてご利用いただけます。必要に応じてご予約ください。"],
  "是否需要簽長期合約？可以短期嗎？":["Do I need a long-term contract? Is short-term possible?","長期契約は必要ですか？短期も可能ですか？"],
  "我們提供各種靈活方案，無論依小時計的臨時辦公、短期月繳，或長期的季繳、年繳，都能滿足您的需求（其中借址登記為年繳制）。":["We offer flexible plans — hourly ad-hoc use, short-term monthly, or long-term quarterly and yearly (note: the virtual office is billed annually).","時間単位のスポット利用、短期の月払い、長期の四半期・年払いまで柔軟なプランをご用意（バーチャルオフィスは年払い制です）。"],
  "方便停車嗎？":["Is parking convenient?","駐車は便利ですか？"],
  "兩處據點大樓地下皆有月租機械式車位。附近至少有二處步行 2 分鐘可達的停車場可臨時停車。":["Both buildings have monthly mechanical parking in the basement, and there are at least two car parks within a 2-minute walk for temporary parking.","両拠点ともビル地下に月極の機械式駐車場があります。徒歩2分圏内に少なくとも2か所、一時利用可能な駐車場もあります。"],
  "聯絡辰星":["Contact","お問い合わせ"],
  "期待您加入我們的聚落，一同共創成功。":["We look forward to welcoming you to our community and creating success together.","私たちのコミュニティに加わり、ともに成功を築けることを楽しみにしています。"],
  "電話 Tel":["Phone","電話"],
  "信箱 Email":["Email","メール"],
  "社群":["Social","SNS"],
  "基隆路二段 145 號 10 樓":["10F, No.145, Sec.2, Keelung Rd.","基隆路二段145号10階"],
  "基隆路一段 398 號 4 樓":["4F, No.398, Sec.1, Keelung Rd.","基隆路一段398号4階"],
  "請選擇據點":["Select a Venue","拠点を選択"],
  "怎麼稱呼您":["Your Name","お名前"],
  "聯絡電話":["Phone","電話番号"],
  "E-mail":["E-mail","メール"],
  "諮詢項目":["Interested In","ご相談内容"],
  "問題諮詢或意見反應":["Questions or Feedback","ご質問・ご意見"],
  "請選擇…":["Please select…","選択してください…"],
  "先生":["Mr.","男性"],
  "女士":["Ms.","女性"],
  "您的姓名":["Your name","お名前"],
  "辦公室":["Office","オフィス"],
  "其他":["Other","その他"],
  "請輸入您的需求…":["Tell us what you need…","ご要望をご記入ください…"],
  "個人資料蒐集同意聲明":["Personal Data Consent Statement","個人情報取得同意書"],
  "送出諮詢　SUBMIT":["Submit　SUBMIT","送信　SUBMIT"],
  "開啟選單":["Open menu","メニューを開く"],
  "查看更多評價 ▾":["Show more reviews ▾","口コミをもっと見る ▾"],
  "位於台北信義區黃金地段的小坪數共享辦公空間，為您的事業提供彈性、優質的工作場域。":["A compact shared office space in the prime Xinyi district of Taipei, offering flexible, high-quality workspace for your business.","台北・信義区の一等地にある小規模シェアオフィス。柔軟で質の高いワークスペースを事業のためにご提供します。"],
  "信義館｜基隆路二段 145 號 10 樓":["Xinyi｜10F, No.145, Sec.2, Keelung Rd.","信義館｜基隆路二段145号10階"],
  "世貿館｜基隆路一段 398 號 4 樓":["WTC｜4F, No.398, Sec.1, Keelung Rd.","世貿館｜基隆路一段398号4階"],
  "隱私權政策":["Privacy Policy","プライバシーポリシー"],
  "交通位置・歡迎蒞臨參觀":["Location & Access","アクセス・ご来館を歓迎します"],
  "台北市信義區基隆路二段 145 號 10 樓・近捷運六張犁站":["10F, No.145, Sec.2, Keelung Rd., Xinyi, Taipei · Near Liuzhangli MRT","台北市信義区基隆路二段145号10階・MRT六張犁駅近く"],
  "台北市信義區基隆路一段 398 號 4 樓・近捷運台北 101／世貿站":["4F, No.398, Sec.1, Keelung Rd., Xinyi, Taipei · Near Taipei 101 / WTC MRT","台北市信義区基隆路一段398号4階・MRT台北101／世貿駅近く"],
  "📍 開啟 Google 導航 →":["📍 Open in Google Maps →","📍 Googleマップで開く →"],
  "即時訊息通知":["Instant Notifications","リアルタイム通知"],
  "郵件包裹到件、訪客來訪，透過 LINE 即時通知，人不在也安心掌握。":["Get instant LINE alerts when mail, parcels or visitors arrive — stay in control even when you’re away.","郵便・荷物の到着や来客を、LINEでリアルタイムにお知らせ。不在でも安心して把握できます。"],
  "彈性方案調整":["Flexible Plans","柔軟なプラン変更"],
  "從共享座位到獨立辦公室，隨團隊規模升降級，不被長約綁死。":["Scale from a co-working seat to a private office as your team grows or shrinks — no long-term lock-in.","コワーキング席から個室オフィスまで、チーム規模に応じて変更可能。長期契約に縛られません。"],
  "會晤與接待空間":["Meeting & Reception","商談・接客スペース"],
  "需要體面地接待客戶？專為辦公而設的環境，比咖啡廳更專業、更不受打擾。":["Need to host clients professionally? A purpose-built office environment — more professional and undisturbed than a café.","クライアントをきちんとお迎えしたい時に。オフィス専用の環境で、カフェより専門的で邪魔が入りません。"],
  "＊ 以上服務內容可依您的實際需求洽詢調整。":["* The services above can be tailored to your actual needs.","※上記の内容はご要望に応じて調整可能です。"],
  "＊ 標示「請洽專員」之項目，由配合的專業夥伴依公司規模與個案報價；歡迎洽詢，辰星一站式為您安排。":["* Items marked ‘By Quote’ are priced by our partner professionals based on company size and case. Please inquire — Morning Stars arranges it all in one stop.","※「お見積り」と記載の項目は、提携専門家が会社規模や案件に応じてお見積りします。お気軽にお問い合わせください。辰星がワンストップで手配します。"],
  "在地嚮導":["Local Guide","ローカルガイド"],
  "世貿館・2個月前":["WTC · 2 months ago","世貿館・2か月前"],
  "信義館・1年前":["Xinyi · 1 year ago","信義館・1年前"],
  "信義館・1個月前":["Xinyi · 1 month ago","信義館・1か月前"],
  "地點很方便，靠近 101 站，交通非常便利。工作空間舒適、安靜，很適合小團隊，整體環境讓人感覺很自在、很有生產力。有任何需求，工作人員都會積極協助解決，是一間很貼心、服務很周到的商務中心。":["A very convenient location near the Taipei 101 MRT station. The workspace is comfortable and quiet — great for small teams, relaxing and productive. The staff actively help with any need; a thoughtful, attentive business center.","台北101駅の近くでとても便利な立地。仕事空間は快適で静か、小規模チームに最適で、居心地よく生産的です。どんな要望にもスタッフが積極的に対応してくれる、心配りの行き届いたビジネスセンターです。"],
  "鄰近捷運交通方便，室內採光佳而且環境整潔。工作人員口齒清晰邏輯也好，在對話中都不會有任何冗長緩詢，如果是新鮮創業人士可以來嘗試體驗看看。":["Close to the MRT and easy to reach, with great natural light and a tidy interior. The staff are articulate and clear; if you’re a new entrepreneur, it’s worth trying.","MRTに近く交通便利で、室内は採光が良く清潔です。スタッフは説明が明快で分かりやすく、これから起業する方は一度体験してみる価値があります。"],
  "解說人員很溫柔又很專業，詢問過很多間，這裡服務態度最優秀，推推推。":["The staff were gentle and professional. I asked at many places, and the service here is the best — highly recommend!","案内スタッフは優しくとてもプロフェッショナル。何件も問い合わせましたが、ここの接客が一番です。おすすめ！"],
  "離捷運站很近，工作人員服務很好，環境也很乾淨舒適~~":["Very close to the MRT, great service from the staff, and a clean, comfortable environment ~~","MRT駅からとても近く、スタッフの対応も良く、環境も清潔で快適です〜〜"],
  "地理位置優越、交通便利，工作氛圍也非常棒，是個充滿正能量的辦公空間。":["Excellent location and convenient transport, with a wonderful working atmosphere — a positive, energizing office space.","立地に優れアクセスも便利。仕事の雰囲気も素晴らしく、ポジティブなエネルギーに満ちたオフィス空間です。"],
  "地點好，空間又舒適。":["Great location and comfortable space.","立地が良く、空間も快適です。"],
  "辰星商務人員服務很好，和善又細心解說，環境很乾淨舒適。":["The Morning Stars staff offer great service — friendly and attentive explanations, with a clean, comfortable environment.","辰星のスタッフは対応が良く、親切で丁寧に説明してくれます。環境も清潔で快適です。"],
  "瀏覽所有最新貼文 →":["Browse all posts →","すべての記事を見る →"],
  "同意「":["I agree to the ","「"],
  "返回場館":["Back to Venues","拠点へ戻る"],
  "信義館 ｜ 近捷運六張犁站辦公室":["Xinyi Branch ｜ Office near Liuzhangli MRT","信義館｜MRT六張犁駅近くのオフィス"],
  "台北市信義區基隆路二段 145 號 10 樓":["10F, No.145, Sec.2, Keelung Rd., Xinyi Dist., Taipei","台北市信義区基隆路二段145号10階"],
  "交通方式":["Getting Here","アクセス"],
  "捷運六張犁站（步行 6 分鐘）":["Liuzhangli MRT (6-min walk)","MRT六張犁駅（徒歩6分）"],
  "公車喬治商職站（基隆路幹線、1、207、254、282、284、292、611、758、935、950、1551）":["Bus: George Vocational School stop (Keelung Rd. Trunk; 1, 207, 254, 282, 284, 292, 611, 758, 935, 950, 1551)","バス：喬治商職停（基隆路幹線、1、207、254、282、284、292、611、758、935、950、1551）"],
  "停車指南":["Parking","駐車案内"],
  "本棟地下 B1：洪橋大樓機械式停車場，月租 4,000 起（洽管理員）":["Basement B1: Hongqiao Bldg. mechanical parking, from NT$4,000/mo (ask management)","地下B1：洪橋ビル機械式駐車場、月額4,000〜（管理員へお問い合わせ）"],
  "步行 2 分鐘：俥亭基隆路戶外停車場、USPACE 台哥大電信大樓地下停車場":["2-min walk: Cheting Keelung Rd. outdoor lot; USPACE Taiwan Mobile Bldg. basement lot","徒歩2分：俥亭基隆路屋外駐車場、USPACE 台湾大哥大ビル地下駐車場"],
  "附近多處步行 6 分鐘內可達的停車選擇":["Several more parking options within a 6-min walk","徒歩6分以内に複数の駐車場あり"],
  "在地圖上開啟 →":["Open in Maps →","地図で開く →"],
  "世貿館 ｜ 近台北101世貿站辦公室":["WTC Branch ｜ Office near Taipei 101 / WTC MRT","世貿館｜MRT台北101／世貿駅近くのオフィス"],
  "台北市信義區基隆路一段 398 號 4 樓":["4F, No.398, Sec.1, Keelung Rd., Xinyi Dist., Taipei","台北市信義区基隆路一段398号4階"],
  "捷運台北 101／世貿站（步行 5 分鐘）":["Taipei 101 / WTC MRT (5-min walk)","MRT台北101／世貿駅（徒歩5分）"],
  "公車世貿中心（基隆路）站（284、292、611、950、基隆路幹線）":["Bus: WTC (Keelung Rd.) stop (284, 292, 611, 950, Keelung Rd. Trunk)","バス：世貿中心（基隆路）停（284、292、611、950、基隆路幹線）"],
  "本棟地下 B1：國際世貿大樓機械式停車場，月租另洽":["Basement B1: International Trade Bldg. mechanical parking, monthly rate on request","地下B1：国際世貿ビル機械式駐車場、月額は要相談"],
  "步行 10 分鐘：嘟嘟房世貿站、愛馬屋 101 場、CITY PARKING 台北信基大樓站":["10-min walk: Dudu Fang WTC, Aimawu 101, CITY PARKING Xinji Bldg.","徒歩10分：嘟嘟房世貿、愛馬屋101、CITY PARKING 台北信基ビル"],
  "暖":["Warm","暖色"],
  "暗":["Dark","ダーク"],
  "白":["Light","ライト"],
  /* ── 服務頁共用 & 借址登記 virtual-office ── */
  "費用":["Pricing","料金"],
  "首頁":["Home","ホーム"],
  "據點":["Locations","拠点"],
  "平日 10:00–17:00":["Weekdays 10:00–17:00","平日 10:00–17:00"],
  "借址登記・虛擬辦公室":["Virtual Office · Registered Address","バーチャルオフィス・住所登記"],
  "台北信義區的公司登記地址":["A Company Registration Address in Xinyi, Taipei","台北・信義区の会社登記住所"],
  "／ 借址登記・虛擬辦公室":[" / Virtual Office · Registered Address"," / バーチャルオフィス・住所登記"],
  "公司成立、營運上暫時無需實體辦公室？辰星提供位於台北信義區黃金地段的借址登記服務，地址符合專業形象，含郵件代收與記帳士配合，讓您用最低成本擁有一個體面的公司門面。":["Starting a company but don’t yet need a physical office? Morning Stars offers a registered business address in the prime Xinyi district of Taipei — a professional image with mail handling and partner bookkeeping, giving your company a respectable face at minimal cost.","会社設立後、当面は実オフィスが不要ですか？辰星は台北・信義区の一等地に住所登記サービスをご提供。プロフェッショナルな住所に郵便受付と提携記帳士のサポートを含み、最小限のコストで立派な会社の顔を実現します。"],
  "所謂「借址登記」，就是將公司行號的工商登記地址設於辰星，無需承租整間實體辦公室，即可合法完成公司設立與營業登記。":["A “registered address” means using Morning Stars as your company’s official business-registration address — legally completing company formation and business registration without renting an entire physical office.","「住所登記」とは、会社の商業登記住所を辰星に置くこと。実オフィスを丸ごと借りずに、合法的に会社設立と営業登記を完了できます。"],
  "對許多初創團隊、自由工作者、SOHO 族與電商賣家而言，事業初期最需要的不是一間昂貴的辦公室，而是一個":["For many startups, freelancers, home-based workers and e-commerce sellers, what matters most early on is not an expensive office, but ","多くのスタートアップ、フリーランス、SOHO、EC事業者にとって、創業初期に最も必要なのは高価なオフィスではなく、"],
  "能登記、能收信、形象專業":["a registrable, mail-receiving, professional","登記でき、郵便を受け取れ、印象もプロフェッショナルな"],
  "的地址。辰星位於台北市信義區基隆路，鄰近捷運六張犁站與台北 101／世貿站，是名片與官網上一看就放心的黃金地段門面。":[" address. Morning Stars is on Keelung Rd. in Xinyi, Taipei, near Liuzhangli MRT and Taipei 101 / WTC MRT — a prime-location front that looks reassuring on your business card and website.","住所です。辰星は台北・信義区の基隆路にあり、MRT六張犁駅と台北101／世貿駅に近接。名刺や公式サイトに載せても安心の一等地の門構えです。"],
  "借址登記適合誰？":["Who is the virtual office for?","住所登記はどんな方に？"],
  "剛成立公司、想用信義區地址提升專業形象的創業者":["Founders who just started a company and want a Xinyi address to boost their professional image","会社を設立したばかりで、信義区の住所でプロの印象を高めたい起業家"],
  "在家工作、不想用住家地址做公司登記的 SOHO 與自由工作者":["Home-based SOHO workers and freelancers who don’t want to register with their home address","在宅勤務で、自宅住所で会社登記したくないSOHO・フリーランス"],
  "電商、網路品牌、顧問與接案工作室等無需實體門市的事業":["E-commerce, online brands, consultants and freelance studios that don’t need a physical storefront","EC、ネットブランド、コンサル、受託スタジオなど実店舗が不要な事業"],
  "外縣市或海外公司，需要一個台北據點收受公文與郵件":["Out-of-town or overseas companies needing a Taipei base to receive official documents and mail","地方・海外の企業で、公文書や郵便を受け取る台北拠点が必要な方"],
  "服務內容":["What’s Included","サービス内容"],
  "合法登記地址":["Legal Registered Address","合法な登記住所"],
  "：提供台北信義區地址供公司、行號工商登記與營業登記使用。":[": A Taipei Xinyi address for company and business registration.","：台北・信義区の住所を会社・事業の商業登記および営業登記にご利用いただけます。"],
  "郵件包裹代收":["Mail & Parcel Handling","郵便・荷物の受取代行"],
  "：代收郵件、包裹、快遞與政府公文，透過 LINE 即時通知處理情形。":[": We receive mail, parcels, couriers and government documents, with real-time LINE notifications.","：郵便・荷物・宅配・公文書を代理受領し、LINEでリアルタイムにご連絡します。"],
  "記帳士配合":["Partner Bookkeeper","記帳士の連携"],
  "：合作專業記帳士，協助公司設立、變更登記、每月記帳與報稅。":[": Working with professional bookkeepers for company formation, change registration, monthly bookkeeping and tax filing.","：専門の記帳士と連携し、会社設立・変更登記・毎月の記帳と税務申告をサポート。"],
  "彈性升級":["Flexible Upgrade","柔軟なアップグレード"],
  "：日後需要實體空間時，可無痛升級為共享座位或獨立辦公室。":[": When you later need physical space, upgrade smoothly to a co-working seat or private office.","：将来実スペースが必要になれば、コワーキング席や個室オフィスへスムーズに移行できます。"],
  "會議空間支援":["Meeting Space Support","会議スペースの利用"],
  "：需與客戶會晤時，可預約租用會議室，比咖啡廳更專業、更不受打擾。":[": Book a meeting room to host clients — more professional and undisturbed than a café.","：来客時は会議室を予約可能。カフェより専門的で邪魔が入りません。"],
  "含工商登記地址、郵件代收與 LINE 即時通知，可搭配記帳士辦理公司設立與記帳。":["Includes a business-registration address, mail handling and real-time LINE notifications; pair with a bookkeeper for company formation and accounting.","商業登記住所、郵便受付、LINEリアルタイム通知を含み、記帳士と組み合わせて会社設立や記帳にも対応。"],
  "需要實體空間？":["Need physical space?","実スペースが必要ですか？"],
  "事業成長後可彈性升級，從共享座位（月租 4,500 元起）到 1–6 人獨立辦公室（月租 10,000 元起）。":["Upgrade flexibly as your business grows — from a co-working seat (from NT$4,500/mo) to a 1–6 person private office (from NT$10,000/mo).","事業の成長に合わせて柔軟にアップグレード。コワーキング席（月額4,500〜）から1〜6名の個室オフィス（月額10,000〜）まで。"],
  "看獨立辦公室 →":["See Private Offices →","個室オフィスを見る →"],
  "＊ 實際方案內容可依您的需求洽詢調整，歡迎來電 0903-368-856 或加 LINE @mstars 諮詢。":["* Plans can be tailored to your needs — call 0903-368-856 or add LINE @mstars to inquire.","※プラン内容はご要望に応じて調整可能です。0903-368-856 またはLINE @mstars までお問い合わせください。"],
  "借址登記可以用來做公司工商登記嗎？":["Can a registered address be used for company registration?","住所登記は会社の商業登記に使えますか？"],
  "可以。辰星提供位於台北信義區的合法登記地址，可供公司行號辦理工商登記、營業登記之用，地址位於黃金地段、符合專業形象。":["Yes. Morning Stars provides a legal registered address in Xinyi, Taipei for company and business registration — in a prime location with a professional image.","はい。辰星は台北・信義区の合法な登記住所をご提供し、会社・事業の商業登記や営業登記に利用可能。一等地でプロフェッショナルな印象です。"],
  "借址登記費用怎麼計算？":["How is the fee calculated?","料金はどのように計算されますか？"],
  "採年繳制，NT$18,000 元起，平均每月約 1,500 元，已包含郵件代收與通知服務，無需額外費用。":["Billed annually from NT$18,000 (about NT$1,500/month), including mail handling and notifications — no extra charges.","年払い制でNT$18,000〜（月あたり約1,500）。郵便受付と通知サービスを含み、追加費用はかかりません。"],
  "借址登記有提供郵件代收嗎？":["Does it include mail handling?","郵便の受取代行はありますか？"],
  "有。辰星會代收您的郵件、包裹與快遞，並透過 LINE 即時通知，您可選擇親自領取或約定轉寄。":["Yes. We receive your mail, parcels and couriers and notify you in real time via LINE; you can pick up in person or arrange forwarding.","はい。郵便・荷物・宅配を代理受領し、LINEでリアルタイムにご連絡。直接受取または転送のご指定が可能です。"],
  "可以協助公司設立與記帳嗎？":["Can you help with company formation and accounting?","会社設立や記帳のサポートはありますか？"],
  "可以。辰星配合專業記帳士，協助公司設立、變更登記與每月記帳報稅流程，讓初創事業少走冤枉路。":["Yes. Morning Stars works with professional bookkeepers to assist with company formation, change registration and monthly bookkeeping and tax filing — helping startups avoid detours.","はい。辰星は専門の記帳士と連携し、会社設立・変更登記・毎月の記帳と税務申告をサポート。スタートアップの遠回りを防ぎます。"],
  "其他服務":["Other Services","その他のサービス"],
  "會議室租借 →":["Meeting Room Rental →","会議室レンタル →"],
  "獨立辦公室出租 →":["Private Office Rental →","個室オフィス →"],
  "兩處據點介紹 →":["About Our Venues →","拠点紹介 →"],
  "最新貼文 →":["Journal →","お知らせ →"],
  "用信義區地址，為事業開一個好頭":["Give your business a strong start with a Xinyi address","信義区の住所で、事業に良いスタートを"],
  "歡迎來電或線上諮詢，我們將為您說明借址登記與公司設立流程。":["Call or message us — we’ll walk you through the registered-address and company-formation process.","お電話・オンラインでお気軽にご相談ください。住所登記と会社設立の流れをご説明します。"],
  "線上諮詢":["Online Inquiry","オンライン相談"],
  "致電 0903-368-856":["Call 0903-368-856","0903-368-856 へ電話"]
  };

  /* ---- 引擎 ---- */
  var idx={en:0,ja:1};
  var items=[];
  function reg(node,type,attr,zh){items.push({node:node,type:type,attr:attr,zh:zh,key:zh.trim()});}
  function collect(){
    var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,null,false),n;
    while(n=w.nextNode()){
      var p=n.parentNode; if(!p) continue;
      if(p.closest&&p.closest('script,style,noscript')) continue;
      var z=n.nodeValue; if(z&&z.trim()&&T[z.trim()]) reg(n,'text',null,z);
    }
    ['placeholder','aria-label','title','alt'].forEach(function(a){
      Array.prototype.forEach.call(document.querySelectorAll('['+a+']'),function(el){
        var v=el.getAttribute(a); if(v&&T[v.trim()]) reg(el,'attr',a,v);
      });
    });
  }
  function apply(lang){
    for(var i=0;i<items.length;i++){
      var it=items[i];
      var tr = lang==='zh' ? it.key : (T[it.key]?T[it.key][idx[lang]]:null);
      if(tr==null) tr=it.key;
      var val=it.zh.replace(it.key,tr);
      if(it.type==='text') it.node.nodeValue=val; else it.node.setAttribute(it.attr,val);
    }
    document.documentElement.lang = lang==='zh'?'zh-Hant':lang;
    try{localStorage.setItem('ms_lang',lang);}catch(e){}
    var a=document.querySelectorAll('.langsw a');
    for(var j=0;j<a.length;j++) a[j].className=(a[j].getAttribute('data-l')===lang?'cur':'');
    var lm=document.getElementById('langMenu'); if(lm) lm.classList.remove('open');
  }
  window.setLang=function(l){apply(l);};
  window.toggleLangMenu=function(e){if(e)e.stopPropagation();var m=document.getElementById('langMenu');if(m)m.classList.toggle('open');};
  document.addEventListener('click',function(e){var m=document.getElementById('langMenu');if(m&&e.target.closest&&!e.target.closest('.langsw'))m.classList.remove('open');});
  function init(){collect();var s='zh';try{s=localStorage.getItem('ms_lang')||'zh';}catch(e){}apply(s);}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();

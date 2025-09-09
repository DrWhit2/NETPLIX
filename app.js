/* ==================
   app.js — 홈/시리즈 + 모달 + 회차
   ========================= */

/* ===== 경로/로더 유틸 (확장자 자동 탐색) ===== */
const IMG_BASE = "images/";
const EXT_CANDIDATES = [".png", ".jpg", ".jpeg", ".webp"];

const posterUrl = f => IMG_BASE + f; // 기본 포스터는 그대로 사용

function backdropCandidates(file){
  // "1.png" -> ["images/1_bg.png", "images/1_bg.jpg", ...]
  const base = file.replace(/(\.[a-z0-9]+)$/i, "");
  return EXT_CANDIDATES.map(ext => `${IMG_BASE}${base}_bg${ext}`);
}
function episodeThumbCandidates(itemFile, no){
  // "1.png" + 2 -> ["images/1_ep2.png", "images/1_ep2.jpg", ...]
  const base = itemFile.replace(/(\.[a-z0-9]+)$/i, "");
  return EXT_CANDIDATES.map(ext => `${IMG_BASE}${base}_ep${no}${ext}`);
}
function tryLoad(url){
  return new Promise((res, rej)=>{
    const im = new Image();
    im.onload = ()=>res(url);
    im.onerror= ()=>rej(url);
    im.src = url;
  });
}
// <img>에 여러 후보 중 첫 번째로 성공하는 이미지를 넣음.
// fallbackUrl이 있으면 후보가 전부 실패할 때 그걸로 넣음.
async function preloadAndSwap(imgEl, candidates, fallbackUrl=null){
  if(!imgEl) return;
  imgEl.style.opacity = "0";
  const list = Array.isArray(candidates) ? candidates : [candidates];
  for(const url of list){
    try{
      const ok = await tryLoad(url);
      imgEl.src = ok;
      requestAnimationFrame(()=> imgEl.style.opacity = "1");
      return;
    }catch(_){ /* try next */ }
  }
  if(fallbackUrl){
    imgEl.src = fallbackUrl;
    imgEl.style.opacity = "1";
  }
}

/* ====== 영화 데이터 ====== */
const MOVIES = [
  { title:"이퀄스", file:"a.png", match:92, year:2015, age:"15+", cast:["니콜라스 홀트","크리스틴 스튜어트"], genres:["SF","로맨스"], tags:["디스토피아","금지된 사랑"], overview:"모든 감정이 통제되고, 사랑이 범죄가 된 감정통제구역. 어느 날 동료의 죽음을 목격한 사일러스는 현장에서 니아의 미묘한 표정 변화를 보고 그녀가 감정보균자임을 알게 된다. 이에 사일러스는 생전 처음으로 낯선 감정을 느끼고 감정 억제 치료를 받지만, 그녀를 향한 마음은 점점 커져만 간다." },
  { title:"Us", file:"b.png", match:93, year:2019, age:"15+", cast:["루피타 뇽오","윈스턴 듀크"], genres:["호러","스릴러"], tags:["도플갱어","사회 풍자"], overview:"해변가로 휴가를 떠난 윌슨 가족 앞에 자기들과 똑같이 생긴 ‘도플갱어’ 가족이 나타난다. 자신과 똑 닮은 존재들의 침입과 폭력이 이어지며, 애들레이드는 묻어둔 과거의 진실과 마주하게 된다." },
  { title:"퍼펙트 블루", file:"d.png", match:97, year:1997, age:18, cast:["이와마 사키","마츠모토 코헤이"], genres:["애니메이션","스릴러"], tags:["심리","호러"], overview:"아이돌을 그만두고 배우로 전향한 ‘미마’에게 또 하나의 자신, 미마가 나타난다. 미마는 결국 미쳐버린 것일까? 아니면 꿈일까? 세간을 떠들썩하게 한 연속살인 사건의 범인은 자신인 것일까? 애초에 '자신'은 누구일까? 미마는 점점 정체성을 잃어가게 되는데..." },
  { title:"향수", file:"e.png", match:94, year:2006, age:18, cast:["벤 위쇼","알란 릭맨"], genres:["스릴러","드라마"], tags:["집착","범죄"], overview:"18세기 프랑스에 비상한 아이가 태어난다. 후각이 극도로 발달해 냄새만으로 사물을 구별하는 아이. 어느덧 청년으로 자란 그는 최고의 향수 제조사를 찾아가 사사를 청한다. 그의 목표는 하나. 매혹적인 향기를 영원히, 완벽하게 소유하는 것." },
  { title:"블랙 스완", file:"h.png", match:95, year:2010, age:18, cast:["나탈리 포트만","밀라 쿠니스"], genres:["드라마","스릴러"], tags:["예술","심리"], overview:"“나는 완벽했어요.” 새롭게 해석된 [백조의 호수] 공연에서 순수하고 가녀린 백조와 관능적이고 도발적인 흑조, 1인 2역을 완벽하게 해내고 싶은 그녀의 욕망은 어느새 집착에 가깝게 변질되어가는데…" },
  { title:"양들의 침묵", file:"j.png", match:99, year:1991, age:18, cast:["조디 포스터","안소니 홉킨스"], genres:["스릴러","범죄"], tags:["심리전","명작"], overview:"FBI 수습요원 ‘클라리스’는 연쇄살인마를 잡기 위해 수감 중인 범죄 심리학자 ‘한니발 렉터’에게 도움을 청한다. 렉터의 심리전 속에서 단서를 맞춰 나가며 클라리스는 범죄자와 자신 내면의 트라우마를 동시에 마주한다." },
  { title:"A.I.", file:"k.png", match:89, year:2001, age:"12+", cast:["헤일리 조엘 오스먼트","주드 로"], genres:["SF","드라마"], tags:["휴머니즘","미래"], overview:"가까운 미래, 감정을 느끼도록 설계된 인조 소년 데이비드가 인간 부부의 집에 입양된다. 그는 ‘엄마’의 사랑을 되찾기 위한 여정을 떠나며 인간성과 사랑의 의미를 묻는다." },
  { title:"터스크", file:"m.png", match:84, year:2014, age:18, cast:["저스틴 롱","마이클 파크스"], genres:["호러"], tags:["기괴","블랙코미디"], overview:"팟캐스터 월레스는 취재차 캐나다에 갔다가, 기묘한 전단을 따라 외딴 집의 노인 하워드를 찾아간다. 하워드는 매혹적인 항해담으로 월레스를 방심시킨 뒤 감금하고, 과거의 집착을 투사해 그를 ‘바다코끼리’로 개조하려는 광기 어린 수술을 시작한다." },
  { title:"숨바꼭질", file:"n.png", match:85, year:2005, age:"15+", cast:["로버트 드 니로","다코타 패닝"], genres:["스릴러"], tags:["가족","심리"], overview:"우리 집에 나 말고 다른 사람이 살고 있다! 형의 아파트를 뒤로한 채 자신의 안락한 집으로 돌아온 그 날, ‘성수’는 형의 아파트에서 봤던 암호가 자신의 집 초인종 옆에서 새겨진 것을 발견한다. 아파트의 암호를 찬찬히 살펴보던 그는 그것이 집에 사는 사람의 성별과 수를 뜻하는 것을 알게 된다." },
  { title:"오펀: 천사의 아이", file:"o.png", match:86, year:2009, age:"15+", cast:["베라 파미가","이사벨 퍼만"], genres:["호러","스릴러"], tags:["충격 반전"], overview:"입양을 결심한 케이트와 존은 고아원에서 성숙하고 예의 바른 아홉 살 소녀 에스더를 데려온다. 하지만 집에 온 뒤로 사고와 불행이 잇따르며, 케이트는 아이의 말과 행동에서 설명하기 힘든 불길함을 감지한다." },
  { title:"비바리움", file:"p.png", match:87, year:2019, age:"15+", cast:["이모겐 푸츠","제시 아이젠버그"], genres:["SF","스릴러"], tags:["디스토피아","폐쇄공간"], overview:"집을 보러 간 커플은 모든 집이 똑같은 미로 같은 신도시에 갇힌다. 어떤 방향으로 향해도 집 앞에 다다르는 이 네모반듯한 곳에서 다른 선택지는 없다, 오직 살아갈 뿐! 탈출이 불가능한 상황에서 둘은 정체불명의 아이까지 키우게 되며, 일상은 점차 괴랄하게 변해 간다." },
  { title:"엑스 마키나", file:"q.png", match:95, year:2014, age:18, cast:["알리시아 비칸데르","도널 글리슨"], genres:["SF","스릴러"], tags:["AI","철학"], overview:"거대 기업의 개발자 네이든은 직원 칼렙에게 여성형 AI ‘에이바’의 테스트를 맡긴다. 둘은 그녀의 인격과 감정이 진짜인지 아니면 프로그래밍 된 것인 지를 밝히는 테스트를 진행하지만 아직은 모든 것이 의심스럽기만 하다." },
  { title:"케빈에 대하여", file:"r.png", match:88, year:2011, age:18, cast:["틸다 스윈튼","에즈라 밀러"], genres:["드라마","스릴러"], tags:["가족","비극"], overview:"악은 타고나는가, 길러지는가? 모성애는 과연 인간의 본성인가? 여행을 사랑하던 자유분방한 여성 에바는 아들 케빈을 낳은 뒤 삶이 송두리째 바뀐다. 케빈은 어린 시절부터 이유를 알 수 없는 적대심과 불안정한 기질을 드러내며, 모자 관계는 갈수록 파국으로 치닫게 되는데... " },
  { title:"써클", file:"s.png", match:83, year:2015, age:18, cast:["줄리 벤즈","카터 젠킨스"], genres:["SF","스릴러"], tags:["사회실험","심리"], overview:"당신에게는 생존할 가치가 있습니까? 어두운 방 안, 50명의 사람이 각자 빨간 원을 디딘 채로 서있다. 오로지 대화만이 허용된 이곳에서 이들은 2분마다 다수결로 죽을 사람을 투표로 선출해야 한다. 생존을 위한 설득과 논쟁, 차별과 도덕이 뒤엉킨 끝에 마지막 선택이 다가온다." },
  { title:"가타카", file:"t.png", match:94, year:1997, age:"15+", cast:["이선 호크","우마 서먼"], genres:["SF","드라마"], tags:["유전","운명"], overview:"타고난 유전적 성향이 사회에서의 지위를 결정하는 미래 사회. 자연 출생으로 태어난 빈센트는 열성 유전자로 인해 차별받으며, 우주 비행사의 꿈조차 허락되지 않는다. 그러나 그는 사고로 불구가 된 ‘완벽한 유전자’의 소유자 제롬의 신분을 빌려, 가타카 항공우주국에 입사한다. 정체가 발각될 위기 속에서도 빈센트는 끝내 자신의 의지와 노력만으로 별을 향한 길에 다가가며, 인간의 한계와 가능성을 증명한다." },
  { title:"Capsules", file:"u.png", match:88, year:2022, age:"15+", cast:["Dust"], genres:["단편","SF"], tags:["감성"], overview:"감정을 느끼기 위해 캡슐을 복용하는 세상. 한 쌍의 커플은 ‘사랑’ 캡슐을 함께 복용하며 서로의 마음을 확인한다. 그러나 시간이 흐르면서, 그들은 점차 캡슐의 약효가 희미해지고 있음을 깨닫게 되는데..." }
];

/* ====== 시리즈 ====== */
const SERIES = [
  { title:"Rabid Rabbit", file:"1.png", match:92, year:2015, age:"19+", genres:["좀아포, 하이틴"], overview:"금발의 치어리더 '아일리'는 과학자 '오스월드 화이트'를 납치해, 자신의 반려 토끼를 불사신으로 만들 것을 강요한다. 그리고 오스월드의 손끝에서 되살아난 토끼는 피투성이 좀비가 되어, 런던 교정을 시작으로 영국 전역을 파멸 속에 몰아넣는데..." },
  { title:"크레이브 엑스 - 오프 더 레코드 1", file:"2.png", match:90, year:2017, age:"15+", genres:["오프더레코드, 현실다큐"], overview:"〈크레이브 엑스〉 촬영 초반, 오스월드 역의 배우가 돌연 하차하며 제작팀은 패닉에 빠진다. 감독은 급히 스태프의 딸 이자벨을 투입해 “오스월드가 변장했다”는 억지 설정을 덧붙이는데... 과연 이 드라마는 무사히 방영될 수 있을까?" },
  { title:"크레이브 엑스 - 오프 더 레코드 2", file:"3.png", match:90, year:2025, age:"19+", genres:["현실다큐, 범죄기록"], overview:"〈크레이브 엑스〉 촬영은 막바지에 접어든다. 오스월드의 변장 설정에 대한 대중들의 반응은 싸늘하다. 결국 감독은 초대 오스월드 배우를 다시 찾으려 했으나, 돌아온 소식은 실종이라는 충격적인 답뿐. 그때 정체불명의 한 청년이 오스월드역 오디션에 나타난다. 완벽해 보이는 그의 연기 뒤로 현장은 알 수 없는 불길함에 휩싸인다." },
  { title:"멸망한 세계의 마지막 수신", file:"4.png", match:90, year:2503, age:"12+", genres:["감성, 다큐"], overview:"2503년, 인류는 소행성 충돌의 상처를 딛고 재건된 사회 속에서 살아가고 있다. 한 연구팀은 500년 전, 인류의 몰락기에 기록된 마지막 통신 신호를 복원하는 데 성공한다. 이 다큐멘터리는 그 통신 기록을 추적하며 지구와 우주에 고립된 두 인물이 나눈 최후의 교신을 재조명한다." },
  { title:"MARRIAGE NO 101", file:"5.png", match:90, year:2024, age:"12+", genres:["개그"], overview:"연구원 화이트는 재벌 사업가 대니와 100번의 결혼과 이혼 끝에 다시금 재혼을 노린다. 점차 기괴한 희극으로 번져가는 이야기 속에서 과연 그는 재혼에 성공할 수 있을까?" }
];

/* ===== 공통 유틸 ===== */
const normalize = s => s.toLowerCase().replace(/\s+/g,'').replace(/[.\u3002]/g,''); 
const TITLE_ALIAS = { "어스": "Us" };
const pickByTitles = (all, titles) => {
  const wanted = new Set(titles.map(t => normalize(TITLE_ALIAS[t] || t)));
  return all.filter(m => wanted.has(normalize(m.title)));
};

const MY_TITLES   = ["이퀄스","Capsules","엑스 마키나","가타카","A.I."];
const RECS_TITLES = ["Us","퍼펙트 블루","향수","양들의 침묵","블랙 스완"];
const EXCLUDE_TRENDING = new Set([ normalize("숨바꼭질") ]);

/* ===== DOM ===== */
const $ = (s,r=document)=>r.querySelector(s);
const profileScreen = $("#profile-screen");
const homeView = $("#home-view");
const seriesView = $("#series-view");
const banner = $(".nf-banner");
const bannerTitle = $("#banner-title");
const bannerOverview = $("#banner-overview");
const bannerMatch = $("#banner-match");
const bannerYear  = $("#banner-year");
const bannerAge   = $("#banner-age");
const bannerInfoBtn = $("#banner-info");
const bannerPlayBtn = $("#banner-play");
const rowTrending=$("#row-trending"), rowTop=$("#row-top"), rowSf=$("#row-sf");
const seriesGrid=$("#series-grid");

const overlay=$("#overlay"),
      modalClose=$("#modal-close"),
      modalTitle=$("#modal-title"),
      modalOverview=$("#modal-overview"),
      modalBackdrop=$("#modal-backdrop"),
      modalMatch=$("#modal-match"),
      modalYear=$("#modal-year"),
      modalAge=$("#modal-age"),
      modalCast=$("#modal-cast"),
      modalGenres=$("#modal-genres"),
      modalTags=$("#modal-tags");

/* ===== helper ===== */
function card(m, opts={}){
  const btn=document.createElement("button");
  btn.className="card"; btn.type="button"; btn.title=m.title;
  btn.setAttribute("aria-label", `${m.title} 상세 보기`);
  btn.innerHTML=`<img src="${posterUrl(m.file)}" alt="${m.title} 포스터" loading="lazy" decoding="async">`;
  btn.onclick=()=>openModal(m, { fromSeries: !!opts.fromSeries });
  return btn;
}
function renderRow(container, items, opts={}){
  if(!container) return;
  container.innerHTML=""; items.forEach(m=>container.appendChild(card(m, opts)));
}

/* ===== 배너 ===== */
function renderBanner(){
  const eq = MOVIES.find(x => normalize(x.title)===normalize("이퀄스")) || MOVIES[0];
  const poster = posterUrl(eq.file);
  const bgCandidates = backdropCandidates(eq.file);

  (async ()=>{
    let set = false;
    for(const url of bgCandidates){
      try{ await tryLoad(url); banner.style.backgroundImage = `url(${url})`; set = true; break; }catch(_){}
    }
    if(!set) banner.style.backgroundImage = `url(${poster})`;
  })();

  bannerTitle.textContent = eq.title;
  bannerOverview.textContent = eq.overview;
  bannerMatch.textContent = `${eq.match}% 일치`;
  bannerYear.textContent  = eq.year;
  bannerAge.textContent   = eq.age;

  bannerInfoBtn?.addEventListener("click", ()=>openModal(eq,{fromSeries:false}));
  bannerPlayBtn?.addEventListener("click", ()=>openModal(eq,{fromSeries:false}));
}

/* ===== 별점(고정) ===== */
const RATING_RAW = {
  "터스크": 1,"숨바꼭질": 3,"오펀: 천사의 아이": 3,"비바리움": 2,"케빈에 대하여": 4,
  "이퀄스": 2,"A.I.": 4,"엑스 마키나": 3,"가타카": 4,"Capsules": 2,
  "Us": 5,"퍼펙트 블루": 4,"향수": 5,"블랙 스완": 4,"양들의 침묵": 5,"써클":5
};
const _RATING = (()=>{ const m={}; for(const [k,v] of Object.entries(RATING_RAW)){ const alias = TITLE_ALIAS[k]||k; m[normalize(alias)] = v; } return m; })();
function getRatingFor(title){ return _RATING[normalize(title)] ?? 3; }
function makeRatingBar(title){
  const wrap=document.createElement("div"); wrap.className="rating";
  const stars=document.createElement("div"); stars.className="stars";
  const val=document.createElement("span"); val.className="rating-value";
  const rating=getRatingFor(title); const full=Math.floor(rating); const half=rating%1>=0.5;
  for(let i=1;i<=5;i++){
    const s=document.createElement("span"); s.className="star";
    s.textContent = i<=full ? "★" : (i===full+1 && half ? "★" : "☆");
    if(i<=full || (i===full+1 && half)) s.classList.add("is-on");
    stars.appendChild(s);
  }
  val.textContent=String(rating);
  wrap.appendChild(stars); wrap.appendChild(val);
  return wrap;
}

/* ===== 회차 ===== */
const EPISODES = {
  [normalize("Rabid Rabbit")]: [
    { no: 1, duration: "48분", desc: "치어리딩 연습이 끝난 저녁, 아일리에게 닥친 것은 뜻밖의 이별 통보였다. 남자친구는 차갑게 돌아서고, 아일리는 교정 한쪽에 홀로 남겨진다. 울적한 마음을 달래주는 건 언제나 그녀의 사랑스러운 반려토끼뿐이다." },
    { no: 2, duration: "51분", desc: "아일리는 반려 토끼를 불사신으로 만들고 싶다는 생각에, 괴짜 과학자로 소문난 오스월드 화이트를 납치한다. 그러나 오스월드 손에서 토끼는 좀비로 개조되어 버리고, 바이러스가 사람에게까지 전염되기 시작하며 런던 교정은 순식간에 아수라장이 된다." },
    { no: 3, duration: "49분", desc: "피로 시작된 공격은 빠르게 확산된다. 학생과 시민들이 감염되며, 런던 도심 전체가 공포에 잠긴다. 아일리는 자신이 불러온 재앙을 깨닫지만, 이미 늦었다는 것을 깨닫는다." },
  ],
  [normalize("크레이브 엑스 - 오프 더 레코드 1")]: [
    { no: 1, duration: "47분", desc: "촬영 개시 직후, 주연 배우가 돌연 하차한다. 제작진은 충격에 빠지고, 촬영장은 순식간에 혼란에 휩싸인다. 감독은 불가능에 가까운 선택을 내린다. 바로 스태프의 딸 이자벨을 투입해 “오스월드가 변장했다”는 설정을 억지로 끼워 넣는 것." },
    { no: 2, duration: "50분", desc: "이자벨만으로는 오스월드의 모든 분량을 소화하기 어렵다. 급기야 주변의 배우들이 돌아가며 오스월드의 대타로 나서기 시작한다. 현장의 스태프들은 이 급조한 변장 설정이 과연 시청자들에게 통할 수 있을지 의문을 품는다." },
    { no: 3, duration: "49분", desc: "방영이 이어질수록 대중의 반응은 싸늘해진다. 오스월드의 설정이 작위적이라는 비판이 쏟아지고, 시청률은 곤두박질친다. 내부 회의에서는 “초대 오스월드 배우를 다시 데려와야 한다”는 절박한 목소리가 커져만 간다." }
  ],
  [normalize("크레이브 엑스 - 오프 더 레코드 2")]: [
    { no: 1, duration: "53분", desc: "제작팀은 오스월드 역을 공개 오디션으로 전환한다. 26번째 순서에 등장한 건 정체불명의 신인배우 W(가명). W는 목소리와 표정, 분위기까지 오스월드와 놀라운 싱크로율을 보여주며, 결국 합격을 거머쥔다. 그러나 스태프들은 왜인지 설명할 수 없는 불길함에 사로잡힌다." },
    { no: 2, duration: "51분", desc: "W는 촬영이 끝난 순간에도 캐릭터의 말투와 행동을 흉내 내며, 예기치 못한 기행으로 동료 배우들을 기겁하게 만든다. 카메라는 그의 이상 행동들을 포착해 나간다." },
    { no: 3, duration: "52분", desc: "그가 오스월드를 모욕하는 것처럼 들리는 대본을 수정해달라고 항의한 것도 수차례. 그는 단순 오스월드 캐릭터의 광팬인 것일까?" },
    { no: 4, duration: "52분", desc: "제작진은 결국 신인 배우 W와의 계약을 파기하고 초대 배우의 복귀를 요청한다. 그러나 돌아온 답은 단 하나 — 초대배우가 실종됐다는 충격적인 소식뿐이다." },
    { no: 5, duration: "52분", desc: "돌연 경찰이 크레이브 엑스 촬영장에 들이닥친다. 검찰은 W를 초대 오스월드 배우 살해와 시신 유기 혐의로 기소했고, 갑작스러운 상황에 현장은 순식간에 아수라장이 된다." },
    { no: 6, duration: "54분", desc: " “오스월드 역”을 차지한 이 W라는 청년은 과연 누구이며, 그는 어떤 수법으로, 왜 초대 배우를 살해했는가. 드라마 제작기를 다루던 다큐멘터리는 법정 증언과 수사 기록을 토대로 범인의 실체를 파헤치는 프로그램으로 변모한다." }
  ],
  [normalize("멸망한 세계의 마지막 수신")]: [
    { no: 1, duration: "45분", desc: "500년 전, 소행성 충돌은 대기와 지각을 불태우며 수많은 생명을 앗아갔다. 극소수의 생존자들 속에서 한 젊은 통신 엔지니어는 인류의 종말을 직시한다. 동료들의 만류에도 불구하고 그는 버려진 지상 기지로 향해, 통신기를 다시 가동시키려 떠난다." },
    { no: 2, duration: "46분", desc: "수많은 시도 끝에 오스월드 화이트는 고장 난 지상 통신기를 복구하는 데 성공하고, 그의 신호는 끝없는 우주를 표류하던 대니 쉘비스에게 도달한다. 인류가 남긴 마지막 대화, 다섯 번의 문자로 이어지는 최후의 통신이 시작된다." },
    { no: 3, duration: "48분", desc: "대니 쉘비스가 마지막으로 남긴 암호 같은 문장은 무엇을 의미하는가. 단절된 시대를 넘어 복원된 이 짧은 신호 속에는 과연 어떤 의도와 희망이 담겨 있었을까. 과학자들과 언어학자들은 그 의미를 해석하며, 인류가 남긴 흔적을 추적한다." }
  ],
  [normalize("MARRIAGE NO 101")]: [
    { no: 1, duration: "44분", desc: "화이트는 대니와의 재혼을 노린다. 이유는 단 하나, 결혼을 통한 재산 분할과 연구 자금 확보. 그러나 이번만큼은 대니가 쉽게 넘어올 것 같지 않다." },
    { no: 2, duration: "45분", desc: "101번째 청혼. 화이트는 반짝이는 반지 대신 두툼한 사업계획서를 내밀지만 대니는 냉소적인 미소로 서류를 덮는다." },
    { no: 3, duration: "47분", desc: "연구 자금이 바닥나자 화이트는 점차 초조해지고, 결국 새로운 수단을 궁리한다. 대니가 좋아하던 연인을 흉내 내면서까지 그의 마음을 되잡으려 노력하지만 따라하는 말투와 몸짓은 어설프기 그지없다." },
    { no: 4, duration: "47분", desc: "모든 시도가 실패로 돌아간 뒤 자포자기한 화이트는 사업계획서도, 우스꽝스러운 연인 행세도 모두 내려놓는다. 이제 화이트에겐 더 이상 쓸만한 수단이 없다." },
    { no: 5, duration: "47분", desc: "화이트는 빈손으로, 그러나 처음으로 진심을 담아 대니를 붙잡아 본다. 이 고백으로 마침내 그는 101번째 재혼에 성공하며 둘에겐 평화가 찾아온다. 그러나 검은 메뚜기 건축물 사건이 터지며 두 사람의 관계는 다시 파국으로 돌아서는데... " }
  ]
};
function renderEpisodes(item, fromSeries){
  const box = document.getElementById("grid-episodes");
  if(!box) return;
  if(!fromSeries){ box.hidden=true; box.innerHTML=""; return; }
  const eps = EPISODES[normalize(item.title)] || [];
  if(!eps.length){ box.hidden=true; box.innerHTML=""; return; }

  const poster = posterUrl(item.file);
  box.hidden=false;
  box.innerHTML = `
    <h4 class="sec-title">회차 <span class="season-badge">시즌 1</span></h4>
    <ol class="episodes">
      ${eps.map(ep => `
        <li class="ep" data-no="${ep.no}">
          <div class="ep-no">${ep.no}</div>
          <img class="ep-thumb" src="${poster}" alt="${item.title} ${ep.no}화 썸네일">
          <div class="ep-body">
            <div class="ep-title"><strong>${ep.no}화</strong><span class="ep-meta">${ep.duration}</span></div>
            <p class="ep-desc">${ep.desc}</p>
          </div>
        </li>`).join("")}
    </ol>
  `;

  // 각 회차 이미지: 1_ep{no}.(png|jpg|jpeg|webp) 순으로 탐색, 실패 시 포스터 유지
  box.querySelectorAll(".ep").forEach(li=>{
    const no = parseInt(li.dataset.no,10);
    const img = li.querySelector(".ep-thumb");
    const candidates = episodeThumbCandidates(item.file, no);
    preloadAndSwap(img, candidates, poster);
  });
}

/* ===== 모달 열기/닫기 ===== */
let lastFocused=null;
function openModal(m,{fromSeries=false}={}){
  lastFocused=document.activeElement;

  // 배경: 다양한 확장자 시도, 실패 시 포스터
  preloadAndSwap(
    modalBackdrop,
    backdropCandidates(m.file),
    posterUrl(m.file)
  );

  modalTitle.textContent = m.title;
  modalMatch.textContent = `${m.match}% 일치`;
  modalYear.textContent  = m.year;
  modalAge.textContent   = m.age;
  modalOverview.textContent = m.overview;

  // 장르 표시
  modalGenres.textContent = (m.genres||[]).join(", ");

  if(fromSeries){
    // 시리즈: '장르'만 남기고 출연/특징 완전 숨김
    modalCast.textContent = "";
    modalCast.style.display = "none";
    document.querySelector(".dt-cast")?.classList.add("hidden");

    modalTags.textContent = "";
    modalTags.style.display = "none";
    document.querySelector(".dt-tags")?.classList.add("hidden");
  }else{
    // 영화(홈): 출연/특징 보이기
    modalCast.textContent = (m.cast||[]).join(", ");
    document.querySelector(".dt-cast")?.classList.remove("hidden");
    modalCast.style.display = "";

    modalTags.textContent = (m.tags||[]).join(", ");
    document.querySelector(".dt-tags")?.classList.remove("hidden");
    modalTags.style.display = "";
  }

  const topRow = document.getElementById("grid-top");
  if(topRow){ topRow.innerHTML = ""; topRow.hidden = !!fromSeries; if(!fromSeries) topRow.appendChild( makeRatingBar(m.title) ); }

  renderEpisodes(m, fromSeries);

  overlay.hidden=false;
  document.body.style.overflow="hidden";
  document.getElementById("modal-close")?.focus();
}
function closeModal(){
  overlay.hidden=true; document.body.style.overflow="";
  lastFocused && lastFocused.focus();
}
overlay?.addEventListener("click", e=>{ if(e.target===overlay) closeModal(); });
document.getElementById("modal-close")?.addEventListener("click", closeModal);
document.addEventListener("keydown", e=>{ if(e.key==="Escape" && !overlay.hidden) closeModal(); });

/* 렌더링 */
function renderHome(){
  renderBanner();
  const usedTitles = new Set(["이퀄스", ...MY_TITLES, ...RECS_TITLES]);
  const usedNorm = new Set(Array.from(usedTitles).map(t => normalize(t)));
  const mylist = pickByTitles(MOVIES, MY_TITLES);
  const recs   = pickByTitles(MOVIES, RECS_TITLES);
  let trending = MOVIES.filter(m => !usedNorm.has(normalize(m.title)));
  trending = trending.filter(m => !EXCLUDE_TRENDING.has(normalize(m.title)));
  renderRow(rowTrending, trending);
  renderRow(rowTop,      mylist);
  renderRow(rowSf,       recs);
}
function renderSeries(){
  const hero = SERIES[0];
  const sBanner = document.getElementById("series-banner");
  const tEl = document.getElementById("series-banner-title");
  const oEl = document.getElementById("series-banner-overview");
  const mEl = document.getElementById("series-banner-match");
  const yEl = document.getElementById("series-banner-year");
  const aEl = document.getElementById("series-banner-age");
  const play = document.getElementById("series-banner-play");
  const info = document.getElementById("series-banner-info");
  if (sBanner && hero){
    const poster = posterUrl(hero.file);
    const bgCandidates = backdropCandidates(hero.file);

    (async ()=>{
      let set = false;
      for(const url of bgCandidates){
        try{ await tryLoad(url); sBanner.style.backgroundImage = `url(${url})`; set = true; break; }catch(_){}
      }
      if(!set) sBanner.style.backgroundImage = `url(${poster})`;
    })();

    tEl.textContent = hero.title;
    oEl.textContent = hero.overview;
    mEl.textContent = `${hero.match}% 일치`;
    yEl.textContent = hero.year;
    aEl.textContent = hero.age;
    play?.addEventListener("click", ()=>openModal(hero,{fromSeries:true}));
    info?.addEventListener("click", ()=>openModal(hero,{fromSeries:true}));
  }
  renderRow(seriesGrid, SERIES, {fromSeries:true});
}

/* 네비 */
function showHome(){
  homeView.hidden=false; seriesView.hidden=true;
  document.getElementById("nav-home")?.classList.add("active");
  document.getElementById("nav-series")?.classList.remove("active");
}
function showSeries(){
  seriesView.hidden=false; homeView.hidden=true;
  document.getElementById("nav-series")?.classList.add("active");
  document.getElementById("nav-home")?.classList.remove("active");
}

/* 프로필 */
function initProfile(){
  const app = document.getElementById("app");
  document.querySelectorAll(".profile").forEach(p=>{
    p.addEventListener("click", ()=>{
      profileScreen.style.display="none";
      app.hidden=false;
      showHome();
      renderHome();
      renderSeries();
    });
  });
}

/* Init */
document.getElementById("nav-home")?.addEventListener("click", (e)=>{ e.preventDefault(); showHome(); renderHome(); });
document.getElementById("nav-series")?.addEventListener("click", (e)=>{ e.preventDefault(); showSeries(); renderSeries(); });
initProfile();

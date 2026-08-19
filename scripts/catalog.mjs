/**
 * Awesome NPU — data layer.
 * Parses README.md (+ ENRICH / i18n / arch-map) into the product catalog.
 * Imported by scripts/generate.mjs (renderer) and by the Astro site.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
// Anchor file reads to the repo's scripts/ dir. Under Astro's bundler,
// import.meta.url moves, so prefer <cwd>/scripts (cwd is the repo root for
// both `astro build` and `node scripts/generate.mjs`), falling back to __dir.
const SCRIPTS = fs.existsSync(path.join(process.cwd(), 'scripts', 'i18n.json'))
  ? path.join(process.cwd(), 'scripts') : __dir;
const ROOT = path.resolve(SCRIPTS, '..');
const REPO_URL = 'https://github.com/pleahmacaka/awesome-npu';
const PAGES_URL = 'https://pleahmacaka.github.io/awesome-npu/';
const I18N = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'i18n.json'), 'utf8'));
const EI18N = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'enrich-i18n.json'), 'utf8'));
/* 지원 신경망 아키텍처 (CNN/RNN/Transformer/LLM 등) — 제품별 분류. 키: `벤더||제품명` */
let ARCH = {};
try { ARCH = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'arch-map.json'), 'utf8')); }
catch (e) { console.warn('[warn] arch-map.json 없음 — 아키텍처 필드 생략'); }
const ARCH_ORDER = ['CNN','RNN','Transformer','ViT','LLM','VLM','Diffusion','SNN'];
const sortArch = a => [...(a||[])].sort((x,y)=>{ const i=ARCH_ORDER.indexOf(x), j=ARCH_ORDER.indexOf(y); return (i<0?99:i)-(j<0?99:j); });

/* 지원 정밀도(INT8/FP16/FP8 등): 조사로 채운 맵 + 텍스트에서 파싱한 것 병합. 키: `벤더||제품명` */
let PRECMAP = {};
try { PRECMAP = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'precision-map.json'), 'utf8')); } catch (e) {}
const PREC_ORDER = ['INT4','INT8','INT16','FP4','FP8','FP16','BF16','FP32','TF32','FP64'];
function parsePrec(key, texts){
  const set = new Set((PRECMAP[key]||[]).map(x=>String(x).toUpperCase()));
  const re = /\b(INT4|INT8|INT16|FP4|FP8|FP16|BF16|FP32|TF32|FP64)\b/gi;
  for (const t of texts) { let m; const s=String(t||''); while ((m=re.exec(s))) set.add(m[1].toUpperCase()); }
  return PREC_ORDER.filter(x=>set.has(x));
}

/* 가격 검증 맵: {키: {usd, approx}}. usd null이면 미공개 확정. */
let PRICEMAP = {};
try { PRICEMAP = JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'price-map.json'), 'utf8')); } catch (e) {}

/* 상세 사양 번역 유틸 — 한국어 원본을 6개 언어로 옮긴다.
   이미 표/카드에 별도로 표시되는 항목(성능·메모리·전력·출시)은 상세 그리드에서 제외한다. */
const LANGS = ['ko', 'en', 'ja', 'zh', 'es', 'he'];
const SKIP_SPEC_KEYS = new Set(['성능', '메모리', '전력', '출시']);
const trKey = (k, lang) => lang === 'ko' ? k : ((EI18N.keys[k] && EI18N.keys[k][lang]) || k);
const trVal = (v, lang) => lang === 'ko' ? v : ((EI18N.values[v] && EI18N.values[v][lang]) || v);
function buildSpecsI18n(specs){
  const entries = Object.entries(specs || {}).filter(([k]) => !SKIP_SPEC_KEYS.has(k));
  const out = {};
  for (const lang of LANGS) out[lang] = entries.map(([k, v]) => [trKey(k, lang), trVal(v, lang)]);
  return out;
}
function buildNoteI18n(key, koNote){
  const t = EI18N.notes[key];
  const out = {};
  for (const lang of LANGS) {
    out[lang] = (t && t[lang]) || (lang === 'ko' ? (koNote || (t && t.en) || '') : ((t && t.en) || koNote || ''));
  }
  return out;
}

/* 칩(실리콘) 기준 그룹핑용 오버라이드 — 여러 제품이 같은 칩을 쓰는 경우 동일 칩명으로 묶는다.
   (키: `벤더||README 제품명`) */
const CHIP_OVERRIDE = {
  'Google||Coral USB Accelerator': 'Edge TPU',
  'Google||Coral M.2 / Mini PCIe (single)': 'Edge TPU',
  'Google||Coral M.2 Dual Edge TPU': 'Edge TPU',
  'Google||Coral Mini PCIe Accelerator': 'Edge TPU',
  'Google||Coral Dev Board': 'Edge TPU',
  'Google||Coral Dev Board Mini': 'Edge TPU',
  'Google||Coral SoM': 'Edge TPU',
  'Google||Coral Accelerator Module': 'Edge TPU',
  'Gyrfalcon||Lightspeeur 2803S Plai Plug': 'Lightspeeur 2803S',
  'Gyrfalcon||GAINBOARD 2803S': 'Lightspeeur 2803S',
};

const FLAGS = { KR:'🇰🇷', US:'🇺🇸', NL:'🇳🇱', CN:'🇨🇳', NO:'🇳🇴', IL:'🇮🇱', JP:'🇯🇵', DE:'🇩🇪', FR:'🇫🇷', TW:'🇹🇼', CH:'🇨🇭', GB:'🇬🇧', GR:'🇬🇷', CA:'🇨🇦' };
const CNAME_UI = { KR:'대한민국', US:'미국', NL:'네덜란드', CN:'중국', NO:'노르웨이', IL:'이스라엘', JP:'일본', DE:'독일', FR:'프랑스', TW:'대만', CH:'스위스' };

/* 제조사 공식 자료·공개 보도 기반 한글 상세 (키: `벤더||README 제품명`) */
const ENRICH = {
  'Rebellions||ATOM': { chip:'ATOM', segment:'datacenter', tags:['데이터센터','추론','클라우드'],
    specs:{ '타입':'추론 NPU', '용도':'데이터센터', '상용화':'KT클라우드', '공정':'삼성 7nm급' },
    note:'국산 AI 반도체 최초로 KT클라우드에 대규모 상용화. NPUaaS 형태로 서비스 제공.' },
  'Rebellions||ATOM Max': { chip:'ATOM-Max', segment:'datacenter', tags:['데이터센터','추론','양산'],
    specs:{ '타입':'추론 NPU', '용도':'데이터센터', '상태':'양산·운영 중', '에코':'vLLM 등' },
    note:'ATOM 후속 고성능 버전. 실제 고객사에서 양산·운영 중.' },
  'Rebellions||REBEL / Rebel 100': { chip:'REBEL', segment:'datacenter', tags:['데이터센터','LLM','HBM3E','칩렛'],
    specs:{ '타입':'차세대 AI 칩', '메모리':'HBM3E', '대상':'LLM·멀티모달', '구성':'Card/Server/Rack' },
    note:'REBEL 칩 4개를 칩렛으로 결합한 REBEL-Quad. vLLM·Triton 지원. H200급 성능 목표. 서버·랙 단위 판매.' },
  'Rebellions||ION': { chip:'ION', segment:'datacenter', tags:['금융 특화','추론','1세대'],
    specs:{ '타입':'추론 NPU', '용도':'금융 특화', '출시':'2021', '세대':'1세대' },
    note:'리벨리온 첫 칩. 금융 워크로드에 특화된 AI 반도체.' },
  'FuriosaAI||WARBOY': { chip:'Warboy', segment:'edge', tags:['비전','추론','1세대'],
    specs:{ '타입':'Vision NPU', '용도':'영상 인식', '벤치':'T4 대비 4배(영상)', 'SDK':'C/Python' },
    note:'1세대 비전 특화 NPU. MLPerf에서 NVIDIA T4 대비 4배 영상 인식 성능. Model Zoo 제공.' },
  'FuriosaAI||RNGD': { chip:'RNGD', segment:'datacenter', tags:['데이터센터','LLM','HBM3','2세대'],
    specs:{ '타입':'추론 NPU', '메모리':'HBM3', '대상':'LLM·일반', '에코':'K8s·vLLM' },
    note:'2세대 NPU. BF16/FP8/INT8 양자화 지원. Kubernetes 네이티브 통합, OpenAI 호환 API 서버 제공.' },
  'DEEPX||DX-M1': { chip:'DX-M1', segment:'edge', priceUSD:120, tags:['엣지','M.2','산업용','RPi5'],
    specs:{ '성능':'25 TOPS (INT8)', '전력':'1–5 W', '메모리':'4GB LPDDR5', 'I/F':'M.2 PCIe Gen3 x4' },
    note:'라즈베리파이5·x86/ARM 호환. -25~85°C 산업용. DXNN SDK로 PyTorch/ONNX/TF 지원. Digi-Key 정식 유통.' },
  'DEEPX||DX-M1M': { chip:'DX-M1M', segment:'edge', tags:['엣지','온디바이스','저전력'],
    specs:{ '성능':'25 TOPS', '전력':'3 W (typ)', '용도':'비전·오디오', 'SDK':'PyTorch/ONNX' },
    note:'온디바이스 AI용. IPS/Watt 효율 중심 설계.' },
  'DEEPX||DX-M2': { chip:'DX-M2', segment:'edge', tags:['엣지','차세대','휴머노이드','2nm'],
    specs:{ '공정':'삼성 2nm 목표', '대상':'피지컬 AI·로봇', '상태':'개발 중', '전략':'초저가' },
    note:'CES 2026에서 방향성 공개. 로봇·휴머노이드용 차세대 칩. 초저가(수십 달러대) 목표 언급.' },
  'DEEPX||DX-H1': { chip:'DX-H1 V-NPU', segment:'datacenter', tags:['서버','고성능','다중 카메라'],
    specs:{ '성능':'~28 POPS/서버', '전력':'~40 W', '용도':'추론 서버', '규모':'1만 카메라급' },
    note:'대규모 AI 연산용 서버 솔루션. 수만 대 카메라·센서 동시 처리.' },
  'DEEPX||DX-L1 / DX-L2': { chip:'DX-L1/L2', segment:'edge', tags:['초소형','센서','가전'],
    specs:{ 'DX-L1':'2.4 TOPS', 'DX-L2':'6.4 TOPS', '공정':'삼성 14/28nm', '용도':'AI 스마트가전' },
    note:'초소형 센서~가전용 저체급 라인. 단일/3채널 카메라 영상 처리.' },
  'Mobilint||MLA100 PCIe Card': { chip:'ARIES', segment:'edge', tags:['엣지','PCIe','LLM/VLM','8코어','GPU 대체'],
    specs:{ '성능':'64 TOPS (부스트 80)', '전력':'25 W', '메모리':'16 / 32GB LPDDR4X', 'I/F':'PCIe Gen4 8-lane', '코어':'ARIES 8코어', 'SDK':'qb (모델 컴파일러)', '모델':'200+ (SOTA 포함)', '카메라':'최대 10채널 실시간' },
    note:'ARIES 8코어 기반 엣지 PCIe 카드. 경쟁 제품 대비 약 4배 성능·1/10 전력을 표방하며 온프레미스 서버 GPU 대체를 겨냥. 스마트팩토리·시티·AI CCTV·로봇에 활용. MobileNetV2 11,551 FPS, ResNet-50 3,082 FPS. AWS Greengrass 연동.' },
  'Mobilint||MLA100 MXM': { chip:'ARIES', segment:'edge', tags:['임베디드','MXM','로보틱스','러기드'],
    specs:{ '성능':'80 TOPS', '전력':'25 W', '폼팩터':'MXM 표준 모듈', '코어':'ARIES 8코어', '대상':'러기드 AI 박스', 'SDK':'qb' },
    note:'표준 MXM(Mobile PCIe Module) 인터페이스 기반 임베디드 NPU 모듈. 공간·전력·발열이 중요한 로보틱스·산업 자동화용. 서버급 추론을 엣지 기기로 이식하는 것이 목표. 2025.04 정식 출시, 샘플·주문 가능.' },
  'Mobilint||MLX-A1 Edge AI Box': { chip:'ARIES', segment:'edge', tags:['엣지박스','올인원','오프라인','다중 카메라'],
    specs:{ '성능':'64 TOPS (부스트 80)', '전력':'35 W', 'I/O':'USB·MIPI·Ethernet·PCIe', '비디오':'4K@120fps 인코더', '카메라':'최대 10채널', 'OS':'소프트웨어 프리로드' },
    note:'소프트웨어와 I/O가 통합된 완제품 AI 박스(데스크·산업 겸용). 외부 컴퓨터·서버 없이 온디바이스로 AI 실행해 저지연·보안 강화. 스마트시티·AMR·드론용. ARIES 탑재.' },
  'Mobilint||MLA400 PCIe Card': { chip:'Quad-ARIES', segment:'datacenter', tags:['서버','고밀도','Quad-ARIES','Multi-LLM'],
    specs:{ '성능':'~256 TOPS (부스트 ~320)', '구조':'ARIES 4-chip', '용도':'Multi-LLM·다중 카메라 비전', '강점':'TOPS/Watt 효율', 'SDK':'qb + 보일러플레이트' },
    note:'ARIES 4개를 한 카드에 집적한 고밀도 PCIe 카드. 온프레미스 다중 LLM 추론과 대규모 다중 카메라 비전용. CES 2026·Embedded World 2026 전시, Multi-LLM 데모 및 오픈소스 보일러플레이트 공개.' },
  'Mobilint||REGULUS': { chip:'REGULUS', segment:'edge', tags:['온디바이스','SoC','드론','AI카메라','CES 수상'],
    specs:{ '성능':'10 TOPS', '전력':'3 W (TDP)', '통합':'CPU + ISP + Codec', 'I/F':'Ethernet·USB·MIPI', '대상':'소형 엣지 기기', '수상':'CES Innovation Award 2025' },
    note:'CPU·ISP·코덱을 통합한 초저전력 온디바이스 AI SoC. 크기·비용·전력 제약이 큰 소형 기기용으로, AI 로봇·드론·스마트 가전·스마트 토이·AI CCTV 등에 최적. 2024년 CES Innovation Award 2025 수상.' },
  'HyperAccel||Orion': { chip:'LPU (FPGA)', segment:'datacenter', tags:['LLM 전용','LPU','FPGA','데이터센터'],
    specs:{ '타입':'LLM 추론(LPU)', '구현':'FPGA 기반', '벤치':'GPT GPU 대비 ~5.6배', '메모리':'HBM/LPDDR' },
    note:'LLM 추론 특화 LPU(NPU 하위범주). FPGA로 구현한 초기 서버 제품. AWS EC2 F2 마켓플레이스 제공.' },
  'HyperAccel||Bertha': { chip:'Bertha', segment:'datacenter', priceUSD:3500, tags:['LLM 전용','LPU','ASIC','삼성 4nm'],
    specs:{ '타입':'LLM 추론 ASIC', '메모리':'LPDDR5X', '공정':'삼성 4nm', '효율':'가격효율 GPU ~10배' },
    note:'세계 최초 LPDDR5X 기반 LLM 전용 칩. 서버에 그대로 장착하는 PCIe 폼팩터. 가격은 대표 발언 기준 목표가.' },
  'Google||Coral USB Accelerator': { chip:'Edge TPU', segment:'edge', priceUSD:59.99, tags:['엣지','TFLite','USB','플러그앤플레이'],
    specs:{ '성능':'4 TOPS', '전력':'~2 W', 'I/F':'USB 3.0', '프레임워크':'TensorFlow Lite' },
    note:'USB로 기존 호스트(RPi 등)에 Edge TPU 추가. TFLite 전용. 개발·프로토타입에 간편.' },
  'Google||Coral M.2 Dual Edge TPU': { chip:'Edge TPU x2', segment:'edge', priceUSD:39.99, tags:['엣지','TFLite','M.2','ASIC'],
    specs:{ '성능':'8 TOPS (4x2)', '전력':'~4 W', 'I/F':'M.2 E-key', '프레임워크':'TensorFlow Lite' },
    note:'Edge TPU 2개 탑재 M.2 모듈. M.2 E-key PCIe x1 2레인 필요(보드 호환 주의).' },
  'Hailo||Hailo-8 M.2': { chip:'Hailo-8', segment:'edge', priceUSD:135, tags:['엣지','M.2','고효율','비전'],
    specs:{ '성능':'26 TOPS', '전력':'~2.5 W', 'I/F':'M.2 PCIe Gen3 x4', 'SDK':'Dataflow Compiler' },
    note:'고효율 비전 엣지 NPU. RPi5 등과 널리 사용. Hailo-8L(13 TOPS) 저가형도 존재.' },
  'NXP||Ara-1 DNPU': { chip:'Ara-1', segment:'edge', tags:['엣지','비전','저전력','DNPU'],
    specs:{ '타입':'Discrete NPU', '용도':'카메라·엣지서버', '에코':'eIQ SW', '강점':'에너지 효율' },
    note:'NXP 1세대 디스크리트 NPU. 칩 또는 모듈 형태. 비전·음성·제스처 멀티모달 추론.' },
  'NXP||Ara240 DNPU': { chip:'Ara240', segment:'edge', tags:['엣지','GenAI','M.2','LLM/VLM'],
    specs:{ '성능':'최대 40 eTOPS', '타입':'Discrete NPU(2세대)', '메모리':'16GB', '출시':'2026.06' },
    note:'실시간 GenAI 최적화. 16GB M.2 모듈로 i.MX 95/8M Plus의 코프로세서 활용. LLM·VLM·멀티모달.' },
  'NXP||i.MX 8M Plus NPU': { chip:'i.MX 8M Plus', segment:'edge', tags:['산업IoT','통합형','장기공급'],
    specs:{ '성능':'2.3 TOPS', '타입':'통합 NPU', '용도':'산업 IoT', '강점':'신뢰성·장기수급' },
    note:'산업용 IoT 특화. 최대 성능보다 신뢰성·보안·장기 공급성 우선.' },
  'Intel||Neural Compute Stick 2': { chip:'Movidius Myriad X', segment:'edge', priceUSD:70, tags:['엣지','USB','VPU','프로토타입'],
    specs:{ '성능':'4 TOPS', '타입':'VPU', 'I/F':'USB 3.0', '툴킷':'OpenVINO' },
    note:'USB 형태로 기존 시스템에 AI 추론 추가. OpenVINO 최적화. 현재 단종 단계, 재고 기준 가격.' },
  'Rockchip||RK3588 NPU': { chip:'RK3588', segment:'edge', priceUSD:100, tags:['SoC','통합형','범용','SBC'],
    specs:{ '성능':'6 TOPS', '타입':'SoC 내장 NPU', '용도':'비전·NLP·오디오', '강점':'범용 컴퓨팅' },
    note:'범용 SoC 내장 NPU. 보통 SBC(Orange Pi 5 등)에 탑재되어 유통(가격은 보드 기준).' },
  'Nordic Semiconductor||Axon NPU (nRF54LM20B)': { chip:'Axon', segment:'mcu', tags:['MCU급','초저전력','TinyML','무선'],
    specs:{ '성능':'CPU 대비 최대 15배', '효율':'경쟁 대비 8배', 'RAM':'512KB / 2MB NVM', '코어':'Cortex-M33 + RISC-V' },
    note:'nRF54L 시리즈 내장 NPU. BLE·Thread·Matter 무선 SoC. 키워드 스포팅·음향 분류 등 초저전력 엣지 AI. 2026 Q2 양산.' },
  'Qualcomm||Hexagon NPU': { chip:'Hexagon', segment:'edge', tags:['SoC','모바일','온디바이스'],
    specs:{ '타입':'SoC 내장 NPU', '용도':'비전·음성·분석', '강점':'전력 효율', '에코':'LiteRT/AI Pack' },
    note:'Snapdragon SoC 내장. 모바일·키오스크·디지털 사이니지용. Google LiteRT NPU 가속 지원(AOT 컴파일).' },
  /* 부분 보강: 체급만 지정 */
  'Syntiant||NDP120': { segment:'mcu', tags:['MCU급','상시구동','오디오'] },
};
// 추가 보강 데이터(비교용 GPU + 엣지 MPU/SoC)는 별도 JSON에서 병합
try { Object.assign(ENRICH, JSON.parse(fs.readFileSync(path.join(SCRIPTS, 'enrich-extra.json'), 'utf8'))); }
catch (e) { /* enrich-extra.json 없으면 무시 */ }

// ---------- 유틸 ----------
const escHtml = s => String(s==null?'':s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slug = s => s.trim().toLowerCase().replace(/[^\w\s-]/g,'').replace(/\s/g,'-');

function renderInline(t){
  let s = escHtml(t);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m,txt,url)=>`<a href="${url.replace(/"/g,'%22')}" target="_blank" rel="noopener">${txt}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}
function splitRow(line){
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0,-1);
  return s.split('|').map(c=>c.trim());
}
function renderMarkdown(md){
  const lines = md.replace(/\r/g,'').replace(/—/g,'·').split('\n');
  const N = lines.length;
  let html = '', i = 0;
  while (i < N) {
    const line = lines[i];
    if (/^\s*$/.test(line)) { i++; continue; }
    const hm = line.match(/^(#{2,4})\s+(.*)$/);
    if (hm) {
      const lvl = hm[1].length;
      const txt = hm[2].replace(/\s+#+\s*$/,'').trim();
      html += `<h${lvl} id="${slug(txt)}">${renderInline(txt)}</h${lvl}>`;
      i++; continue;
    }
    if (/^\|.*\|\s*$/.test(line) && i+1 < N && /^\|[\s:|-]+\|\s*$/.test(lines[i+1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < N && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      html += `<div class="tbl-wrap"><table><thead><tr>${header.map(h=>`<th>${renderInline(h)}</th>`).join('')}</tr></thead><tbody>${
        rows.map(r=>`<tr>${r.map(c=>`<td>${renderInline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      continue;
    }
    if (/^\s*-\s+/.test(line)) {
      const items = [];
      while (i < N && /^\s*-\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*-\s+/,'')); i++; }
      html += `<ul>${items.map(it=>`<li>${renderInline(it)}</li>`).join('')}</ul>`;
      continue;
    }
    const buf = [];
    while (i < N && !/^\s*$/.test(lines[i]) && !/^(#{2,4})\s+/.test(lines[i]) && !/^\s*-\s+/.test(lines[i]) && !/^\|.*\|\s*$/.test(lines[i])) {
      buf.push(lines[i].trim()); i++;
    }
    if (buf.length) html += `<p>${renderInline(buf.join(' '))}</p>`;
  }
  return html;
}

// ---------- 셀 파서 ----------
function parseProductCell(cell){
  const standalone = !cell.includes('⚠');
  const m = cell.match(/\[([^\]]+)\]\(([^)]+)\)/);
  const name = (m ? m[1] : cell.replace('⚠','')).trim();
  const url = m ? m[2].trim() : '';
  return { name, url, standalone };
}
function parseCountry(cell){
  for (const [code, emoji] of Object.entries(FLAGS)) if (cell.includes(emoji)) return code;
  return 'US';
}
function parseCompute(raw, isDatacenter){
  const s = (raw||'').trim();
  if (!s || s === '-') return { tops:null, display:'-' };
  const m = s.match(/~?\s*([\d]+(?:\.[\d]+)?)/);
  const tops = m ? parseFloat(m[1]) : null;
  let display = s;
  if (!isDatacenter && /^~?\s*[\d]+(?:\.[\d]+)?$/.test(s)) display = s.replace(/\s+/g,'') + ' TOPS';
  return { tops, display };
}
function parseReleased(raw){
  const s = (raw||'').trim();
  if (!s || s === '-') return { date:null, display:null }; // null = 미상(다국어 렌더 시 번역)
  if (/^\d{4}-\d{2}$/.test(s)) return { date:s+'-01', display:s.replace('-','.') };
  if (/^\d{4}$/.test(s)) return { date:s+'-01-01', display:s };
  const y = s.match(/\d{4}/);
  return { date: y ? y[0]+'-01-01' : null, display:s };
}
/* 가격 3단계 표기: 정확 "$1,299" / 근사 "~$300" / 미공개 null(다국어 렌더 시 번역).
   우선순위: price-map.json(조사 검증) > enrich.priceUSD > README 셀 파싱. */
function fmtUSD(n){
  return Number.isInteger(n) ? n.toLocaleString('en-US')
    : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parsePrice(raw, enrich, key){
  const s = (raw||'').replace(/\\/g,'').trim();
  let priceUSD = null, approx = false;
  const ov = key != null ? PRICEMAP[key] : undefined;
  if (ov !== undefined) {
    priceUSD = ov && ov.usd != null ? ov.usd : null;
    approx = !!(ov && ov.approx);
  } else {
    if (enrich && Object.prototype.hasOwnProperty.call(enrich,'priceUSD') && enrich.priceUSD != null) {
      priceUSD = enrich.priceUSD;
      approx = !!enrich.priceApprox;
    } else {
      const nums = [...s.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)].map(m=>parseFloat(m[1].replace(/,/g,'')));
      if (nums.length > 1) { priceUSD = Math.round((nums[0]+nums[nums.length-1])/2); approx = true; }
      else if (nums.length === 1) priceUSD = nums[0];
    }
    if (/~|약|\(target\)|\+|–|—|\ds\b/.test(s)) approx = true;
  }
  const display = priceUSD == null ? null : (approx ? '~' : '') + '$' + fmtUSD(priceUSD);
  return { priceUSD, display, priceApprox: approx };
}
function formGroup(form){
  const f = form || '';
  // 장착(마운트) 방식 분류: 슬롯/폼팩터로 그룹. SoC 내장은 'Embedded'(MCU/베어메탈).
  if (/M\.2/i.test(f)) return 'M.2';
  if (/mPCIe|mini[\s-]?PCIe/i.test(f)) return 'mPCIe';
  if (/USB/i.test(f)) return 'USB';
  if (/MXM/i.test(f)) return 'MXM';
  if (/PCIe|Card/i.test(f)) return 'PCIe';
  if (/OAM|Server|System|Blade|Wafer|Rack/i.test(f)) return 'Server';
  if (/SoM/i.test(f)) return 'SoM';
  if (/\bIP\b/i.test(f)) return 'IP';
  if (/HAT/i.test(f)) return 'HAT';
  if (/SBC|board|Box/i.test(f)) return 'Board';
  if (/SoC|sensor|chip|module/i.test(f)) return 'Embedded';
  return 'Server';
}

// 정렬용 숫자 파생: 메모리 문자열 → GB(가장 큰 용량), 전력 문자열 → W.
function parseMemGB(s){
  if (!s) return null;
  let best = null, m; const re = /([\d.]+)\s*(TB|GB|MB|KB)/gi;
  while ((m = re.exec(s))) {
    const v = parseFloat(m[1]), u = m[2].toUpperCase();
    const gb = u === 'TB' ? v * 1024 : u === 'GB' ? v : u === 'MB' ? v / 1024 : v / 1048576;
    if (best === null || gb > best) best = gb;
  }
  return best;
}
function parseWatts(s){
  if (!s) return null;
  const m = String(s).match(/([\d.]+)\s*W\b/i);
  return m ? parseFloat(m[1]) : null;
}

// ---------- 표 파서 ----------
function colFinder(header){
  const H = header.map(h=>h.toLowerCase());
  const find = (...names) => { for (const n of names){ const idx = H.findIndex(h=>h.includes(n)); if (idx>=0) return idx; } return -1; };
  return {
    vendor: find('vendor'), product: find('product'), country: find('country'),
    form: find('form'), compute: find('compute'), memory: find('memory'),
    useCase: find('use case','use-case','usecase'), released: find('released','release'), price: find('price'),
  };
}
function parseTableUnder(lines, headingText, isDatacenter, usedKeys){
  const hIdx = lines.findIndex(l => l.trim() === headingText);
  if (hIdx < 0) { console.warn(`[warn] 섹션을 찾지 못함: ${headingText}`); return []; }
  let i = hIdx + 1;
  while (i < lines.length && !/^\|.*\|\s*$/.test(lines[i])) i++;
  if (i >= lines.length) return [];
  const header = splitRow(lines[i]);
  const col = colFinder(header);
  i += 2; // 헤더 + 구분선
  const out = [];
  while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
    const cells = splitRow(lines[i]); i++;
    const { name, url, standalone } = parseProductCell(cells[col.product] || '');
    if (!name) continue;
    const vendor = (cells[col.vendor] || '').trim();
    const key = `${vendor}||${name}`;
    const enrich = ENRICH[key];
    if (enrich && usedKeys) usedKeys.add(key);

    const country = parseCountry(cells[col.country] || '');
    const form = (cells[col.form] || '').trim();
    const memory = (cells[col.memory] || '').trim();
    const useCase = col.useCase >= 0 ? (cells[col.useCase] || '').trim() : '';
    const comp = parseCompute(cells[col.compute] || '', isDatacenter);
    const rel = parseReleased(cells[col.released] || '');
    const pr = parsePrice(cells[col.price] || '', enrich, key);

    const segment = (enrich && enrich.segment) || (isDatacenter ? 'datacenter' : (/MCU|TinyML/i.test(useCase) ? 'mcu' : 'edge'));
    let specs;
    if (enrich && enrich.specs) specs = enrich.specs;
    else { specs = {}; specs['성능'] = comp.display; specs['메모리'] = memory || '-'; if (useCase) specs['용도'] = useCase; specs['출시'] = rel.display; }
    const tags = (enrich && enrich.tags) ? enrich.tags : [];
    const enriched = !!(enrich && (enrich.specs || enrich.note || (enrich.tags && enrich.tags.length)));
    const chip = CHIP_OVERRIDE[key] || (enrich && enrich.chip) || '';
    const chipKey = chip || name;
    const power = (enrich && enrich.power) || (specs && specs['전력']) || null;
    const koNote = (enrich && enrich.note) || '';

    out.push({
      id: key, enriched, chip, chipKey,
      vendor, product:name, url, standalone,
      country, origin: country === 'KR' ? 'kr' : 'global',
      form, formGroup: formGroup(form),
      kind: (enrich && enrich.kind) || 'npu',
      compute: comp.display === '—' ? null : (cells[col.compute]||'').trim(), computeDisplay: comp.display, tops: comp.tops,
      memory, memGB: parseMemGB(memory), useCase, power, watts: parseWatts(power),
      release: rel.date ? (cells[col.released]||'').trim() : null, releaseDate: rel.date, releaseDisplay: rel.display,
      price: (cells[col.price]||'').trim(), priceDisplay: pr.display, priceUSD: pr.priceUSD, priceApprox: pr.priceApprox,
      segment, tags, arch: sortArch(ARCH[key]),
      prec: parsePrec(key, [cells[col.compute], ...Object.values(specs||{})]),
      specsI18n: buildSpecsI18n(specs), noteI18n: buildNoteI18n(key, koNote),
    });
  }
  return out;
}

// ---------- 실행 ----------
const readme = fs.readFileSync(path.join(ROOT,'README.md'), 'utf8');
const catalogCss = fs.readFileSync(path.join(SCRIPTS,'catalog.css'), 'utf8');
const lines = readme.replace(/\r/g,'').split('\n');

const usedKeys = new Set();
const mainProducts = parseTableUnder(lines, '## Products', false, usedKeys);
const dcProducts = parseTableUnder(lines, '## Datacenter inference accelerators', true, usedKeys);
const products = [...mainProducts, ...dcProducts];

// ---- 제품/벤더 상세 페이지 슬러그 + URL 배정 ----
const mkslug = s => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g,'').trim().replace(/[\s_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'') || 'x';
const vendorSlug = {}; const usedV = new Set();
for (const v of [...new Set(products.map(p=>p.vendor))]) { let s=mkslug(v); while(usedV.has(s)) s+='-x'; usedV.add(s); vendorSlug[v]=s; }
const usedP = new Set();
for (const p of products) {
  let s = mkslug(p.vendor)+'-'+mkslug(p.product); while(usedP.has(s)) s+='-2'; usedP.add(s);
  p.slug = s;
  p.page = `${PAGES_URL}p/${s}/`;
  p.vpage = `${PAGES_URL}v/${vendorSlug[p.vendor]}/`;
}

// 인트로: H1 다음 ~ "## Contents" 이전 (페이지 자기 자신을 가리키는 라이브 링크는 제외)
const h1Idx = lines.findIndex(l => /^#\s+/.test(l));
const contentsIdx = lines.findIndex(l => l.trim() === '## Contents');
const introMd = lines.slice(h1Idx + 1, contentsIdx > 0 ? contentsIdx : h1Idx + 1)
  .filter(l => !/pleahmacaka\.github\.io/.test(l) && !/^\s*Flags:/.test(l))
  .join('\n');

// 문서: "## Raspberry Pi accelerators" ~ 끝
const piIdx = lines.findIndex(l => l.trim() === '## Raspberry Pi accelerators');
const docsMd = piIdx >= 0 ? lines.slice(piIdx).join('\n') : '';

// 사용되지 않은 보강 키 경고(제품명 불일치 감지)
for (const k of Object.keys(ENRICH)) if (!usedKeys.has(k)) console.warn(`[warn] 매칭되지 않은 보강 데이터: ${k}`);

const introHTML = renderMarkdown(introMd);
const docsHTML = renderMarkdown(docsMd);
const DATA = { products, generatedAt: new Date().toISOString().slice(0,10), repo: REPO_URL };

export { products, mainProducts, dcProducts, I18N, EI18N, ENRICH, LANGS, PAGES_URL, REPO_URL, ROOT, escHtml, vendorSlug, introHTML, docsHTML, DATA, catalogCss, usedKeys };

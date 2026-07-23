#!/usr/bin/env node
/**
 * Awesome NPU — GitHub Pages 빌더
 *
 * README.md 를 단일 소스로 삼아 인터랙티브 제품 카탈로그(index.html)를 생성한다.
 *   - "## Products" / "## Datacenter inference accelerators" 표 → 제품 데이터
 *   - "## Raspberry Pi accelerators" 이후 → 문서 영역(HTML)
 *   - 상단 소개 문단 → 히어로 소개(HTML)
 * 여기에 아래 ENRICH(제조사 공식 자료 기반 한글 상세)의 사양/설명/태그를 병합한다.
 *
 * 사용:  node scripts/generate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dir, '..');
const REPO_URL = 'https://github.com/pleahmacaka/awesome-npu';
const PAGES_URL = 'https://pleahmacaka.github.io/awesome-npu/';
const I18N = JSON.parse(fs.readFileSync(path.join(__dir, 'i18n.json'), 'utf8'));
const EI18N = JSON.parse(fs.readFileSync(path.join(__dir, 'enrich-i18n.json'), 'utf8'));
/* 지원 신경망 아키텍처 (CNN/RNN/Transformer/LLM 등) — 제품별 분류. 키: `벤더||제품명` */
let ARCH = {};
try { ARCH = JSON.parse(fs.readFileSync(path.join(__dir, 'arch-map.json'), 'utf8')); }
catch (e) { console.warn('[warn] arch-map.json 없음 — 아키텍처 필드 생략'); }
const ARCH_ORDER = ['CNN','RNN','Transformer','ViT','LLM','VLM','Diffusion','SNN'];
const sortArch = a => [...(a||[])].sort((x,y)=>{ const i=ARCH_ORDER.indexOf(x), j=ARCH_ORDER.indexOf(y); return (i<0?99:i)-(j<0?99:j); });

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

const FLAGS = { KR:'🇰🇷', US:'🇺🇸', NL:'🇳🇱', CN:'🇨🇳', NO:'🇳🇴', IL:'🇮🇱', JP:'🇯🇵', DE:'🇩🇪', FR:'🇫🇷', TW:'🇹🇼', CH:'🇨🇭' };
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
function parsePrice(raw, enrich){
  const s = (raw||'').trim();
  let priceUSD = null;
  if (enrich && Object.prototype.hasOwnProperty.call(enrich,'priceUSD')) {
    priceUSD = enrich.priceUSD;
  } else {
    const m = s.match(/\$\s?([\d,]+(?:\.\d+)?)/);
    if (m) priceUSD = parseFloat(m[1].replace(/,/g,''));
  }
  const display = (!s || s === '-') ? null : s; // null = 미공개(다국어 렌더 시 번역)
  return { priceUSD, display };
}
function formGroup(form){
  const f = form || '';
  if (/M\.2/i.test(f)) return 'M.2';
  if (/USB/i.test(f)) return 'USB';
  if (/MXM/i.test(f)) return 'MXM';
  if (/Box/i.test(f)) return 'Box';
  if (/PCIe/i.test(f)) return 'PCIe';
  if (/OAM/i.test(f)) return 'OAM';
  if (/SoM/i.test(f)) return 'SoM';
  if (/SoC|sensor/i.test(f)) return 'SoC';
  return 'Server/System';
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
    const pr = parsePrice(cells[col.price] || '', enrich);

    const segment = (enrich && enrich.segment) || (isDatacenter ? 'datacenter' : (/MCU|TinyML/i.test(useCase) ? 'mcu' : 'edge'));
    let specs;
    if (enrich && enrich.specs) specs = enrich.specs;
    else { specs = {}; specs['성능'] = comp.display; specs['메모리'] = memory || '-'; if (useCase) specs['용도'] = useCase; specs['출시'] = rel.display; }
    const tags = (enrich && enrich.tags) ? enrich.tags : [];
    const enriched = !!(enrich && (enrich.specs || enrich.note || (enrich.tags && enrich.tags.length)));
    const chip = CHIP_OVERRIDE[key] || (enrich && enrich.chip) || '';
    const chipKey = chip || name;
    const power = (specs && specs['전력']) || null;
    const koNote = (enrich && enrich.note) || '';

    out.push({
      id: key, enriched, chip, chipKey,
      vendor, product:name, url, standalone,
      country, origin: country === 'KR' ? 'kr' : 'global',
      form, formGroup: formGroup(form),
      compute: comp.display === '—' ? null : (cells[col.compute]||'').trim(), computeDisplay: comp.display, tops: comp.tops,
      memory, useCase, power,
      release: rel.date ? (cells[col.released]||'').trim() : null, releaseDate: rel.date, releaseDisplay: rel.display,
      price: (cells[col.price]||'').trim(), priceDisplay: pr.display, priceUSD: pr.priceUSD,
      segment, tags, arch: sortArch(ARCH[key]),
      specsI18n: buildSpecsI18n(specs), noteI18n: buildNoteI18n(key, koNote),
    });
  }
  return out;
}

// ---------- 실행 ----------
const readme = fs.readFileSync(path.join(ROOT,'README.md'), 'utf8');
const template = fs.readFileSync(path.join(__dir,'template.html'), 'utf8');
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

// ---- 다국어 정적 페이지 생성 (언어별 SSR + hreflang) : SEO ----
const vendorsN = new Set(products.map(p=>p.vendor)).size;
const countriesN = new Set(products.map(p=>p.country)).size;
const OGLOCALE = { en:'en_US', ko:'ko_KR', ja:'ja_JP', zh:'zh_CN', es:'es_ES', he:'he_IL' };
const HREFLANG_CODE = { en:'en', ko:'ko', ja:'ja', zh:'zh-Hans', es:'es', he:'he' };
const langPath = lang => lang==='en' ? PAGES_URL : `${PAGES_URL}${lang}/`;
const SEO_TITLE = {
  en:'Awesome NPU | NPU and AI accelerator list and comparison',
  ko:'NPU 목록, AI 가속기 비교 | Awesome NPU',
  ja:'NPU 一覧、AIアクセラレータ比較 | Awesome NPU',
  zh:'NPU 列表与 AI 加速器对比 | Awesome NPU',
  es:'Lista de NPU y comparación de aceleradores de IA | Awesome NPU',
  he:'רשימת NPU והשוואת מאיצי AI | Awesome NPU',
};
const seoDesc = lang => { const n=products.length; return ({
  en:`An interactive databook of ${n} NPUs and AI inference accelerators from ${vendorsN} vendors, spanning MCU-class chips to datacenter cards. Filter, sort and compare by TOPS, memory, power, price and release date.`,
  ko:`MCU급 칩부터 데이터센터 카드까지, NPU와 AI 추론 가속기 ${n}종을 성능(TOPS), 메모리, 전력, 가격으로 필터·정렬·비교할 수 있는 인터랙티브 데이터북입니다.`,
  ja:`MCUクラスのチップからデータセンターカードまで、NPUとAI推論アクセラレータ${n}種を性能(TOPS)、メモリ、消費電力、価格で絞り込み・並べ替え・比較できるインタラクティブなデータブック。`,
  zh:`从 MCU 级芯片到数据中心卡，收录 ${n} 款 NPU 与 AI 推理加速器，可按性能(TOPS)、内存、功耗、价格进行筛选、排序与对比的交互式数据手册。`,
  es:`Un databook interactivo de ${n} NPU y aceleradores de inferencia de IA, desde chips de clase MCU hasta tarjetas de datacenter. Filtra, ordena y compara por TOPS, memoria, consumo, precio y fecha.`,
  he:`ספר נתונים אינטראקטיבי של ${n} מעבדי NPU ומאיצי הסקת AI, משבבי MCU ועד כרטיסי מרכזי נתונים. סינון, מיון והשוואה לפי TOPS, זיכרון, צריכה ומחיר.`,
})[lang]; };
const seoKw = lang => {
  const base='NPU, AI accelerator, AI inference accelerator, edge AI, on-device AI, TinyML, TOPS, datacenter inference, LPU, Rebellions, FuriosaAI, DEEPX, Mobilint, Hailo, Coral, Jetson, TPU, Gaudi';
  const loc={ ko:'NPU 목록, NPU 비교, AI 가속기, NPU 종류, ', ja:'NPU 一覧, NPU 比較, AIアクセラレータ, ', zh:'NPU 列表, NPU 对比, AI 加速器, ', es:'lista de NPU, comparación de NPU, acelerador de IA, ', he:'רשימת NPU, השוואת NPU, מאיץ AI, ' }[lang]||'';
  return loc+base;
};
const HREFLANG = [`<link rel="alternate" hreflang="x-default" href="${PAGES_URL}">`]
  .concat(LANGS.map(l=>`<link rel="alternate" hreflang="${HREFLANG_CODE[l]}" href="${langPath(l)}">`)).join('\n');

// data-i18n 텍스트/속성을 대상 언어로 치환 → 정적 HTML 자체가 해당 언어가 됨(검색엔진/무JS 노출)
function localizeBody(html, L){
  html = html.replace(/(<[^>]*\sdata-i18n="([a-z_]+)"[^>]*>)([^<]*)(<\/)/g, (m,open,key,txt,close)=> L[key]!=null ? open+escHtml(L[key])+close : m);
  html = html.replace(/(\sdata-i18n-ph="([a-z_]+)"[^>]*\splaceholder=")([^"]*)(")/g, (m,pre,key,val,q)=> L[key]!=null ? pre+escHtml(L[key])+q : m);
  html = html.replace(/(\sdata-i18n-aria="([a-z_]+)"\s+aria-label=")([^"]*)(")/g, (m,pre,key,val,q)=> L[key]!=null ? pre+escHtml(L[key])+q : m);
  return html;
}
function ssrFor(lang){
  const T=I18N[lang];
  let regionDN; try{ regionDN=new Intl.DisplayNames([lang],{type:'region'}); }catch(e){ regionDN=null; }
  const cname=code=>{ try{ return (regionDN&&regionDN.of(code))||code; }catch(e){ return code; } };
  const SEG_T={ mcu:T.seg_mcu, edge:T.seg_edge, datacenter:T.seg_datacenter };
  const ccS=p=>`<span class="cc" title="${escHtml(cname(p.country))}">${escHtml(p.country)}</span>`;
  const rowS=(p,i)=>{
    const perf=p.computeDisplay||'-'; const power=p.power||'-';
    const intg=p.standalone?'':` <span class="intg" data-tip="${escHtml(T.warn_integrated)}" role="img" aria-label="${escHtml(T.warn_integrated)}" tabindex="0">⚠</span>`;
    const price=p.priceDisplay==null?T.undisclosed:p.priceDisplay;
    const rel=p.releaseDisplay||T.unknown;
    const archTxt=p.arch&&p.arch.length?escHtml(p.arch.join(' · ')):'<span class="muted">-</span>';
    return `<tr data-id="${escHtml(p.id)}"><td class="sel"><input type="checkbox" class="rowchk" data-id="${escHtml(p.id)}" aria-label="${escHtml(p.product)}"></td>`+
      `<td class="idx">${String(i+1).padStart(2,'0')}</td>`+
      `<td class="prod"><a class="pn" href="${escHtml(p.page)}">${escHtml(p.product)}</a>${p.chip?`<div class="pchip">${escHtml(p.chip)}</div>`:''}</td>`+
      `<td class="muted"><a class="vn" href="${escHtml(p.vpage)}">${escHtml(p.vendor)}</a></td><td>${ccS(p)}</td>`+
      `<td><span class="seg">${escHtml(SEG_T[p.segment]||p.segment)}</span></td>`+
      `<td class="arch">${archTxt}</td>`+
      `<td>${escHtml(p.form)}${intg}</td>`+
      `<td class="r"><span class="num">${escHtml(perf)}</span></td>`+
      `<td class="muted">${escHtml(p.memory||'-')}</td>`+
      `<td><span class="num">${escHtml(power)}</span></td>`+
      `<td class="r"><span class="num ${p.priceUSD!=null?'':'muted'}">${escHtml(price)}</span></td>`+
      `<td class="r"><span class="num ${p.releaseDate?'':'muted'}">${escHtml(rel)}</span></td></tr>`;
  };
  const headCell=(col,k,o)=>{ o=o||{}; const inter=o.sort||o.filter; const cls=[o.r?'r':'',inter?'thx':''].filter(Boolean).join(' ');
    const caret=inter?'<svg class="thc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="m6 9 6 6 6-6"/></svg>':'';
    return `<th scope="col" data-col="${col}"${cls?` class="${cls}"`:''}><span class="thl">${escHtml(T[k])}</span>${caret}</th>`; };
  const THEAD=`<thead><tr><th class="sel"><input type="checkbox" class="selall" aria-label="${escHtml(T.a_selectall)}"></th><th scope="col"><span class="sr">#</span></th>`+
    headCell('product','col_product',{sort:1})+headCell('vendor','col_vendor',{sort:1,filter:1})+headCell('country','col_country',{filter:1})+
    headCell('class','col_class',{filter:1})+headCell('arch','arch',{filter:1})+headCell('form','col_form',{filter:1})+
    headCell('perf','col_perf',{r:1,sort:1})+headCell('memory','col_memory',{})+headCell('power','col_power',{})+
    headCell('price','col_price',{r:1,sort:1})+headCell('release','col_release',{r:1,sort:1})+`</tr></thead>`;
  return {
    table:`<table class="db">${THEAD}<tbody>${products.map(rowS).join('')}</tbody></table>`,
    count:`<b>${products.length}</b> ${escHtml(T.w_products)}`,
    meta:`<span><b>${products.length}</b> ${escHtml(T.w_products)}</span><span><b>${vendorsN}</b> ${escHtml(T.w_vendors)}</span><span><b>${countriesN}</b> ${escHtml(T.w_countries)}</span>`,
  };
}
function jsonldFor(lang){
  const url=langPath(lang);
  return { '@context':'https://schema.org', '@graph':[
    { '@type':'WebSite', '@id':PAGES_URL+'#website', name:'Awesome NPU', url:PAGES_URL, inLanguage:lang, description:seoDesc(lang) },
    { '@type':'BreadcrumbList', '@id':url+'#breadcrumb', itemListElement:[{ '@type':'ListItem', position:1, name:'Awesome NPU', item:PAGES_URL }] },
    { '@type':['CollectionPage','ItemList'], '@id':url+'#catalog', name:SEO_TITLE[lang], url, inLanguage:lang, isPartOf:{ '@id':PAGES_URL+'#website' }, numberOfItems:products.length,
      itemListElement: products.map((p,i)=>({ '@type':'ListItem', position:i+1, item:{ '@type':'Product', '@id':p.page+'#product', name:p.product, url:p.page, sameAs:p.url, brand:{ '@type':'Brand', name:p.vendor }, category:({mcu:'MCU-class NPU',edge:'Edge NPU',datacenter:'Datacenter AI accelerator'}[p.segment]||'NPU') } })) }
  ] };
}

for (const ph of ['<!--__DATA__-->','<!--__META__-->','<!--__COUNT__-->','<!--__TABLE__-->','<!--__ABOUT__-->','<!--__DOCS__-->','<!--__HREFLANG__-->','__LANG__','__DIR__','__TITLE__','__DESC__','__CANONICAL__','__OGTITLE__','__OGLOCALE__','__KEYWORDS__'])
  if (!template.includes(ph)) { console.error(`template.html 자리표시자 누락: ${ph}`); process.exit(1); }
const DATA_JSON = JSON.stringify(DATA).replace(/</g,'\\u003c');
const I18N_JSON = JSON.stringify(I18N).replace(/</g,'\\u003c');

let pageCount = 0;
for (const lang of LANGS){
  const L = I18N[lang];
  const ssr = ssrFor(lang);
  const locked = lang !== 'en';
  const dataScript = `<script>window.DATA=${DATA_JSON};window.I18N=${I18N_JSON};window.__SSRLANG=${JSON.stringify(lang)};window.__LANGLOCK=${locked};</script>`;
  const ldScript = `<script type="application/ld+json">${JSON.stringify(jsonldFor(lang)).replace(/</g,'\\u003c')}</script>`;
  const page = localizeBody(template, L)
    .replace(/__LANG__/g, lang)
    .replace(/__DIR__/g, L._dir || 'ltr')
    .replace(/__TITLE__/g, escHtml(SEO_TITLE[lang]))
    .replace(/__OGTITLE__/g, escHtml(SEO_TITLE[lang]))
    .replace('__OGLOCALE__', OGLOCALE[lang])
    .replace(/__DESC__/g, escHtml(seoDesc(lang)))
    .replace('__KEYWORDS__', escHtml(seoKw(lang)))
    .replace(/__CANONICAL__/g, langPath(lang))
    .replace('<!--__HREFLANG__-->', HREFLANG)
    .replace('<!--__META__-->', ssr.meta)
    .replace('<!--__COUNT__-->', ssr.count)
    .replace('<!--__TABLE__-->', ssr.table)
    .replace('<!--__ABOUT__-->', introHTML)
    .replace('<!--__DOCS__-->', docsHTML)
    .replace('<!--__DATA__-->', dataScript + '\n' + ldScript);
  const outPath = lang === 'en' ? path.join(ROOT,'index.html') : path.join(ROOT, lang, 'index.html');
  fs.mkdirSync(path.dirname(outPath), { recursive:true });
  fs.writeFileSync(outPath, page);
  pageCount++;
}

// ---- 제품/벤더 상세 페이지 생성 (내부 링크 + 원본 자료는 한 단계 더) ----
const TEN = I18N.en;
const regionEN2 = new Intl.DisplayNames(['en'],{type:'region'});
const cnEN = c => { try { return regionEN2.of(c)||c; } catch(e){ return c; } };
const EXTA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const detailCss = `:root{--sans:'Pretendard','Pretendard Variable',sans-serif}
:root[data-theme=dark]{--paper:#0c0b0a;--paper-2:#151311;--field:#1a1815;--ink:#ece7dd;--ink-2:rgba(236,231,221,.66);--ink-3:rgba(236,231,221,.58);--rule:rgba(236,231,221,.14);--rule-2:rgba(236,231,221,.30);--rule-3:rgba(236,231,221,.55);--spot:#ff5a3c;--wash:rgba(236,231,221,.04)}
:root[data-theme=light]{--paper:#f4f1ea;--paper-2:#eeeae1;--field:#ebe7dd;--ink:#17140f;--ink-2:rgba(23,20,15,.68);--ink-3:rgba(23,20,15,.64);--rule:rgba(23,20,15,.16);--rule-2:rgba(23,20,15,.32);--rule-3:rgba(23,20,15,.6);--spot:#d23a1f;--wash:rgba(23,20,15,.035)}
*{box-sizing:border-box}html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased;word-break:keep-all;overflow-wrap:break-word}
body::before{content:"";position:fixed;top:0;inset-inline:0;height:3px;background:var(--spot);z-index:100}
a{color:inherit;text-decoration:none}::selection{background:var(--spot);color:#fff}
.wrap{width:100%;max-width:920px;margin-inline:auto;padding-inline:clamp(16px,4vw,44px)}
.topbar{position:sticky;top:3px;z-index:60;background:var(--paper);border-bottom:1px solid var(--rule)}
.topbar-in{display:flex;align-items:center;height:52px;gap:14px}.wm{font-weight:800;font-size:15px;letter-spacing:-.01em}
.tb-r{margin-inline-start:auto;display:flex;align-items:center;gap:6px}
.dlang{appearance:none;background:none;border:1px solid var(--rule-2);color:var(--ink-2);font-size:12.5px;padding:6px 10px;cursor:pointer;font-family:inherit}
.ibtn{width:34px;height:34px;display:grid;place-items:center;color:var(--ink-2);background:none;border:none;cursor:pointer;font-size:16px}.ibtn:hover{color:var(--ink)}
.ibtn svg{width:17px;height:17px}
main{padding-block:clamp(28px,5vw,52px) 80px}
.bc{font-size:12.5px;color:var(--ink-3);margin-bottom:22px;display:flex;flex-wrap:wrap;gap:7px;align-items:center}
.bc a{color:var(--ink-2);border-bottom:1px solid var(--rule-2)}.bc a:hover{color:var(--spot)}.bc .sep{color:var(--rule-3)}
h1.dt{font-size:clamp(1.9rem,5vw,3rem);line-height:1.05;letter-spacing:-.03em;font-weight:800;margin:0;text-wrap:balance}
.dsub{margin:14px 0 0;font-size:13.5px;color:var(--ink-3)}
.darch{display:flex;flex-wrap:wrap;gap:7px;margin:22px 0 0;align-items:center}
.darch i{font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-style:normal;margin-inline-end:3px}
.darch .at{font-size:12px;color:var(--ink-2);border:1px solid var(--rule-2);padding:3px 10px}
dl.dg{display:grid;grid-template-columns:minmax(120px,190px) 1fr;margin:30px 0 0;border-top:1px solid var(--rule-2)}
dl.dg dt{color:var(--ink-3);font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;padding:13px 0;border-bottom:1px solid var(--rule)}
dl.dg dd{margin:0;color:var(--ink);padding:13px 0 13px 20px;border-bottom:1px solid var(--rule)}
dl.dg dd a{border-bottom:1px solid var(--spot)}dl.dg dd a:hover{color:var(--spot)}
.dnote{margin:26px 0 0;font-size:14px;color:var(--ink-2);line-height:1.72;max-width:72ch}
.dwarn{margin:16px 0 0;font-size:12.5px;color:var(--spot)}
.dcta{display:inline-flex;align-items:center;gap:9px;margin:34px 0 0;background:var(--spot);color:#fff;font-weight:650;font-size:14.5px;padding:14px 22px}
.dcta svg{width:15px;height:15px}.dcta:hover{filter:brightness(1.08)}
.rel{margin:56px 0 0;border-top:1px solid var(--rule-2);padding-top:26px}
.rel h2{font-size:11.5px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin:0 0 16px}
.relg{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,238px),1fr));border-top:1px solid var(--rule);border-inline-start:1px solid var(--rule)}
.relc{border-inline-end:1px solid var(--rule);border-block-end:1px solid var(--rule);padding:16px 18px}
.relc b{font-weight:650;font-size:14px;letter-spacing:-.01em}.relc:hover b{color:var(--spot)}.relc .rs{font-size:12px;color:var(--ink-3);margin-top:5px}
.back{display:inline-block;margin:44px 0 0;font-size:13px;color:var(--ink-2);border-bottom:1px solid var(--spot);padding-bottom:2px}.back:hover{color:var(--spot)}
footer{border-top:1px solid var(--rule-2)}.foot-in{padding-block:30px;font-size:12.5px;color:var(--ink-3)}.foot-in a{color:var(--ink-2);border-bottom:1px solid var(--rule-2)}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}}`;

const FAVICON = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23d23a1f'/%3E%3Ctext x='16' y='23' font-family='Arial,Helvetica,sans-serif' font-size='21' font-weight='700' text-anchor='middle' fill='%23fff'%3EN%3C/text%3E%3C/svg%3E`;
const themeInit = `<script>(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('npu-theme');var t=(q==='light'||q==='dark')?q:(s||(matchMedia&&matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'));document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>`;
const detailScript = `<script>(function(){var I=window.I18N||{en:{}},P=window.__P||{},SUP=['ko','en','ja','zh','es','he'];function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}function det(){try{var q=new URLSearchParams(location.search).get('lang');if(q&&SUP.indexOf(q)>=0)return q;}catch(e){}try{var s=localStorage.getItem('npu-lang');if(s&&SUP.indexOf(s)>=0)return s;}catch(e){}var c=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'en'];for(var i=0;i<c.length;i++){var b=String(c[i]).toLowerCase().split('-')[0];if(b==='iw')b='he';if(b==='zh')return'zh';if(SUP.indexOf(b)>=0)return b;}return'en';}function ap(lang){var L=I[lang]||I.en;document.documentElement.lang=lang;document.documentElement.dir=(L._dir||'ltr');document.querySelectorAll('[data-i18n]').forEach(function(el){var k=el.getAttribute('data-i18n');if(L[k]!=null)el.textContent=L[k];});var nE=document.getElementById('d-note');if(nE&&P.noteI18n){var n=P.noteI18n[lang]||P.noteI18n.en||'';nE.textContent=n;nE.style.display=n?'':'none';}var sE=document.getElementById('d-specs');if(sE&&P.specsI18n){var rows=P.specsI18n[lang]||P.specsI18n.en||[];sE.innerHTML=rows.map(function(kv){return '<dt>'+esc(kv[0])+'</dt><dd>'+esc(kv[1])+'</dd>';}).join('');sE.parentNode&&(sE.style.display=rows.length?'':'none');}var cE=document.getElementById('d-country');if(cE&&P.country){try{cE.textContent=new Intl.DisplayNames([lang],{type:'region'}).of(P.country)||P.country;}catch(e){}}var sel=document.getElementById('dlang');if(sel)sel.value=lang;try{localStorage.setItem('npu-lang',lang);}catch(e){}}var sel=document.getElementById('dlang');if(sel){SUP.forEach(function(lg){var o=document.createElement('option');o.value=lg;o.textContent=(I[lg]&&I[lg]._name)||lg;sel.appendChild(o);});sel.onchange=function(e){ap(e.target.value);};}var tb=document.getElementById('dtheme');function st(t){document.documentElement.setAttribute('data-theme',t);if(tb)tb.innerHTML=t==='dark'?'&#9789;':'&#9728;';try{localStorage.setItem('npu-theme',t);}catch(e){}}if(tb){st(document.documentElement.getAttribute('data-theme')||'dark');tb.onclick=function(){st(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');};}ap(det());})();</script>`;

function pageHead(title, desc, canonical, jsonld){
  return `<!DOCTYPE html><html lang="en" dir="ltr" data-theme="dark"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><meta name="color-scheme" content="dark light">`+
    `<link rel="icon" href="${FAVICON}"><title>${escHtml(title)}</title><meta name="description" content="${escHtml(desc)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${canonical}">`+
    `<meta property="og:type" content="website"><meta property="og:site_name" content="Awesome NPU"><meta property="og:title" content="${escHtml(title)}"><meta property="og:description" content="${escHtml(desc)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${PAGES_URL}og.png">`+
    `<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"><style>${detailCss}</style>${themeInit}`+
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g,'\\u003c')}</script></head><body>`;
}
function topbar(){
  return `<header class="topbar"><div class="wrap topbar-in"><a class="wm" href="${PAGES_URL}">Awesome NPU</a><div class="tb-r"><select id="dlang" class="dlang" aria-label="Language"></select><a class="ibtn" href="${REPO_URL}" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.34 9.34 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"/></svg></a><button id="dtheme" class="ibtn" aria-label="Toggle theme"></button></div></div></header>`;
}
function footerH(){ return `<footer><div class="wrap foot-in"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a> · <a href="${REPO_URL}" target="_blank" rel="noopener">GitHub ↗</a></div></footer>`; }

// 제품 상세 페이지
const bySlugVendor = {}; products.forEach(p=>{ (bySlugVendor[p.vendor]=bySlugVendor[p.vendor]||[]).push(p); });
for (const p of products) {
  const seg = ({mcu:'MCU-class NPU',edge:'Edge NPU',datacenter:'Datacenter AI accelerator'}[p.segment]||'NPU');
  const title = `${p.product} (${p.vendor}) NPU specs | Awesome NPU`;
  const archTxt = (p.arch&&p.arch.length)?p.arch.join(', '):'';
  const desc = `${p.product} by ${p.vendor}: ${archTxt?archTxt+' ':''}${TEN['seg_'+p.segment]} NPU. ${p.computeDisplay&&p.computeDisplay!=='-'?p.computeDisplay+', ':''}${p.memory?p.memory+', ':''}${p.form}. Specs, supported architectures and the official source in the Awesome NPU databook.`.slice(0,300);
  const price = p.priceDisplay==null ? `<span data-i18n="undisclosed">${escHtml(TEN.undisclosed)}</span>` : escHtml(p.priceDisplay);
  const rel = p.releaseDisplay ? escHtml(p.releaseDisplay) : `<span data-i18n="unknown">${escHtml(TEN.unknown)}</span>`;
  const dgRow = (k,v) => `<dt data-i18n="${k}">${escHtml(TEN[k])}</dt><dd>${v}</dd>`;
  const specsSSR = p.specsI18n.en.map(([k,v])=>`<dt>${escHtml(k)}</dt><dd>${escHtml(v)}</dd>`).join('');
  const warn = p.standalone ? '' : `<p class="dwarn" data-i18n="warn_integrated">${escHtml(TEN.warn_integrated)}</p>`;
  const archBlock = (p.arch&&p.arch.length)?`<div class="darch"><i data-i18n="arch">${escHtml(TEN.arch)}</i>${p.arch.map(a=>`<span class="at">${escHtml(a)}</span>`).join('')}</div>`:'';
  const related = (bySlugVendor[p.vendor]||[]).filter(q=>q.id!==p.id).slice(0,6);
  const relBlock = related.length?`<div class="rel"><h2 data-i18n="used_in">More from ${escHtml(p.vendor)}</h2><div class="relg">${related.map(q=>`<a class="relc" href="${q.page}"><b>${escHtml(q.product)}</b><div class="rs">${escHtml([TEN['seg_'+q.segment],q.form,q.computeDisplay!=='-'?q.computeDisplay:''].filter(Boolean).join(' / '))}</div></a>`).join('')}</div></div>`:'';
  const jsonld = { '@context':'https://schema.org','@graph':[
    { '@type':'Product', '@id':p.page+'#product', name:p.product, url:p.page, category:seg, brand:{'@type':'Brand',name:p.vendor}, sameAs:p.url, description:(p.noteI18n.en||desc) },
    { '@type':'BreadcrumbList', itemListElement:[
      {'@type':'ListItem',position:1,name:'Awesome NPU',item:PAGES_URL},
      {'@type':'ListItem',position:2,name:p.vendor,item:p.vpage},
      {'@type':'ListItem',position:3,name:p.product,item:p.page} ] } ] };
  const dataInj = `<script>window.I18N=${JSON.stringify(I18N).replace(/</g,'\\u003c')};window.__P=${JSON.stringify({country:p.country,noteI18n:p.noteI18n,specsI18n:p.specsI18n}).replace(/</g,'\\u003c')};</script>`;
  const html = pageHead(title, desc, p.page, jsonld)+topbar()+
    `<main class="wrap"><nav class="bc"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a><span class="sep">/</span><a href="${p.vpage}">${escHtml(p.vendor)}</a><span class="sep">/</span><span>${escHtml(p.product)}</span></nav>`+
    `<h1 class="dt">${escHtml(p.product)}</h1><div class="dsub">${escHtml([p.vendor, cnEN(p.country), p.chip].filter(Boolean).join(' · '))}</div>${archBlock}`+
    `<dl class="dg">`+
      dgRow('col_vendor',`<a href="${p.vpage}">${escHtml(p.vendor)}</a>`)+
      `<dt data-i18n="col_country">${escHtml(TEN.col_country)}</dt><dd id="d-country">${escHtml(cnEN(p.country))}</dd>`+
      `<dt data-i18n="col_class">${escHtml(TEN.col_class)}</dt><dd data-i18n="seg_${p.segment}">${escHtml(TEN['seg_'+p.segment])}</dd>`+
      dgRow('col_form', escHtml(p.form)+(p.standalone?'':' <span class="dwarn" style="margin:0" data-i18n="integrated">'+escHtml(TEN.integrated)+'</span>'))+
      dgRow('col_perf', escHtml(p.computeDisplay||'-'))+
      dgRow('col_memory', escHtml(p.memory||'-'))+
      dgRow('col_power', escHtml(p.power||'-'))+
      dgRow('col_price', price)+
      dgRow('col_release', rel)+
    `</dl>`+
    `<dl class="dg" id="d-specs"${p.specsI18n.en.length?'':' style="display:none"'}>${specsSSR}</dl>`+
    `<p class="dnote" id="d-note"${p.noteI18n.en?'':' style="display:none"'}>${escHtml(p.noteI18n.en)}</p>${warn}`+
    `<a class="dcta" href="${escHtml(p.url)}" target="_blank" rel="noopener"><span data-i18n="official_page">${escHtml(TEN.official_page||'Visit the official page')}</span>${EXTA}</a>`+
    relBlock+
    `<div><a class="back" href="${PAGES_URL}" data-i18n="back_catalog">${escHtml(TEN.back_catalog||'Back to the catalog')}</a></div>`+
    `</main>`+footerH()+dataInj+detailScript+`</body></html>`;
  const dir = path.join(ROOT,'p',p.slug); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'index.html'), html);
}

// 벤더 상세 페이지
for (const [vendor, vslug] of Object.entries(vendorSlug)) {
  const list = bySlugVendor[vendor]||[];
  const countries = [...new Set(list.map(p=>p.country))];
  const vpage = `${PAGES_URL}v/${vslug}/`;
  const title = `${vendor} NPUs and AI accelerators (${list.length}) | Awesome NPU`;
  const desc = `${vendor} NPU and AI inference accelerator products: ${list.slice(0,8).map(p=>p.product).join(', ')}. Specs, supported architectures and official sources in the Awesome NPU databook.`.slice(0,300);
  const jsonld = { '@context':'https://schema.org','@graph':[
    { '@type':'Brand', '@id':vpage+'#brand', name:vendor, url:vpage },
    { '@type':'BreadcrumbList', itemListElement:[
      {'@type':'ListItem',position:1,name:'Awesome NPU',item:PAGES_URL},
      {'@type':'ListItem',position:2,name:vendor,item:vpage} ] },
    { '@type':'ItemList', numberOfItems:list.length, itemListElement:list.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.product,url:p.page})) } ] };
  const dataInj = `<script>window.I18N=${JSON.stringify(I18N).replace(/</g,'\\u003c')};</script>`;
  const cards = list.map(p=>`<a class="relc" href="${p.page}"><b>${escHtml(p.product)}</b><div class="rs">${escHtml([TEN['seg_'+p.segment],p.form,p.computeDisplay!=='-'?p.computeDisplay:'',(p.arch&&p.arch.join(' · '))].filter(Boolean).join(' / '))}</div></a>`).join('');
  const html = pageHead(title, desc, vpage, jsonld)+topbar()+
    `<main class="wrap"><nav class="bc"><a href="${PAGES_URL}" data-i18n="nav_products">Products</a><span class="sep">/</span><span>${escHtml(vendor)}</span></nav>`+
    `<h1 class="dt">${escHtml(vendor)}</h1><div class="dsub">${escHtml(countries.map(cnEN).join(', '))} · <b>${list.length}</b> <span data-i18n="w_products">${escHtml(TEN.w_products)}</span></div>`+
    `<div class="rel" style="border:none;margin-top:34px;padding:0"><div class="relg">${cards}</div></div>`+
    `<div><a class="back" href="${PAGES_URL}" data-i18n="back_catalog">${escHtml(TEN.back_catalog||'Back to the catalog')}</a></div>`+
    `</main>`+footerH()+dataInj+detailScript+`</body></html>`;
  const dir = path.join(ROOT,'v',vslug); fs.mkdirSync(dir,{recursive:true}); fs.writeFileSync(path.join(dir,'index.html'), html);
}
// 상세 페이지 URL (벤더는 허브 페이지라 우선순위 약간 높게)
const detailEntries = [
  ...Object.values(vendorSlug).map(s=>({loc:`${PAGES_URL}v/${s}/`, pr:'0.7'})),
  ...products.map(p=>({loc:p.page, pr:'0.6'})),
];

// 사이트맵 (모든 언어 URL + hreflang 대체 + 제품/벤더 상세)
const today = new Date().toISOString().slice(0,10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`+
  LANGS.map(lang=>{
    const alts = [`    <xhtml:link rel="alternate" hreflang="x-default" href="${PAGES_URL}"/>`]
      .concat(LANGS.map(l=>`    <xhtml:link rel="alternate" hreflang="${HREFLANG_CODE[l]}" href="${langPath(l)}"/>`)).join('\n');
    return `  <url>\n    <loc>${langPath(lang)}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${lang==='en'?'1.0':'0.8'}</priority>\n${alts}\n  </url>`;
  }).join('\n')+'\n'+
  detailEntries.map(e=>`  <url>\n    <loc>${e.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>${e.pr}</priority>\n  </url>`).join('\n')+
  `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), sitemap);

// 요약
const kr = products.filter(p=>p.origin==='kr').length;
const seg = k => products.filter(p=>p.segment===k).length;
console.log(`✓ 생성 완료: ${pageCount}개 언어 페이지 (index.html + ${LANGS.filter(l=>l!=='en').join('/')}/) + sitemap.xml`);
console.log(`  상세 페이지 ${products.length}개 제품 (/p/) + ${Object.keys(vendorSlug).length}개 벤더 (/v/)`);
console.log(`  제품 ${products.length}종 (Products ${mainProducts.length} + Datacenter ${dcProducts.length})`);
console.log(`  국내 ${kr} · 해외 ${products.length-kr}`);
console.log(`  데이터센터 ${seg('datacenter')} · 엣지 ${seg('edge')} · MCU ${seg('mcu')}`);
console.log(`  보강 병합 ${usedKeys.size}/${Object.keys(ENRICH).length}`);

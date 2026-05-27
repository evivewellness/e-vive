/**
 * E-Vive Scene SVG Generator
 * Creates hero and section illustrations for each page.
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/images/scenes');
fs.mkdirSync(outDir, { recursive: true });

// Brand colours
const C = {
  forest: '#003580', jade: '#004A99', mint: '#84BD60', gold: '#E8845A',
  sky: '#38bdf8', cream: '#FFFDF8', darkBg: '#0f2035',
  skin1: '#C68642', skin2: '#9A6428', skin3: '#6B3A2A', skin4: '#3D1F0A',
  hair: '#1a0a00', uniform1: '#1a5276', uniform2: '#006064',
};

/* ─────────────────────────────────────────────────────────────────────────────
   1. HOMEPAGE HERO — "Care at Home"
   Wide 1200×520 scene: warm living room, HCA tending to seated elderly patient
───────────────────────────────────────────────────────────────────────────── */
const heroHome = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 520" width="1200" height="520">
<defs>
  <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f5ede0"/>
    <stop offset="100%" stop-color="#e8d5b8"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#c4a882"/>
    <stop offset="100%" stop-color="#a8855a"/>
  </linearGradient>
  <linearGradient id="win-light" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fff9e6" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="#ffe082" stop-opacity="0.3"/>
  </linearGradient>
  <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#87ceeb"/>
    <stop offset="100%" stop-color="#e0f4ff"/>
  </linearGradient>
  <linearGradient id="jade-uniform" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#1a5276"/>
    <stop offset="100%" stop-color="#154360"/>
  </linearGradient>
  <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="130%">
    <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="rgba(0,0,0,0.15)"/>
  </filter>
  <clipPath id="scene-clip"><rect width="1200" height="520" rx="16"/></clipPath>
</defs>
<g clip-path="url(#scene-clip)">

  <!-- Wall -->
  <rect width="1200" height="520" fill="url(#wall)"/>
  <!-- Floor -->
  <rect y="390" width="1200" height="130" fill="url(#floor)"/>
  <!-- Baseboard -->
  <rect y="388" width="1200" height="6" fill="#b8956a" opacity="0.7"/>

  <!-- ── Window left ── -->
  <rect x="60" y="40" width="220" height="300" rx="6" fill="url(#win-light)" stroke="#d4b896" stroke-width="3"/>
  <rect x="60" y="40" width="220" height="300" rx="6" fill="url(#sky-grad)" opacity="0.6"/>
  <!-- Window panes -->
  <rect x="60" y="40" width="220" height="300" rx="6" fill="none" stroke="#d4b896" stroke-width="3"/>
  <line x1="170" y1="40" x2="170" y2="340" stroke="#d4b896" stroke-width="2.5"/>
  <line x1="60" y1="190" x2="280" y2="190" stroke="#d4b896" stroke-width="2.5"/>
  <!-- Window light beam -->
  <polygon points="280,40 280,340 480,390 480,0" fill="rgba(255,240,180,0.15)"/>
  <!-- Curtain left -->
  <path d="M40,30 Q58,180 50,340 L70,340 Q78,180 60,30 Z" fill="#e8c9a0" opacity="0.9"/>
  <!-- Curtain right -->
  <path d="M280,30 Q298,180 290,340 L310,340 Q302,180 320,30 Z" fill="#e8c9a0" opacity="0.9"/>
  <!-- Curtain tie-back left -->
  <ellipse cx="55" cy="200" rx="12" ry="8" fill="#d4a870"/>
  <!-- Curtain tie-back right -->
  <ellipse cx="305" cy="200" rx="12" ry="8" fill="#d4a870"/>

  <!-- ── Potted plant ── -->
  <!-- Pot -->
  <path d="M160,388 L180,340 L230,340 L250,388 Z" fill="#c0694a"/>
  <rect x="155" y="382" width="100" height="10" rx="4" fill="#a85a38"/>
  <!-- Soil -->
  <ellipse cx="205" cy="340" rx="28" ry="8" fill="#5c3317"/>
  <!-- Stem 1 -->
  <path d="M205,340 Q190,290 170,250" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Stem 2 -->
  <path d="M205,340 Q215,280 240,240" stroke="#2e7d32" stroke-width="5" fill="none" stroke-linecap="round"/>
  <!-- Stem 3 -->
  <path d="M205,340 Q205,270 195,220" stroke="#1b5e20" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Leaves -->
  <ellipse cx="165" cy="245" rx="32" ry="18" fill="#43a047" transform="rotate(-30 165 245)"/>
  <ellipse cx="243" cy="235" rx="32" ry="18" fill="#388e3c" transform="rotate(25 243 235)"/>
  <ellipse cx="192" cy="215" rx="28" ry="16" fill="#4caf50" transform="rotate(-10 192 215)"/>
  <ellipse cx="220" cy="200" rx="22" ry="14" fill="#66bb6a" transform="rotate(15 220 200)"/>

  <!-- ── Armchair ── -->
  <!-- Back -->
  <rect x="420" y="200" width="220" height="190" rx="22" fill="#7b5ea7" filter="url(#soft-shadow)"/>
  <!-- Seat -->
  <rect x="410" y="310" width="240" height="80" rx="16" fill="#6a4d96"/>
  <!-- Left arm -->
  <rect x="400" y="270" width="40" height="120" rx="14" fill="#7b5ea7"/>
  <!-- Right arm -->
  <rect x="620" y="270" width="40" height="120" rx="14" fill="#7b5ea7"/>
  <!-- Chair legs -->
  <rect x="420" y="378" width="16" height="30" rx="5" fill="#5a3f80"/>
  <rect x="618" y="378" width="16" height="30" rx="5" fill="#5a3f80"/>
  <!-- Chair cushion highlight -->
  <ellipse cx="530" cy="318" rx="80" ry="16" fill="rgba(255,255,255,0.08)"/>

  <!-- ── Elderly patient (seated in chair) ── -->
  <!-- Body / clothing -->
  <ellipse cx="530" cy="355" rx="64" ry="36" fill="#8B7355"/>
  <rect x="490" y="285" width="80" height="80" rx="18" fill="#8B7355"/>
  <!-- Collar/neckline detail -->
  <path d="M510,285 L530,300 L550,285" fill="rgba(255,255,255,0.15)"/>
  <!-- Left arm resting on chair arm -->
  <path d="M490,330 Q450,340 418,350" stroke="#7B6545" stroke-width="22" fill="none" stroke-linecap="round"/>
  <!-- Right arm resting -->
  <path d="M570,330 Q610,342 622,352" stroke="#7B6545" stroke-width="22" fill="none" stroke-linecap="round"/>
  <!-- Hands -->
  <ellipse cx="418" cy="354" rx="14" ry="10" fill="#9A6428"/>
  <ellipse cx="624" cy="355" rx="14" ry="10" fill="#9A6428"/>
  <!-- Neck -->
  <rect x="515" y="272" width="30" height="22" rx="6" fill="#9A6428"/>
  <!-- Head -->
  <ellipse cx="530" cy="250" rx="36" ry="40" fill="#9A6428"/>
  <!-- Ear left -->
  <ellipse cx="494" cy="253" rx="7" ry="10" fill="#8B7355"/>
  <!-- Ear right -->
  <ellipse cx="566" cy="253" rx="7" ry="10" fill="#8B7355"/>
  <!-- Hair (white/salt) -->
  <ellipse cx="530" cy="218" rx="34" ry="16" fill="#b0a090"/>
  <rect x="496" y="218" width="68" height="12" rx="8" fill="#b0a090"/>
  <!-- Face shadow -->
  <ellipse cx="530" cy="260" rx="22" ry="16" fill="rgba(0,0,0,0.06)"/>
  <!-- Eyes (warm, kind, slightly squinted — older) -->
  <ellipse cx="516" cy="244" rx="7" ry="5" fill="white"/>
  <ellipse cx="544" cy="244" rx="7" ry="5" fill="white"/>
  <circle cx="516" cy="244" r="4" fill="#1a0a00"/>
  <circle cx="544" cy="244" r="4" fill="#1a0a00"/>
  <circle cx="517.5" cy="242.5" r="1.3" fill="white" opacity="0.85"/>
  <circle cx="545.5" cy="242.5" r="1.3" fill="white" opacity="0.85"/>
  <!-- Wrinkle lines -->
  <path d="M503,238 Q509,236 515,238" stroke="rgba(100,60,20,0.3)" stroke-width="1" fill="none"/>
  <path d="M545,238 Q551,236 557,238" stroke="rgba(100,60,20,0.3)" stroke-width="1" fill="none"/>
  <!-- Eyebrows (greying) -->
  <path d="M506,236 Q516,231 522,234" stroke="#8a7060" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M538,234 Q544,231 554,236" stroke="#8a7060" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <ellipse cx="530" cy="258" rx="5" ry="3.5" fill="rgba(100,60,20,0.3)"/>
  <!-- Warm smile -->
  <path d="M517,268 Q530,278 543,268" stroke="rgba(100,60,20,0.4)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── HCA (standing, slightly behind/beside) ── -->
  <!-- Shadow on floor -->
  <ellipse cx="700" cy="400" rx="52" ry="12" fill="rgba(0,0,0,0.12)"/>
  <!-- Legs -->
  <rect x="672" y="330" width="22" height="80" rx="8" fill="#1a3a5c"/>
  <rect x="706" y="330" width="22" height="80" rx="8" fill="#1a3a5c"/>
  <!-- Shoes -->
  <ellipse cx="683" cy="412" rx="16" ry="7" fill="#1a1a2e"/>
  <ellipse cx="717" cy="412" rx="16" ry="7" fill="#1a1a2e"/>
  <!-- Body/uniform (scrubs) -->
  <rect x="652" y="190" width="97" height="150" rx="18" fill="url(#jade-uniform)" filter="url(#soft-shadow)"/>
  <!-- Uniform pocket -->
  <rect x="720" y="230" width="22" height="16" rx="4" fill="rgba(255,255,255,0.15)"/>
  <!-- ID badge -->
  <rect x="658" y="224" width="28" height="18" rx="4" fill="white" opacity="0.85"/>
  <rect x="661" y="228" width="22" height="2" rx="1" fill="#004A99"/>
  <rect x="661" y="232" width="16" height="2" rx="1" fill="#84BD60"/>
  <!-- Left arm reaching toward patient -->
  <path d="M652,220 Q600,260 580,300" stroke="#154360" stroke-width="26" fill="none" stroke-linecap="round"/>
  <!-- Left hand -->
  <ellipse cx="577" cy="305" rx="16" ry="12" fill="#C68642"/>
  <!-- Right arm down -->
  <path d="M748,220 Q762,270 758,310" stroke="#154360" stroke-width="24" fill="none" stroke-linecap="round"/>
  <!-- Right hand holding small cup -->
  <ellipse cx="760" cy="316" rx="14" ry="11" fill="#C68642"/>
  <!-- Cup -->
  <rect x="752" y="308" width="18" height="18" rx="5" fill="white" opacity="0.9"/>
  <rect x="754" y="305" width="14" height="5" rx="2" fill="#e0e0e0"/>
  <!-- Neck -->
  <rect x="685" y="172" width="32" height="26" rx="7" fill="#C68642"/>
  <!-- Head -->
  <ellipse cx="701" cy="148" rx="38" ry="42" fill="#C68642"/>
  <!-- Ear left -->
  <ellipse cx="663" cy="150" rx="8" ry="11" fill="#B57A35"/>
  <!-- Ear right -->
  <ellipse cx="739" cy="150" rx="8" ry="11" fill="#B57A35"/>
  <!-- Hair — braids pulled back -->
  <ellipse cx="701" cy="114" rx="36" ry="18" fill="#1a0a00"/>
  <rect x="665" y="116" width="72" height="14" rx="8" fill="#1a0a00"/>
  <ellipse cx="701" cy="110" rx="22" ry="10" fill="#2a1208"/>
  <!-- Face shadow -->
  <ellipse cx="701" cy="162" rx="24" ry="18" fill="rgba(0,0,0,0.05)"/>
  <!-- Eyes (focused, caring) -->
  <ellipse cx="686" cy="140" rx="7.5" ry="6" fill="white"/>
  <ellipse cx="716" cy="140" rx="7.5" ry="6" fill="white"/>
  <circle cx="686" cy="140" r="4.5" fill="#1a0a00"/>
  <circle cx="716" cy="140" r="4.5" fill="#1a0a00"/>
  <circle cx="687.8" cy="138.5" r="1.5" fill="white" opacity="0.9"/>
  <circle cx="717.8" cy="138.5" r="1.5" fill="white" opacity="0.9"/>
  <!-- Eyebrows (HCA — focused/friendly) -->
  <path d="M676,130 Q686,124 694,128" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M708,128 Q716,124 726,130" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <ellipse cx="701" cy="154" rx="5.5" ry="3.8" fill="rgba(100,60,20,0.3)"/>
  <!-- Gentle professional smile -->
  <path d="M688,166 Q701,176 714,166" stroke="rgba(100,60,20,0.5)" stroke-width="2.2" fill="none" stroke-linecap="round"/>

  <!-- ── Side table ── -->
  <rect x="755" y="340" width="90" height="60" rx="6" fill="#a8855a"/>
  <rect x="748" y="335" width="104" height="12" rx="5" fill="#c4a882"/>
  <!-- Legs -->
  <rect x="760" y="388" width="10" height="20" rx="3" fill="#9a7550"/>
  <rect x="824" y="388" width="10" height="20" rx="3" fill="#9a7550"/>
  <!-- Items on table -->
  <!-- Medicine bottle -->
  <rect x="780" y="308" width="16" height="28" rx="5" fill="#e8845a"/>
  <rect x="780" y="305" width="16" height="6" rx="2" fill="#d4704a"/>
  <rect x="783" y="316" width="10" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
  <!-- Glass of water -->
  <rect x="806" y="314" width="14" height="22" rx="3" fill="rgba(135,206,235,0.7)" stroke="#90caf9" stroke-width="1"/>
  <!-- Notebook -->
  <rect x="764" y="335" width="52" height="4" rx="2" fill="#84BD60" opacity="0.8"/>

  <!-- ── Bookshelf (right background) ── -->
  <rect x="940" y="100" width="200" height="280" rx="6" fill="#8B6914" opacity="0.5"/>
  <rect x="940" y="100" width="200" height="280" rx="6" fill="none" stroke="#7a5c10" stroke-width="2" opacity="0.5"/>
  <!-- Shelf lines -->
  <line x1="940" y1="180" x2="1140" y2="180" stroke="#7a5c10" stroke-width="2" opacity="0.4"/>
  <line x1="940" y1="260" x2="1140" y2="260" stroke="#7a5c10" stroke-width="2" opacity="0.4"/>
  <!-- Books row 1 -->
  <rect x="952" y="110" width="24" height="65" rx="2" fill="#004A99" opacity="0.7"/>
  <rect x="978" y="118" width="20" height="57" rx="2" fill="#E8845A" opacity="0.7"/>
  <rect x="1000" y="113" width="18" height="62" rx="2" fill="#84BD60" opacity="0.7"/>
  <rect x="1020" y="115" width="22" height="60" rx="2" fill="#7b5ea7" opacity="0.7"/>
  <rect x="1044" y="110" width="16" height="65" rx="2" fill="#E8845A" opacity="0.6"/>
  <rect x="1062" y="116" width="20" height="59" rx="2" fill="#004A99" opacity="0.6"/>
  <rect x="1084" y="112" width="18" height="63" rx="2" fill="#84BD60" opacity="0.65"/>
  <rect x="1104" y="117" width="24" height="58" rx="2" fill="#880e4f" opacity="0.6"/>
  <!-- Books row 2 -->
  <rect x="952" y="192" width="26" height="60" rx="2" fill="#1b5e20" opacity="0.7"/>
  <rect x="980" y="196" width="20" height="56" rx="2" fill="#004A99" opacity="0.65"/>
  <rect x="1002" y="192" width="16" height="60" rx="2" fill="#E8845A" opacity="0.7"/>
  <rect x="1020" y="195" width="24" height="57" rx="2" fill="#84BD60" opacity="0.6"/>
  <rect x="1046" y="192" width="18" height="60" rx="2" fill="#7b5ea7" opacity="0.65"/>
  <rect x="1066" y="195" width="22" height="57" rx="2" fill="#880e4f" opacity="0.6"/>
  <rect x="1090" y="192" width="18" height="60" rx="2" fill="#1b5e20" opacity="0.65"/>
  <!-- Frame on shelf -->
  <rect x="970" y="270" width="58" height="44" rx="4" fill="#c9a84c" opacity="0.8"/>
  <rect x="975" y="275" width="48" height="34" rx="2" fill="#e8d5b8" opacity="0.9"/>
  <!-- Vase on shelf -->
  <path d="M1070,268 Q1058,275 1060,310 L1088,310 Q1090,275 1078,268 Z" fill="#c0694a" opacity="0.7"/>
  <ellipse cx="1074" cy="268" rx="8" ry="4" fill="#b05a3a" opacity="0.7"/>
  <!-- Flowers in vase -->
  <circle cx="1060" cy="256" r="10" fill="#E8845A" opacity="0.8"/>
  <circle cx="1074" cy="248" r="11" fill="#84BD60" opacity="0.8"/>
  <circle cx="1088" cy="256" r="10" fill="#E8845A" opacity="0.75"/>

  <!-- ── E-Vive logo mark (top right) ── -->
  <rect x="1060" y="24" width="120" height="44" rx="10" fill="rgba(0,53,128,0.85)"/>
  <text x="1076" y="50" font-family="Georgia,serif" font-size="20" font-weight="bold" fill="white" letter-spacing="1">e-vive</text>
  <rect x="1060" y="68" width="120" height="3" rx="1" fill="#84BD60" opacity="0.7"/>

  <!-- ── E-Vive accent strip ── -->
  <rect x="0" y="510" width="1200" height="10" fill="url(#jade-uniform)" opacity="0.8"/>
  <rect x="0" y="510" width="400" height="10" fill="#84BD60" opacity="0.6"/>
  <rect x="400" y="510" width="400" height="10" fill="#E8845A" opacity="0.5"/>

</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   2. ABOUT / FOUNDER STORY — "A Family's Journey"
   480×420: Elderly father with adult daughter caring for him
───────────────────────────────────────────────────────────────────────────── */
const founderStory = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 420" width="480" height="420">
<defs>
  <linearGradient id="fs-bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f5ede0"/>
    <stop offset="100%" stop-color="#e0c9a8"/>
  </linearGradient>
  <linearGradient id="fs-floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#c4a882"/>
    <stop offset="100%" stop-color="#9a7550"/>
  </linearGradient>
  <clipPath id="fs-clip"><rect width="480" height="420" rx="16"/></clipPath>
</defs>
<g clip-path="url(#fs-clip)">
  <rect width="480" height="420" fill="url(#fs-bg)"/>
  <rect y="330" width="480" height="90" fill="url(#fs-floor)"/>
  <rect y="328" width="480" height="5" fill="#b8956a" opacity="0.6"/>

  <!-- Window -->
  <rect x="320" y="30" width="140" height="200" rx="5" fill="#ddf0ff" opacity="0.85" stroke="#c4a882" stroke-width="2"/>
  <line x1="390" y1="30" x2="390" y2="230" stroke="#c4a882" stroke-width="2"/>
  <line x1="320" y1="130" x2="460" y2="130" stroke="#c4a882" stroke-width="2"/>
  <!-- light beam -->
  <polygon points="460,30 460,230 290,280 290,0" fill="rgba(255,240,180,0.12)"/>

  <!-- Small table -->
  <rect x="60" y="270" width="100" height="65" rx="5" fill="#a8855a"/>
  <rect x="52" y="265" width="116" height="10" rx="4" fill="#c4a882"/>
  <rect x="65" y="325" width="10" height="20" rx="3" fill="#9a7550"/>
  <rect x="140" y="325" width="10" height="20" rx="3" fill="#9a7550"/>
  <!-- Tea cup on table -->
  <rect x="88" y="240" width="24" height="20" rx="5" fill="white" opacity="0.9" stroke="#ddd" stroke-width="1"/>
  <path d="M112,248 Q122,248 122,256 Q122,264 112,264" fill="none" stroke="#ccc" stroke-width="2"/>
  <!-- Steam -->
  <path d="M96,236 Q98,228 96,220" stroke="#ccc" stroke-width="1.5" fill="none" opacity="0.6"/>
  <path d="M104,234 Q106,224 104,216" stroke="#ccc" stroke-width="1.5" fill="none" opacity="0.6"/>
  <!-- Medicine bottle -->
  <rect x="118" y="238" width="14" height="24" rx="4" fill="#E8845A"/>
  <rect x="119" y="234" width="12" height="6" rx="2" fill="#d4704a"/>

  <!-- ── Elderly father (seated) ── -->
  <!-- Chair -->
  <rect x="180" y="200" width="160" height="130" rx="14" fill="#5c4a3a"/>
  <rect x="168" y="260" width="30" height="90" rx="12" fill="#5c4a3a"/>
  <rect x="322" y="260" width="30" height="90" rx="12" fill="#5c4a3a"/>
  <rect x="172" y="315" width="20" height="30" rx="4" fill="#4a3828"/>
  <rect x="328" y="315" width="20" height="30" rx="4" fill="#4a3828"/>
  <!-- Body -->
  <ellipse cx="260" cy="300" rx="60" ry="35" fill="#6b5038"/>
  <rect x="220" y="245" width="80" height="70" rx="14" fill="#6b5038"/>
  <!-- Arms -->
  <path d="M220,280 Q185,295 172,310" stroke="#5e4530" stroke-width="20" fill="none" stroke-linecap="round"/>
  <path d="M300,280 Q335,295 348,312" stroke="#5e4530" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="170" cy="315" rx="13" ry="9" fill="#9A6428"/>
  <ellipse cx="350" cy="316" rx="13" ry="9" fill="#9A6428"/>
  <!-- Neck -->
  <rect x="247" y="232" width="26" height="20" rx="6" fill="#9A6428"/>
  <!-- Head -->
  <ellipse cx="260" cy="210" rx="34" ry="38" fill="#9A6428"/>
  <!-- Ears -->
  <ellipse cx="226" cy="212" rx="6.5" ry="9" fill="#8B6428"/>
  <ellipse cx="294" cy="212" rx="6.5" ry="9" fill="#8B6428"/>
  <!-- Salt-and-pepper hair -->
  <ellipse cx="260" cy="178" rx="32" ry="14" fill="#7a6a60"/>
  <rect x="228" y="180" width="64" height="12" rx="7" fill="#7a6a60"/>
  <!-- Eyes (warm, slightly tired — elder) -->
  <ellipse cx="247" cy="205" rx="6" ry="5" fill="white"/>
  <ellipse cx="273" cy="205" rx="6" ry="5" fill="white"/>
  <circle cx="247" cy="205" r="3.5" fill="#2a1208"/>
  <circle cx="273" cy="205" r="3.5" fill="#2a1208"/>
  <!-- Eyebrows — elder -->
  <path d="M238,196 Q247,191 254,195" stroke="#6a5040" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M266,195 Q273,191 282,196" stroke="#6a5040" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <ellipse cx="260" cy="218" rx="5" ry="3.5" fill="rgba(100,60,20,0.28)"/>
  <!-- Warm gentle smile -->
  <path d="M249,228 Q260,236 271,228" stroke="rgba(100,60,20,0.38)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── Salome / daughter (kneeling/leaning beside) ── -->
  <!-- Body -->
  <ellipse cx="380" cy="330" rx="50" ry="28" fill="#7c3aed" opacity="0.9"/>
  <rect x="352" y="248" width="72" height="92" rx="14" fill="#7c3aed"/>
  <!-- Arm reaching to father (tender gesture) -->
  <path d="M352,270 Q310,290 300,308" stroke="#6a30cc" stroke-width="22" fill="none" stroke-linecap="round"/>
  <ellipse cx="296" cy="314" rx="14" ry="10" fill="#C68642"/>
  <!-- Right arm down -->
  <path d="M424,270 Q438,305 436,335" stroke="#6a30cc" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="436" cy="340" rx="13" ry="9" fill="#C68642"/>
  <!-- Neck -->
  <rect x="371" y="234" width="26" height="22" rx="6" fill="#C68642"/>
  <!-- Head -->
  <ellipse cx="384" cy="212" rx="34" ry="38" fill="#C68642"/>
  <!-- Ears -->
  <ellipse cx="350" cy="214" rx="6.5" ry="9" fill="#B57A35"/>
  <ellipse cx="418" cy="214" rx="6.5" ry="9" fill="#B57A35"/>
  <!-- Natural hair, updo -->
  <ellipse cx="384" cy="182" rx="30" ry="16" fill="#1a0a00"/>
  <circle cx="384" cy="168" rx="14" ry="14" fill="#1a0a00"/>
  <ellipse cx="360" cy="196" rx="9" ry="12" fill="#1a0a00"/>
  <ellipse cx="408" cy="196" rx="9" ry="12" fill="#1a0a00"/>
  <!-- Eyes (Salome — focused, caring) -->
  <ellipse cx="372" cy="207" rx="6.5" ry="5.5" fill="white"/>
  <ellipse cx="396" cy="207" rx="6.5" ry="5.5" fill="white"/>
  <circle cx="372" cy="207" r="4" fill="#1a0a00"/>
  <circle cx="396" cy="207" r="4" fill="#1a0a00"/>
  <circle cx="373.5" cy="205.5" r="1.3" fill="white" opacity="0.9"/>
  <circle cx="397.5" cy="205.5" r="1.3" fill="white" opacity="0.9"/>
  <!-- Eyebrows -->
  <path d="M363,197 Q372,191 379,196" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M389,196 Q396,191 405,197" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <!-- Nose -->
  <ellipse cx="384" cy="220" rx="5" ry="3.5" fill="rgba(100,60,20,0.3)"/>
  <!-- Empathetic smile -->
  <path d="M373,232 Q384,242 395,232" stroke="rgba(100,60,20,0.45)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── Quote / story caption ── -->
  <rect x="20" y="358" width="440" height="46" rx="10" fill="rgba(0,53,128,0.82)"/>
  <text x="40" y="377" font-family="Georgia,serif" font-style="italic" font-size="11.5" fill="rgba(255,255,255,0.9)">"When my father needed care at home, I couldn't find a system that worked.</text>
  <text x="40" y="393" font-family="Georgia,serif" font-style="italic" font-size="11.5" fill="rgba(255,255,255,0.9)">I built E-Vive so no family goes through that alone." — Salome Mburu</text>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   3. ASSISTANTS HERO — "The Professional HCA"
   600×500: Confident HCA with digital tablet, professional setting
───────────────────────────────────────────────────────────────────────────── */
const assistantsHero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
<defs>
  <linearGradient id="ah-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#003580"/>
    <stop offset="100%" stop-color="#004A99"/>
  </linearGradient>
  <linearGradient id="ah-card" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="rgba(255,255,255,0.12)"/>
    <stop offset="100%" stop-color="rgba(255,255,255,0.05)"/>
  </linearGradient>
  <linearGradient id="ah-floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#002060"/>
    <stop offset="100%" stop-color="#001540"/>
  </linearGradient>
  <clipPath id="ah-clip"><rect width="600" height="500" rx="16"/></clipPath>
</defs>
<g clip-path="url(#ah-clip)">
  <rect width="600" height="500" fill="url(#ah-bg)"/>
  <!-- Floor -->
  <rect y="430" width="600" height="70" fill="url(#ah-floor)"/>
  <rect y="428" width="600" height="4" fill="rgba(132,189,96,0.4)"/>

  <!-- Background circles (decorative) -->
  <circle cx="480" cy="80" r="120" fill="rgba(132,189,96,0.06)"/>
  <circle cx="480" cy="80" r="80" fill="rgba(132,189,96,0.06)"/>
  <circle cx="100" cy="400" r="90" fill="rgba(232,132,90,0.06)"/>

  <!-- ── Stats cards floating (background) ── -->
  <rect x="380" y="160" width="190" height="80" rx="14" fill="url(#ah-card)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="400" y="192" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="#84BD60">KES 45K+</text>
  <text x="400" y="212" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.7)">Avg monthly earnings (top tier)</text>
  <rect x="385" y="225" width="100" height="3" rx="1.5" fill="rgba(132,189,96,0.5)"/>

  <rect x="380" y="260" width="190" height="76" rx="14" fill="url(#ah-card)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="400" y="292" font-family="Georgia,serif" font-size="26" font-weight="bold" fill="#E8845A">850+</text>
  <text x="400" y="310" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.7)">Active HCAs on the platform</text>

  <rect x="380" y="356" width="190" height="76" rx="14" fill="url(#ah-card)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <text x="400" y="388" font-family="Georgia,serif" font-size="26" font-weight="bold" fill="white">4.8★</text>
  <text x="400" y="406" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.7)">Average care rating nationwide</text>

  <!-- Vertical accent line -->
  <rect x="368" y="160" width="4" height="272" rx="2" fill="rgba(132,189,96,0.35)"/>

  <!-- ── HCA figure (center-left) ── -->
  <!-- Floor shadow -->
  <ellipse cx="230" cy="444" rx="70" ry="14" fill="rgba(0,0,0,0.3)"/>
  <!-- Legs -->
  <rect x="198" y="350" width="26" height="104" rx="10" fill="#0d2d5c"/>
  <rect x="238" y="350" width="26" height="104" rx="10" fill="#0d2d5c"/>
  <!-- Shoes -->
  <ellipse cx="211" cy="456" rx="20" ry="8" fill="#0a1a35"/>
  <ellipse cx="251" cy="456" rx="20" ry="8" fill="#0a1a35"/>
  <!-- Body (teal scrubs) -->
  <rect x="172" y="185" width="118" height="178" rx="20" fill="#006064"/>
  <!-- Scrub detail -->
  <path d="M196,212 L231,230 L266,212" fill="rgba(255,255,255,0.08)"/>
  <!-- Name badge -->
  <rect x="182" y="228" width="34" height="22" rx="5" fill="white" opacity="0.9"/>
  <rect x="186" y="233" width="26" height="2" rx="1" fill="#004A99"/>
  <rect x="186" y="237" width="20" height="2" rx="1" fill="#84BD60"/>
  <rect x="186" y="241" width="14" height="2" rx="1" fill="#004A99" opacity="0.5"/>
  <!-- Pocket -->
  <rect x="244" y="228" width="30" height="22" rx="5" fill="rgba(0,0,0,0.1)"/>
  <path d="M248,230 Q259,225 270,230" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <!-- Left arm (holding tablet) -->
  <path d="M172,210 Q148,250 140,290" stroke="#004d4d" stroke-width="30" fill="none" stroke-linecap="round"/>
  <!-- Tablet -->
  <rect x="100" y="265" width="72" height="96" rx="8" fill="#1a1a2e" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
  <rect x="106" y="272" width="60" height="80" rx="4" fill="#003580"/>
  <!-- App UI on tablet -->
  <rect x="110" y="276" width="52" height="6" rx="2" fill="#84BD60" opacity="0.8"/>
  <rect x="110" y="287" width="38" height="4" rx="1.5" fill="rgba(255,255,255,0.4)"/>
  <rect x="110" y="295" width="44" height="4" rx="1.5" fill="rgba(255,255,255,0.25)"/>
  <!-- Mini HCA profile card on tablet -->
  <rect x="110" y="305" width="52" height="38" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" stroke-width="0.5"/>
  <circle cx="120" cy="317" r="7" fill="#84BD60" opacity="0.8"/>
  <rect x="131" y="312" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.6)"/>
  <rect x="131" y="318" width="18" height="2.5" rx="1.2" fill="rgba(255,255,255,0.4)"/>
  <rect x="131" y="323" width="22" height="2.5" rx="1.2" fill="#84BD60" opacity="0.7"/>
  <!-- Green status dot on tablet -->
  <circle cx="154" cy="312" r="4" fill="#4caf50"/>
  <!-- Right arm (down, confident pose) -->
  <path d="M290,215 Q308,260 306,300" stroke="#004d4d" stroke-width="28" fill="none" stroke-linecap="round"/>
  <ellipse cx="305" cy="308" rx="18" ry="12" fill="#9A6428"/>
  <!-- Left hand on tablet -->
  <ellipse cx="138" cy="295" rx="16" ry="11" fill="#9A6428"/>
  <!-- Neck -->
  <rect x="218" y="168" width="26" height="26" rx="7" fill="#C68642"/>
  <!-- Head -->
  <ellipse cx="231" cy="144" rx="40" ry="44" fill="#C68642"/>
  <!-- Ears -->
  <ellipse cx="191" cy="147" rx="8" ry="11" fill="#B57A35"/>
  <ellipse cx="271" cy="147" rx="8" ry="11" fill="#B57A35"/>
  <!-- Hair — braids updo, confident -->
  <ellipse cx="231" cy="106" rx="38" ry="18" fill="#1a0a00"/>
  <circle cx="231" cy="94" rx="18" ry="18" fill="#1a0a00"/>
  <ellipse cx="204" cy="122" rx="12" ry="16" fill="#1a0a00"/>
  <ellipse cx="258" cy="122" rx="12" ry="16" fill="#1a0a00"/>
  <!-- Confident expression -->
  <ellipse cx="217" cy="138" rx="8" ry="7" fill="white"/>
  <ellipse cx="245" cy="138" rx="8" ry="7" fill="white"/>
  <circle cx="217" cy="138" r="5" fill="#1a0a00"/>
  <circle cx="245" cy="138" r="5" fill="#1a0a00"/>
  <circle cx="219" cy="136.5" r="1.7" fill="white" opacity="0.9"/>
  <circle cx="247" cy="136.5" r="1.7" fill="white" opacity="0.9"/>
  <path d="M206,127 Q217,120 224,125" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M238,125 Q245,120 256,127" stroke="#1a0a00" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="231" cy="154" rx="6" ry="4" fill="rgba(100,60,20,0.3)"/>
  <!-- Confident smile -->
  <path d="M218,166 Q231,178 244,166" stroke="rgba(100,60,20,0.5)" stroke-width="2.5" fill="none" stroke-linecap="round"/>

  <!-- ── Logo / branding ── -->
  <text x="36" y="56" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="white" letter-spacing="2">e-vive</text>
  <rect x="36" y="62" width="80" height="3" rx="1.5" fill="#84BD60"/>
  <text x="36" y="82" font-family="Arial,sans-serif" font-size="11" fill="rgba(255,255,255,0.6)" letter-spacing="1">HOMECARE PLATFORM</text>

  <!-- Mint accent bottom -->
  <rect x="0" y="490" width="600" height="10" fill="#84BD60" opacity="0.3"/>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   4. CAREGIVERS HERO — "Family Supporting Family"
   600×400: Caregiver daughter and elderly mother, warm scene
───────────────────────────────────────────────────────────────────────────── */
const caregiverHero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="600" height="400">
<defs>
  <linearGradient id="cg-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#fff8f0"/>
    <stop offset="100%" stop-color="#ffe8d0"/>
  </linearGradient>
  <clipPath id="cg-clip"><rect width="600" height="400" rx="16"/></clipPath>
</defs>
<g clip-path="url(#cg-clip)">
  <rect width="600" height="400" fill="url(#cg-bg)"/>
  <!-- Floor -->
  <rect y="325" width="600" height="75" fill="#c4a882" opacity="0.45"/>
  <rect y="323" width="600" height="4" fill="#b8956a" opacity="0.4"/>

  <!-- Sofa background -->
  <rect x="100" y="195" width="400" height="140" rx="20" fill="#e8845a" opacity="0.75"/>
  <rect x="86" y="250" width="44" height="90" rx="16" fill="#e8845a" opacity="0.7"/>
  <rect x="470" y="250" width="44" height="90" rx="16" fill="#e8845a" opacity="0.7"/>
  <!-- Sofa cushion lines -->
  <rect x="100" y="265" width="170" height="6" rx="3" fill="rgba(0,0,0,0.06)"/>
  <rect x="330" y="265" width="170" height="6" rx="3" fill="rgba(0,0,0,0.06)"/>
  <!-- Sofa legs -->
  <rect x="108" y="323" width="12" height="18" rx="4" fill="#c07040"/>
  <rect x="480" y="323" width="12" height="18" rx="4" fill="#c07040"/>

  <!-- ── Elderly mother (seated left, facing right) ── -->
  <!-- Body -->
  <ellipse cx="218" cy="288" rx="55" ry="32" fill="#7B5EA7" opacity="0.85"/>
  <rect x="183" y="235" width="70" height="68" rx="14" fill="#7B5EA7" opacity="0.85"/>
  <!-- Left arm resting on sofa arm -->
  <path d="M183,262 Q148,272 118,282" stroke="#6a4d96" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="113" cy="285" rx="13" ry="9" fill="#9A6428"/>
  <!-- Right arm (leaning, hand in daughter's hand) -->
  <path d="M253,262 Q285,275 300,294" stroke="#6a4d96" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="306" cy="299" rx="14" ry="10" fill="#9A6428"/>
  <!-- Neck -->
  <rect x="205" y="222" width="24" height="20" rx="6" fill="#9A6428"/>
  <!-- Head -->
  <ellipse cx="217" cy="200" rx="32" ry="36" fill="#9A6428"/>
  <!-- Ears -->
  <ellipse cx="185" cy="202" rx="6" ry="9" fill="#8B6428"/>
  <ellipse cx="249" cy="202" rx="6" ry="9" fill="#8B6428"/>
  <!-- Grey hair — braided -->
  <ellipse cx="217" cy="170" rx="30" ry="13" fill="#8a7878"/>
  <rect x="187" y="172" width="60" height="11" rx="7" fill="#8a7878"/>
  <!-- Eyes (elder, kind) -->
  <ellipse cx="204" cy="196" rx="6" ry="5" fill="white"/>
  <ellipse cx="230" cy="196" rx="6" ry="5" fill="white"/>
  <circle cx="204" cy="196" r="3.5" fill="#1a0a00"/>
  <circle cx="230" cy="196" r="3.5" fill="#1a0a00"/>
  <!-- Warm smile -->
  <path d="M194,212 L217,222 L240,212" stroke="rgba(100,60,20,0.35)" stroke-width="1.8" fill="none" stroke-linecap="round"/>

  <!-- ── Daughter caregiver (seated right, facing mother) ── -->
  <!-- Body -->
  <ellipse cx="370" cy="288" rx="55" ry="32" fill="#2e7d32" opacity="0.85"/>
  <rect x="347" y="228" width="70" height="72" rx="14" fill="#2e7d32" opacity="0.85"/>
  <!-- Left arm (holding mother's hand — joining hands) -->
  <path d="M347,258 Q320,272 306,294" stroke="#1b5e20" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="301" cy="300" rx="14" ry="10" fill="#C68642"/>
  <!-- Right arm -->
  <path d="M417,260 Q446,275 462,284" stroke="#1b5e20" stroke-width="20" fill="none" stroke-linecap="round"/>
  <ellipse cx="466" cy="288" rx="13" ry="9" fill="#C68642"/>
  <!-- Joined hands (clasped in the center) -->
  <ellipse cx="303" cy="300" rx="18" ry="13" fill="#C68642"/>
  <ellipse cx="307" cy="298" rx="16" ry="11" fill="#9A6428" opacity="0.6"/>
  <path d="M296,296 Q304,304 314,298" fill="none" stroke="rgba(100,60,20,0.3)" stroke-width="1.5"/>
  <!-- Neck -->
  <rect x="365" y="214" width="24" height="20" rx="6" fill="#C68642"/>
  <!-- Head -->
  <ellipse cx="377" cy="193" rx="32" ry="36" fill="#C68642"/>
  <!-- Ears -->
  <ellipse cx="345" cy="195" rx="6" ry="9" fill="#B57A35"/>
  <ellipse cx="409" cy="195" rx="6" ry="9" fill="#B57A35"/>
  <!-- Afro natural hair -->
  <ellipse cx="377" cy="168" rx="34" ry="20" fill="#1a0a00"/>
  <ellipse cx="345" cy="180" rx="12" ry="16" fill="#1a0a00"/>
  <ellipse cx="409" cy="180" rx="12" ry="16" fill="#1a0a00"/>
  <ellipse cx="377" cy="152" rx="24" ry="22" fill="#1a0a00"/>
  <!-- Eyes (caring, warm) -->
  <ellipse cx="364" cy="188" rx="6.5" ry="5.5" fill="white"/>
  <ellipse cx="390" cy="188" rx="6.5" ry="5.5" fill="white"/>
  <circle cx="364" cy="188" r="4" fill="#1a0a00"/>
  <circle cx="390" cy="188" r="4" fill="#1a0a00"/>
  <circle cx="365.5" cy="186.5" r="1.3" fill="white" opacity="0.9"/>
  <circle cx="391.5" cy="186.5" r="1.3" fill="white" opacity="0.9"/>
  <!-- Eyebrows -->
  <path d="M355,178 Q364,172 371,177" stroke="#1a0a00" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M383,177 Q390,172 399,178" stroke="#1a0a00" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Tender smile -->
  <path d="M364,204 Q377,214 390,204" stroke="rgba(100,60,20,0.45)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── E-Vive branding strip ── -->
  <rect x="0" y="358" width="600" height="42" fill="rgba(0,53,128,0.85)"/>
  <text x="24" y="383" font-family="Georgia,serif" font-size="13" font-weight="bold" fill="white">Family Caregiver Hub</text>
  <text x="24" y="396" font-family="Arial,sans-serif" font-size="9.5" fill="rgba(255,255,255,0.65)" letter-spacing="0.5">TRAINING · COMMUNITY · COUNSELLING · RESOURCES · SUPPORT GROUPS</text>
  <rect x="530" y="366" width="50" height="26" rx="6" fill="rgba(132,189,96,0.3)" stroke="rgba(132,189,96,0.5)" stroke-width="1"/>
  <text x="540" y="382" font-family="Arial,sans-serif" font-size="10" font-weight="bold" fill="#84BD60">FREE</text>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   5. PARTNERS HERO — "Clinical Excellence & Seamless Referrals"
   800×400: Professional hospital hallway, clinical data overlays
───────────────────────────────────────────────────────────────────────────── */
const partnersHero = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" width="800" height="400">
<defs>
  <linearGradient id="ph-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e8f4fd"/>
    <stop offset="100%" stop-color="#c8e6f8"/>
  </linearGradient>
  <linearGradient id="ph-floor" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#d0e8f4"/>
    <stop offset="100%" stop-color="#b8d8f0"/>
  </linearGradient>
  <linearGradient id="ph-accent" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="#003580"/>
    <stop offset="100%" stop-color="#004A99"/>
  </linearGradient>
  <clipPath id="ph-clip"><rect width="800" height="400" rx="16"/></clipPath>
</defs>
<g clip-path="url(#ph-clip)">
  <rect width="800" height="400" fill="url(#ph-bg)"/>
  <!-- Floor -->
  <rect y="318" width="800" height="82" fill="url(#ph-floor)"/>
  <rect y="316" width="800" height="5" fill="rgba(0,74,153,0.15)"/>
  <!-- Floor tiles -->
  <line x1="0" y1="338" x2="800" y2="338" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="0" y1="358" x2="800" y2="358" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <!-- Vertical tile lines -->
  <line x1="100" y1="318" x2="100" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="200" y1="318" x2="200" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="300" y1="318" x2="300" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="400" y1="318" x2="400" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="500" y1="318" x2="500" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="600" y1="318" x2="600" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>
  <line x1="700" y1="318" x2="700" y2="400" stroke="rgba(0,74,153,0.08)" stroke-width="1"/>

  <!-- Wall details: corridor -->
  <!-- Ceiling accent stripe -->
  <rect x="0" y="0" width="800" height="14" fill="url(#ph-accent)"/>
  <rect x="0" y="14" width="800" height="4" fill="#84BD60"/>
  <!-- Wall panels -->
  <rect x="0" y="18" width="800" height="8" fill="rgba(0,74,153,0.06)"/>
  <!-- E-Vive x Hospital sign -->
  <rect x="290" y="28" width="220" height="50" rx="6" fill="white" opacity="0.92" stroke="rgba(0,74,153,0.2)" stroke-width="1"/>
  <text x="314" y="52" font-family="Georgia,serif" font-size="18" font-weight="bold" fill="#003580">e-vive</text>
  <text x="356" y="52" font-family="Arial,sans-serif" font-size="12" fill="#888"> × </text>
  <text x="370" y="52" font-family="Arial,sans-serif" font-size="12" fill="#555">Partner Portal</text>
  <rect x="310" y="57" width="100" height="2" rx="1" fill="#84BD60"/>
  <rect x="414" y="57" width="60" height="2" rx="1" fill="#E8845A"/>

  <!-- ── Doctor figure (left) ── -->
  <!-- Shadow -->
  <ellipse cx="180" cy="330" rx="42" ry="10" fill="rgba(0,0,0,0.08)"/>
  <!-- Legs -->
  <rect x="154" y="262" width="20" height="70" rx="7" fill="#2c3e50"/>
  <rect x="186" y="262" width="20" height="70" rx="7" fill="#2c3e50"/>
  <!-- Shoes -->
  <ellipse cx="164" cy="334" rx="16" ry="7" fill="#1a252f"/>
  <ellipse cx="196" cy="334" rx="16" ry="7" fill="#1a252f"/>
  <!-- White coat -->
  <rect x="138" y="148" width="84" height="126" rx="14" fill="white" stroke="rgba(0,74,153,0.1)" stroke-width="1.5"/>
  <!-- Coat lapel -->
  <path d="M162,162 L180,184 L198,162" fill="rgba(0,74,153,0.06)"/>
  <!-- Stethoscope -->
  <path d="M170,175 Q155,195 150,228" stroke="#2c3e50" stroke-width="3.5" fill="none"/>
  <path d="M190,175 Q205,195 210,228" stroke="#2c3e50" stroke-width="3.5" fill="none"/>
  <path d="M150,228 Q180,248 210,228" stroke="#2c3e50" stroke-width="3.5" fill="none"/>
  <circle cx="180" cy="248" r="10" fill="#2c3e50"/>
  <!-- Clipboard -->
  <rect x="198" y="195" width="42" height="58" rx="5" fill="#f5f5f5" stroke="#ccc" stroke-width="1"/>
  <rect x="204" y="188" width="30" height="10" rx="3" fill="#e0e0e0" stroke="#bbb" stroke-width="1"/>
  <!-- Text lines on clipboard -->
  <rect x="203" y="206" width="32" height="2.5" rx="1" fill="#004A99" opacity="0.7"/>
  <rect x="203" y="212" width="28" height="2" rx="1" fill="#84BD60" opacity="0.7"/>
  <rect x="203" y="218" width="32" height="2" rx="1" fill="rgba(0,0,0,0.2)"/>
  <rect x="203" y="224" width="22" height="2" rx="1" fill="rgba(0,0,0,0.15)"/>
  <rect x="203" y="230" width="30" height="2" rx="1" fill="rgba(0,0,0,0.15)"/>
  <!-- Left arm -->
  <path d="M138,168 Q118,210 112,250" stroke="#e0e0e0" stroke-width="22" fill="none" stroke-linecap="round"/>
  <ellipse cx="110" cy="256" rx="14" ry="10" fill="#9A6428"/>
  <!-- Neck + head -->
  <rect x="168" y="134" width="24" height="20" rx="6" fill="#C68642"/>
  <ellipse cx="180" cy="113" rx="32" ry="36" fill="#C68642"/>
  <ellipse cx="148" cy="116" rx="7" ry="10" fill="#B57A35"/>
  <ellipse cx="212" cy="116" rx="7" ry="10" fill="#B57A35"/>
  <!-- Hair short-waves -->
  <path d="M148,88 Q155,74 165,72 Q175,68 180,70 Q185,68 195,72 Q205,74 212,88 Z" fill="#1a0a00"/>
  <ellipse cx="180" cy="86" rx="32" ry="12" fill="#1a0a00"/>
  <!-- Eyes (professional) -->
  <ellipse cx="167" cy="108" rx="7" ry="5.5" fill="white"/>
  <ellipse cx="193" cy="108" rx="7" ry="5.5" fill="white"/>
  <circle cx="167" cy="108" r="4" fill="#1a0a00"/>
  <circle cx="193" cy="108" r="4" fill="#1a0a00"/>
  <!-- Eyebrows -->
  <path d="M158,98 Q167,92 174,97" stroke="#1a0a00" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M186,97 Q193,92 202,98" stroke="#1a0a00" stroke-width="2" fill="none" stroke-linecap="round"/>
  <!-- Neutral professional expression -->
  <path d="M168,122 Q180,130 192,122" stroke="rgba(100,60,20,0.4)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── HCA figure (right) ── -->
  <ellipse cx="550" cy="330" rx="42" ry="10" fill="rgba(0,0,0,0.08)"/>
  <rect x="526" y="262" width="20" height="70" rx="7" fill="#1a3a5c"/>
  <rect x="558" y="262" width="20" height="70" rx="7" fill="#1a3a5c"/>
  <ellipse cx="536" cy="334" rx="16" ry="7" fill="#0a1a35"/>
  <ellipse cx="568" cy="334" rx="16" ry="7" fill="#0a1a35"/>
  <!-- Teal scrubs -->
  <rect x="508" y="148" width="84" height="126" rx="14" fill="#006064"/>
  <path d="M532,162 L550,184 L568,162" fill="rgba(255,255,255,0.08)"/>
  <!-- ID badge -->
  <rect x="516" y="178" width="32" height="20" rx="4" fill="white" opacity="0.85"/>
  <rect x="520" y="183" width="24" height="2" rx="1" fill="#004A99"/>
  <rect x="520" y="187" width="18" height="2" rx="1" fill="#84BD60"/>
  <!-- Folder -->
  <rect x="560" y="188" width="44" height="58" rx="5" fill="#E8845A" opacity="0.9"/>
  <rect x="560" y="182" width="28" height="9" rx="4" fill="#d4704a" opacity="0.9"/>
  <rect x="566" y="198" width="32" height="2.5" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="566" y="205" width="26" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
  <rect x="566" y="212" width="30" height="2" rx="1" fill="rgba(255,255,255,0.4)"/>
  <!-- Left arm -->
  <path d="M508,168 Q488,208 484,248" stroke="#004d4d" stroke-width="22" fill="none" stroke-linecap="round"/>
  <ellipse cx="483" cy="254" rx="14" ry="10" fill="#9A6428"/>
  <!-- Right arm with folder -->
  <path d="M592,168 Q612,205 610,244" stroke="#004d4d" stroke-width="22" fill="none" stroke-linecap="round"/>
  <ellipse cx="608" cy="250" rx="14" ry="10" fill="#9A6428"/>
  <!-- Neck + head -->
  <rect x="538" y="134" width="24" height="20" rx="6" fill="#6B3A2A"/>
  <ellipse cx="550" cy="113" rx="32" ry="36" fill="#6B3A2A"/>
  <ellipse cx="518" cy="116" rx="7" ry="10" fill="#5A3020"/>
  <ellipse cx="582" cy="116" rx="7" ry="10" fill="#5A3020"/>
  <!-- Afro hair -->
  <circle cx="550" cy="94" r="42" fill="#1a0a00"/>
  <ellipse cx="524" cy="110" rx="12" ry="16" fill="#1a0a00"/>
  <ellipse cx="576" cy="110" rx="12" ry="16" fill="#1a0a00"/>
  <!-- Eyes -->
  <ellipse cx="537" cy="108" rx="7" ry="5.5" fill="white"/>
  <ellipse cx="563" cy="108" rx="7" ry="5.5" fill="white"/>
  <circle cx="537" cy="108" r="4" fill="#1a0a00"/>
  <circle cx="563" cy="108" r="4" fill="#1a0a00"/>
  <circle cx="538.5" cy="106.5" r="1.4" fill="white" opacity="0.9"/>
  <circle cx="564.5" cy="106.5" r="1.4" fill="white" opacity="0.9"/>
  <!-- Eyebrows -->
  <path d="M528,97 Q537,91 544,96" stroke="#1a0a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M556,96 Q563,91 572,97" stroke="#1a0a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <path d="M538,122 Q550,132 562,122" stroke="rgba(100,60,20,0.45)" stroke-width="2" fill="none" stroke-linecap="round"/>

  <!-- ── Digital referral overlay panel (center) ── -->
  <rect x="290" y="110" width="220" height="180" rx="14" fill="white" opacity="0.94" stroke="rgba(0,74,153,0.15)" stroke-width="1.5"/>
  <!-- Panel header -->
  <rect x="290" y="110" width="220" height="36" rx="14" fill="#003580"/>
  <rect x="290" y="132" width="220" height="14" fill="#003580"/>
  <text x="310" y="133" font-family="Arial,sans-serif" font-size="11" font-weight="bold" fill="white">Digital Referral Dashboard</text>
  <!-- Stats inside panel -->
  <text x="308" y="162" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#004A99">24</text>
  <text x="308" y="174" font-family="Arial,sans-serif" font-size="9" fill="#888">Active Referrals</text>
  <text x="378" y="162" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#84BD60">97%</text>
  <text x="378" y="174" font-family="Arial,sans-serif" font-size="9" fill="#888">Placement Rate</text>
  <text x="448" y="162" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#E8845A">4.8★</text>
  <text x="448" y="174" font-family="Arial,sans-serif" font-size="9" fill="#888">Care Rating</text>
  <!-- Divider -->
  <rect x="306" y="180" width="188" height="1" fill="rgba(0,74,153,0.1)"/>
  <!-- Progress bars -->
  <text x="308" y="198" font-family="Arial,sans-serif" font-size="9" fill="#555">HCA Match Rate</text>
  <rect x="308" y="202" width="172" height="6" rx="3" fill="#f0f0f0"/>
  <rect x="308" y="202" width="158" height="6" rx="3" fill="#84BD60"/>
  <text x="308" y="220" font-family="Arial,sans-serif" font-size="9" fill="#555">Reports Delivered</text>
  <rect x="308" y="224" width="172" height="6" rx="3" fill="#f0f0f0"/>
  <rect x="308" y="224" width="148" height="6" rx="3" fill="#004A99"/>
  <text x="308" y="242" font-family="Arial,sans-serif" font-size="9" fill="#555">Family Satisfaction</text>
  <rect x="308" y="246" width="172" height="6" rx="3" fill="#f0f0f0"/>
  <rect x="308" y="246" width="165" height="6" rx="3" fill="#E8845A"/>
  <!-- Live indicator -->
  <circle cx="484" cy="120" r="5" fill="#4caf50"/>
  <circle cx="484" cy="120" r="9" fill="#4caf50" opacity="0.3"/>
  <text x="470" y="137" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.8)">LIVE</text>
  <!-- Panel: Referral steps -->
  <rect x="308" y="264" width="168" height="18" rx="5" fill="#84BD60" opacity="0.15"/>
  <text x="318" y="276" font-family="Arial,sans-serif" font-size="9" fill="#2e7d32" font-weight="bold">✓ Referral confirmed — HCA matched</text>

  <!-- ── Bottom accent bar ── -->
  <rect x="0" y="380" width="800" height="20" fill="url(#ph-accent)" opacity="0.9"/>
  <rect x="0" y="380" width="266" height="20" fill="#003580"/>
  <rect x="266" y="380" width="267" height="20" fill="#84BD60" opacity="0.7"/>
  <rect x="533" y="380" width="267" height="20" fill="#E8845A" opacity="0.6"/>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   6. HOMEPAGE — HOW IT WORKS visual (families side)
   480×320: Family with tablet finding a carer
───────────────────────────────────────────────────────────────────────────── */
const howItWorksFamilies = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" width="480" height="320">
<defs>
  <linearGradient id="hw-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#e8f5e9"/>
    <stop offset="100%" stop-color="#c8e6c9"/>
  </linearGradient>
  <clipPath id="hw-clip"><rect width="480" height="320" rx="14"/></clipPath>
</defs>
<g clip-path="url(#hw-clip)">
  <rect width="480" height="320" fill="url(#hw-bg)"/>
  <!-- Phone/tablet in center -->
  <rect x="168" y="40" width="144" height="232" rx="16" fill="#1a1a2e" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <rect x="176" y="52" width="128" height="208" rx="10" fill="#003580"/>
  <!-- Phone screen — E-Vive match interface -->
  <rect x="180" y="56" width="120" height="14" rx="4" fill="#004A99" opacity="0.8"/>
  <text x="188" y="67" font-family="Arial,sans-serif" font-size="8" fill="rgba(255,255,255,0.85)">e-vive · Find a Carer</text>
  <!-- Search bar -->
  <rect x="182" y="74" width="116" height="14" rx="5" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" stroke-width="0.8"/>
  <text x="192" y="84" font-family="Arial,sans-serif" font-size="7.5" fill="rgba(255,255,255,0.5)">Nairobi, Westlands · 2.1 km</text>
  <!-- HCA result cards on screen -->
  <rect x="182" y="92" width="116" height="44" rx="5" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.15)" stroke-width="0.6"/>
  <circle cx="194" cy="110" r="10" fill="#84BD60" opacity="0.9"/>
  <text x="194" y="114" font-family="Arial,sans-serif" font-size="8" text-anchor="middle" fill="white" font-weight="bold">AM</text>
  <rect x="208" y="96" width="60" height="5" rx="2" fill="rgba(255,255,255,0.7)"/>
  <rect x="208" y="104" width="46" height="4" rx="1.5" fill="rgba(255,255,255,0.4)"/>
  <rect x="208" y="112" width="52" height="4" rx="1.5" fill="rgba(132,189,96,0.6)"/>
  <rect x="270" y="95" width="22" height="10" rx="3" fill="#84BD60" opacity="0.85"/>
  <text x="274" y="103" font-family="Arial,sans-serif" font-size="6" fill="white">★ 4.9</text>
  <rect x="208" y="120" width="76" height="12" rx="4" fill="#004A99" opacity="0.8"/>
  <text x="222" y="129" font-family="Arial,sans-serif" font-size="6.5" fill="white">View Profile →</text>

  <rect x="182" y="140" width="116" height="44" rx="5" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.12)" stroke-width="0.6"/>
  <circle cx="194" cy="158" r="10" fill="#E8845A" opacity="0.9"/>
  <text x="194" y="162" font-family="Arial,sans-serif" font-size="8" text-anchor="middle" fill="white" font-weight="bold">JO</text>
  <rect x="208" y="144" width="56" height="5" rx="2" fill="rgba(255,255,255,0.6)"/>
  <rect x="208" y="152" width="44" height="4" rx="1.5" fill="rgba(255,255,255,0.35)"/>
  <rect x="208" y="160" width="50" height="4" rx="1.5" fill="rgba(132,189,96,0.5)"/>
  <rect x="270" y="143" width="22" height="10" rx="3" fill="#84BD60" opacity="0.7"/>
  <text x="274" y="151" font-family="Arial,sans-serif" font-size="6" fill="white">★ 4.8</text>

  <!-- Map pin on screen -->
  <rect x="182" y="188" width="116" height="60" rx="5" fill="rgba(56,189,248,0.12)" stroke="rgba(56,189,248,0.25)" stroke-width="0.6"/>
  <text x="240" y="220" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" fill="rgba(255,255,255,0.5)">📍 Map View</text>
  <!-- Simple map dots -->
  <circle cx="210" cy="210" r="4" fill="#84BD60" opacity="0.8"/>
  <circle cx="240" cy="205" r="5" fill="#E8845A" opacity="0.8"/>
  <circle cx="268" cy="215" r="4" fill="#84BD60" opacity="0.7"/>
  <line x1="210" y1="210" x2="240" y2="205" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <line x1="240" y1="205" x2="268" y2="215" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>

  <!-- ── Label ── -->
  <rect x="0" y="280" width="480" height="40" fill="rgba(0,53,128,0.8)"/>
  <text x="240" y="298" font-family="Georgia,serif" font-size="13" text-anchor="middle" fill="white" font-weight="bold">Find. Match. Care.</text>
  <text x="240" y="312" font-family="Arial,sans-serif" font-size="9" text-anchor="middle" fill="rgba(255,255,255,0.65)">Location-based HCA matching · Verified profiles · GPS check-in</text>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   7. ABOUT HERO VISUAL — E-Vive Community Mosaic
   520×360: Abstract illustration of Kenya map + care community
───────────────────────────────────────────────────────────────────────────── */
const aboutHeroVisual = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 360" width="520" height="360">
<defs>
  <linearGradient id="av-bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#003580"/>
    <stop offset="60%" stop-color="#004A99"/>
    <stop offset="100%" stop-color="#1565c0"/>
  </linearGradient>
  <radialGradient id="av-glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="rgba(132,189,96,0.2)"/>
    <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
  </radialGradient>
  <clipPath id="av-clip"><rect width="520" height="360" rx="16"/></clipPath>
</defs>
<g clip-path="url(#av-clip)">
  <rect width="520" height="360" fill="url(#av-bg)"/>
  <rect width="520" height="360" fill="url(#av-glow)"/>

  <!-- Background concentric circles suggesting reach/coverage -->
  <circle cx="260" cy="180" r="200" fill="none" stroke="rgba(132,189,96,0.08)" stroke-width="40"/>
  <circle cx="260" cy="180" r="140" fill="none" stroke="rgba(132,189,96,0.08)" stroke-width="30"/>
  <circle cx="260" cy="180" r="80" fill="none" stroke="rgba(132,189,96,0.1)" stroke-width="20"/>

  <!-- Kenya silhouette (simplified — recognizable outline) -->
  <path d="M200,80 L230,60 L270,58 L310,70 L340,90 L360,130 L355,170 L340,200 L320,240 L300,280 L280,300 L260,310 L240,300 L220,275 L210,250 L200,220 L195,190 L190,160 L185,130 Z" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1.5"/>

  <!-- Sub-county nodes (47 counties — represented as clusters) -->
  <!-- Nairobi cluster (center) -->
  <circle cx="260" cy="190" r="18" fill="#E8845A" opacity="0.9"/>
  <circle cx="260" cy="190" r="26" fill="#E8845A" opacity="0.2"/>
  <text x="260" y="195" font-family="Arial,sans-serif" font-size="7" text-anchor="middle" fill="white" font-weight="bold">NBI</text>

  <!-- County nodes scattered -->
  <circle cx="218" cy="148" r="8" fill="#84BD60" opacity="0.85"/><!-- Kiambu -->
  <circle cx="300" cy="145" r="7" fill="#84BD60" opacity="0.8"/><!-- Muranga -->
  <circle cx="240" cy="224" r="7" fill="#84BD60" opacity="0.8"/><!-- Kajiado -->
  <circle cx="284" cy="226" r="6" fill="#84BD60" opacity="0.75"/><!-- Machakos -->
  <circle cx="196" cy="190" r="7" fill="#38bdf8" opacity="0.8"/><!-- Nakuru -->
  <circle cx="314" cy="186" r="7" fill="#38bdf8" opacity="0.8"/><!-- Embu -->
  <circle cx="228" cy="165" r="5" fill="#84BD60" opacity="0.7"/>
  <circle cx="292" cy="170" r="5" fill="#84BD60" opacity="0.7"/>
  <circle cx="255" cy="230" r="5" fill="#38bdf8" opacity="0.7"/>
  <circle cx="274" cy="158" r="6" fill="#84BD60" opacity="0.75"/>
  <circle cx="245" cy="148" r="5" fill="#38bdf8" opacity="0.65"/>
  <circle cx="318" cy="210" r="5" fill="#84BD60" opacity="0.65"/>
  <circle cx="204" cy="210" r="5" fill="#84BD60" opacity="0.65"/>

  <!-- Connecting lines (network effect) -->
  <line x1="260" y1="190" x2="218" y2="148" stroke="rgba(132,189,96,0.3)" stroke-width="1"/>
  <line x1="260" y1="190" x2="300" y2="145" stroke="rgba(132,189,96,0.3)" stroke-width="1"/>
  <line x1="260" y1="190" x2="196" y2="190" stroke="rgba(56,189,248,0.25)" stroke-width="1"/>
  <line x1="260" y1="190" x2="314" y2="186" stroke="rgba(56,189,248,0.25)" stroke-width="1"/>
  <line x1="260" y1="190" x2="240" y2="224" stroke="rgba(132,189,96,0.25)" stroke-width="1"/>
  <line x1="260" y1="190" x2="284" y2="226" stroke="rgba(132,189,96,0.25)" stroke-width="1"/>

  <!-- ── Stats overlay (top-left) ── -->
  <rect x="20" y="20" width="165" height="110" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="40" y="48" font-family="Georgia,serif" font-size="30" font-weight="bold" fill="white">850+</text>
  <text x="40" y="64" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">Verified HCAs</text>
  <rect x="40" y="70" width="100" height="1.5" fill="rgba(132,189,96,0.4)"/>
  <text x="40" y="88" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="#84BD60">2,400+</text>
  <text x="40" y="102" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">Families Served</text>
  <text x="40" y="120" font-family="Arial,sans-serif" font-size="9" fill="rgba(132,189,96,0.7)">Est. 2021 · Nairobi, Kenya</text>

  <!-- ── Stats overlay (bottom-right) ── -->
  <rect x="335" y="250" width="165" height="90" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="355" y="278" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="#E8845A">47</text>
  <text x="390" y="278" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.5)" dy="0"> sub-counties</text>
  <rect x="355" y="284" width="120" height="1.5" fill="rgba(232,132,90,0.4)"/>
  <text x="355" y="303" font-family="Georgia,serif" font-size="22" font-weight="bold" fill="white">4.8★</text>
  <text x="355" y="320" font-family="Arial,sans-serif" font-size="10" fill="rgba(255,255,255,0.6)">Average care rating</text>
  <text x="355" y="334" font-family="Arial,sans-serif" font-size="9" fill="rgba(132,189,96,0.7)">97% placement success</text>

  <!-- ── Logo / branding ── -->
  <text x="20" y="348" font-family="Georgia,serif" font-size="16" font-weight="bold" fill="rgba(255,255,255,0.5)" letter-spacing="2">e-vive</text>
  <rect x="20" y="352" width="48" height="2" rx="1" fill="rgba(132,189,96,0.4)"/>
</g>
</svg>`;

/* ─────────────────────────────────────────────────────────────────────────────
   WRITE ALL SCENE FILES
───────────────────────────────────────────────────────────────────────────── */
const scenes = {
  'hero-home.svg': heroHome,
  'founder-story.svg': founderStory,
  'assistants-hero.svg': assistantsHero,
  'caregiver-hero.svg': caregiverHero,
  'partners-hero.svg': partnersHero,
  'how-it-works-families.svg': howItWorksFamilies,
  'about-hero-visual.svg': aboutHeroVisual,
};

Object.entries(scenes).forEach(([filename, svg]) => {
  fs.writeFileSync(path.join(outDir, filename), svg);
  console.log(`✅ ${filename}`);
});

console.log(`\n✅ Generated ${Object.keys(scenes).length} scene SVGs in public/images/scenes/`);

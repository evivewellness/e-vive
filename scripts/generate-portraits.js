/**
 * E-Vive Portrait SVG Generator
 * Generates culturally-appropriate illustrated portraits for HCAs and team members.
 * Style: Modern flat illustration with African features.
 */

const fs = require('fs');
const path = require('path');

// ── Skin tones ──────────────────────────────────────────────────────────────
const SKIN = {
  light:    { face: '#C68642', shadow: '#A57A30', ear: '#B8763A' },
  medium:   { face: '#9A6428', shadow: '#7D4E1A', ear: '#8C5A22' },
  warm:     { face: '#7B4B2A', shadow: '#62381C', ear: '#704225' },
  deep:     { face: '#5C3317', shadow: '#44240D', ear: '#532E13' },
  rich:     { face: '#3D1F0A', shadow: '#2A1206', ear: '#371A07' },
};

// ── Hair colours ─────────────────────────────────────────────────────────────
const HAIR = {
  black:    '#1a0a00',
  darkBrown:'#2C1810',
  brown:    '#4A2D1A',
  salt:     '#6B5A52',   // salt-and-pepper / older
};

// ── Generate hair SVG by style ────────────────────────────────────────────────
function hairPaths(style, hc, cx=100, cy=90) {
  switch(style) {
    case 'short-natural':
      return `
        <ellipse cx="${cx}" cy="${cy-22}" rx="34" ry="16" fill="${hc}"/>
        <rect x="${cx-34}" y="${cy-28}" width="68" height="14" rx="10" fill="${hc}"/>`;

    case 'afro':
      return `
        <circle cx="${cx}" cy="${cy-10}" r="46" fill="${hc}"/>
        <ellipse cx="${cx-42}" cy="${cy+2}" rx="12" ry="18" fill="${hc}"/>
        <ellipse cx="${cx+42}" cy="${cy+2}" rx="12" ry="18" fill="${hc}"/>`;

    case 'braids-down': {
      const w = 5, count = 9, start = cx - 38;
      let paths = `<ellipse cx="${cx}" cy="${cy-22}" rx="38" ry="16" fill="${hc}"/>`;
      for(let i=0;i<count;i++){
        const x = start + i*9.5;
        paths += `<rect x="${x}" y="${cy-10}" width="${w}" height="38" rx="2.5" fill="${hc}" opacity="0.9"/>`;
      }
      return paths;
    }

    case 'locs-medium': {
      let paths = `<ellipse cx="${cx}" cy="${cy-22}" rx="36" ry="16" fill="${hc}"/>`;
      const locData = [[-30,28],[-18,34],[-6,36],[6,36],[18,34],[30,28],[-24,32],[24,32]];
      locData.forEach(([ox,h]) => {
        paths += `<rect x="${cx+ox-3.5}" y="${cy-8}" width="7" height="${h}" rx="3.5" fill="${hc}" opacity="0.88"/>`;
      });
      return paths;
    }

    case 'short-waves':
      return `
        <path d="M${cx-36},${cy-18}
          Q${cx-28},${cy-36} ${cx-18},${cy-32}
          Q${cx-8},${cy-42} ${cx},${cy-38}
          Q${cx+8},${cy-42} ${cx+18},${cy-32}
          Q${cx+28},${cy-36} ${cx+36},${cy-18}
          Z" fill="${hc}"/>`;

    case 'wrapped':  // head wrap / gele style
      return `
        <ellipse cx="${cx}" cy="${cy-22}" rx="38" ry="20" fill="${hc}"/>
        <ellipse cx="${cx}" cy="${cy-36}" rx="30" ry="10" fill="${hc}" opacity="0.8"/>
        <rect x="${cx-38}" y="${cy-30}" width="76" height="12" rx="4" fill="${hc}" opacity="0.7"/>
        <ellipse cx="${cx+32}" cy="${cy-38}" rx="10" ry="7" fill="${hc}" transform="rotate(-20 ${cx+32} ${cy-38})"/>`;

    case 'short-fade':
      return `
        <rect x="${cx-34}" y="${cy-36}" width="68" height="22" rx="12" fill="${hc}"/>
        <ellipse cx="${cx}" cy="${cy-26}" rx="34" ry="10" fill="${hc}"/>`;

    case 'natural-updo':
      return `
        <ellipse cx="${cx}" cy="${cy-30}" rx="28" ry="22" fill="${hc}"/>
        <circle cx="${cx}" cy="${cy-46}" r="16" fill="${hc}"/>
        <ellipse cx="${cx-26}" cy="${cy-8}" rx="10" ry="14" fill="${hc}"/>
        <ellipse cx="${cx+26}" cy="${cy-8}" rx="10" ry="14" fill="${hc}"/>`;

    case 'salt-short':
      return `
        <ellipse cx="${cx}" cy="${cy-22}" rx="34" ry="16" fill="${hc}"/>
        <rect x="${cx-34}" y="${cy-28}" width="68" height="14" rx="10" fill="${hc}"/>
        <ellipse cx="${cx-20}" cy="${cy-28}" rx="10" ry="5" fill="#9e9e9e" opacity="0.5"/>
        <ellipse cx="${cx+14}" cy="${cy-30}" rx="8" ry="4" fill="#9e9e9e" opacity="0.4"/>`;

    default:
      return `<ellipse cx="${cx}" cy="${cy-22}" rx="34" ry="16" fill="${hc}"/>`;
  }
}

// ── Face features ─────────────────────────────────────────────────────────────
function face(sk, cx=100, cy=90) {
  const { face: fc, shadow: sc, ear: ec } = sk;
  return `
    <!-- Ears -->
    <ellipse cx="${cx-32}" cy="${cy+5}" rx="7" ry="9" fill="${ec}"/>
    <ellipse cx="${cx+32}" cy="${cy+5}" rx="7" ry="9" fill="${ec}"/>
    <!-- Head -->
    <ellipse cx="${cx}" cy="${cy}" rx="32" ry="36" fill="${fc}"/>
    <!-- Cheek shadows -->
    <ellipse cx="${cx-18}" cy="${cy+12}" rx="9" ry="6" fill="${sc}" opacity="0.18"/>
    <ellipse cx="${cx+18}" cy="${cy+12}" rx="9" ry="6" fill="${sc}" opacity="0.18"/>
    <!-- Brow ridge shadow -->
    <ellipse cx="${cx}" cy="${cy-14}" rx="20" ry="6" fill="${sc}" opacity="0.12"/>
    <!-- Nose -->
    <ellipse cx="${cx}" cy="${cy+8}" rx="5" ry="3.5" fill="${sc}" opacity="0.4"/>
    <ellipse cx="${cx-4}" cy="${cy+10}" rx="3.5" ry="2.5" fill="${sc}" opacity="0.3"/>
    <ellipse cx="${cx+4}" cy="${cy+10}" rx="3.5" ry="2.5" fill="${sc}" opacity="0.3"/>
    <!-- Eyes -->
    <ellipse cx="${cx-11}" cy="${cy-6}" rx="6" ry="5" fill="white"/>
    <ellipse cx="${cx+11}" cy="${cy-6}" rx="6" ry="5" fill="white"/>
    <circle cx="${cx-11}" cy="${cy-6}" r="3.5" fill="#1a0a00"/>
    <circle cx="${cx+11}" cy="${cy-6}" r="3.5" fill="#1a0a00"/>
    <circle cx="${cx-9.5}" cy="${cy-7.5}" r="1.2" fill="white" opacity="0.9"/>
    <circle cx="${cx+12.5}" cy="${cy-7.5}" r="1.2" fill="white" opacity="0.9"/>
    <!-- Eyebrows -->
    <path d="M${cx-17},${cy-14} Q${cx-11},${cy-18} ${cx-5},${cy-15}" stroke="#1a0a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <path d="M${cx+5},${cy-15} Q${cx+11},${cy-18} ${cx+17},${cy-14}" stroke="#1a0a00" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <!-- Smile -->
    <path d="M${cx-10},${cy+18} Q${cx},${cy+26} ${cx+10},${cy+18}" stroke="${sc}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
}

// ── Uniform / body ────────────────────────────────────────────────────────────
function body(uniformColor, cx=100) {
  const lighter = uniformColor + 'cc';
  return `
    <!-- Neck -->
    <rect x="${cx-10}" y="118" width="20" height="20" rx="4" fill="#9A6428"/>
    <!-- Shoulders / torso -->
    <ellipse cx="${cx}" cy="165" rx="52" ry="30" fill="${uniformColor}"/>
    <!-- Collar / lapel detail -->
    <path d="M${cx-18},128 L${cx},138 L${cx+18},128" fill="${lighter}" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
    <!-- Name badge -->
    <rect x="${cx+14}" y="148" width="20" height="13" rx="3" fill="white" opacity="0.35"/>`;
}

// ── Assemble full SVG ─────────────────────────────────────────────────────────
function makeSVG({ bg, skin, hair, hairColor, uniform, initials }) {
  const sk = SKIN[skin] || SKIN.warm;
  const hc = HAIR[hairColor] || HAIR.black;
  const uc = uniform || '#1976D2';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <clipPath id="circle-clip"><circle cx="100" cy="100" r="100"/></clipPath>
    <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${bg}" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
    </radialGradient>
    <radialGradient id="light" cx="35%" cy="20%" r="60%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.18)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
    </radialGradient>
  </defs>
  <g clip-path="url(#circle-clip)">
    <!-- Background -->
    <circle cx="100" cy="100" r="100" fill="url(#bg-grad)"/>
    <circle cx="100" cy="100" r="100" fill="url(#light)"/>
    <!-- Body -->
    ${body(uc, 100)}
    <!-- Hair (behind head) -->
    ${hairPaths(hair, hc)}
    <!-- Face -->
    ${face(sk)}
    <!-- Hair (in front - top only) -->
    ${hairPaths(hair, hc)}
  </g>
  <!-- Border ring -->
  <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
</svg>`;
}

// ── Portrait configurations ───────────────────────────────────────────────────
const PORTRAITS = [
  // ── HCA profiles ──
  { file:'hca-amina-njeri',    bg:'#6b0028', skin:'medium', hair:'braids-down',   hairColor:'black',    uniform:'#1a5276', initials:'AN' },
  { file:'hca-john-omondi',   bg:'#0e4272', skin:'rich',   hair:'short-fade',    hairColor:'black',    uniform:'#154360', initials:'JO' },
  { file:'hca-grace-otieno',  bg:'#5d4037', skin:'warm',   hair:'natural-updo',  hairColor:'darkBrown',uniform:'#1b5e20', initials:'GO' },
  { file:'hca-faith-wanjiku', bg:'#1a237e', skin:'deep',   hair:'afro',          hairColor:'black',    uniform:'#37474f', initials:'FW' },
  { file:'hca-samuel-kamau',  bg:'#b71c1c', skin:'medium', hair:'short-natural', hairColor:'black',    uniform:'#1565c0', initials:'SK' },
  { file:'hca-rose-adhiambo', bg:'#4e342e', skin:'deep',   hair:'locs-medium',   hairColor:'darkBrown',uniform:'#006064', initials:'RA' },
  { file:'hca-peter-mutua',   bg:'#01579b', skin:'warm',   hair:'short-waves',   hairColor:'black',    uniform:'#1a5276', initials:'PM' },
  { file:'hca-mary-chebet',   bg:'#2e7d32', skin:'light',  hair:'braids-down',   hairColor:'brown',    uniform:'#4a148c', initials:'MC' },
  { file:'hca-esther-kariuki',bg:'#880e4f', skin:'medium', hair:'natural-updo',  hairColor:'black',    uniform:'#006064', initials:'EK' },
  { file:'hca-david-barasa',  bg:'#37474f', skin:'rich',   hair:'short-fade',    hairColor:'black',    uniform:'#1b5e20', initials:'DB' },
  { file:'hca-lillian-waweru',bg:'#f57f17', skin:'light',  hair:'afro',          hairColor:'darkBrown',uniform:'#880e4f', initials:'LW' },
  { file:'hca-hassan-abdalla',bg:'#00695c', skin:'deep',   hair:'short-natural', hairColor:'black',    uniform:'#0d47a1', initials:'HA' },
  { file:'hca-agnes-ndungu',  bg:'#e64a19', skin:'warm',   hair:'wrapped',       hairColor:'black',    uniform:'#1a5276', initials:'AN' },
  { file:'hca-kelvin-rop',    bg:'#b71c1c', skin:'rich',   hair:'short-waves',   hairColor:'black',    uniform:'#37474f', initials:'KR' },
  { file:'hca-jane-njambi',   bg:'#4e342e', skin:'medium', hair:'salt-short',    hairColor:'salt',     uniform:'#1b5e20', initials:'JN' },
  { file:'hca-sylvia-achieng',bg:'#0277bd', skin:'deep',   hair:'locs-medium',   hairColor:'darkBrown',uniform:'#4a148c', initials:'SA' },
  { file:'hca-michael-oduya', bg:'#1a237e', skin:'rich',   hair:'short-fade',    hairColor:'black',    uniform:'#006064', initials:'MO' },
  { file:'hca-priya-mehta',   bg:'#880e4f', skin:'light',  hair:'natural-updo',  hairColor:'brown',    uniform:'#880e4f', initials:'PR' },

  // ── Team members ──
  { file:'team-salome-mburu',  bg:'#4a1942', skin:'medium', hair:'natural-updo',  hairColor:'black',    uniform:'#6a1b9a', initials:'SM' },
  { file:'team-auma-otieno',   bg:'#0d3b6e', skin:'deep',   hair:'braids-down',   hairColor:'black',    uniform:'#1565c0', initials:'AO' },
  { file:'team-kamau-maina',   bg:'#3e1a00', skin:'warm',   hair:'short-waves',   hairColor:'black',    uniform:'#37474f', initials:'KM' },
  { file:'team-fatuma-said',   bg:'#5c1a3a', skin:'deep',   hair:'wrapped',       hairColor:'black',    uniform:'#880e4f', initials:'FS' },
  { file:'team-patrick-mutiso',bg:'#1a0050', skin:'rich',   hair:'short-fade',    hairColor:'black',    uniform:'#1a237e', initials:'PM' },
  { file:'team-grace-njuguna', bg:'#2e0060', skin:'medium', hair:'afro',          hairColor:'darkBrown',uniform:'#4527a0', initials:'GN' },

  // ── Counsellors (caregivers page) ──
  { file:'counsellor-sarah-kamau', bg:'#880e4f', skin:'medium', hair:'natural-updo', hairColor:'black', uniform:'#1a5276', initials:'SK' },
  { file:'counsellor-james-otieno',bg:'#01579b', skin:'deep',   hair:'short-natural',hairColor:'black', uniform:'#154360', initials:'JO' },
  { file:'counsellor-rose-mutua',  bg:'#2e7d32', skin:'warm',   hair:'afro',         hairColor:'darkBrown',uniform:'#1b5e20',initials:'RM' },
  { file:'counsellor-peter-mwangi',bg:'#4e342e', skin:'rich',   hair:'short-fade',   hairColor:'black', uniform:'#37474f', initials:'PM' },
];

// ── Write all portrait files ──────────────────────────────────────────────────
const outDir = path.join(__dirname, '../public/images/portraits');
fs.mkdirSync(outDir, { recursive: true });

let count = 0;
PORTRAITS.forEach(p => {
  const svg = makeSVG(p);
  fs.writeFileSync(path.join(outDir, `${p.file}.svg`), svg);
  count++;
});

console.log(`✅ Generated ${count} portrait SVGs in public/images/portraits/`);

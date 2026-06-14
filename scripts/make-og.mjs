// Gera o banner Open Graph (1200x630) da Radiance Laser em public/og-banner.png
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const equip = readFileSync("public/equipamento.png");
const equipB64 = `data:image/png;base64,${equip.toString("base64")}`;

const W = 1200;
const H = 630;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#243b66"/>
      <stop offset="100%" stop-color="#0e1a33"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#e6c47e"/>
      <stop offset="100%" stop-color="#d8b46a"/>
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="15%" r="55%">
      <stop offset="0%" stop-color="#d8b46a" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#d8b46a" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="panel"><rect x="780" y="70" width="350" height="490" rx="22"/></clipPath>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- marca -->
  <g transform="translate(80,74)">
    <rect width="56" height="56" rx="14" fill="#0e1a33" stroke="#d8b46a" stroke-width="1.5"/>
    <circle cx="28" cy="28" r="15" fill="none" stroke="#d8b46a" stroke-width="3"/>
    <circle cx="28" cy="28" r="5" fill="#d8b46a"/>
    <text x="74" y="36" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#ffffff">Radiance <tspan fill="#d8b46a">Laser</tspan></text>
  </g>

  <!-- conteúdo -->
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="82" y="248" font-size="22" font-weight="700" letter-spacing="3" fill="#d8b46a">LOCAÇÃO DE LASER MÉDICO</text>
    <text x="80" y="330" font-size="76" font-weight="800" fill="#ffffff">DEKA DUOGlide</text>
    <text x="82" y="392" font-size="27" fill="#cdd7ea">Equipamento moderno, suporte especializado</text>
    <text x="82" y="430" font-size="27" fill="#cdd7ea">e agendamento online.</text>

    <!-- chips -->
    <g transform="translate(82,470)">
      <rect width="200" height="44" rx="22" fill="#ffffff" fill-opacity="0.10"/>
      <text x="100" y="29" font-size="20" fill="#ffffff" text-anchor="middle">Maringá · PR</text>
      <rect x="216" width="270" height="44" rx="22" fill="#ffffff" fill-opacity="0.10"/>
      <text x="351" y="29" font-size="20" fill="#ffffff" text-anchor="middle">Entrega no mesmo dia</text>
    </g>

    <text x="82" y="572" font-size="24" font-weight="700" fill="#d8b46a">radiancelaser.com.br</text>
  </g>

  <!-- painel da foto -->
  <rect x="780" y="70" width="350" height="490" rx="22" fill="#ffffff"/>
  <image href="${equipB64}" x="800" y="90" width="310" height="450" preserveAspectRatio="xMidYMid meet" clip-path="url(#panel)"/>
</svg>`;

writeFileSync("public/og-banner.svg", svg);

await sharp(Buffer.from(svg)).png().toFile("public/og-banner.png");
console.log("og-banner.png gerado");

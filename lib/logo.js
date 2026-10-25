// Lot 29 (B3) : logotype EnerTchad pour les pages React (lib/strategic.jsx) et les gabarits
// Node (scripts/next/subsites.mjs). Meme balisage que scripts/logo_markup.py, a partir de
// scripts/logo_paths.json produit par scripts/gen_logo.py (lu depuis la racine du depot, comme
// lib/strategic.jsx lit les pages : un chemin relatif a import.meta.url ne survit pas a webpack).
import { readFileSync } from 'node:fs';

let P = null;
function paths() {
  if (!P) P = JSON.parse(readFileSync(`${process.cwd()}/scripts/logo_paths.json`, 'utf8'));
  return P;
}

export function logoSvg(cls = 'et-logo', gid = 'etlg') {
  const p = paths();
  return `<svg class="${cls}" viewBox="0 0 ${p.width} ${p.height | 0}" width="${Math.round(p.width)}" height="${p.height | 0}" role="img" aria-label="EnerTchad" focusable="false">` +
    `<title>EnerTchad</title><defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1">` +
    '<stop offset="0" stop-color="#DBAE4A"/><stop offset="1" stop-color="#C2922E"/></linearGradient></defs>' +
    `<g transform="scale(${p.picto_scale})">` +
    `<path d="M100 96 L126.98 67.9 A37.4 37.4 0 1 0 73.02 67.9 Z" fill="url(#${gid})"/>` +
    '<path d="M96 100 L67.9 73.02 A37.4 37.4 0 1 0 67.9 126.98 Z" fill="#1E6EC2"/>' +
    '<path d="M104 100 L132.1 126.98 A37.4 37.4 0 1 0 132.1 73.02 Z" fill="#218A2C"/>' +
    '<path d="M100 104 L73.02 132.1 A37.4 37.4 0 1 0 126.98 132.1 Z" fill="#E8CD7F"/></g>' +
    `<path d="${p.ener}" fill="currentColor"/><path d="${p.tchad}" fill="var(--et-logo-or,#7A5A12)"/></svg>`;
}

export function logoImg(cls = 'et-logo', lazy = true) {
  const p = paths();
  return `<img class="${cls}" src="/assets/brand/enertchad-logo-h-sombre.svg" alt="EnerTchad" width="${Math.round(p.width)}" height="${p.height | 0}"${lazy ? ' loading="lazy"' : ''} decoding="async">`;
}

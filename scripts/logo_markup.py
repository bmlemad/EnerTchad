# -*- coding: utf-8 -*-
"""Lot 29 (B3) : balisage en ligne du logotype EnerTchad (voir scripts/gen_logo.py).

logo_svg(cls='et-logo') renvoie le <svg> en ligne (role="img", aria-label, <title>) :
« Ener » en currentColor, « Tchad » en var(--et-logo-or). logo_img() renvoie la variante
sombre en <img> pour les pieds de page nuit.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_P = None


def _paths():
    global _P
    if _P is None:
        with open(os.path.join(ROOT, 'scripts', 'logo_paths.json'), encoding='utf-8') as fh:
            _P = json.load(fh)
    return _P


def logo_svg(cls='et-logo', gid='etlg'):
    p = _paths()
    return ('<svg class="{cls}" viewBox="0 0 {w} {h}" width="{wi}" height="{h}" role="img" aria-label="EnerTchad" focusable="false">'
            '<title>EnerTchad</title><defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#DBAE4A"/><stop offset="1" stop-color="#C2922E"/></linearGradient></defs>'
            '<g transform="scale({ps})">'
            '<path d="M100 96 L126.98 67.9 A37.4 37.4 0 1 0 73.02 67.9 Z" fill="url(#{gid})"/>'
            '<path d="M96 100 L67.9 73.02 A37.4 37.4 0 1 0 67.9 126.98 Z" fill="#1E6EC2"/>'
            '<path d="M104 100 L132.1 126.98 A37.4 37.4 0 1 0 132.1 73.02 Z" fill="#218A2C"/>'
            '<path d="M100 104 L73.02 132.1 A37.4 37.4 0 1 0 126.98 132.1 Z" fill="#E8CD7F"/></g>'
            '<path d="{ener}" fill="currentColor"/><path d="{tchad}" fill="var(--et-logo-or,#7A5A12)"/></svg>'
            ).format(cls=cls, w=p['width'], wi=int(round(p['width'])), h=int(p['height']), gid=gid, ps=p['picto_scale'],
                     ener=p['ener'], tchad=p['tchad'])


def logo_img(cls='et-logo', lazy=True):
    p = _paths()
    return ('<img class="{cls}" src="/assets/brand/enertchad-logo-h-sombre.svg" alt="EnerTchad" '
            'width="{w}" height="{h}"{lazy} decoding="async">').format(
        cls=cls, w=int(round(p['width'])), h=int(p['height']), lazy=' loading="lazy"' if lazy else '')

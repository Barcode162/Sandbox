// src/main.ts — FROZEN (WO-001). Entry: styles + boot.
import './style.css';
import { bootGame } from './app/game.ts';
import { blockZoom } from './input/nozoom.ts';

blockZoom();
bootGame(document.getElementById('app')!);

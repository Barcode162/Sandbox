// src/main.ts — FROZEN (WO-001). Entry: styles + boot.
import './style.css';
import { bootGame } from './app/game.ts';

bootGame(document.getElementById('app')!);

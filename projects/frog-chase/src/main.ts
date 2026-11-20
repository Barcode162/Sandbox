/** Entry point. OWNER: WO-004. Keep it this thin. */
import { createApp } from './app/app';

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const ui = document.getElementById('ui') as HTMLElement;
const app = createApp(canvas, ui);
window.__lily = app.hook;

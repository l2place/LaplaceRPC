const fs = require('node:fs');
const path = require('node:path');
function loadConfig(file = path.join(__dirname, 'config.json')) {
  if (!fs.existsSync(file)) throw new Error('Copy config.example.json to config.json and set your Discord Application ID.');
  const c = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!/^\d{17,20}$/.test(c.clientId || '')) throw new Error('clientId must be your numeric Discord Application ID. No token is needed.');
  for (const key of ['details', 'state']) {
    if (typeof c[key] !== 'string' || c[key].length < 2 || c[key].length > 128) throw new Error(`${key} must contain 2-128 characters.`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(c.activeSince || '') || !Number.isFinite(Date.parse(c.activeSince)) || new Date(c.activeSince).toISOString().slice(0,10) !== c.activeSince || Date.parse(c.activeSince) > Date.now()) throw new Error('activeSince must be a valid past date in YYYY-MM-DD format.');
  c.buttons = c.buttons || [];
  if (!Array.isArray(c.buttons) || c.buttons.length > 2) throw new Error('Use at most two buttons.');
  for (const b of c.buttons) {
    if (typeof b.label !== 'string' || b.label.length < 1 || b.label.length > 32 || !/^https?:\/\//.test(b.url || '')) throw new Error('Each button needs a 1-32 character label and an HTTP(S) URL.');
    new URL(b.url);
  }
  for (const key of ['largeImageKey', 'largeImageText']) if (c[key] !== undefined && (typeof c[key] !== 'string' || c[key].length > 256)) throw new Error(`${key} must be a string up to 256 characters.`);
  if (c.showElapsedTime !== undefined && typeof c.showElapsedTime !== 'boolean') throw new Error('showElapsedTime must be true or false.');
  return c;
}
module.exports = { loadConfig };

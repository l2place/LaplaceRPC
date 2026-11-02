const RPC = require('discord-rpc');

const { loadConfig } = require('./config');
let config;
try { config = loadConfig(); } catch (error) { console.error(error.message); process.exit(1); }
const clientId = config.clientId;
const fs = require('fs');
const path = require('path');
let client;
let activityTimer;
let retryTimer;
let stopping = false;
let activityConfirmed = false;

function log(message) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  try { fs.appendFileSync(path.join(__dirname, 'rpc.log'), line + '\n'); }
  catch (error) { console.error('Cannot write rpc.log:', error.message); }
}

const startTimestamp = config.showElapsedTime ? new Date() : undefined;
const activeSince = new Date(config.activeSince);

function getActiveDuration() {
  const now = new Date();
  let years = now.getFullYear() - activeSince.getFullYear();
  let months = now.getMonth() - activeSince.getMonth();
  let days = now.getDate() - activeSince.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}mo`);
  if (years === 0 && months === 0) parts.push(`${days}d`);

  return parts.join(' ') || '0d';
}

async function setActivity(connection = client) {
  if (!connection || connection !== client) return;

  const result = await connection.setActivity({
    details: config.details.replaceAll('{duration}', getActiveDuration()),
    state: config.state,
    startTimestamp,
    largeImageKey: config.largeImageKey || undefined,
    largeImageText: config.largeImageText || undefined,
    instance: false,
    buttons: config.buttons,
  });
  if (!activityConfirmed) {
    fs.writeFileSync(path.join(__dirname, 'rpc-status.json'), JSON.stringify({ pid: process.pid, connected: true, updated: new Date().toISOString(), username: connection.user.username, activity: result }));
    log('Discord accepted activity.');
    activityConfirmed = true;
  }
}

function reconnect(connection, error) {
  if (stopping || client !== connection) return;
  client = null;
  activityConfirmed = false;
  fs.writeFileSync(path.join(__dirname, 'rpc-status.json'), JSON.stringify({ pid: process.pid, connected: false, updated: new Date().toISOString(), error: String(error.message || error) }));
  clearInterval(activityTimer);
  if (connection.transport.socket) connection.transport.socket.destroy();
  log(`Discord connection unavailable: ${error.message || error}. Retrying in 15 seconds.`);
  clearTimeout(retryTimer);
  retryTimer = setTimeout(connect, 15000);
}

function connect() {
  if (stopping) return;
  const connection = new RPC.Client({ transport: 'ipc' });
  client = connection;
  connection.on('error', error => reconnect(connection, error));
  connection.on('disconnected', () => reconnect(connection, new Error('Disconnected')));
  connection.on('ready', () => {
    if (client !== connection) return;
    log('Connected to Discord.');
    const update = () => setActivity(connection).catch(error => reconnect(connection, error));
    update();
    activityTimer = setInterval(update, 15000);
  });
  connection.login({ clientId }).catch(error => reconnect(connection, error));
}

function shutdown() {
  stopping = true;
  clearTimeout(retryTimer);
  clearInterval(activityTimer);
  if (client && client.transport.socket) client.transport.socket.destroy();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
connect();




const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
async function run(fail) {
 const clients = [], writes = [], retries = [], intervals = [];
 class Client extends EventEmitter {
  constructor() { super(); clients.push(this); this.user = {username: 'test-user'}; this.transport = {socket:{destroy(){}}}; }
  async login() { if (fail) throw new Error('Could not connect'); this.emit('ready'); }
  async setActivity(activity) { return {name:'Test App', ...activity}; }
 }
 const config = {clientId:'123456789012345678',activeSince:'2020-01-01',showElapsedTime:true,details:'Active for {duration}',state:'Testing',buttons:[]};
 vm.runInNewContext(source, {
  require(name) {
   if (name === 'discord-rpc') return {Client};
   if (name === './config') return {loadConfig:()=>config};
   if (name === 'fs') return {appendFileSync(){},writeFileSync:(file,data)=>writes.push(JSON.parse(data))};
   if (name === 'path') return path;
   throw new Error(name);
  },
  __dirname: 'test', console: {log(){},error(){}}, process:{pid:123,on(){},exit(){throw new Error('Unexpected exit');}},
  setInterval(fn,ms){ intervals.push({fn,ms}); return intervals.length; }, clearInterval(){},
  setTimeout(fn,ms){ retries.push({fn,ms}); return retries.length; }, clearTimeout(){}
 });
 await new Promise(resolve=>setImmediate(resolve));
 return {clients,writes,retries,intervals};
}
test('successful connection records acknowledgement for the current process', async()=>{
 const r = await run(false);
 assert.equal(r.writes[0].pid,123);
 assert.equal(r.writes[0].connected,true);
 assert.match(r.writes[0].activity.details,/Active for/);
 assert.equal(r.intervals[0].ms,15000);
});
test('Discord unavailable schedules retry and records disconnected state', async()=>{
 const r = await run(true);
 assert.equal(r.writes[0].connected,false);
 assert.equal(r.retries.length,1);
 assert.equal(r.retries[0].ms,15000);
 r.retries[0].fn();
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(r.clients.length,2);
});
test('duplicate disconnect events schedule only one reconnect', async()=>{
 const r = await run(false);
 r.clients[0].emit('disconnected');
 r.clients[0].emit('disconnected');
 assert.equal(r.retries.length,1);
 assert.equal(r.writes.at(-1).connected,false);
});

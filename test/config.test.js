const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('../config');
function check(change, fn) {
 const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'laplace-rpc-'));
 const file = path.join(dir, 'config.json');
 const c = { clientId: '123456789012345678', details: 'Active for {duration}', state: 'Building things', activeSince: '2020-01-01', buttons: [], ...change };
 try { fs.writeFileSync(file, JSON.stringify(c)); fn(file); } finally { fs.rmSync(dir, {recursive:true,force:true}); }
}
test('valid configuration loads', () => check({}, f => assert.equal(loadConfig(f).state, 'Building things')));
test('placeholder ID is rejected', () => check({clientId:'YOUR_ID'}, f => assert.throws(()=>loadConfig(f), /clientId/)));
test('impossible date is rejected', () => check({activeSince:'2020-02-31'}, f => assert.throws(()=>loadConfig(f), /activeSince/)));
test('unsafe button URL is rejected', () => check({buttons:[{label:'Website',url:'javascript:alert(1)'}]}, f => assert.throws(()=>loadConfig(f), /HTTP/)));
test('more than two buttons are rejected', () => check({buttons:Array(3).fill({label:'Site',url:'https://example.com'})}, f=>assert.throws(()=>loadConfig(f), /two/)));
test('missing config gives setup instructions', () => assert.throws(()=>loadConfig(path.join(os.tmpdir(),'missing-laplace-rpc-config.json')), /Copy config/));

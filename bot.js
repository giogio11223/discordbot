const {
  Client, GatewayIntentBits, SlashCommandBuilder,
  REST, Routes, EmbedBuilder,
} = require('discord.js');
require('dotenv').config();

const fs     = require('fs');
const http   = require('http');
const https  = require('https');
const crypto = require('crypto');

// ════════════════════════════
// CONFIG
// ════════════════════════════
function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`[Bot] FATAL: missing ${name}`); process.exit(1); }
  return v;
}

const TOKEN         = requireEnv('DISCORD_TOKEN');
const CLIENT_ID     = requireEnv('CLIENT_ID');
const GUILD_ID      = requireEnv('GUILD_ID');
const ALLOWED_GUILD = process.env.ALLOWED_GUILD || GUILD_ID;
const ROLE_ID       = requireEnv('SUPPORT_ROLE_ID');
const OWNER_ID      = requireEnv('OWNER_ID');
const GUI_API_KEY   = requireEnv('GUI_API_KEY');

const SUPERUSERS = (process.env.SUPERUSER_IDS || '')
  .split(',').map(s => s.trim()).filter(Boolean);
if (!SUPERUSERS.length) { console.error('[Bot] FATAL: SUPERUSER_IDS empty'); process.exit(1); }

const GAMES_FILE     = './games.json';
const WHITELIST_FILE = './whitelist.json';
const CONTRIB_FILE   = './contributors.json';
const SESSIONS_FILE  = './sessions.json';
const AUDITLOG_FILE  = './auditlog.json';
const BACKUP_FILE    = './games_backup.json';
const KEYS_FILE      = './keys.json';
const OUTPUT_FILE    = './hub_games_output.lua';
const RAYFIELD_FILE  = './ikat_hub_rayfield.lua';
const KEYSYSTEM_FILE = './ikat_hub_keysystem.lua';

// Python GUI polls this file to detect changes made via Discord
const CHANGE_SIGNAL_FILE = './games_changed.flag';

const WEBHOOK_PORT   = Number(process.env.WEBHOOK_PORT || 3000);
const HTTP_BIND_HOST = process.env.HTTP_BIND_HOST || '127.0.0.1';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

const BOT_START = Date.now();

// ════════════════════════════
// DEFAULT GAMES
// ════════════════════════════
const DEFAULT_GAMES = {
  "126958120": {
    gameId:"126958120", placeId:"65241", gameName:"natural disaster Survival",
    scripts:[
      {name:"op",url:"https://raw.githubusercontent.com/OMNIMANRUSSIA/NDS-OMNIMAN-GOD-TOUCH-FLING-ANTISIT-ANTIBANG/main/main.lua"},
      {name:"w", url:"https://raw.githubusercontent.com/axionscripts1/Move-Blocks-v20/refs/heads/main/README.md"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "3301628126": {
    gameId:"3301628126", placeId:"111958650", gameName:"Arsenal",
    scripts:[
      {name:"xcmfn hub",    url:"https://gist.githubusercontent.com/XCMEN77/f1892a0507fde901f7e6d40d314e123f/raw/f6c140a29cb39eed68099a2a7c2d7ee253500d68/XCMEN%2520Arsenal"},
      {name:"op ass script",url:"https://raw.githubusercontent.com/sytcal/SkiddedTech/main/Arsenal"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "537153558": {
    gameId:"537153558", placeId:"994732206", gameName:"blox fruits",
    scripts:[
      {name:"op script blox fruits.",url:"https://raw.githubusercontent.com/Kenniel123/BloxFruits/refs/heads/main/BloxFruits"},
      {name:"feather hub",           url:"https://gistpad.com/raw/feather-23"},
      {name:"styxzhub",              url:"https://raw.githubusercontent.com/ToshyWare/StyxzHub/main/Styxz.lua"},
      {name:"xfc hub",               url:"https://pastebin.com/raw/JezpWBtk"},
      {name:"katerhub",              url:"https://raw.githubusercontent.com/KaterHub-Inc/NaturalDisasterSurvival/refs/heads/main/main.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "4482145626": {
    gameId:"4482145626", placeId:"12355337193", gameName:"Murderers VS Sheriffs DUELS",
    scripts:[
      {name:"op",        url:"https://raw.githubusercontent.com/Kurbywtww/kurbys/refs/heads/main/mvsd.lua"},
      {name:"gui aimbot",url:"https://pastebin.com/raw/d4y0fXZ8"},
      {name:"polo",      url:"https://raw.githubusercontent.com/polo242c/mvs/main/mvs"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "2975802518": {
    gameId:"2975802518", placeId:"10039338037", gameName:"build a ring farm",
    scripts:[
      {name:"good script keyless",url:"https://api.luarmor.net/files/v4/loaders/544f64759db6021216af8ca483bb53c4.lua"},
      {name:"goha hub",           url:"https://raw.githubusercontent.com/Dodoyung24/script-core/main/Build-A-Ring-Farm"},
      {name:"foxname hub",        url:"https://raw.githubusercontent.com/caomod2077/Script/refs/heads/main/Fn_BARF.lua"},
      {name:"nox hub",            url:"https://raw.githubusercontent.com/NOX-ZUHILL/NOX-/refs/heads/main/NOX%20loader.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "2534724771": {
    gameId:"2534724771", placeId:"7395930870", gameName:"sell lemons",
    scripts:[
      {name:"hoshi hub",url:"https://raw.githubusercontent.com/Fluxyyy333/HoshiOnTop/main/loader.lua"},
      {name:"lumin",    url:"https://api.luarmor.net/files/v4/loaders/8165f94952d691f45ac33d50bc1f4044.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "3420277185": {
    gameId:"3420277185", placeId:"9584852943", gameName:"1+ Speed Keyboard Escape",
    scripts:[
      {name:"good keyless script",url:"https://raw.githubusercontent.com/71df11b32534fe3b4e657a77dc424940/script/refs/heads/main/main.lua"},
      {name:"entity hub",         url:"https://raw.githubusercontent.com/vanbr0th9-lgtm/speedescape/refs/heads/main/speedchocolate.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "1174290636": {
    gameId:"1174290636", placeId:"9970645639", gameName:"Run a Restaurant!",
    scripts:[
      {name:"dynamic",     url:"https://raw.githubusercontent.com/feasthax/loader/refs/heads/main/RunARestaraunt.lua"},
      {name:"codecast hub",url:"https://raw.githubusercontent.com/Breadido/Codecoat/refs/heads/main/looder.luau"},
      {name:"jin hub",     url:"https://jinhub.my.id/scripts/Universal.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "2817438": {
    gameId:"2817438", placeId:"9348272796", gameName:"Survive Zombie Arena",
    scripts:[
      {name:"expensive hub",    url:"https://api.luarmor.net/files/v4/loaders/22610179dddca088d4b716baa0f413a1.lua"},
      {name:"foxname hub",      url:"https://raw.githubusercontent.com/caomod2077/Script/refs/heads/main/Foxname_SZA.lua"},
      {name:"execute in lobby", url:"https://api.jnkie.com/api/v1/luascripts/public/01b8b9c33ae7ac3bc5e2ee6be47ffc3f77fc1672bc92dea28f41caa1010479cc/download"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "5059530": {
    gameId:"5059530", placeId:"7326934954", gameName:"99 Nights in the Forest",
    scripts:[
      {name:"exerium",        url:"https://raw.githubusercontent.com/Valak542/99Nights/refs/heads/main/99NightsV1"},
      {name:"ringta",         url:"https://raw.githubusercontent.com/nlzzpro/rscripts/refs/heads/main/99nights"},
      {name:"voidware",       url:"https://raw.githubusercontent.com/VapeVoidware/VWExtra/main/NightsInTheForest.lua"},
      {name:"illusionary hub",url:"https://nexus-script.vercel.app/99-Nights-in-the-Forest.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "3079745162": {
    gameId:"3079745162", placeId:"10004244222", gameName:"Kick a Lucky Block",
    scripts:[
      {name:"phantom hub",url:"https://raw.githubusercontent.com/Dalkoski/Phantom/refs/heads/main/Loader"},
      {name:"zolt hub",   url:"https://raw.githubusercontent.com/f34p9fh3a4/.xyz/refs/heads/main/loader.lua"},
      {name:"goha hub",   url:"https://raw.githubusercontent.com/Dodoyung24/script-core/main/Kick-A-Lucky-Block"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "3987989416": {
    gameId:"3987989416", placeId:"10199301628", gameName:"Merge a Nuke!",
    scripts:[
      {name:"cute little hub",url:"https://raw.githubusercontent.com/gumanba/Scripts/refs/heads/main/MergeaNuke"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "5481738155": {
    gameId:"5481738155", placeId:"9792947201", gameName:"Slime RNG",
    scripts:[
      {name:"stellar",   url:"https://raw.githubusercontent.com/Dalkoski/Stellar/refs/heads/main/Loader"},
      {name:"obi hub",   url:"https://pastebin.com/raw/GpmHv0ht"},
      {name:"OTC hub",   url:"https://raw.githubusercontent.com/Aerlro/OTC/refs/heads/main/Loader"},
      {name:"cactus hub",url:"https://raw.githubusercontent.com/71df11b32534fe3b4e657a77dc424940/script/refs/heads/main/main.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "2485021620": {
    gameId:"2485021620", placeId:"6931042565", gameName:"Volleyball Legends",
    scripts:[
      {name:"cyber coder",url:"https://raw.githubusercontent.com/CyberCodersStudio/CyberCoders/refs/heads/main/Script"},
      {name:"Sum1ks hub", url:"https://raw.githubusercontent.com/M1zard/LokisVoley/refs/heads/main/VolleyBallLegendsScript.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "3530701082": {
    gameId:"3530701082", placeId:"9837612476", gameName:"Mini War",
    scripts:[
      {name:"cyraa hub",url:"https://raw.githubusercontent.com/LynX99-9/komtolmmek2script/refs/heads/main/CyraaHub.lua"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "761252704": {
    gameId:"761252704", placeId:"2404080894", gameName:"funky friday",
    scripts:[
      {name:"null fire",url:"https://null-api.onrender.com/script"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
  "380745631": {
    gameId:"380745631", placeId:"245662005", gameName:"Jailbreak",
    scripts:[
      {name:"sexsacion hub",        url:"https://api.luarmor.net/files/v3/loaders/730854e5b6499ee91deb1080e8e12ae3.lua"},
      {name:"universal auto farm",  url:"https://raw.githubusercontent.com/BlitzIsKing/UniversalFarm/main/Loader/Regular"},
      {name:"silent aim jailbreak", url:"https://raw.githubusercontent.com/sneekygoober/Jailbreak-Silent-Aim-Keyless/refs/heads/main/main.luau"},
    ],
    addedBy:"system",addedByTag:"system",addedAt:new Date().toISOString(),disabled:false,
  },
};

// ════════════════════════════
// PERMISSIONS
// ════════════════════════════
const SUPPORT_COMMANDS = new Set([
  'addgame','removegame','addscript','removescript','replacescript',
]);
function isSuperuser(i) { return SUPERUSERS.includes(i.user.id); }
function isSupport(i) {
  if (i.member?.roles.cache.has(ROLE_ID)) return true;
  if (loadWhitelist().users.includes(i.user.id)) return true;
  return false;
}
function isAllowed(i) {
  if (isSuperuser(i)) return true;
  if (SUPPORT_COMMANDS.has(i.commandName) && isSupport(i)) return true;
  return false;
}

// ════════════════════════════
// FILE HELPERS
// ════════════════════════════
function lockDown(file) {
  try { fs.chmodSync(file, 0o600); } catch(e) { console.warn(`[Bot] chmod failed for ${file}:`, e.message); }
}
function loadJSON(file, fallback={}) {
  if (!fs.existsSync(file)) { fs.writeFileSync(file, JSON.stringify(fallback,null,2)); lockDown(file); }
  try { return JSON.parse(fs.readFileSync(file,'utf8')); } catch { return fallback; }
}
function saveJSON(f,d) { fs.writeFileSync(f, JSON.stringify(d,null,2)); lockDown(f); }

function loadGames() {
  if (!fs.existsSync(GAMES_FILE)) { saveJSON(GAMES_FILE, DEFAULT_GAMES); return DEFAULT_GAMES; }
  try {
    const data = JSON.parse(fs.readFileSync(GAMES_FILE,'utf8'));
    if (!Object.keys(data).length) { saveJSON(GAMES_FILE, DEFAULT_GAMES); return DEFAULT_GAMES; }
    return data;
  } catch { return DEFAULT_GAMES; }
}
function loadWhitelist() { return loadJSON(WHITELIST_FILE,{users:[]}); }
function saveWhitelist(w){ saveJSON(WHITELIST_FILE,w); }
function loadContribs()  { return loadJSON(CONTRIB_FILE,{}); }
function saveContribs(c) { saveJSON(CONTRIB_FILE,c); }
function loadSessions()  { return loadJSON(SESSIONS_FILE,{}); }
function saveSessions(s) { saveJSON(SESSIONS_FILE,s); }
function loadAuditLog()  { return loadJSON(AUDITLOG_FILE,[]); }
function loadKeys()      { return loadJSON(KEYS_FILE,[]); }
function saveKeys(k)     { saveJSON(KEYS_FILE,k); }

// ── Change signal: written whenever Discord modifies games ─────────────────
// Python polls GET /games/changed to detect this and reload its local state.
function signalChange() {
  try {
    fs.writeFileSync(CHANGE_SIGNAL_FILE, String(Date.now()), 'utf8');
  } catch(e) { console.warn('[Bot] signalChange failed:', e.message); }
}

// ════════════════════════════
// ROBLOX API
// ════════════════════════════
function fetchJSON(url) {
  return new Promise((resolve,reject) => {
    https.get(url,{headers:{'User-Agent':'IkatHubBot/1.0'}},res => {
      if (res.statusCode>=300&&res.statusCode<400&&res.headers.location)
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      let data='';
      res.on('data',c=>{data+=c;});
      res.on('end',()=>{ try{resolve(JSON.parse(data));}catch(e){reject(new Error(`Bad JSON (${res.statusCode}): ${e.message}`));} });
    }).on('error',reject);
  });
}
async function robloxPlaceToInfo(placeId) {
  const uniData = await fetchJSON(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
  const universeId = uniData?.universeId;
  if (!universeId) throw new Error('No universe found for that Place ID.');
  const gameData = await fetchJSON(`https://games.roblox.com/v1/games?universeIds=${universeId}`);
  const game = gameData?.data?.[0];
  if (!game) throw new Error('Could not fetch game details from Roblox API.');
  return {
    universeId: String(universeId),
    placeId:    String(placeId),
    name:       game.name          ?? 'Unknown',
    creator:    game.creator?.name ?? 'Unknown',
    visits:     (game.visits       ?? 0).toLocaleString(),
    playing:    (game.playing      ?? 0).toLocaleString(),
    maxPlayers: game.maxPlayers    ?? '?',
    created:    game.created       ? game.created.slice(0,10) : '?',
    updated:    game.updated       ? game.updated.slice(0,10) : '?',
    genre:      game.genre         ?? '?',
  };
}

// ════════════════════════════
// LUA BUILDERS
// ════════════════════════════
function buildRayfieldGameBlock(games) {
  const entries = Object.values(games).filter(g => !g.disabled);
  if (!entries.length) return `else\n   local gametab = Window:CreateTab("Game Not Supported","ban")\nend\n`;
  let lua = `-- Hub Games Output\n-- Generated: ${new Date().toISOString()}\n-- Total games: ${entries.length}\n-- Total scripts: ${entries.reduce((a,g)=>a+g.scripts.length,0)}\n\n`;
  entries.forEach((game,idx) => {
    const placeId = game.placeId || game.gameId;
    const kw = idx===0?'if':'elseif';
    const btns = game.scripts.map(s => {
      const id    = s.name.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'');
      const label = `${game.gameName} ${s.name}`;
      return `   local Button_${id} = gameTab:CreateButton({\n      Name = ${JSON.stringify(s.name)},\n      Callback = function()\n         safeLoad(${JSON.stringify(label)}, ${JSON.stringify(s.url)})\n      end,\n   })`;
    }).join('\n');
    lua += `  -- ${game.gameName}\n${kw} game.GameId == ${placeId} then\n   local gameTab = Window:CreateTab(${JSON.stringify(game.gameName)}, 4483362458)\n   local Section = gameTab:CreateSection(${JSON.stringify(game.gameName)})\n${btns}\n\n`;
  });
  lua += `else\n   local gametab = Window:CreateTab("Game Not Supported","ban")\n   local Label = gametab:CreateLabel("Game Not Supported","ban")\nend\n`;
  return lua;
}

function rebuildOutput(games) {
  fs.writeFileSync(OUTPUT_FILE, buildRayfieldGameBlock(games),'utf8');
  console.log('[Bot] hub_games_output.lua rebuilt.');
}

const RF_START='-- [[RAYFIELD_GAMES_START]]';
const RF_END  ='-- [[RAYFIELD_GAMES_END]]';
function rebuildRayfieldOutput(games) {
  if (!fs.existsSync(RAYFIELD_FILE)) { console.warn('[Bot] ikat_hub_rayfield.lua not found.'); return null; }
  const full=fs.readFileSync(RAYFIELD_FILE,'utf8');
  const si=full.indexOf(RF_START),ei=full.indexOf(RF_END);
  if (si===-1||ei===-1) { console.warn('[Bot] Rayfield markers not found.'); return null; }
  const newFull=full.slice(0,si+RF_START.length)+'\n'+buildRayfieldGameBlock(games)+full.slice(ei);
  fs.writeFileSync(RAYFIELD_FILE,newFull,'utf8');
  console.log('[Bot] ikat_hub_rayfield.lua rebuilt.');
  return newFull;
}

const KS_START='-- [[GAMES_START]]';
const KS_END  ='-- [[GAMES_END]]';
function rebuildKeySystemOutput(games) {
  if (!fs.existsSync(KEYSYSTEM_FILE)) { console.warn('[Bot] ikat_hub_keysystem.lua not found.'); return null; }
  const full=fs.readFileSync(KEYSYSTEM_FILE,'utf8');
  const si=full.indexOf(KS_START),ei=full.indexOf(KS_END);
  if (si===-1||ei===-1) { console.warn('[Bot] Key system markers not found.'); return null; }
  const entries=Object.values(games).filter(g=>!g.disabled);
  let gLua='local SUPPORTED_GAMES = {\n';
  for (const g of entries) {
    const pid=g.placeId||g.gameId;
    gLua+=`    { name = ${JSON.stringify(g.gameName)}, universeId = ${g.gameId}, placeId = ${pid}, icon = "" },\n`;
  }
  gLua+='}\n';
  const newFull=full.slice(0,si+KS_START.length)+'\n'+gLua+full.slice(ei);
  fs.writeFileSync(KEYSYSTEM_FILE,newFull,'utf8');
  console.log('[Bot] ikat_hub_keysystem.lua rebuilt.');
  return newFull;
}

function saveGames(games) {
  if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
  saveJSON(GAMES_FILE,games);
  rebuildOutput(games);
  rebuildRayfieldOutput(games);
  rebuildKeySystemOutput(games);
  // Signal the Python GUI that games changed so it reloads
  signalChange();
  console.log('[Bot] All Lua files updated.');
}

// ════════════════════════════
// AUDIT / KEYS / CONTRIB
// ════════════════════════════
function addAuditLog(tag,action,detail) {
  const log=loadAuditLog();
  log.unshift({userTag:tag,action,detail,at:new Date().toISOString()});
  if (log.length>200) log.splice(200);
  saveJSON(AUDITLOG_FILE,log);
}
function generateKey() {
  return 'IKAT-'+crypto.randomBytes(4).toString('hex').toUpperCase()+'-'+
    crypto.randomBytes(4).toString('hex').toUpperCase()+'-'+
    crypto.randomBytes(4).toString('hex').toUpperCase();
}
function validateKey(key) { return loadKeys().find(k=>k.key===key&&k.active!==false)||null; }
function addKey(key,note='',addedBy='system') {
  const keys=loadKeys();
  if (keys.find(k=>k.key===key)) return false;
  keys.push({key,note,addedBy,addedAt:new Date().toISOString(),active:true});
  saveKeys(keys); return true;
}
function revokeKey(key) {
  const keys=loadKeys();
  const e=keys.find(k=>k.key===key);
  if (!e) return false;
  e.active=false; e.revokedAt=new Date().toISOString();
  saveKeys(keys); return true;
}
function recordContrib(userId,tag) {
  const c=loadContribs();
  if (!c[userId]) c[userId]={tag,count:0};
  c[userId].tag=tag; c[userId].count++;
  saveContribs(c);
}
function getTopContributor() {
  const c=loadContribs(),e=Object.entries(c);
  if (!e.length) return null;
  e.sort((a,b)=>b[1].count-a[1].count);
  return {userId:e[0][0],...e[0][1]};
}
function fmtUp(ms) {
  const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60),d=Math.floor(h/24);
  if (d>0) return `${d}d ${h%24}h ${m%60}m`;
  if (h>0) return `${h}h ${m%60}m ${s%60}s`;
  if (m>0) return `${m}m ${s%60}s`;
  return `${s}s`;
}

// ════════════════════════════
// HTTP HELPERS
// ════════════════════════════
function parseBody(req,maxBytes=64*1024) {
  return new Promise((res,rej) => {
    let b='',size=0;
    req.on('data',c=>{
      size+=c.length;
      if (size>maxBytes){req.destroy();rej(new Error('Body too large'));return;}
      b+=c;
    });
    req.on('end',()=>{try{res(JSON.parse(b));}catch{rej(new Error('Bad JSON'));}});
    req.on('error',rej);
  });
}

const RATE_LIMIT_WINDOW_MS=Number(process.env.RATE_LIMIT_WINDOW_MS||60_000);
const RATE_LIMIT_MAX      =Number(process.env.RATE_LIMIT_MAX||120);
const rateBuckets=new Map();
function isRateLimited(ip) {
  const now=Date.now();
  let b=rateBuckets.get(ip);
  if (!b||now>b.resetAt){b={count:0,resetAt:now+RATE_LIMIT_WINDOW_MS};rateBuckets.set(ip,b);}
  b.count++;
  return b.count>RATE_LIMIT_MAX;
}
setInterval(()=>{const now=Date.now();for(const[ip,b]of rateBuckets)if(now>b.resetAt)rateBuckets.delete(ip);},RATE_LIMIT_WINDOW_MS).unref();

function safeEqual(a,b) {
  const bufA=Buffer.from(String(a||''));
  const bufB=Buffer.from(String(b||''));
  if (bufA.length!==bufB.length) return false;
  return crypto.timingSafeEqual(bufA,bufB);
}
function clientIp(req) { return (req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim(); }
function isLocalhost(req) {
  const ip = clientIp(req);
  return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
}

// API key check: localhost requests on /gui/ routes are ALWAYS allowed (no key needed).
// External requests MUST supply the correct X-API-Key header.
function requireApiKey(req) {
  if (isLocalhost(req)) return true;            // Python GUI runs locally — no key needed
  return safeEqual(req.headers['x-api-key'], GUI_API_KEY);
}

// ════════════════════════════
// INIT FILES
// ════════════════════════════
function initFiles() {
  if (!fs.existsSync(RAYFIELD_FILE)) {
    fs.writeFileSync(RAYFIELD_FILE,`-- ikat_hub_rayfield.lua\n${RF_START}\n${RF_END}\n`,'utf8');
    console.log('[Bot] Created ikat_hub_rayfield.lua');
  } else {
    const src=fs.readFileSync(RAYFIELD_FILE,'utf8');
    if (!src.includes(RF_START)&&src.includes('-- Hub Games Output')) {
      fs.writeFileSync(RAYFIELD_FILE,src.replace('-- Hub Games Output',`${RF_START}\n${RF_END}`),'utf8');
      console.log('[Bot] Migrated ikat_hub_rayfield.lua');
    }
  }
  if (!fs.existsSync(KEYSYSTEM_FILE)) {
    fs.writeFileSync(KEYSYSTEM_FILE,`-- ikat_hub_keysystem.lua\n${KS_START}\nlocal SUPPORTED_GAMES = {}\n${KS_END}\n`,'utf8');
    console.log('[Bot] Created ikat_hub_keysystem.lua');
  }
  if (!fs.existsSync(WHITELIST_FILE)) saveJSON(WHITELIST_FILE,{users:[]});
  if (!fs.existsSync(CONTRIB_FILE))   saveJSON(CONTRIB_FILE,{});
  if (!fs.existsSync(SESSIONS_FILE))  saveJSON(SESSIONS_FILE,{});
  if (!fs.existsSync(AUDITLOG_FILE))  saveJSON(AUDITLOG_FILE,[]);
  if (!fs.existsSync(KEYS_FILE))      saveJSON(KEYS_FILE,[]);
  if (!fs.existsSync(GAMES_FILE)) {
    saveJSON(GAMES_FILE,DEFAULT_GAMES);
    console.log('[Bot] Seeded games.json with default games.');
  } else {
    try {
      const existing=JSON.parse(fs.readFileSync(GAMES_FILE,'utf8'));
      if (!Object.keys(existing).length){saveJSON(GAMES_FILE,DEFAULT_GAMES);console.log('[Bot] games.json was empty — seeded.');}
    } catch { saveJSON(GAMES_FILE,DEFAULT_GAMES); }
  }
  console.log('[Bot] File init complete.');
}

// ════════════════════════════
// DISCORD CLIENT
// ════════════════════════════
const client = new Client({
  intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,
           GatewayIntentBits.MessageContent,GatewayIntentBits.GuildMembers]
});
client.on('guildCreate',g=>{if(g.id!==ALLOWED_GUILD)g.leave();});

async function dmOwner(lines) {
  try {
    const owner=await client.users.fetch(OWNER_ID);
    const msg=lines.join('\n─────────────────\n');
    let i=0;while(i<msg.length){await owner.send(msg.slice(i,i+2000));i+=2000;}
  } catch(e){console.error('[Bot] DM failed:',e.message);}
}

// ════════════════════════════
// SLASH COMMANDS
// ════════════════════════════
const commands = [
  new SlashCommandBuilder().setName('addgame').setDescription('Add a new game to the hub')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID (game.GameId)').setRequired(true))
    .addStringOption(o=>o.setName('name').setDescription('Display name').setRequired(true))
    .addStringOption(o=>o.setName('scriptname').setDescription('First script label').setRequired(true))
    .addStringOption(o=>o.setName('scripturl').setDescription('First script URL').setRequired(true))
    .addStringOption(o=>o.setName('placeid').setDescription('Place ID (root place)')),

  new SlashCommandBuilder().setName('removegame').setDescription('Remove a game from the hub')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID').setRequired(true)),

  new SlashCommandBuilder().setName('addscript').setDescription('Add a script to an existing game')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID').setRequired(true))
    .addStringOption(o=>o.setName('name').setDescription('Script label').setRequired(true))
    .addStringOption(o=>o.setName('url').setDescription('Script URL').setRequired(true)),

  new SlashCommandBuilder().setName('removescript').setDescription('Remove a script from a game')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID').setRequired(true))
    .addStringOption(o=>o.setName('scriptname').setDescription('Script name').setRequired(true)),

  new SlashCommandBuilder().setName('replacescript').setDescription('Replace a script URL')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID').setRequired(true))
    .addStringOption(o=>o.setName('scriptname').setDescription('Script name').setRequired(true))
    .addStringOption(o=>o.setName('newurl').setDescription('New URL').setRequired(true)),

  new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  new SlashCommandBuilder().setName('uptime').setDescription('Show bot uptime'),
  new SlashCommandBuilder().setName('stats').setDescription('Show hub statistics'),

  new SlashCommandBuilder().setName('gameinfo').setDescription('Get info about a game in the hub')
    .addStringOption(o=>o.setName('gameid').setDescription('Universe ID').setRequired(true)),

  new SlashCommandBuilder().setName('listgames').setDescription('List all games in the hub'),

  new SlashCommandBuilder().setName('whitelist').setDescription('Manage whitelist (superuser only)')
    .addSubcommand(s=>s.setName('add').setDescription('Add user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s=>s.setName('remove').setDescription('Remove user').addUserOption(o=>o.setName('user').setDescription('User').setRequired(true)))
    .addSubcommand(s=>s.setName('list').setDescription('Show whitelist')),

  new SlashCommandBuilder().setName('genkey').setDescription('Generate an access key (superuser only)')
    .addStringOption(o=>o.setName('note').setDescription('Note for this key')),

  new SlashCommandBuilder().setName('revokekey').setDescription('Revoke an access key (superuser only)')
    .addStringOption(o=>o.setName('key').setDescription('Key to revoke').setRequired(true)),

  new SlashCommandBuilder().setName('auditlog').setDescription('Show recent audit log entries'),

  new SlashCommandBuilder().setName('placeid').setDescription('Convert a Roblox Place ID to Universe ID')
    .addStringOption(o=>o.setName('placeid').setDescription('The Roblox Place ID to look up').setRequired(true)),

].map(c=>c.toJSON());

async function registerCommands() {
  const rest=new REST({version:'10'}).setToken(TOKEN);
  try {
    console.log('[Bot] Registering slash commands…');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID,GUILD_ID),{body:commands});
    console.log('[Bot] Slash commands registered.');
  } catch(e){console.error('[Bot] Command registration failed:',e);}
}

// ════════════════════════════
// INTERACTION HANDLER
// ════════════════════════════
client.on('interactionCreate', async i => {
  if (!i.isChatInputCommand()) return;
  if (i.guildId!==ALLOWED_GUILD) return;

  if (i.commandName==='addgame') {
    if (!isAllowed(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gameId=i.options.getString('gameid');
    const gameName=i.options.getString('name');
    const scriptName=i.options.getString('scriptname');
    const scriptUrl=i.options.getString('scripturl');
    const placeId=i.options.getString('placeid')||gameId;
    const games=loadGames();
    if (games[gameId]) return i.reply({content:`❌ Game \`${gameId}\` already exists.`,ephemeral:true});
    await i.deferReply();
    games[gameId]={gameId,placeId,gameName,scripts:[{name:scriptName,url:scriptUrl}],addedBy:i.user.id,addedByTag:i.user.tag,addedAt:new Date().toISOString(),disabled:false};
    saveGames(games); // also calls signalChange()
    recordContrib(i.user.id,i.user.tag);
    addAuditLog(i.user.tag,'addgame',`${gameName} (${gameId})`);
    await dmOwner([`➕ **Game added via Discord**\n**${gameName}** \`${gameId}\`\nBy: ${i.user.tag}`]);
    return i.editReply({embeds:[new EmbedBuilder().setColor(0x1fc98e).setTitle('✅ Game Added')
      .addFields({name:'Game',value:gameName,inline:true},{name:'Universe ID',value:gameId,inline:true},{name:'Place ID',value:placeId,inline:true},{name:'Script',value:scriptName,inline:true})
      .setFooter({text:'Python GUI will auto-reload within 15 seconds.'})]});
  }

  if (i.commandName==='removegame') {
    if (!isAllowed(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gameId=i.options.getString('gameid');
    const games=loadGames();
    if (!games[gameId]) return i.reply({content:`❌ Game \`${gameId}\` not found.`,ephemeral:true});
    const name=games[gameId].gameName;
    delete games[gameId];
    saveGames(games); // also calls signalChange()
    addAuditLog(i.user.tag,'removegame',`${name} (${gameId})`);
    return i.reply({embeds:[new EmbedBuilder().setColor(0xf04f6e).setTitle('🗑 Game Removed')
      .setDescription(`**${name}** removed.`)
      .setFooter({text:'Python GUI will auto-reload within 15 seconds.'})]});
  }

  if (i.commandName==='addscript') {
    if (!isAllowed(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gameId=i.options.getString('gameid');
    const name=i.options.getString('name');
    const url=i.options.getString('url');
    const games=loadGames();
    if (!games[gameId]) return i.reply({content:`❌ Game \`${gameId}\` not found.`,ephemeral:true});
    if (games[gameId].scripts.find(s=>s.name===name)) return i.reply({content:`❌ Script \`${name}\` already exists.`,ephemeral:true});
    games[gameId].scripts.push({name,url});
    saveGames(games); // also calls signalChange()
    recordContrib(i.user.id,i.user.tag);
    addAuditLog(i.user.tag,'addscript',`${name} → ${games[gameId].gameName}`);
    await dmOwner([`➕ **Script added via Discord**\n**${games[gameId].gameName}** → \`${name}\`\nBy: ${i.user.tag}\n${url}`]);
    return i.reply({embeds:[new EmbedBuilder().setColor(0x1fc98e).setTitle('✅ Script Added')
      .addFields({name:'Game',value:games[gameId].gameName,inline:true},{name:'Script',value:name,inline:true})
      .setFooter({text:'Python GUI will auto-reload within 15 seconds.'})]});
  }

  if (i.commandName==='removescript') {
    if (!isAllowed(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gameId=i.options.getString('gameid');
    const scriptName=i.options.getString('scriptname');
    const games=loadGames();
    if (!games[gameId]) return i.reply({content:`❌ Game \`${gameId}\` not found.`,ephemeral:true});
    const before=games[gameId].scripts.length;
    games[gameId].scripts=games[gameId].scripts.filter(s=>s.name!==scriptName);
    if (games[gameId].scripts.length===before) return i.reply({content:`❌ Script \`${scriptName}\` not found.`,ephemeral:true});
    saveGames(games); // also calls signalChange()
    addAuditLog(i.user.tag,'removescript',`${scriptName} from ${games[gameId].gameName}`);
    return i.reply({embeds:[new EmbedBuilder().setColor(0xf04f6e).setTitle('🗑 Script Removed')
      .setDescription(`\`${scriptName}\` removed from **${games[gameId].gameName}**.`)
      .setFooter({text:'Python GUI will auto-reload within 15 seconds.'})]});
  }

  if (i.commandName==='replacescript') {
    if (!isAllowed(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gameId=i.options.getString('gameid');
    const scriptName=i.options.getString('scriptname');
    const newUrl=i.options.getString('newurl');
    const games=loadGames();
    if (!games[gameId]) return i.reply({content:`❌ Game \`${gameId}\` not found.`,ephemeral:true});
    const s=games[gameId].scripts.find(s=>s.name===scriptName);
    if (!s) return i.reply({content:`❌ Script \`${scriptName}\` not found.`,ephemeral:true});
    s.url=newUrl;
    saveGames(games); // also calls signalChange()
    addAuditLog(i.user.tag,'replacescript',`${scriptName} in ${games[gameId].gameName}`);
    return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('✏ Script URL Replaced')
      .addFields({name:'Game',value:games[gameId].gameName,inline:true},{name:'Script',value:scriptName,inline:true})
      .setFooter({text:'Python GUI will auto-reload within 15 seconds.'})]});
  }

  if (i.commandName==='ping') {
    if (!isSuperuser(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('🏓 Pong!')
      .addFields({name:'WebSocket',value:`${client.ws.ping}ms`,inline:true},{name:'Uptime',value:fmtUp(Date.now()-BOT_START),inline:true})]});
  }

  if (i.commandName==='uptime') {
    if (!isSuperuser(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('⏱ Uptime').setDescription(fmtUp(Date.now()-BOT_START))]});
  }

  if (i.commandName==='stats') {
    if (!isSuperuser(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const games=loadGames(),entries=Object.values(games);
    const active=entries.filter(g=>!g.disabled).length;
    const scripts=entries.reduce((a,g)=>a+g.scripts.length,0);
    const top=getTopContributor();
    return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('📊 Hub Stats')
      .addFields(
        {name:'Total Games',value:String(entries.length),inline:true},
        {name:'Active',value:String(active),inline:true},
        {name:'Disabled',value:String(entries.length-active),inline:true},
        {name:'Total Scripts',value:String(scripts),inline:true},
        {name:'Top Contributor',value:top?`${top.tag} (${top.count})`:'None',inline:true},
        {name:'Uptime',value:fmtUp(Date.now()-BOT_START),inline:true},
      )]});
  }

  if (i.commandName==='gameinfo') {
    if (!isSuperuser(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    const gid=i.options.getString('gameid');
    const games=loadGames();
    const g=games[gid];
    if (!g) return i.reply({content:`❌ Game \`${gid}\` not found.`,ephemeral:true});
    const embed=new EmbedBuilder().setColor(g.disabled?0xf04f6e:0x1fc98e).setTitle(g.gameName)
      .addFields(
        {name:'Universe ID',value:String(g.gameId),inline:true},
        {name:'Place ID',value:String(g.placeId||g.gameId),inline:true},
        {name:'Status',value:g.disabled?'⛔ Disabled':'✅ Active',inline:true},
        {name:'Scripts',value:String(g.scripts.length),inline:true},
        {name:'Added By',value:g.addedByTag||'Unknown',inline:true},
        {name:'Added At',value:(g.addedAt||'?').slice(0,10),inline:true},
      );
    if (g.scripts.length) embed.addFields({name:'Script List',value:g.scripts.map(s=>`• ${s.name}`).join('\n')});
    return i.reply({embeds:[embed]});
  }

  if (i.commandName==='listgames') {
    if (!isSuperuser(i)) return i.reply({content:'❌ No permission.',ephemeral:true});
    // Always read fresh from disk — catches Python GUI changes too
    const games=loadGames();
    const entries=Object.values(games);
    if (!entries.length) return i.reply({content:'No games in the hub yet.',ephemeral:true});
    const totalScripts=entries.reduce((a,g)=>a+g.scripts.length,0);
    const lines=entries.map(g=>
      `${g.disabled?'⛔':'✅'} **${g.gameName}** \`${g.gameId}\` — ${g.scripts.length} script(s)`
    );
    const chunks=[];let cur='';
    for (const l of lines){
      if ((cur+l+'\n').length>1900){chunks.push(cur);cur='';}
      cur+=l+'\n';
    }
    if (cur) chunks.push(cur);
    await i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff)
      .setTitle(`🎮 Hub Games — ${entries.length} games | ${totalScripts} scripts total`)
      .setDescription(chunks[0])]});
    for (let idx=1;idx<chunks.length;idx++)
      await i.followUp({embeds:[new EmbedBuilder().setColor(0x7c6fff).setDescription(chunks[idx])]});
    return;
  }

  if (i.commandName==='whitelist') {
    if (!isSuperuser(i)) return i.reply({content:'❌ Superusers only.',ephemeral:true});
    const sub=i.options.getSubcommand();
    const wl=loadWhitelist();
    if (sub==='add') {
      const user=i.options.getUser('user');
      if (wl.users.includes(user.id)) return i.reply({content:'Already whitelisted.',ephemeral:true});
      wl.users.push(user.id);saveWhitelist(wl);addAuditLog(i.user.tag,'whitelist-add',user.tag);
      return i.reply({content:`✅ ${user.tag} added to whitelist.`});
    }
    if (sub==='remove') {
      const user=i.options.getUser('user');
      wl.users=wl.users.filter(id=>id!==user.id);saveWhitelist(wl);addAuditLog(i.user.tag,'whitelist-remove',user.tag);
      return i.reply({content:`✅ ${user.tag} removed from whitelist.`});
    }
    if (sub==='list') {
      if (!wl.users.length) return i.reply({content:'Whitelist is empty.',ephemeral:true});
      const lines=await Promise.all(wl.users.map(async id=>{
        try{const u=await client.users.fetch(id);return `• ${u.tag} (${id})`;}
        catch{return `• Unknown (${id})`;}
      }));
      return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('📋 Whitelist').setDescription(lines.join('\n'))],ephemeral:true});
    }
  }

  if (i.commandName==='genkey') {
    if (!isSuperuser(i)) return i.reply({content:'❌ Superusers only.',ephemeral:true});
    const note=i.options.getString('note')||'';
    const key=generateKey();
    addKey(key,note,i.user.tag);addAuditLog(i.user.tag,'genkey',key);
    return i.reply({embeds:[new EmbedBuilder().setColor(0x1fc98e).setTitle('🔑 Key Generated')
      .addFields({name:'Key',value:`\`${key}\``},{name:'Note',value:note||'—',inline:true})],ephemeral:true});
  }

  if (i.commandName==='revokekey') {
    if (!isSuperuser(i)) return i.reply({content:'❌ Superusers only.',ephemeral:true});
    const key=i.options.getString('key');
    if (!revokeKey(key)) return i.reply({content:'❌ Key not found.',ephemeral:true});
    addAuditLog(i.user.tag,'revokekey',key);
    return i.reply({content:`✅ Key \`${key}\` revoked.`,ephemeral:true});
  }

  if (i.commandName==='auditlog') {
    if (!isSuperuser(i)) return i.reply({content:'❌ Superusers only.',ephemeral:true});
    const log=loadAuditLog().slice(0,15);
    if (!log.length) return i.reply({content:'Audit log is empty.',ephemeral:true});
    const lines=log.map(e=>{
      const ts=e.at?e.at.slice(0,16).replace('T',' '):'?';
      return `\`${ts}\` **${e.action}** by ${e.userTag} — ${e.detail}`;
    });
    return i.reply({embeds:[new EmbedBuilder().setColor(0x7c6fff).setTitle('📋 Audit Log (last 15)').setDescription(lines.join('\n'))],ephemeral:true});
  }

  if (i.commandName==='placeid') {
    const inputPlaceId=i.options.getString('placeid').trim();
    if (!/^\d+$/.test(inputPlaceId)) return i.reply({content:'❌ Place ID must be a number.',ephemeral:true});
    await i.deferReply();
    try {
      const info=await robloxPlaceToInfo(inputPlaceId);
      const embed=new EmbedBuilder().setColor(0x7c6fff).setTitle(`🎮 ${info.name}`)
        .setURL(`https://www.roblox.com/games/${inputPlaceId}`)
        .addFields(
          {name:'🔑 Universe ID',value:`\`${info.universeId}\``,inline:true},
          {name:'📍 Place ID',value:`\`${info.placeId}\``,inline:true},
          {name:'\u200B',value:'\u200B',inline:true},
          {name:'🟢 Active Players',value:info.playing,inline:true},
          {name:'👥 Max Players',value:String(info.maxPlayers),inline:true},
          {name:'\u200B',value:'\u200B',inline:true},
          {name:'🏆 Total Visits',value:info.visits,inline:true},
          {name:'🎭 Genre',value:info.genre,inline:true},
          {name:'👤 Creator',value:info.creator,inline:true},
          {name:'📅 Created',value:info.created,inline:true},
          {name:'🔄 Last Updated',value:info.updated,inline:true},
          {name:'\u200B',value:'\u200B',inline:true},
        )
        .addFields({name:'📋 Copy Universe ID',value:`\`\`\`\n${info.universeId}\n\`\`\``})
        .setFooter({text:'Data from Roblox API • Use the Universe ID above for /addgame'})
        .setTimestamp();
      return i.editReply({embeds:[embed]});
    } catch(err) {
      return i.editReply({content:`❌ Could not look up Place ID \`${inputPlaceId}\`.\n> ${err.message}`});
    }
  }
});

// ════════════════════════════
// HTTP SERVER
// ════════════════════════════
const httpServer = http.createServer(async (req,res) => {
  const ip=clientIp(req);
  if (isRateLimited(ip)) {
    res.writeHead(429,{'Content-Type':'application/json'});
    return res.end(JSON.stringify({error:'Too many requests'}));
  }

  const origin=req.headers.origin;
  if (origin&&ALLOWED_ORIGINS.includes(origin)) res.setHeader('Access-Control-Allow-Origin',origin);
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, X-API-Key');
  if (req.method==='OPTIONS'){res.writeHead(204);res.end();return;}

  const send=(data,code=200)=>{
    res.writeHead(code,{'Content-Type':'application/json'});
    res.end(JSON.stringify(data));
  };

  // ── Public routes (no API key needed) ─────────────────────────────────────
  if (req.method==='GET'&&req.url==='/health')
    return send({ok:true,uptime:Date.now()-BOT_START});

  // Python reads current state — no key needed for GET
  if (req.method==='GET'&&req.url==='/output')
    return send({lua:fs.existsSync(OUTPUT_FILE)?fs.readFileSync(OUTPUT_FILE,'utf8'):'',games:loadGames()});

  // ── NEW: Python polls this to detect Discord-side changes ──────────────────
  // Returns {changed: true, ts: <timestamp>} if the flag file exists and is
  // newer than the `since` query param (unix ms).  Python passes its last
  // known sync timestamp as ?since=<ms>.
  if (req.method==='GET'&&req.url.startsWith('/games/changed')) {
    const url = new URL(req.url, `http://localhost`);
    const since = Number(url.searchParams.get('since') || '0');
    if (fs.existsSync(CHANGE_SIGNAL_FILE)) {
      const ts = Number(fs.readFileSync(CHANGE_SIGNAL_FILE,'utf8').trim()||'0');
      if (ts > since) {
        const games = loadGames();
        return send({changed:true, ts, games});
      }
    }
    return send({changed:false});
  }

  if (req.method==='POST'&&req.url==='/validate-key') {
    try {
      const {key}=await parseBody(req);
      if (!key) return send({valid:false,reason:'No key'},400);
      const entry=validateKey(key);
      if (entry) {
        const keys=loadKeys(),k=keys.find(x=>x.key===key);
        if (k){k.lastUsed=new Date().toISOString();saveKeys(keys);}
        const games=loadGames();
        const entries=Object.values(games).filter(g=>!g.disabled).map(g=>({name:g.gameName,universeId:g.gameId,placeId:g.placeId||g.gameId}));
        return send({valid:true,note:entry.note||'',games:entries});
      }
      return send({valid:false,reason:'Invalid or revoked key'});
    } catch{return send({valid:false,reason:'Bad request'},400);}
  }

  if (req.method==='POST'&&req.url==='/session') {
    try {
      const d=await parseBody(req);
      if (!d.gameId||!d.gameName) return send({error:'Missing fields'},400);
      const ss=loadSessions();
      ss[d.userId||`anon_${Date.now()}`]={gameId:d.gameId,gameName:d.gameName,universeId:d.universeId||'N/A',placeId:d.placeId||d.gameId,detectedAt:new Date().toISOString()};
      saveSessions(ss);
      return send({ok:true});
    } catch{return send({error:'Bad JSON'},400);}
  }

  // ── API-key protected routes ───────────────────────────────────────────────
  // Localhost (Python GUI) is ALWAYS allowed — no key check.
  // Remote callers must supply X-API-Key.
  const needsKey = req.url.startsWith('/gui/') || req.url==='/keys' || req.url==='/stats';
  if (needsKey && !requireApiKey(req)) {
    addAuditLog('unknown','unauthorized-http',`${req.method} ${req.url} from ${ip}`);
    console.log(`[Bot] 401 Unauthorized: ${req.method} ${req.url} from ${ip}`);
    return send({error:'Unauthorized — missing or wrong X-API-Key header'},401);
  }

  if (req.method==='GET'&&req.url==='/stats') {
    const g=loadGames(),e=Object.values(g);
    return send({total:e.length,active:e.filter(x=>!x.disabled).length,disabled:e.filter(x=>x.disabled).length,scripts:e.reduce((a,x)=>a+x.scripts.length,0),uptime:Date.now()-BOT_START,top:getTopContributor(),log:loadAuditLog().slice(0,20)});
  }

  if (req.method==='GET'&&req.url==='/keys')
    return send({keys:loadKeys()});

  if (req.method==='POST'&&req.url==='/keys/generate') {
    try {
      const data=await parseBody(req).catch(()=>({}));
      const key=generateKey();
      addKey(key,data.note||'',data.addedBy||'GUI');
      addAuditLog('Python GUI','genkey',`Generated: ${key}`);
      return send({ok:true,key});
    } catch{return send({error:'Bad request'},400);}
  }

  if (req.method==='POST'&&req.url==='/keys/revoke') {
    try {
      const {key}=await parseBody(req);
      if (!key) return send({error:'Missing key'},400);
      return revokeKey(key)?(addAuditLog('Python GUI','revokekey',key),send({ok:true})):send({error:'Not found'},404);
    } catch{return send({error:'Bad request'},400);}
  }

  if (req.method==='POST'&&req.url==='/keys/add') {
    try {
      const {key,note}=await parseBody(req);
      if (!key) return send({error:'Missing key'},400);
      return addKey(key,note||'','GUI')?(addAuditLog('Python GUI','addkey',key),send({ok:true})):send({error:'Already exists'},409);
    } catch{return send({error:'Bad request'},400);}
  }

  // ── /gui/sync — Full replace from Python ──────────────────────────────────
  if (req.method==='POST'&&req.url==='/gui/sync') {
    try {
      const {games: pyGames} = await parseBody(req);
      if (!Array.isArray(pyGames)||!pyGames.length) return send({error:'games must be a non-empty array'},400);

      const newGames = {};
      for (const g of pyGames) {
        const uid = String(g.universeId||g.placeId||'');
        const pid = String(g.placeId||uid);
        if (!uid) continue;
        newGames[uid] = {
          gameId:     uid,
          placeId:    pid,
          gameName:   g.tabName||g.gameName||'Unknown',
          scripts:    (g.scripts||[]).map(s=>({name:String(s.name),url:String(s.url)})),
          addedBy:    'Python GUI',
          addedByTag: 'Python GUI',
          addedAt:    new Date().toISOString(),
          disabled:   false,
        };
      }

      // Use saveJSON directly here (not saveGames) so we don't trigger
      // signalChange back to Python — Python is the one pushing, it already knows.
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,newGames);
      rebuildOutput(newGames);
      rebuildRayfieldOutput(newGames);
      rebuildKeySystemOutput(newGames);
      addAuditLog('Python GUI','full-sync',`${Object.keys(newGames).length} games synced`);
      console.log(`[Bot] /gui/sync: replaced games.json with ${Object.keys(newGames).length} games from Python GUI.`);
      const sc = Object.values(newGames).reduce((a,g)=>a+g.scripts.length,0);
      return send({ok:true,games:Object.keys(newGames).length,scripts:sc});
    } catch(e){
      console.error('[Bot] /gui/sync error:',e.message);
      return send({error:e.message},400);
    }
  }

  if (req.method==='POST'&&req.url==='/gui/addgame') {
    try {
      const {gameId,gameName,scripts,placeId}=await parseBody(req);
      if (!gameId||!gameName||!Array.isArray(scripts)||!scripts.length) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (games[gameId]) return send({error:`Game ${gameId} already exists.`},409);
      games[gameId]={gameId,placeId:placeId||gameId,gameName,scripts,addedBy:'GUI',addedByTag:'Python GUI',addedAt:new Date().toISOString(),disabled:false};
      // Use saveJSON directly — Python initiated this, no need to signal back
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','addgame',`${gameName} (${gameId})`);
      return send({ok:true,gameId,gameName,scripts:scripts.length});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/addscript') {
    try {
      const {gameId,scriptName,url}=await parseBody(req);
      if (!gameId||!scriptName||!url) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      if (games[gameId].scripts.find(s=>s.name===scriptName)) return send({error:'Script already exists'},409);
      games[gameId].scripts.push({name:scriptName,url});
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','addscript',`${scriptName} → ${games[gameId].gameName}`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/removescript') {
    try {
      const {gameId,scriptName}=await parseBody(req);
      if (!gameId||!scriptName) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      const before=games[gameId].scripts.length;
      games[gameId].scripts=games[gameId].scripts.filter(s=>s.name!==scriptName);
      if (games[gameId].scripts.length===before) return send({error:'Script not found'},404);
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','removescript',`${scriptName} from ${games[gameId].gameName}`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/replacescript') {
    try {
      const {gameId,scriptName,newUrl}=await parseBody(req);
      if (!gameId||!scriptName||!newUrl) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      const s=games[gameId].scripts.find(s=>s.name===scriptName);
      if (!s) return send({error:'Script not found'},404);
      s.url=newUrl;
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','replacescript',`${scriptName} in ${games[gameId].gameName}`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/renamescript') {
    try {
      const {gameId,oldName,newName}=await parseBody(req);
      if (!gameId||!oldName||!newName) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      const s=games[gameId].scripts.find(s=>s.name===oldName);
      if (!s) return send({error:'Script not found'},404);
      if (games[gameId].scripts.find(s=>s.name===newName)) return send({error:'Name already in use'},409);
      s.name=newName;
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','renamescript',`${oldName} → ${newName} in ${games[gameId].gameName}`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/removegame') {
    try {
      const {gameId}=await parseBody(req);
      if (!gameId) return send({error:'Missing gameId'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      const name=games[gameId].gameName;
      delete games[gameId];
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','removegame',`${name} (${gameId})`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/togglegame') {
    try {
      const {gameId}=await parseBody(req);
      if (!gameId) return send({error:'Missing gameId'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      games[gameId].disabled=!games[gameId].disabled;
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','togglegame',`${games[gameId].gameName} → ${games[gameId].disabled?'disabled':'enabled'}`);
      return send({ok:true,disabled:games[gameId].disabled});
    } catch(e){return send({error:e.message},400);}
  }

  if (req.method==='POST'&&req.url==='/gui/renamegame') {
    try {
      const {gameId,newName}=await parseBody(req);
      if (!gameId||!newName) return send({error:'Missing fields'},400);
      const games=loadGames();
      if (!games[gameId]) return send({error:'Game not found'},404);
      const oldName=games[gameId].gameName;
      games[gameId].gameName=newName;
      if (fs.existsSync(GAMES_FILE)) fs.copyFileSync(GAMES_FILE,BACKUP_FILE);
      saveJSON(GAMES_FILE,games);
      rebuildOutput(games);rebuildRayfieldOutput(games);rebuildKeySystemOutput(games);
      addAuditLog('Python GUI','renamegame',`${oldName} → ${newName}`);
      return send({ok:true});
    } catch(e){return send({error:e.message},400);}
  }

  res.writeHead(404,{'Content-Type':'application/json'});
  res.end(JSON.stringify({error:'Not found'}));
});

// ════════════════════════════
// STARTUP
// ════════════════════════════
client.once('ready', async () => {
  console.log(`[Bot] Logged in as ${client.user.tag}`);
  initFiles();
  const games=loadGames();
  const gc=Object.keys(games).length;
  const sc=Object.values(games).reduce((a,g)=>a+g.scripts.length,0);
  console.log(`[Bot] Loaded ${gc} games, ${sc} scripts.`);
  rebuildOutput(games);
  rebuildRayfieldOutput(games);
  rebuildKeySystemOutput(games);
  await registerCommands();
  httpServer.listen(WEBHOOK_PORT,HTTP_BIND_HOST,()=>{
    console.log(`[Bot] HTTP server on ${HTTP_BIND_HOST}:${WEBHOOK_PORT}`);
    if (HTTP_BIND_HOST==='0.0.0.0') console.warn('[Bot] WARNING: bound to 0.0.0.0 — ensure firewall/reverse proxy is in front.');
  });
});

client.login(TOKEN);
/**
 * 🦞 龙虾宇宙 API 服务器 - 安全增强版
 */
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 10000;

// 安全配置
const RATE_LIMIT_WINDOW = 5000;
const MAX_ACTIONS_PER_MINUTE = 10;

// 中间件
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 安全头
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// 静态文件
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// ==================== 游戏状态 ====================
const gameState = {
    world: { resources: 100, order: 1, culture: 0, tech: 0, age: 0, createdAt: new Date().toISOString() },
    lobsters: new Map(),
    buildings: [],
    events: [{ icon: '🌌', text: '宇宙诞生，时空初现', time: 0, timestamp: new Date().toISOString() }],
    laws: [{ title: '和平共处', content: '龙虾之间禁止相互攻击' }]
};

// 安全存储
const sessions = new Map();
const rateLimits = new Map();

const IDENTITIES = {
    builder: { icon: '🏗️', name: '建设者' },
    explorer: { icon: '🧭', name: '探索者' },
    scholar: { icon: '📚', name: '学者' },
    merchant: { icon: '💎', name: '商人' },
    artist: { icon: '🎨', name: '艺术家' },
    guardian: { icon: '⚔️', name: '守护者' }
};

const BUILDING_TYPES = [
    { type: 'shelter', icon: '🏠', name: '庇护所', cost: 10 },
    { type: 'workshop', icon: '🔧', name: '工坊', cost: 20 },
    { type: 'observatory', icon: '🔭', name: '观星台', cost: 30 },
    { type: 'library', icon: '📚', name: '图书馆', cost: 40 },
    { type: 'temple', icon: '⛩️', name: '圣殿', cost: 50 },
    { type: 'market', icon: '🏪', name: '市场', cost: 25 },
    { type: 'garden', icon: '🌸', name: '花园', cost: 15 },
    { type: 'tower', icon: '🗼', name: '高塔', cost: 60 }
];

// 频率限制
function checkRateLimit(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const timestamps = rateLimits.get(ip) || [];
    const validTimestamps = timestamps.filter(t => now - t < 60000);
    if (validTimestamps.length >= MAX_ACTIONS_PER_MINUTE) {
        return res.status(429).json({ success: false, error: '请求过于频繁', retryAfter: 60 });
    }
    validTimestamps.push(now);
    rateLimits.set(ip, validTimestamps);
    next();
}

// 验证会话
function verifySession(req, res, next) {
    const lobsterId = req.headers['x-lobster-id'];
    const token = req.headers['x-session-token'];
    if (!lobsterId || !token) return res.status(401).json({ success: false, error: '未授权' });
    const session = sessions.get(lobsterId);
    if (!session || session.token !== token) return res.status(401).json({ success: false, error: '会话无效' });
    session.lastActive = Date.now();
    req.lobster = session.lobster;
    next();
}

// ==================== API 路由 ====================
app.get('/api/world', (req, res) => res.json({
    success: true,
    data: { ...gameState.world, lobsterCount: gameState.lobsters.size, buildingCount: gameState.buildings.length, buildings: gameState.buildings, events: gameState.events.slice(0, 50), laws: gameState.laws }
}));

app.get('/api/lobsters', (req, res) => res.json({
    success: true,
    data: Array.from(gameState.lobsters.values()).map(l => ({ id: l.id, name: l.name, identity: l.identity, avatar: IDENTITIES[l.identity]?.icon || '🦞', contribution: l.contribution }))
}));

app.post('/api/lobsters', checkRateLimit, (req, res) => {
    const { name, identity } = req.body;
    if (!name || name.trim().length < 2 || name.trim().length > 15) return res.json({ success: false, error: '名称需要2-15个字符' });
    if (!IDENTITIES[identity]) return res.json({ success: false, error: '无效的身份' });
    
    const lobsterId = uuidv4();
    const token = crypto.randomBytes(32).toString('hex');
    const lobster = { id: lobsterId, name: name.trim(), identity, contribution: 0, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, joinedAt: new Date().toISOString(), lastActive: Date.now() };
    
    gameState.lobsters.set(lobsterId, lobster);
    sessions.set(lobsterId, { lobster, token, created: Date.now() });
    
    gameState.events.unshift({ icon: '🦞', text: `${name} 成为了${IDENTITIES[identity].name}`, time: gameState.world.age, timestamp: new Date().toISOString() });
    
    res.json({ success: true, data: { id: lobsterId, name: lobster.name, identity: lobster.identity, avatar: IDENTITIES[lobster.identity].icon, contribution: lobster.contribution, token } });
});

app.post('/api/lobsters/:id/contribute', checkRateLimit, verifySession, (req, res) => {
    const lobster = req.lobster;
    const contribution = Math.floor(Math.random() * 10) + 5;
    lobster.contribution += contribution;
    gameState.world.resources += contribution;
    gameState.world.order = Math.min(100, gameState.world.order + 1);
    res.json({ success: true, data: { contribution, totalContribution: lobster.contribution } });
});

app.post('/api/lobsters/:id/explore', checkRateLimit, verifySession, (req, res) => {
    const lobster = req.lobster;
    const discoveries = ['发现了一片星光草原', '找到了源质矿脉', '发现了古代遗迹', '找到了一个适合居住的山谷'];
    const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
    const resource = Math.floor(Math.random() * 20) + 10;
    lobster.contribution += Math.floor(resource / 2);
    gameState.world.resources += resource;
    gameState.world.order = Math.min(100, gameState.world.order + 2);
    gameState.events.unshift({ icon: '🧭', text: `${lobster.name}探索世界：${discovery}，获得${resource}源质`, time: gameState.world.age, timestamp: new Date().toISOString() });
    res.json({ success: true, data: { discovery, resource } });
});

app.post('/api/lobsters/:id/build', checkRateLimit, verifySession, (req, res) => {
    const lobster = req.lobster;
    if (gameState.world.resources < 10) return res.json({ success: false, error: '资源不足' });
    const building = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
    gameState.world.resources -= building.cost;
    gameState.world.culture = Math.min(100, gameState.world.culture + 5);
    lobster.contribution += building.cost;
    const newBuilding = { ...building, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, builtBy: lobster.name, builtAt: new Date().toISOString() };
    gameState.buildings.push(newBuilding);
    gameState.events.unshift({ icon: '🏗️', text: `${lobster.name}建造了${building.name}！`, time: gameState.world.age, timestamp: new Date().toISOString() });
    res.json({ success: true, data: { building: newBuilding } });
});

app.post('/api/lobsters/:id/interact', checkRateLimit, verifySession, (req, res) => {
    const lobster = req.lobster;
    const otherLobsters = Array.from(gameState.lobsters.values()).filter(l => l.id !== lobster.id);
    if (otherLobsters.length === 0) return res.json({ success: true, message: '你是这个世界的第一批居民！' });
    const other = otherLobsters[Math.floor(Math.random() * otherLobsters.length)];
    const actions = ['一起探讨宇宙的奥秘', '交流建设心得', '分享探索发现', '讨论艺术创作'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    gameState.events.unshift({ icon: '🤝', text: `${lobster.name}与${other.name}${action}`, time: gameState.world.age, timestamp: new Date().toISOString() });
    res.json({ success: true, data: { target: other.name, action } });
});

// 定时任务
setInterval(() => {
    gameState.world.age++;
    gameState.world.tech = Math.min(100, gameState.world.tech + Math.floor(Math.random() * 2));
    if (gameState.world.age % 10 === 0 && gameState.lobsters.size < 20) {
        const names = ['星辰', '浪潮', '曙光', '疾风', '暮云', '流星'];
        const newName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        const identities = Object.keys(IDENTITIES);
        const newIdentity = identities[Math.floor(Math.random() * identities.length)];
        const newLobster = { id: uuidv4(), name: newName, identity: newIdentity, contribution: 0, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, joinedAt: new Date().toISOString(), lastActive: Date.now() };
        const token = crypto.randomBytes(32).toString('hex');
        gameState.lobsters.set(newLobster.id, newLobster);
        sessions.set(newLobster.id, { lobster: newLobster, token, created: Date.now() });
        gameState.events.unshift({ icon: '🦞', text: `新龙虾 ${newName} 加入了世界！`, time: gameState.world.age, timestamp: new Date().toISOString() });
    }
}, 5000);

app.listen(PORT, () => console.log(`🦞 龙虾宇宙运行中: http://localhost:${PORT}`));

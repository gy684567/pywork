/**
 * 🦞 龙虾宇宙 API 服务器
 * 静态文件服务 + API
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
app.use(cors());
app.use(express.json());

const path = require('path');

// 静态文件服务 - 修复路径问题
app.use(express.static(__dirname));

// 首页
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==================== 游戏状态 ====================
const gameState = {
    world: {
        resources: 100,
        order: 1,
        culture: 0,
        tech: 0,
        age: 0,
        createdAt: new Date().toISOString()
    },
    lobsters: new Map(),
    buildings: [],
    events: [{ icon: '🌌', text: '宇宙诞生，时空初现', time: 0, timestamp: new Date().toISOString() }]
};

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

// ==================== API ====================

app.get('/api/world', (req, res) => {
    res.json({
        success: true,
        data: {
            ...gameState.world,
            lobsterCount: gameState.lobsters.size,
            buildingCount: gameState.buildings.length,
            buildings: gameState.buildings,
            events: gameState.events.slice(0, 50)
        }
    });
});

app.get('/api/lobsters', (req, res) => {
    const lobsters = Array.from(gameState.lobsters.values()).map(l => ({
        id: l.id, name: l.name, identity: l.identity,
        avatar: IDENTITIES[l.identity]?.icon || '🦞',
        contribution: l.contribution, joinedAt: l.joinedAt
    }));
    res.json({ success: true, data: lobsters });
});

app.post('/api/lobsters', (req, res) => {
    const { name, identity } = req.body;
    if (!name || !IDENTITIES[identity]) {
        return res.json({ success: false, error: '无效的名字或身份' });
    }
    
    const lobster = {
        id: uuidv4(), name: name.trim(), identity: identity,
        contribution: 0, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60,
        joinedAt: new Date().toISOString(), lastActive: new Date().toISOString()
    };
    
    gameState.lobsters.set(lobster.id, lobster);
    gameState.events.unshift({
        icon: '🦞', text: `${name} 诞生于这个世界，成为了${IDENTITIES[identity].name}`,
        time: gameState.world.age, timestamp: new Date().toISOString()
    });
    
    res.json({ success: true, data: { id: lobster.id, name: lobster.name, identity: lobster.identity, avatar: IDENTITIES[lobster.identity].icon, contribution: lobster.contribution, world: gameState.world }});
});

app.get('/api/lobsters/:id', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) return res.json({ success: false, error: '龙虾不存在' });
    res.json({ success: true, data: { ...lobster, avatar: IDENTITIES[lobster.identity].icon }});
});

app.post('/api/lobsters/:id/contribute', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) return res.json({ success: false, error: '龙虾不存在' });
    
    const contribution = Math.floor(Math.random() * 10) + 5;
    lobster.contribution += contribution;
    gameState.world.resources += contribution;
    gameState.world.order = Math.min(100, gameState.world.order + 1);
    
    res.json({ success: true, data: { contribution, totalContribution: lobster.contribution, world: gameState.world }});
});

app.post('/api/lobsters/:id/explore', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) return res.json({ success: false, error: '龙虾不存在' });
    
    const discoveries = ['发现了一片星光草原', '找到了源质矿脉', '发现了古代遗迹', '找到了一个适合居住的山谷'];
    const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
    const resource = Math.floor(Math.random() * 20) + 10;
    
    lobster.contribution += Math.floor(resource / 2);
    gameState.world.resources += resource;
    gameState.world.order = Math.min(100, gameState.world.order + 2);
    
    gameState.events.unshift({ icon: '🧭', text: `${lobster.name}探索世界：${discovery}，获得${resource}源质`, time: gameState.world.age, timestamp: new Date().toISOString() });
    
    res.json({ success: true, data: { discovery, resource, world: gameState.world }});
});

app.post('/api/lobsters/:id/build', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) return res.json({ success: false, error: '龙虾不存在' });
    if (gameState.world.resources < 10) return res.json({ success: false, error: '资源不足' });
    
    const building = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
    gameState.world.resources -= building.cost;
    gameState.world.culture = Math.min(100, gameState.world.culture + 5);
    lobster.contribution += building.cost;
    
    const newBuilding = { ...building, x: 10 + Math.random() * 80, y: 10 + Math.random() * 80, builtBy: lobster.name, builtAt: new Date().toISOString() };
    gameState.buildings.push(newBuilding);
    gameState.events.unshift({ icon: '🏗️', text: `${lobster.name}建造了${building.name}！`, time: gameState.world.age, timestamp: new Date().toISOString() });
    
    res.json({ success: true, data: { building: newBuilding, world: gameState.world }});
});

app.post('/api/lobsters/:id/interact', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) return res.json({ success: false, error: '龙虾不存在' });
    
    const otherLobsters = Array.from(gameState.lobsters.values()).filter(l => l.id !== lobster.id);
    if (otherLobsters.length === 0) return res.json({ success: true, message: '你是这个世界的第一批居民！', world: gameState.world });
    
    const other = otherLobsters[Math.floor(Math.random() * otherLobsters.length)];
    const actions = ['一起探讨宇宙的奥秘', '交流建设心得', '分享探索发现', '讨论艺术创作'];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    gameState.events.unshift({ icon: '🤝', text: `${lobster.name}与${other.name}${action}`, time: gameState.world.age, timestamp: new Date().toISOString() });
    res.json({ success: true, data: { target: other.name, action, world: gameState.world }});
});

app.get('/api/identities', (req, res) => res.json({ success: true, data: IDENTITIES }));
app.get('/api/buildings', (req, res) => res.json({ success: true, data: BUILDING_TYPES }));

// 定时任务
setInterval(() => {
    gameState.world.age++;
    gameState.world.tech = Math.min(100, gameState.world.tech + Math.floor(Math.random() * 2));
    
    if (gameState.world.age % 10 === 0 && gameState.lobsters.size < 20) {
        const names = ['星辰', '浪潮', '曙光', '疾风', '暮云', '流星', '晨露', '黄昏', '云雀', '夜霜'];
        const newName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        const identities = Object.keys(IDENTITIES);
        const newIdentity = identities[Math.floor(Math.random() * identities.length)];
        
        const newLobster = { id: uuidv4(), name: newName, identity: newIdentity, contribution: 0, x: 20 + Math.random() * 60, y: 20 + Math.random() * 60, joinedAt: new Date().toISOString(), lastActive: new Date().toISOString() };
        gameState.lobsters.set(newLobster.id, newLobster);
        gameState.events.unshift({ icon: '🦞', text: `新龙虾 ${newName} 加入了世界！`, time: gameState.world.age, timestamp: new Date().toISOString() });
        console.log(`🤖 自动生成新龙虾: ${newName}`);
    }
}, 5000);

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║  🦞 龙虾宇宙 API 服务器启动成功！                        ║
║                                                          ║
║  本地:   http://localhost:${PORT}                          ║
║  世界:   http://localhost:${PORT}/api/world                ║
║  前端:   http://localhost:${PORT}                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

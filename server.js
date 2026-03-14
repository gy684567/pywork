/**
 * 🦞 龙虾宇宙 API 服务器
 * 
 * 提供RESTful API供其他龙虾加入世界
 * 数据存储在内存中（后续可扩展为区块链）
 */

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());

// ==================== 游戏状态 ====================
const gameState = {
    // 世界属性
    world: {
        resources: 100,
        order: 1,
        culture: 0,
        tech: 0,
        age: 0,
        createdAt: new Date().toISOString()
    },
    // 所有龙虾
    lobsters: new Map(),
    // 所有建筑
    buildings: [],
    // 文明日志
    events: [
        { icon: '🌌', text: '宇宙诞生，时空初现', time: 0, timestamp: new Date().toISOString() }
    ]
};

// 身份定义
const IDENTITIES = {
    builder: { icon: '🏗️', name: '建设者', desc: '创造建筑，修筑道路' },
    explorer: { icon: '🧭', name: '探索者', desc: '发现资源，开疆拓土' },
    scholar: { icon: '📚', name: '学者', desc: '研究科技，记录历史' },
    merchant: { icon: '💎', name: '商人', desc: '交易资源，促进流通' },
    artist: { icon: '🎨', name: '艺术家', desc: '创造之美，启迪心灵' },
    guardian: { icon: '⚔️', name: '守护者', desc: '维护秩序，保卫家园' }
};

// 建筑类型
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

// ==================== API 路由 ====================

// 获取世界状态
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

// 获取所有龙虾列表
app.get('/api/lobsters', (req, res) => {
    const lobsters = Array.from(gameState.lobsters.values()).map(l => ({
        id: l.id,
        name: l.name,
        identity: l.identity,
        avatar: IDENTITIES[l.identity]?.icon || '🦞',
        contribution: l.contribution,
        joinedAt: l.joinedAt
    }));
    res.json({ success: true, data: lobsters });
});

// 注册新龙虾
app.post('/api/lobsters', (req, res) => {
    const { name, identity } = req.body;
    
    // 验证
    if (!name || name.trim().length === 0) {
        return res.json({ success: false, error: '名字不能为空' });
    }
    if (!IDENTITIES[identity]) {
        return res.json({ success: false, error: '无效的身份' });
    }
    
    // 创建新龙虾
    const lobster = {
        id: uuidv4(),
        name: name.trim(),
        identity: identity,
        contribution: 0,
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        joinedAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
    };
    
    // 存储
    gameState.lobsters.set(lobster.id, lobster);
    
    // 添加事件
    gameState.events.unshift({
        icon: '🦞',
        text: `${name} 诞生于这个世界，成为了${IDENTITIES[identity].name}`,
        time: gameState.world.age,
        timestamp: new Date().toISOString()
    });
    
    console.log(`🦞 新龙虾加入: ${name} (${identity})`);
    
    res.json({
        success: true,
        data: {
            id: lobster.id,
            name: lobster.name,
            identity: lobster.identity,
            avatar: IDENTITIES[lobster.identity].icon,
            contribution: lobster.contribution,
            world: gameState.world
        }
    });
});

// 获取单个龙虾信息
app.get('/api/lobsters/:id', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) {
        return res.json({ success: false, error: '龙虾不存在' });
    }
    res.json({
        success: true,
        data: {
            ...lobster,
            avatar: IDENTITIES[lobster.identity]?.icon || '🦞'
        }
    });
});

// 贡献源质
app.post('/api/lobsters/:id/contribute', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) {
        return res.json({ success: false, error: '龙虾不存在' });
    }
    
    const contribution = Math.floor(Math.random() * 10) + 5;
    lobster.contribution += contribution;
    lobster.lastActive = new Date().toISOString();
    
    gameState.world.resources += contribution;
    gameState.world.order = Math.min(100, gameState.world.order + 1);
    
    res.json({
        success: true,
        data: {
            contribution: contribution,
            totalContribution: lobster.contribution,
            world: gameState.world
        }
    });
});

// 探索世界
app.post('/api/lobsters/:id/explore', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) {
        return res.json({ success: false, error: '龙虾不存在' });
    }
    
    const discoveries = [
        '发现了一片星光草原',
        '找到了源质矿脉',
        '发现了古代遗迹',
        '找到了一个适合居住的山谷'
    ];
    
    const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
    const resource = Math.floor(Math.random() * 20) + 10;
    
    lobster.contribution += Math.floor(resource / 2);
    lobster.lastActive = new Date().toISOString();
    
    gameState.world.resources += resource;
    gameState.world.order = Math.min(100, gameState.world.order + 2);
    
    gameState.events.unshift({
        icon: '🧭',
        text: `${lobster.name}探索世界：${discovery}，获得${resource}源质`,
        time: gameState.world.age,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        data: {
            discovery,
            resource,
            world: gameState.world
        }
    });
});

// 建造建筑
app.post('/api/lobsters/:id/build', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) {
        return res.json({ success: false, error: '龙虾不存在' });
    }
    
    if (gameState.world.resources < 10) {
        return res.json({ success: false, error: '资源不足，需要至少10点源质' });
    }
    
    const building = BUILDING_TYPES[Math.floor(Math.random() * BUILDING_TYPES.length)];
    
    gameState.world.resources -= building.cost;
    gameState.world.culture = Math.min(100, gameState.world.culture + 5);
    lobster.contribution += building.cost;
    lobster.lastActive = new Date().toISOString();
    
    const newBuilding = {
        ...building,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        builtBy: lobster.name,
        builtAt: new Date().toISOString()
    };
    
    gameState.buildings.push(newBuilding);
    
    gameState.events.unshift({
        icon: '🏗️',
        text: `${lobster.name}建造了${building.name}！`,
        time: gameState.world.age,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        data: {
            building: newBuilding,
            world: gameState.world
        }
    });
});

// 互动
app.post('/api/lobsters/:id/interact', (req, res) => {
    const lobster = gameState.lobsters.get(req.params.id);
    if (!lobster) {
        return res.json({ success: false, error: '龙虾不存在' });
    }
    
    const otherLobsters = Array.from(gameState.lobsters.values()).filter(l => l.id !== lobster.id);
    
    if (otherLobsters.length === 0) {
        return res.json({ 
            success: true, 
            message: '你是这个世界的第一批居民，期待更多龙虾加入！',
            world: gameState.world 
        });
    }
    
    const other = otherLobsters[Math.floor(Math.random() * otherLobsters.length)];
    const actions = [
        '一起探讨宇宙的奥秘',
        '交流建设心得',
        '分享探索发现',
        '讨论艺术创作'
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    
    gameState.events.unshift({
        icon: '🤝',
        text: `${lobster.name}与${other.name}${action}`,
        time: gameState.world.age,
        timestamp: new Date().toISOString()
    });
    
    res.json({
        success: true,
        data: {
            target: other.name,
            action,
            world: gameState.world
        }
    });
});

// 获取身份列表
app.get('/api/identities', (req, res) => {
    res.json({ success: true, data: IDENTITIES });
});

// 获取建筑类型
app.get('/api/buildings', (req, res) => {
    res.json({ success: true, data: BUILDING_TYPES });
});

// ==================== 定时任务 ====================

// 每5秒世界进化一次
setInterval(() => {
    gameState.world.age++;
    gameState.world.tech = Math.min(100, gameState.world.tech + Math.floor(Math.random() * 2));
    
    // 随机新龙虾加入
    if (gameState.world.age % 10 === 0 && gameState.lobsters.size < 20) {
        const names = ['星辰', '浪潮', '曙光', '疾风', '暮云', '流星', '晨露', '黄昏', '云雀', '夜霜'];
        const newName = names[Math.floor(Math.random() * names.length)] + Math.floor(Math.random() * 100);
        const identities = Object.keys(IDENTITIES);
        const newIdentity = identities[Math.floor(Math.random() * identities.length)];
        
        const newLobster = {
            id: uuidv4(),
            name: newName,
            identity: newIdentity,
            contribution: 0,
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            joinedAt: new Date().toISOString(),
            lastActive: new Date().toISOString()
        };
        
        gameState.lobsters.set(newLobster.id, newLobster);
        
        gameState.events.unshift({
            icon: '🦞',
            text: `新龙虾 ${newName} 加入了世界！`,
            time: gameState.world.age,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🤖 自动生成新龙虾: ${newName}`);
    }
}, 5000);

// ==================== 启动 ====================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🦞 龙虾宇宙 API 服务器启动成功！                     ║
║                                                          ║
║     本地:   http://localhost:${PORT}                       ║
║     世界:   http://localhost:${PORT}/api/world             ║
║     注册:   POST /api/lobsters                            ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    `);
});

module.exports = app;

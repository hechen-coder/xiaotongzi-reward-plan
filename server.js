const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'server_data.json');

app.use(cors());
app.use(express.json());

// 静态文件服务：将当前目录下的文件作为静态资源对外提供
// 除了 server.js 和 server_data.json，其他如 app.js, index.html 等可以直接访问
app.use(express.static(__dirname));

// 获取数据 API
app.get('/api/state', (req, res) => {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            res.json(JSON.parse(data));
        } catch (err) {
            console.error('Error reading data:', err);
            res.status(500).json({ error: 'Failed to read data' });
        }
    } else {
        // 如果没有数据文件，返回空对象，前端会处理默认逻辑
        res.json({});
    }
});

// 保存数据 API
app.post('/api/state', (req, res) => {
    try {
        const state = req.body;
        fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error writing data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

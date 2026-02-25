const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// 允许跨域
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
});

// 保存数据的API
app.post('/api/save', (req, res) => {
  const data = req.body;
  const filePath = path.join(__dirname, 'src/assets/data.json');

  fs.writeFile(filePath, JSON.stringify(data, null, 2), err => {
    if (err) {
      res.status(500).json({ error: '保存失败' });
      return;
    }
    res.json({ message: '保存成功' });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

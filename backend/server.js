const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { sendRequest } = require('./utils');

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/attack', upload.any(), async (req, res) => {
  const { targetUrl, action, payload, cookie, attackType } = req.body;

  if (!targetUrl || !action) {
    return res.status(400).json({ error: 'Missing targetUrl or action' });
  }

  const headers = {
    'User-Agent': req.headers['user-agent'] || 'AjaxHunterX-Ultimate',
    'Cookie': cookie || '',
    'Accept': '*/*',
  };

  let data = { action };
  if (payload) {
    if (attackType === 'file_upload') {
      // handled by multer files
    } else if (['sql_injection', 'xss', 'lfi', 'rce'].includes(attackType)) {
      data['input'] = payload;
    } else if (attackType === 'ajax_login') {
      data['username'] = payload;
      data['password'] = payload;
    } else {
      data['data'] = payload;
    }
  }

  let files = null;
  if (attackType === 'file_upload' && req.files && req.files.length > 0) {
    files = {};
    req.files.forEach(file => {
      files[file.fieldname] = file;
    });
  }

  try {
    const result = await sendRequest({
      url: targetUrl,
      method: 'POST',
      headers,
      data,
      files,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AjaxHunterX Ultimate backend running on port ${PORT}`);
});

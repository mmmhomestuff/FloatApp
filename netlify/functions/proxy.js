const https = require('https');

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzhpu207loWi36NTyccZIQ54GJcnxWS1giuoajxC24_R2-3sLpeBZGsoiC66py6clxDTw/exec';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  return new Promise((resolve) => {
    const postData = event.body;
    const urlObj = new URL(SHEET_URL);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers,
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, error: e.message })
      });
    });

    req.write(postData);
    req.end();
  });
};

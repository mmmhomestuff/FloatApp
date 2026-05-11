const https = require('https');
const http = require('http');

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzhpu207loWi36NTyccZIQ54GJcnxWS1giuoajxC24_R2-3sLpeBZGsoiC66py6clxDTw/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json'
};

function makeRequest(urlString, method, postData) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const lib = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FloatApp/1.0',
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = lib.request(options, (res) => {
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume(); // drain the response
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : url.origin + res.headers.location;
        // After redirect, always GET (303) or keep method (307/308)
        const nextMethod = res.statusCode === 307 || res.statusCode === 308 ? method : 'GET';
        const nextData = nextMethod === 'GET' ? null : postData;
        resolve(makeRequest(nextUrl, nextMethod, nextData));
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', reject);

    if (postData && method !== 'GET') {
      req.write(postData);
    }
    req.end();
  });
}

exports.handler = async function(event) {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    const result = await makeRequest(SHEET_URL, 'POST', event.body);
    // Unwrap if result is a promise (from redirect)
    const final = await result;
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: typeof final.body === 'string' ? final.body : JSON.stringify(final.body)
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
};

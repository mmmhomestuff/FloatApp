const https = require('https');

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbzhpu207loWi36NTyccZIQ54GJcnxWS1giuoajxC24_R2-3sLpeBZGsoiC66py6clxDTw/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

// Follow redirects — Google Apps Script redirects server-side callers
function fetchWithRedirects(url, postData, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    function doRequest(currentUrl, redirectsLeft) {
      const urlObj = new URL(currentUrl);
      const isHttps = urlObj.protocol === 'https:';
      const lib = isHttps ? https : require('http');

      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'FloatApp/1.0'
        }
      };

      const req = lib.request(options, (res) => {
        // Follow redirect
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirectsLeft > 0) {
          const nextUrl = res.headers.location.startsWith('http')
            ? res.headers.location
            : urlObj.origin + res.headers.location;
          // Consume response body before redirecting
          res.resume();
          doRequest(nextUrl, redirectsLeft - 1);
          return;
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      });

      req.on('error', reject);
      req.write(postData);
      req.end();
    }

    doRequest(url, maxRedirects);
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const result = await fetchWithRedirects(SHEET_URL, event.body);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: result.body
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
};

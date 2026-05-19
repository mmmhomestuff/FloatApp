const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhpu207loWi36NTyccZIQ54GJcnxWS1giuoajxC24_R2-3sLpeBZGsoiC66py6clxDTw/exec';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if(event.httpMethod === 'OPTIONS'){
    return { statusCode: 200, headers, body: '' };
  }

  try {
    let params;
    if(event.httpMethod === 'GET'){
      params = event.queryStringParameters || {};
    } else {
      params = JSON.parse(event.body || '{}');
    }

    const url = APPS_SCRIPT_URL + '?' + new URLSearchParams(params).toString();
    const response = await fetch(url, { redirect: 'follow' });
    const text = await response.text();

    return { statusCode: 200, headers, body: text };
  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({success: false, error: err.message}) };
  }
};

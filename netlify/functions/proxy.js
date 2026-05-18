const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzhpu207loWi36NTyccZIQ54GJcnxWS1giuoajxC24_R2-3sLpeBZGsoiC66py6clxDTw/exec';

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const params = new URLSearchParams(body).toString();
    const url = APPS_SCRIPT_URL + '?' + params;

    const response = await fetch(url);
    const text = await response.text();

    return { statusCode: 200, headers, body: text };
  } catch(err) {
    return { statusCode: 500, headers, body: JSON.stringify({success: false, error: err.message}) };
  }
};

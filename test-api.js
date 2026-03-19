const http = require('http');

const data = JSON.stringify({
  url: 'https://ndqhuwd3ng.ufs.sh/f/0VNPOD4K0u6TU6D674G7LCnWGNvAwbf1PtJj2IYZD0SBTucR',
  language: 'en',
  fileId: 'jh73m2q4d3w63g7j6e7t1x78h4k9qxhz'
});

const req = http.request('http://localhost:3000/api/transcribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', console.error);
req.write(data);
req.end();

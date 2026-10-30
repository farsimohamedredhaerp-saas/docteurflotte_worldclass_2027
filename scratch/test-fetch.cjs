const http = require('http');

const req = http.get('http://localhost:3000/maintenance', (res) => {
  console.log('STATUS:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('BODY LENGTH:', data.length);
    console.log('CONTAINS DOCTYPE:', data.includes('<!DOCTYPE html>'));
    console.log('CONTAINS Centre de Décision:', data.includes('Centre de Décision'));
    console.log('CONTAINS data-theme="light":', data.includes('data-theme="light"'));
  });
});

req.on('error', (err) => {
  console.error('ERROR:', err.message);
});

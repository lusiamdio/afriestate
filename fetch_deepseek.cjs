const https = require('https');

const data = JSON.stringify({
  model: "DeepSeek-V3-0324",
  messages: [
    {
      role: "user",
      content: "There are ten birds in a tree. A hunter shoots one. How many are left in the tree?"
    }
  ]
});

const options = {
  hostname: 'deepseek-v31.p.rapidapi.com',
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-rapidapi-host': 'deepseek-v31.p.rapidapi.com',
    'x-rapidapi-key': 'cd707cd18emsha46a78d1c51103cp11a3eajsn047d42571f12',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log(responseData);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();

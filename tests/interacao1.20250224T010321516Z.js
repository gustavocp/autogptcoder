const http = require('http');

function Ping() {
  return 'pong';
}

exports.ping = Ping;

const server = http.createServer((req, res) => {
  const pingMethod = req.method;
  
  if (pingMethod !== 'GET' && pingMethod !== 'POST') {
    return res.status(405).send('Method not allowed');
  }
  
  if (!Ping.prototype[pingMethod]) {
    return res.status(404).send('Method not found');
  }

  Ping.prototype[pingMethod].call(this, req);
  res.send('pong');
});

server.listen(3000, () => {
  console.log('API running on port 3000');
});
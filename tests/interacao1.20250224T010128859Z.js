// Importa a biblioteca http
const http = require('http');

// Cria uma função de serviço ping
function ping() {
  // Retorna 'pong' quando chamada
  return 'pong';
}

// Criando o servidor HTTP
const server = http.createServer((req, res) => {
  // Definindo a URL que será acessada pelo cliente
  const url = req.url;
  
  // Verificando se o método da requisição é GET
  if (url === '/ping') {
    // Respondendo com 'pong'
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('pong');
  } else {
    // Responder com um erro de método HTTP
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

// Exibindo a API na porta 3000
server.listen(3000, () => {
  console.log('API está rodando na porta 3000');
});
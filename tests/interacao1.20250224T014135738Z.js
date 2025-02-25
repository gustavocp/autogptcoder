// Criação da API com o método ping

app.use(express.static(__dirname + '/public'));

const server = http.createServer(app);
server.listen(3000);

app.get('/ping', (req, res) => {
  res.json('pong');
});
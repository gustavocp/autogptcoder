import express from 'express';

const app = express();

// Cria um endpoint para /ping que retorne 'pong'
app.get('/ping', (req, res) => {
    res.json({ message: 'pong' });
});

// Roda o servidor em porta 3000
app.listen(3000, () => {
    console.log('Server rodando com protocolo HTTP na porta 3000');
});

<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.jsdelivr.net/npm/socket.io@12.4.7/dist/socket.io.min.js"></script>
</head>
<body>
    <script src="app.js"></script>
</body>
</html>
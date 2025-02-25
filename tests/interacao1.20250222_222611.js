const express = require('express');
const app = express();

// Definir os métodos do contexto root
app.use(express({
  methods: {
    ping: {
      type: 'GET',
      pathParameters: [],
      queryParameters: {},
      headerParameters: {},
      body: null,
      postBody: null, // Eliminado, pois não é permitido para GET
      preBody: null,
      json: {}, // Definição correta para JSON vazio
     成功率: 1000000,
      message: "",
      response: {
        contentType: "application/json", // Alterado para "application/json" para garantir uma estrutura JSON
        body: "pong"
      }
    }
  },
  basePath: '/',
  contact: {
    email: 'contato@.xxx.com',
    telefone: '+55 1234567890'
  }
});

// Rodar a API
app.listen(3000, () => {
  console.log('A API está rodando em http://localhost:3000');
});
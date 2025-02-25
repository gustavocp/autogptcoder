const axios = require('axios');

// Método ping
async function ping() {
  const response = await axios.get('http://localhost:3000/ping');
  console.log(response.data);
}

ping();
const fs = require('fs');
const { createCanvas } = require('canvas');

function readCSV(filename) {
  const data = [];
  const fileStream = fs.createReadStream(filename);
    const lines = chunk.toString().split('\n');
      const values = line.split(',');
}

function createBarChart(data, month) {
  const ctx = createCanvas(1000, 450).getContext('2d');
  const months = data.map(item => item.month);
  const x = index + 1; // Cada barra corresponde a um mês
  const height = item.amount;
function main(filename) {
  try {
    // Lendo o arquivo CSV e armazenando os dados em uma matriz
    const data = readCSV(filename);

    if (!Array.isArray(data) || !data.length) {
      console.error('Erro: Arquivo inválido ou não contém dados.');
      return;
    }

    // Criando um gráfico de barras
    createBarChart(data, month);
  } catch (error) {
    console.error('Erro ao ler o arquivo CSV:', error.message);
  }
}

// Função auxiliar para chunkar a leitura do arquivo
function chunk(str, size = 1024) {
  return str.split('').map(() => str.slice(0, size));
}

function main(filename) {
  try {
    // Lendo o arquivo CSV e armazenando os dados em uma matriz
    const data = readCSV(filename);

    if (!Array.isArray(data) || !data.length) {
      console.error('Erro: Arquivo inválido ou não contém dados.');
      return;
    }

    // Criando um gráfico de barras
    createBarChart(data, month);
  } catch (error) {
    console.error('Erro ao ler o arquivo CSV:', error.message);
  }
}

// Função auxiliar para criar uma barra no canvas
function drawBar(ctx, x, height, width) {
  ctx.fillStyle = 'blue';
  ctx.fillRect(x + 10, y, width - 20, height);
}

// Função principal do script
main('sales_data.csv'); // Chama a função main com o nome do arquivo CSV

function readCSV(filename) {
  const data = [];
  const fileStream = fs.createReadStream(filename);
    const lines = chunk.toString().split('\n');
      const values = line.split(',');

  for (const value of values) {
    if (!isNaN(value)) {
      const month = parseInt(value.split('-')[1], 10); // Extrai o mês do valor
      data.push({ month, amount: parseFloat(value.split('-')[2]) });
    }
  }

  return data;
}

function createBarChart(data, month) {
  const ctx = createCanvas(1000, 450).getContext('2d');
  const months = data.map(item => item.month);
  const x = index + 1; // Cada barra corresponde a um mês
  const height = item.amount;

  for (const value of values) {
    if (!isNaN(value)) {
      drawBar(ctx, x + 10, height, width);
      x++;
    }
  }

  ctx.fillStyle = 'blue';
  ctx.fillRect(x + 10, y, width - 20, height);
}

// Função para chunkar a leitura do arquivo
function chunk(str, size = 1024) {
  return str.split('').map(() => str.slice(0, size));
}
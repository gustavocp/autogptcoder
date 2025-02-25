const fs = require('fs');
const { createCanvas } = require('canvas');
function readCSV(filename) {
  const data = [];
  const fileStream = fs.createReadStream(filename);
    const lines = chunk.toString().split('\n');
      const values = line.split(',');
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
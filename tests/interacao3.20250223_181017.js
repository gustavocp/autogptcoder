const fs = require('fs');
const { createCanvas } = require('canvas');

// Função para ler CSV
function readCSV(filename) {
  const data = [];
  try {
    const fileStream = fs.createReadStream(filename);
    fileStream.on('data', (chunk) => {
      const lines = chunk.toString().split('\n');
      for (const line of lines) {
        const values = line.split(',');
        if (values.length === 3 && !isNaN(values[1])) { // Verifica se há três colunas e se é uma quantidade numérica
          data.push({
            month: values[0],
            amount: parseFloat(values[1])
          });
        }
      }
    });
    fileStream.on('end', () => {
      return data;
    });
  } catch (error) {
    console.error(`Error reading CSV file: ${error.message}`);
    return [];
  }
}

// Função para criar gráfico de barras
function createBarChart(data) {
  const ctx = createCanvas(1000, 450).getContext('2d');
  const months = data.map(item => item.month);

  // Adiciona um título ao gráfico
  ctx.fillStyle = 'black';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Sales by Month', 50, 20);

  // Cria uma barra para cada mês
  data.forEach((item, index) => {
    const x = index + 1; // Cada barra corresponde a um mês
    const height = item.amount;
    ctx.fillStyle = `rgba(${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, ${Math.floor(Math.random() * 256)}, 0.4)`;
    ctx.fillRect(x, 400 - height, 100, height);
  });

  // Exibe o gráfico
  ctx.stroke();
}

// Função principal
function main(filename) {
  const data = readCSV(filename);

  if (data.length === 0) {
    console.error('No sales data found.');
    return;
  }

  createBarChart(data);
}

main();

Último erro observado:
[eval]:57
  if (data.length === 0) {
           ^

TypeError: Cannot read properties of undefined (reading 'length')
    at main ([eval]:57:12)
    at [eval]:65:1
    at runScriptInThisContext (node:internal/vm:209:10)
    at node:internal/process/execution:118:14
    at [eval]-wrapper:6:24
    at runScript (node:internal/process/execution:101:62)
    at evalScript (node:internal/process/execution:133:3)
    at node:internal/main/eval_string:51:3

Node.js v20.18.2


Por favor, gere uma nova versão do código que corrija os erros e atenda ao objetivo. Retorne apenas o código. A função `createBarChart` deve ser chamada com um parâmetro de dados para ser usado na função principal.
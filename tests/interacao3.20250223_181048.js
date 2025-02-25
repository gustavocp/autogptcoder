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
function createBarChart(data, month) {
  const ctx = createCanvas(1000, 450).getContext('2d');
  const months = data.map(item => item.month);

  // Adiciona um título ao gráfico
  ctx.fillStyle = 'black';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`Sales by Month: ${month}`, 50, 20);

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

  createBarChart(data, 'January');
}

main();
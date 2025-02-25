const { readFileSync } = require('fs');
const { barChart } = require('chart.js');

// Lendo o arquivo CSV
const csvContent = readFileSync('./vendas.csv', 'utf8');

// Separando as linhas do arquivo CSV
const lines = csvContent.split('\n').map(line => line.trim());

// Verificando se há algum erro ao ler o arquivo
if (!lines) {
    console.error('Erro ao ler o arquivo CSV');
    return;
}

// Criando um array para armazenar os dados da vendas por mês
const data = [];

// Iterando pelos linhas do arquivo CSV
for (let i = 0; i < lines.length - 1; i++) {
    const [month, vendorID, amount] = lines[i].split(',');
    data.push({ month, vendorID, amount });
}

// Calculando a média de vendas por mês
const totalAmount = data.reduce((sum, obj) => sum + obj.amount, 0);
const meanAmount = totalAmount / data.length;

// Criando um gráfico de barras mostrando a média de vendas por mês
barChart({
    type: 'bar',
    data,
    options: {
        scales: {
            x: {
                title: 'Month',
                beginAtZero: true
            },
            y: {
                title: 'Amount (in cents)',
                beginAtZero: false
            }
        }
    }
}).then(chart => {
    // Mostrando o gráfico no console
    console.log('Bar Chart:');
    chart;
});
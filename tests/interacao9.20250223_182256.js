const fs = require('fs');
const { barChart } = require('chart.js');

try {
    const csvContent = readFileSync('./vendas.csv', 'utf8');
    const lines = csvContent.split('\n').map(line => line.trim());
    if (!lines) {
        console.error('Erro ao ler o arquivo CSV');
        return;
    }

    // Criando um array para armazenar os dados da vendas por mês
    const data = [];

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
} catch (error) {
    console.error('Erro ao ler o arquivo CSV:', error);
}

// Função para ler e processar um arquivo CSV
function readFileSync(filePath, encoding = 'utf8') {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, encoding, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

// Função para criar um gráfico de barras
function createBarChart(data) {
    return new Promise((resolve, reject) => {
        const ctx = document.getElementById('chart');
        barChart(ctx, data, {
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
        });
    });
}

// Criando um arquivo CSV chamado vendas.csv para que ele seja carregado e gerado um gráfico de barras com a média de vendas por mês.
const fs = require('fs');
const { barChart } = require('chart.js');
const data = [];

try {
    const csvContent = readFileSync('./vendas.csv', 'utf8');
    const lines = csvContent.split('\n').map(line => line.trim());
    if (!lines) {
        console.error('Erro ao ler o arquivo CSV');
        return;
    }

    for (let i = 0; i < lines.length - 1; i++) {
        const [month, vendorID, amount] = lines[i].split(',');
        data.push({ month, vendorID, amount });
    }

    // Calculando a média de vendas por mês
    const totalAmount = data.reduce((sum, obj) => sum + obj.amount, 0);
    const meanAmount = totalAmount / data.length;

    // Criando um gráfico de barras mostrando a média de vendas por mês.
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
} catch (error) {
    console.error('Erro ao ler o arquivo CSV:', error);
}
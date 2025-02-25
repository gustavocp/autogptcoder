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
  const data = readCSV(filename);
// Código JavaScript para gerar uma sequência de Fibonacci

function generateFibonacci() {
    let sequence = [0, 1];
    for (let i = 2; i < 10; i++) {
        sequence.push(sequence[i - 1] + sequence[i - 2]);
    }
    return sequence;
}

// Código para imprimir a sequência de Fibonacci
function printFibonacci() {
    let fibonacciSequence = generateFibonacci();
    console.log(fibonacciSequence);
}
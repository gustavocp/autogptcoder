```javascript
function imprimirSequenciaFibonacci() {
    const fibonacci = [0, 1];
    let next = 2;
    while (next < 10) {
        fibonacci.push(next);
        next = fibonacci[fibonacci.length - 1] + fibonacci[fibonacci.length - 2];
    }
    return fibonacci.join(', ');
}

console.log(imprimirSequenciaFibonacci());
```
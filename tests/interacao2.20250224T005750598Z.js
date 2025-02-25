function fibonacci() {
    let a = 0;
    let b = 1;
    let fibSequence = [];

    while (a < 10) {
        fibSequence.push(a);
        let nextFib = a + b;
        a = b;
        b = nextFib;
    }

    return fibSequence;
}

console.log(fibonacci());
function generateFibonacci() {
  let first = 0;
  let second = 1;
  let next;

  while (next < 10) {
    next = first + second;
    first = second;
    second = next;
  }

  return fibonacci;
}

console.log(generateFibonacci());
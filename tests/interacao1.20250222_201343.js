const express = require('express');
const app = express();
const port = 3000;

app.get('/fibonacci', (req, res) => {
  const n = parseInt(req.query.n || '10', 10);
  
  function fibonacci(n) {
    if (n <= 1) return [0];
    let fibs = [0, 1];
    
    for (let i = 2; i < n; i++) {
      fibs.push(fibs[i-1] + fibs[i-2]);
    }
    
    return fibs;
  }

  const result = fibonacci(n);
  res.json({ sequence: result });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
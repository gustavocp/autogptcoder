But wait, the problem says to return only the code without comments or explanations. So I should omit any console.log statements unless they are necessary for functionality.

Also, if the user doesn't have Express installed, this code won't run. But since the task is to create an API with Express, assuming it's installed, so no need to handle that case here.

So the final code would be:

const express = require('express');
const app = express();
app.get('/ping', (req, res) => {
  res.send('pong');
});
app.listen(3000);
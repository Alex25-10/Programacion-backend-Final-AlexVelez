const express = require('express');
const app = express();
const productsRouter = require('./routes/products.router.js');
const cartsRouter = require('./routes/carts.router.js');

app.use(express.json());
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.get('/', (req, res) => {
  res.send('API de productos y carritos');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
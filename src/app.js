const express = require('express');
const app = express();
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡API de productos y carritos funcionando! 🚀');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const exphbs = require('express-handlebars');
const path = require('path');
const ProductManager = require('./managers/ProductManager');
const productsRouter = require('./routes/products.router');
const cartsRouter = require('./routes/carts.router');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const productManager = new ProductManager();

// Configuración de middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src', 'public')));

// Configuración de Handlebars
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// Compartir io con las rutas
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Configuración de WebSocket
io.on('connection', (socket) => {
  console.log('¡Cliente conectado! 🧙♂️');
  
  socket.on('nuevoProducto', async (producto) => {
    try {
      const productWithDefaults = {
        ...producto,
        description: producto.description || "Sin descripción",
        code: producto.code || `CODE-${Date.now()}`,
        stock: producto.stock || 10,
        category: producto.category || "general",
        status: true,
        thumbnails: []
      };
      
      await productManager.addProduct(productWithDefaults);
      const updatedProducts = await productManager.getProducts();
      io.emit('actualizarProductos', updatedProducts);
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error al agregar producto:', error);
    }
  });

  socket.on('eliminarProducto', async (id) => {
    try {
      await productManager.deleteProduct(id);
      const updatedProducts = await productManager.getProducts();
      io.emit('actualizarProductos', updatedProducts);
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error al eliminar producto:', error);
    }
  });
});

// Rutas
app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

// Vistas
app.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('home', { 
      products,
      style: 'home.css'
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error al cargar productos' });
  }
});

app.get('/realtimeproducts', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.render('realTimeProducts', { 
      products,
      style: 'realTime.css'
    });
  } catch (error) {
    res.status(500).render('error', { error: 'Error al cargar productos' });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { error: '¡Algo salió mal! 🧯' });
});

// Iniciar servidor
const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor mágico en http://localhost:${PORT} 🎩✨`);
});
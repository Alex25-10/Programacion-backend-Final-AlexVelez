// 1. Configuración inicial y conexión a DB
import { connectDB } from './config/db.config.js';
await connectDB();

// 2. Importación de modelos
import './dao/models/product.model.js';
import './dao/models/carts.model.js'; // Asegúrate de tener este archivo

// 3. Dependencias principales
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import path from 'path';

// 4. Managers y routers
import { ProductManager } from './managers/ProductManager.js';
import { CartManager } from './managers/CartManager.js'; // Importa CartManager
import { createProductsRouter } from './routes/products.router.js';
import { createCartsRouter } from './routes/carts.router.js';

// Configuración de Express
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Inicialización de managers
const productManager = new ProductManager();
const cartManager = new CartManager(); // Instancia de CartManager

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Configuración mejorada de Handlebars
const hbs = engine({
  helpers: {
    multiply: (a, b) => a * b,
    calcTotal: (products) => products.reduce((total, p) => total + (p.product?.price || 0) * p.quantity, 0).toFixed(2),
    eq: (a, b) => a === b,
    formatPrice: (price) => parseFloat(price).toFixed(2) // Nuevo helper para formato de precio
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true
  }
});

app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// WebSocket con eventos extendidos
io.on('connection', (socket) => {
  console.log('¡Cliente conectado! 🧙♂️');

  // Eventos de productos
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

      const newProduct = await productManager.addProduct(productWithDefaults);
      io.emit('productoAgregado', newProduct);
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error WS-add:', error);
    }
  });

  socket.on('eliminarProducto', async (id) => {
    try {
      await productManager.deleteProduct(id);
      io.emit('productoEliminado', id); // Cambiado a io.emit para notificar a todos
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error WS-delete:', error);
    }
  });

  // Nuevos eventos para carritos
  socket.on('actualizarCarrito', async ({ cartId, productId, quantity }) => {
    try {
      const updatedCart = await cartManager.addProductToCart(cartId, productId, quantity);
      io.emit('carritoActualizado', updatedCart);
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error WS-cart:', error);
    }
  });
});

// Middleware para compartir dependencias
app.use((req, res, next) => {
  req.io = io;
  req.productManager = productManager;
  req.cartManager = cartManager; // Añade cartManager al request
  next();
});

// Rutas API
app.use('/api/products', createProductsRouter());
app.use('/api/carts', createCartsRouter());

// Vista principal optimizada
app.get('/', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query, availability } = req.query;
    const result = await productManager.getProducts({ 
      limit: parseInt(limit), 
      page: parseInt(page), 
      sort, 
      query, 
      availability 
    });

    res.render('home', {
      products: result.payload,
      pagination: result,
      filters: { query, sort, availability },
      style: 'home.css',
      user: req.user || null // Ejemplo para futura autenticación
    });
  } catch (error) {
    console.error('Error GET /:', error);
    res.status(500).render('error', { 
      error: 'Error al cargar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Vista de carrito
app.get('/carts/:cid', async (req, res) => {
  try {
    const cart = await cartManager.getCartById(req.params.cid);
    const populatedCart = await cartManager.populateProducts(cart);
    
    res.render('cart', {
      cartId: req.params.cid,
      products: populatedCart.products,
      style: 'cart.css',
      helpers: {
        calcTotal: (products) => products.reduce((total, p) => total + (p.product?.price || 0) * p.quantity, 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error(`Error en GET /carts/${req.params.cid}:`, error);
    res.status(500).render('error', { 
      error: 'Error al cargar el carrito',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).render('error', { 
    error: process.env.NODE_ENV === 'development' ? err.message : '¡Error interno!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

// Inicio seguro del servidor
const PORT = process.env.PORT || 8080;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});

// Manejo de cierre limpio
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Proceso terminado');
    process.exit(0);
  });
});
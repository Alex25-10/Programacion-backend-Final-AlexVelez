// 1. Configuración inicial y conexión a DB
import { connectDB } from './config/db.config.js';
await connectDB();

// 2. Importación de modelos
import './dao/models/product.model.js';
import './dao/models/carts.model.js';

// 3. Dependencias principales
import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import methodOverride from 'method-override';
import { fileURLToPath } from 'url';
import path from 'path';

// 4. Managers y routers
import { ProductManager } from './managers/ProductManager.js';
import { CartManager } from './managers/CartManager.js';
import { createProductsRouter } from './routes/products.router.js';
import { createCartsRouter } from './routes/carts.router.js';
import { productViewsRouter } from './routes/productViews.router.js';

// Configuración de Express y rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Managers
const productManager = new ProductManager();
const cartManager = new CartManager();

// Middlewares generales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Sesiones persistentes en MongoDB Atlas
app.use(session({
  store: MongoStore.create({
    mongoUrl: 'mongodb+srv://gaston25102000:Gaston2510@cluster0.cl9mbpm.mongodb.net/ecommerce?retryWrites=true&w=majority&appName=Cluster0',
    ttl: 3600
  }),
  secret: 'mi-clave-secreta',
  resave: false,
  saveUninitialized: false
}));

// ✅ Middleware que agrega managers y socket a cada req
app.use((req, res, next) => {
  req.io = io;
  req.productManager = productManager;
  req.cartManager = cartManager;
  next();
});

// ✅ Middleware que crea carrito si no hay
app.use(async (req, res, next) => {
  if (!req.session.user) req.session.user = {};

  if (!req.session.user.cart || req.session.user.cart === 'default') {
    const newCart = await req.cartManager.createCart();
    req.session.user.cart = newCart._id.toString();
  }

  next();
});

// ✅ Vistas con Handlebars y helpers
const hbs = engine({
  helpers: {
    multiply: (a, b) => a * b,
    calcTotal: (products) =>
      products.reduce((total, p) => total + (p.product?.price || 0) * p.quantity, 0).toFixed(2),
    eq: (a, b) => a === b,
    formatPrice: (price) => parseFloat(price).toFixed(2),
  },
  runtimeOptions: {
    allowProtoPropertiesByDefault: true,
    allowProtoMethodsByDefault: true,
  },
});
app.engine('handlebars', hbs);
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));

// ✅ Rutas de vistas
app.use('/', productViewsRouter);

// ✅ Rutas API
app.use('/api/products', createProductsRouter());
app.use('/api/carts', createCartsRouter());

// ✅ WebSocket
io.on('connection', (socket) => {
  console.log('¡Cliente conectado! 🧙‍♂️');

  // Productos
  socket.on('nuevoProducto', async (producto) => {
    try {
      const productWithDefaults = {
        ...producto,
        description: producto.description || 'Sin descripción',
        code: producto.code || `CODE-${Date.now()}`,
        stock: producto.stock || 10,
        category: producto.category || 'general',
        status: true,
        thumbnails: [],
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
      io.emit('productoEliminado', id);
    } catch (error) {
      socket.emit('error', error.message);
      console.error('Error WS-delete:', error);
    }
  });

  // Carritos
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

// ✅ Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err.stack);
  res.status(500).render('error', {
    error: process.env.NODE_ENV === 'development' ? err.message : '¡Error interno!',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
});

// ✅ Inicio de servidor
const PORT = process.env.PORT || 8080;
const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor listo en http://localhost:${PORT}`);
});

server.on('error', (err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});

// ✅ Cierre limpio
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Proceso terminado');
    process.exit(0);
  });
});

import express from 'express';

export function createCartsRouter() {
  const router = express.Router();

  // Crear un nuevo carrito vacío
  router.post('/', async (req, res) => {
    try {
      const newCart = await req.cartManager.createCart();
      
      // Emitir evento de nuevo carrito creado
      if (req.io) {
        req.io.emit('cartCreated', newCart);
      }

      res.status(201).json({ 
        status: 'success', 
        payload: newCart 
      });
    } catch (error) {
      console.error('Error en POST /api/carts:', error.message);
      res.status(500).json({ 
        status: 'error', 
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error al crear carrito'
      });
    }
  });

  // Obtener un carrito y renderizar su vista
  router.get('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
      const cart = await req.cartManager.getCartById(cid);
      const populatedCart = await req.cartManager.populateProducts(cart);
      
      res.render('cart', {
        cartId: cid,
        products: populatedCart.products,
        style: 'cart.css',
        helpers: {
          calcTotal: (products) => products.reduce((total, p) => total + (p.product?.price || 0) * p.quantity, 0).toFixed(2)
        }
      });
    } catch (error) {
      console.error(`Error en GET /api/carts/${cid}:`, error.message);
      res.status(500).render('error', { 
        error: 'Error al cargar el carrito',
        details: process.env.NODE_ENV === 'development' ? error.message : null
      });
    }
  });

  // Eliminar un producto específico del carrito
  router.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    try {
      const updatedCart = await req.cartManager.removeProductFromCart(cid, pid);
      
      // Notificar actualización via WebSocket
      if (req.io) {
        req.io.emit('cartUpdated', { 
          cartId: cid, 
          action: 'remove', 
          productId: pid 
        });
      }

      res.json({ 
        status: 'success', 
        payload: updatedCart 
      });
    } catch (error) {
      console.error(`Error en DELETE /api/carts/${cid}/products/${pid}:`, error.message);
      res.status(500).json({ 
        status: 'error', 
        message: error.message 
      });
    }
  });

  // Vaciar todo el carrito
  router.delete('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
      const updatedCart = await req.cartManager.clearCart(cid);
      
      // Notificar vaciado del carrito
      if (req.io) {
        req.io.emit('cartCleared', cid);
      }

      res.json({ 
        status: 'success', 
        payload: updatedCart 
      });
    } catch (error) {
      console.error(`Error en DELETE /api/carts/${cid}:`, error.message);
      res.status(500).json({ 
        status: 'error', 
        message: error.message 
      });
    }
  });

  // Agregar producto al carrito (nueva ruta)
  router.post('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;
    
    try {
      const updatedCart = await req.cartManager.addProductToCart(
        cid, 
        pid, 
        parseInt(quantity)
      );
      
      // Notificar adición de producto
      if (req.io) {
        req.io.emit('cartUpdated', { 
          cartId: cid, 
          action: 'add', 
          productId: pid,
          quantity
        });
      }

      res.json({ 
        status: 'success', 
        payload: updatedCart 
      });
    } catch (error) {
      console.error(`Error en POST /api/carts/${cid}/products/${pid}:`, error.message);
      res.status(500).json({ 
        status: 'error', 
        message: error.message 
      });
    }
  });

  return router;
}
import express from 'express';

export function createCartsRouter() {
  const router = express.Router();

  
  router.post('/', async (req, res) => {
    try {
      const newCart = await req.cartManager.createCart();

      if (req.io) {
        req.io.emit('cartCreated', newCart);
      }

      res.status(201).json({
        status: 'success',
        payload: newCart,
      });
    } catch (error) {
      console.error('Error en POST /api/carts:', error.message);
      res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error al crear carrito',
      });
    }
  });

  
  router.get('/:cid', async (req, res) => {
    const { cid } = req.params;
    try {
      const cart = await req.cartManager.getCartById(cid);
      if (!cart) {
        return res.status(404).json({ status: 'error', message: 'Carrito no encontrado' });
      }

      const populatedCart = await req.cartManager.populateProducts(cart);

      res.render('cart', {
        cartId: cid,
        products: populatedCart.products,
        style: 'cart.css',
        helpers: {
          calcTotal: (products) => products.reduce((total, p) => total + (p.product?.price || 0) * p.quantity, 0).toFixed(2),
        },
      });
    } catch (error) {
      console.error(`Error en GET /api/carts/${cid}:`, error.message);
      res.status(500).render('error', {
        error: 'Error al cargar el carrito',
        details: process.env.NODE_ENV === 'development' ? error.message : null,
      });
    }
  });

  
  router.post('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity = 1 } = req.body;

    try {
      const updatedCart = await req.cartManager.addProductToCart(cid, pid, parseInt(quantity));

      if (req.io) {
        req.io.emit('cartUpdated', {
          cartId: cid,
          action: 'add',
          productId: pid,
          quantity,
        });
      }

      res.json({
        status: 'success',
        payload: updatedCart,
      });
    } catch (error) {
      console.error(`Error en POST /api/carts/${cid}/products/${pid}:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  
  router.put('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    try {
      if (!quantity || isNaN(quantity)) {
        return res.status(400).json({
          status: 'error',
          message: 'Cantidad inválida',
        });
      }

      const updatedCart = await req.cartManager.updateProductQuantity(cid, pid, parseInt(quantity));

      if (req.io) {
        req.io.emit('cartUpdated', {
          cartId: cid,
          action: 'update',
          productId: pid,
          quantity,
        });
      }

      res.json({
        status: 'success',
        payload: updatedCart,
      });
    } catch (error) {
      console.error(`Error en PUT /api/carts/${cid}/products/${pid}:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  
  router.put('/:cid', async (req, res) => {
    const { cid } = req.params;
    const { products } = req.body;

    try {
      if (!Array.isArray(products)) {
        return res.status(400).json({ status: 'error', message: 'Formato inválido' });
      }

      const updatedCart = await req.cartManager.replaceProducts(cid, products);

      if (req.io) {
        req.io.emit('cartReplaced', { cartId: cid });
      }

      res.json({
        status: 'success',
        payload: updatedCart,
      });
    } catch (error) {
      console.error(`Error en PUT /api/carts/${cid}:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  
  router.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;

    try {
      const updatedCart = await req.cartManager.removeProductFromCart(cid, pid);

      if (req.io) {
        req.io.emit('cartUpdated', {
          cartId: cid,
          action: 'remove',
          productId: pid,
        });
      }

      res.json({
        status: 'success',
        payload: updatedCart,
      });
    } catch (error) {
      console.error(`Error en DELETE /api/carts/${cid}/products/${pid}:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  
  router.delete('/:cid', async (req, res) => {
    const { cid } = req.params;

    try {
      const updatedCart = await req.cartManager.clearCart(cid);

      if (req.io) {
        req.io.emit('cartCleared', cid);
      }

      res.json({
        status: 'success',
        payload: updatedCart,
      });
    } catch (error) {
      console.error(`Error en DELETE /api/carts/${cid}:`, error.message);
      res.status(500).json({
        status: 'error',
        message: error.message,
      });
    }
  });

  return router;
}

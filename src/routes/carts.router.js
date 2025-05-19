const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager');

module.exports = (io) => {
  const cartManager = new CartManager();
  const productManager = new ProductManager();

  // Validación de IDs
  const validateIds = (req, res, next) => {
    const cartId = parseInt(req.params.cid);
    const productId = parseInt(req.params.pid);
    
    if (isNaN(cartId)) return res.status(400).json({ error: 'ID de carrito inválido' });
    if (req.params.pid && isNaN(productId)) return res.status(400).json({ error: 'ID de producto inválido' });
    
    req.validatedIds = { cartId, productId };
    next();
  };

  // POST - Crear nuevo carrito
  router.post('/', async (req, res) => {
    try {
      const newCart = await cartManager.createCart();
      res.status(201).json({
        status: 'success',
        payload: newCart,
        message: 'Carrito creado exitosamente'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: 'Error interno al crear carrito',
        details: error.message
      });
    }
  });

  // POST - Agregar producto al carrito
  router.post('/:cid/product/:pid', validateIds, async (req, res) => {
    try {
      const { cartId, productId } = req.validatedIds;
      const quantity = req.body.quantity || 1;

      await productManager.getProductById(productId); // Verifica que el producto exista

      const updatedCart = await cartManager.addProductToCart(cartId, productId, quantity);
      
      if (io) io.emit('cart:updated', updatedCart);

      res.json({
        status: 'success',
        payload: updatedCart,
        message: 'Producto agregado al carrito'
      });
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 500;
      res.status(statusCode).json({
        status: 'error',
        error: error.message,
        type: error.message.includes('no encontrado') ? 'NOT_FOUND' : 'INTERNAL_ERROR'
      });
    }
  });

  // GET - Obtener productos del carrito
  router.get('/:cid', validateIds, async (req, res) => {
    try {
      const { cartId } = req.validatedIds;
      const cart = await cartManager.getCartById(cartId);
      
      const productsWithDetails = await Promise.all(
        cart.products.map(async item => {
          const product = await productManager.getProductById(item.product);
          return {
            ...product,
            quantity: item.quantity,
            subtotal: product.price * item.quantity
          };
        })
      );

      res.json({
        status: 'success',
        payload: {
          cartId: cart.id,
          products: productsWithDetails,
          total: productsWithDetails.reduce((sum, p) => sum + p.subtotal, 0),
          lastUpdated: cart.updatedAt
        }
      });
    } catch (error) {
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({
        status: 'error',
        error: error.message
      });
    }
  });

  // DELETE - Eliminar producto del carrito
  router.delete('/:cid/product/:pid', validateIds, async (req, res) => {
    try {
      const { cartId, productId } = req.validatedIds;
      const updatedCart = await cartManager.removeProductFromCart(cartId, productId);
      
      if (io) io.emit('cart:updated', updatedCart);
      
      res.json({
        status: 'success',
        payload: updatedCart,
        message: 'Producto eliminado del carrito'
      });
    } catch (error) {
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({
        status: 'error',
        error: error.message
      });
    }
  });

  return router;
};
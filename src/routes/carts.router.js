const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager');
const ProductManager = require('../managers/ProductManager'); // Importa el ProductManager

const cartManager = new CartManager();
const productManager = new ProductManager(); // Crea una instancia

// Crea un carrito vacío
router.post('/', async (req, res) => {
  try {
    const newCart = await cartManager.createCart();
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear carrito' });
  }
});

// Agrega producto a un carrito (¡Ruta faltante!)
router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const cartId = parseInt(req.params.cid); // ID del carrito
    const productId = parseInt(req.params.pid); // ID del producto

    // Verifica si el producto existe
    const product = await productManager.getProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Agrega el producto al carrito
    const updatedCart = await cartManager.addProductToCart(cartId, productId);
    res.json(updatedCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lista productos de un carrito (opcional pero útil)
router.get('/:cid', async (req, res) => {
  try {
    const cartId = parseInt(req.params.cid);
    const cart = await cartManager.getCartById(cartId);
    if (!cart) {
      return res.status(404).json({ error: 'Carrito no encontrado' });
    }
    res.json(cart.products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
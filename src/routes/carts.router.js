const express = require('express');
const router = express.Router();
const CartManager = require('../managers/CartManager.js'); // .js explícito

const cartManager = new CartManager();

router.post('/', async (req, res) => {
  try {
    const newCart = await cartManager.createCart();
    res.status(201).json(newCart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ... (otras rutas)

module.exports = router;
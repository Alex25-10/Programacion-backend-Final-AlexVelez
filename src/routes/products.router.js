const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager.js');

const productManager = new ProductManager();

router.get('/', async (req, res) => {
  const products = await productManager.getProducts();
  res.json(products);
});

router.post('/', async (req, res) => {
  try {
    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Rutas adicionales (GET por ID, PUT, DELETE)...

module.exports = router;
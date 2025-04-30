const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager'); // Importación correcta

const productManager = new ProductManager(); // Instancia creada correctamente

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return res.status(400).json({ error: `Falta el campo ${field}` });
      }
    }

    const newProduct = await productManager.addProduct(req.body);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const products = await productManager.getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

module.exports = router;
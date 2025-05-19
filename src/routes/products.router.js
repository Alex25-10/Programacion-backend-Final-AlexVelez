const express = require('express');
const router = express.Router();
const ProductManager = require('../managers/ProductManager');

module.exports = (io) => {
  const productManager = new ProductManager();

  // Middleware para validar campos del producto
  const validateProduct = (req, res, next) => {
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: 'Campos faltantes',
        missingFields: missingFields 
      });
    }

    if (typeof req.body.price !== 'number' || req.body.price <= 0) {
      return res.status(400).json({ error: 'El precio debe ser un número positivo' });
    }

    next();
  };

  // Emitir actualización de productos via WebSocket
  const emitProductsUpdate = async () => {
    try {
      const products = await productManager.getProducts();
      io.emit('productos:updated', products);
    } catch (error) {
      console.error('Error al emitir actualización:', error);
    }
  };

  // POST - Crear producto
  router.post('/', validateProduct, async (req, res) => {
    try {
      const newProduct = await productManager.addProduct({
        ...req.body,
        status: req.body.status !== undefined ? req.body.status : true
      });
      
      await emitProductsUpdate();
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(400).json({ 
        error: error.message,
        type: error.message.includes('código') ? 'DUPLICATE_CODE' : 'VALIDATION_ERROR'
      });
    }
  });

  // GET - Obtener todos los productos (con paginación)
  router.get('/', async (req, res) => {
    try {
      const { limit, page = 1 } = req.query;
      const allProducts = await productManager.getProducts();
      
      // Paginación
      const startIndex = (page - 1) * limit;
      const endIndex = limit ? startIndex + parseInt(limit) : undefined;
      const products = limit ? allProducts.slice(startIndex, endIndex) : allProducts;
      
      res.json({
        status: 'success',
        payload: products,
        totalPages: limit ? Math.ceil(allProducts.length / limit) : 1,
        prevPage: page > 1 ? parseInt(page) - 1 : null,
        nextPage: endIndex < allProducts.length ? parseInt(page) + 1 : null
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error',
        error: 'Error al obtener productos' 
      });
    }
  });

  // GET - Obtener producto por ID
  router.get('/:pid', async (req, res) => {
    try {
      const productId = parseInt(req.params.pid);
      const product = await productManager.getProductById(productId);
      res.json(product);
    } catch (error) {
      res.status(error.message.includes('no existe') ? 404 : 500).json({ 
        error: error.message 
      });
    }
  });

  // PUT - Actualizar producto
  router.put('/:pid', validateProduct, async (req, res) => {
    try {
      const productId = parseInt(req.params.pid);
      const updatedProduct = await productManager.updateProduct(productId, req.body);
      
      await emitProductsUpdate();
      res.json(updatedProduct);
    } catch (error) {
      const statusCode = error.message.includes('no encontrado') ? 404 : 
                        error.message.includes('código') ? 409 : 400;
      res.status(statusCode).json({ error: error.message });
    }
  });

  // DELETE - Eliminar producto
  router.delete('/:pid', async (req, res) => {
    try {
      const productId = parseInt(req.params.pid);
      await productManager.deleteProduct(productId);
      
      await emitProductsUpdate();
      res.json({ 
        status: 'success',
        message: 'Producto eliminado exitosamente' 
      });
    } catch (error) {
      res.status(error.message.includes('no encontrado') ? 404 : 500).json({ 
        error: error.message 
      });
    }
  });

  return router;
};
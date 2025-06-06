import express from 'express';

export function createProductsRouter() {
  const router = express.Router();

  // GET /api/products con paginación, filtros y ordenamiento
  router.get("/", async (req, res) => {
    try {
      const { limit = 10, page = 1, sort, query, availability } = req.query;
      
      const result = await req.productService.getProducts({
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        query,
        availability,
        baseUrl: `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`
      });

      // Emitir evento de actualización si es necesario
      if (req.io && (query || availability)) {
        req.io.emit('productsUpdated', result.payload);
      }

      res.json({
        status: 'success',
        ...result
      });
    } catch (error) {
      console.error("Error en GET /api/products:", error.message);
      res.status(500).json({ 
        status: "error", 
        message: process.env.NODE_ENV === 'development' ? error.message : 'Error al obtener productos'
      });
    }
  });

  // GET /api/products/:pid
  router.get("/:pid", async (req, res) => {
    try {
      const product = await req.productService.getProductById(req.params.pid);
      if (!product) {
        return res.status(404).json({ status: "error", message: "Producto no encontrado" });
      }
      res.json({ status: "success", payload: product });
    } catch (error) {
      console.error(`Error en GET /api/products/${req.params.pid}:`, error.message);
      res.status(400).json({ status: "error", message: error.message });
    }
  });

  // POST /api/products
  router.post("/", async (req, res) => {
    try {
      const newProduct = await req.productService.addProduct(req.body);
      
      // Notificar a todos los clientes via WebSocket
      if (req.io) {
        req.io.emit('newProduct', newProduct);
      }

      res.status(201).json({ status: "success", payload: newProduct });
    } catch (error) {
      console.error("Error en POST /api/products:", error.message);
      res.status(400).json({ status: "error", message: error.message });
    }
  });

  // PUT /api/products/:pid
  router.put("/:pid", async (req, res) => {
    try {
      const updatedProduct = await req.productService.updateProduct(
        req.params.pid, 
        req.body
      );
      
      if (req.io) {
        req.io.emit('productUpdated', updatedProduct);
      }

      res.json({ status: "success", payload: updatedProduct });
    } catch (error) {
      console.error(`Error en PUT /api/products/${req.params.pid}:`, error.message);
      res.status(400).json({ status: "error", message: error.message });
    }
  });

  // DELETE /api/products/:pid
  router.delete("/:pid", async (req, res) => {
    try {
      const deletedProduct = await req.productService.deleteProduct(req.params.pid);
      
      if (req.io) {
        req.io.emit('productDeleted', req.params.pid);
      }

      res.json({ status: "success", payload: deletedProduct });
    } catch (error) {
      console.error(`Error en DELETE /api/products/${req.params.pid}:`, error.message);
      res.status(400).json({ status: "error", message: error.message });
    }
  });

  return router;
}
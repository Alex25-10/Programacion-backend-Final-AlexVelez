import { Router } from 'express';

export const createProductsRouter = () => {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const { limit = 10, page = 1, sort, query, availability } = req.query;

      const result = await req.productManager.getProducts({
        limit: parseInt(limit),
        page: parseInt(page),
        sort,
        query,
        availability,
        baseUrl: `${req.protocol}://${req.get('host')}${req.baseUrl}`
      });

      res.json({
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? `${result.baseUrl}?page=${result.prevPage}&limit=${limit}` : null,
        nextLink: result.hasNextPage ? `${result.baseUrl}?page=${result.nextPage}&limit=${limit}` : null
      });
    } catch (error) {
      console.error('Error GET /api/products:', error);
      res.status(500).json({ status: 'error', error: 'Error al obtener productos' });
    }
  });

  router.get('/:pid', async (req, res) => {
    try {
      const product = await req.productManager.getProductById(req.params.pid);
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener el producto' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const newProduct = await req.productManager.addProduct(req.body);
      req.io.emit('productoAgregado', newProduct);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.put('/:pid', async (req, res) => {
    try {
      const updatedProduct = await req.productManager.updateProduct(req.params.pid, req.body);
      if (!updatedProduct) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(updatedProduct);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  router.delete('/:pid', async (req, res) => {
    try {
      const deleted = await req.productManager.deleteProduct(req.params.pid);
      if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
      req.io.emit('productoEliminado', req.params.pid);
      res.json({ status: 'success', message: 'Producto eliminado' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
};

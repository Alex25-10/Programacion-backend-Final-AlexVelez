import { Router } from 'express';

export const productViewsRouter = Router();

productViewsRouter.get('/products/:pid', async (req, res) => {
  try {
    const { pid } = req.params;
    const product = await req.productManager.getProductById(pid);

    if (!product) {
      return res.status(404).render('error', {
        error: 'Producto no encontrado',
      });
    }

    res.render('product', {
      product,
      style: 'product.css',
    });
  } catch (error) {
    console.error('Error al cargar producto:', error.message);
    res.status(500).render('error', {
      error: 'Error interno al cargar producto',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
});

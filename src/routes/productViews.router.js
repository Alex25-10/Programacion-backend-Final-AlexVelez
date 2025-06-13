import { Router } from 'express';
import { ProductModel } from '../dao/models/product.model.js'; 

export const productViewsRouter = Router();

// 🟢 Ruta para listar productos con filtros y paginación
productViewsRouter.get('/products', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query, availability } = req.query;
    const result = await req.productManager.getProducts({
      limit: parseInt(limit),
      page: parseInt(page),
      sort,
      query,
      availability,
    });

    res.render('home', {
      products: result.docs,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage
          ? `/products?page=${result.prevPage}&limit=${limit}&query=${query || ''}&availability=${availability || ''}&sort=${sort || ''}`
          : null,
        nextLink: result.hasNextPage
          ? `/products?page=${result.nextPage}&limit=${limit}&query=${query || ''}&availability=${availability || ''}&sort=${sort || ''}`
          : null,
      },
      filters: { query, sort, availability },
      hasFilters: !!(query || sort || availability),
      style: 'home.css',
      userCartId: req.session?.user?.cart || 'default'
    });
  } catch (error) {
    console.error('Error en GET /products:', error);
    res.status(500).render('error', {
      error: 'Error al cargar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
});

// 🟢 Ruta para ver un solo producto por ID
productViewsRouter.get('/products/:pid', async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await ProductModel.findById(pid).lean();


    if (!product) {
      return res.status(404).render('error', { message: 'Producto no encontrado' });
    }

    res.render('product', { product });
  } catch (error) {
    console.error('Error en GET /products/:pid:', error);
    res.status(500).render('error', { message: 'Error interno del servidor' });
  }
});

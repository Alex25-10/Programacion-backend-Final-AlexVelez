import { Router } from 'express';
import { ProductModel } from '../dao/models/product.model.js';
import { getCartView } from '../controllers/views.controller.js';
import { ProductManager } from '../managers/ProductManager.js';
import mongoose from 'mongoose'


const productManager = new ProductManager();
export const productViewsRouter = Router();
productViewsRouter.get('/', (req, res) => {
  res.redirect('/products');
});



productViewsRouter.get('/cart/:cid', getCartView);


productViewsRouter.get('/products', async (req, res) => {
  try {
    const { limit = 10, page = 1, sort, query, availability } = req.query;
    const result = await productManager.getProducts({
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
        totalDocs: result.totalDocs,
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
      userCartId: mongoose.Types.ObjectId.isValid(req.session?.user?.cart)
  ? req.session.user.cart
  : null

    });
  } catch (error) {
    console.error('Error en GET /products:', error);
    res.status(500).render('error', {
      error: 'Error al cargar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
});


productViewsRouter.get('/products/:pid', async (req, res) => {
  try {
    const pid = req.params.pid;
    const product = await ProductModel.findById(pid).lean();

    if (!product) {
      return res.status(404).render('error', {
        error: 'Producto no encontrado',
        details: `No se encontró ningún producto con ID ${pid}`,
      });
    }

    res.render('product', {
      product,
      style: 'product.css'
    });
  } catch (error) {
    console.error('Error en GET /products/:pid:', error);
    res.status(500).render('error', {
      error: 'Error al buscar el producto',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
});

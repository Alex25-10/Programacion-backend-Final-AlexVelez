import { ProductModel } from '../dao/models/product.model.js';

// Vista de listado de productos con filtros y paginación
export const getAllProductsView = async (req, res) => {
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
      userCartId: req.session?.user?.cart || 'default'
    });
  } catch (error) {
    console.error('Error en getAllProductsView:', error);
    res.status(500).render('error', {
      error: 'Error al cargar productos',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
};

// Vista de producto individual
export const getSingleProductView = async (req, res) => {
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
    console.error('Error en getSingleProductView:', error);
    res.status(500).render('error', {
      error: 'Error al buscar el producto',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
};

// Vista del carrito
export const getCartView = async (req, res) => {
  try {
    const { cid } = req.params;

    
    if (!cid || cid.length !== 24) {
      return res.status(400).render('error', {
        error: 'ID de carrito inválido',
        details: `El ID "${cid}" no tiene un formato válido.`,
      });
    }

    const cart = await req.cartManager.getCartById(cid);

    if (!cart) {
      return res.status(404).render('error', {
        error: 'Carrito no encontrado',
        details: `No se encontró ningún carrito con ID ${cid}`,
      });
    }

    const populatedCart = await req.cartManager.populateProducts(cart);

    res.render('cart', {
      cartId: populatedCart._id,
      products: populatedCart.products,
      style: 'cart.css'
    });

  } catch (error) {
    console.error('Error en getCartView:', error);
    res.status(500).render('error', {
      error: 'Error al cargar el carrito',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
    });
  }
};

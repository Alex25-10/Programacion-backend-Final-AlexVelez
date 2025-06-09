import { ProductModel } from '../dao/models/product.model.js';

class ProductService {
  async getProducts({ 
    limit = 10, 
    page = 1, 
    sort, 
    query, 
    availability, 
    baseUrl = '/api/products' 
  }) {
    const filter = { status: true };

    
    if (query) filter.category = { $regex: new RegExp(query, 'i') };
    if (availability === 'disponible') filter.stock = { $gt: 0 };

    
    const options = {
      limit: parseInt(limit),
      page: parseInt(page),
      lean: true,
      leanWithId: false,
      sort: sort === 'asc' ? { price: 1 } : sort === 'desc' ? { price: -1 } : undefined
    };

    try {
      const result = await ProductModel.paginate(filter, options);

      
      const buildLink = (targetPage) => {
        const params = new URLSearchParams({ limit, page: targetPage });
        if (sort) params.append('sort', sort);
        if (query) params.append('query', query);
        if (availability) params.append('availability', availability);
        return `${baseUrl}?${params.toString()}`;
      };

      return {
        status: 'success',
        payload: result.docs,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        prevLink: result.hasPrevPage ? buildLink(result.prevPage) : null,
        nextLink: result.hasNextPage ? buildLink(result.nextPage) : null,
        totalDocs: result.totalDocs
      };
    } catch (error) {
      console.error('Error en ProductService:', error);
      throw new Error('Error al obtener productos');
    }
  }

  async getProductById(id) {
    try {
      return await ProductModel.findOne({ _id: id, status: true });
    } catch (error) {
      throw new Error('Producto no encontrado');
    }
  }
}


export const productService = new ProductService();
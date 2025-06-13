import mongoose from 'mongoose';
import { ProductModel } from '../dao/models/product.model.js';

class ProductManager {
  constructor() {
    this.model = ProductModel;
  }

  async getProducts({ 
    limit = 10, 
    page = 1, 
    sort, 
    query, 
    availability = 'available' 
  } = {}) {
    try {
      const filter = {};

      if (query) {
        filter.$or = [
          { category: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } }
        ];
      }

      if (availability === 'available') {
        filter.status = true;
        filter.stock = { $gt: 0 };
      } else if (availability === 'unavailable') {
        filter.$or = [
          { status: false },
          { stock: { $lte: 0 } }
        ];
      }

      const options = {
        limit: parseInt(limit),
        page: parseInt(page),
        sort: this._getSortOption(sort),
        lean: true,
        leanWithId: false,
        select: '-__v -createdAt -updatedAt'
      };

      const result = await this.model.paginate(filter, options);

      return {
        docs: result.docs, // ✅ CAMBIO CLAVE AQUÍ: usamos "docs" en lugar de "payload"
        totalPages: result.totalPages,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevLink: result.hasPrevPage ? 
          this._buildPaginationLink(limit, result.prevPage, sort, query, availability) : null,
        nextLink: result.hasNextPage ? 
          this._buildPaginationLink(limit, result.nextPage, sort, query, availability) : null,
        totalDocs: result.totalDocs
      };
    } catch (error) {
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  _getSortOption(sort) {
    if (!sort) return { createdAt: -1 };

    if (sort === 'asc' || sort === 'desc') {
      return { price: sort === 'asc' ? 1 : -1 };
    }

    const sortField = sort.replace(/^-/, '');
    const sortOrder = sort.startsWith('-') ? -1 : 1;

    const validSortFields = ['title', 'price', 'stock', 'category'];
    if (!validSortFields.includes(sortField)) {
      throw new Error(`Campo no válido para ordenar: ${sortField}`);
    }

    return { [sortField]: sortOrder };
  }

  _buildPaginationLink(limit, page, sort, query, availability) {
    const params = new URLSearchParams();
    params.append('limit', limit);
    params.append('page', page);
    if (sort) params.append('sort', sort);
    if (query) params.append('query', query);
    if (availability) params.append('availability', availability);

    return `/api/products?${params.toString()}`;
  }

  async getProductById(pid) {
    try {
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new Error('ID de producto no válido');
      }

      const product = await this.model.findById(pid)
        .select('-__v')
        .lean();

      if (!product) {
        throw new Error('Producto no encontrado');
      }
      return product;
    } catch (error) {
      throw new Error(`Error al buscar producto: ${error.message}`);
    }
  }

  async addProduct(productData) {
    try {
      const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
      const missingFields = requiredFields.filter(field => !productData[field]);

      if (missingFields.length > 0) {
        throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      }

      const existingProduct = await this.model.findOne({ code: productData.code });
      if (existingProduct) {
        throw new Error('El código de producto ya existe');
      }

      const product = new this.model({
        ...productData,
        status: productData.stock > 0
      });

      await product.validate();
      return await product.save();
    } catch (error) {
      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  async updateProduct(pid, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new Error('ID de producto no válido');
      }

      if (updateData.code) {
        const existingProduct = await this.model.findOne({ 
          code: updateData.code, 
          _id: { $ne: pid } 
        });
        if (existingProduct) {
          throw new Error('El código de producto ya está en uso');
        }
      }

      const updated = await this.model.findByIdAndUpdate(
        pid, 
        updateData, 
        { 
          new: true, 
          runValidators: true,
          select: '-__v -createdAt -updatedAt'
        }
      );

      if (!updated) {
        throw new Error('Producto no encontrado');
      }
      return updated;
    } catch (error) {
      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  async deleteProduct(pid) {
    try {
      if (!mongoose.Types.ObjectId.isValid(pid)) {
        throw new Error('ID de producto no válido');
      }

      const deleted = await this.model.findByIdAndDelete(pid)
        .select('-__v -createdAt -updatedAt');

      if (!deleted) {
        throw new Error('Producto no encontrado');
      }
      return deleted;
    } catch (error) {
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }
}

export { ProductManager };

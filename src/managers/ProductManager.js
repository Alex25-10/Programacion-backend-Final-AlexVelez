const fs = require('fs').promises;
const path = require('path');

class ProductManager {
  constructor() {
    this.path = path.resolve(process.cwd(), 'data', 'products.json');
    this.productsCache = null;
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(path.dirname(this.path), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  async getProducts() {
    if (this.productsCache) return this.productsCache;

    try {
      const data = await fs.readFile(this.path, 'utf8');
      this.productsCache = JSON.parse(data);
      return this.productsCache;
    } catch (error) {
      await this.saveProducts([]);
      return [];
    }
  }

  async addProduct(productData) {
    const requiredFields = ['title', 'description', 'code', 'price', 'stock', 'category'];
    const missingFields = requiredFields.filter(field => !productData[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Faltan campos obligatorios: ${missingFields.join(', ')}`);
    }

    if (productData.price <= 0 || productData.stock < 0) {
      throw new Error("Precio debe ser > 0 y stock no puede ser negativo");
    }

    const products = await this.getProducts();
    
    if (products.some(p => p.code === productData.code)) {
      throw new Error(`El código ${productData.code} ya está registrado`);
    }

    const newProduct = {
      id: this.generateId(products),
      ...productData,
      status: productData.status !== undefined ? productData.status : true,
      thumbnails: productData.thumbnails || []
    };

    products.push(newProduct);
    await this.saveProducts(products);
    return newProduct;
  }

  async getProductById(id) {
    const products = await this.getProducts();
    const product = products.find(p => p.id === id);
    if (!product) throw new Error(`NOT_FOUND: Producto con ID ${id} no existe`);
    return product;
  }

  async updateProduct(id, updatedFields) {
    const products = await this.getProducts();
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error('NOT_FOUND: Producto no encontrado');
    
    if (updatedFields.code && products.some(p => p.code === updatedFields.code && p.id !== id)) {
      throw new Error(`CONFLICT: El código ${updatedFields.code} ya está en uso`);
    }

    delete updatedFields.id;
    
    products[index] = { 
      ...products[index],
      ...updatedFields 
    };

    await this.saveProducts(products);
    return products[index];
  }

  async deleteProduct(id) {
    const products = await this.getProducts();
    const filteredProducts = products.filter(p => p.id !== id);
    
    if (products.length === filteredProducts.length) {
      throw new Error('NOT_FOUND: Producto no encontrado');
    }

    await this.saveProducts(filteredProducts);
  }

  generateId(products) {
    return Date.now(); // IDs únicos basados en timestamp
  }

  async saveProducts(products) {
    await fs.writeFile(this.path, JSON.stringify(products, null, 2));
    this.productsCache = products; // Actualizar caché
  }
}

module.exports = ProductManager;
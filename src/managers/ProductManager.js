const fs = require('fs').promises;
const path = require('path');

class ProductManager {
  constructor() {
    this.path = path.resolve(__dirname, '../data/products.json');
  }

  async addProduct(product) {
    const products = await this.getProducts();
    const newProduct = {
      id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
      ...product,
      status: product.status !== undefined ? product.status : true,
      thumbnails: product.thumbnails || []
    };
    products.push(newProduct);
    await fs.writeFile(this.path, JSON.stringify(products, null, 2));
    return newProduct;
  }

  async getProducts() {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      await fs.writeFile(this.path, '[]');
      return [];
    }
  }

  // ¡Método nuevo agregado aquí!
  async getProductById(id) {
    const products = await this.getProducts();
    const product = products.find(p => p.id === id);
    return product || null;
  }
}

module.exports = ProductManager;
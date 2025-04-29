const fs = require('fs').promises;
const path = require('path');

class ProductManager {
  constructor() {
    this.path = path.join(__dirname, '../../data/products.json');
  }

  async getProducts() {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      return JSON.parse(data);
    } catch {
      await fs.writeFile(this.path, JSON.stringify([]));
      return [];
    }
  }

  // ... (otros métodos)
}

module.exports = ProductManager;
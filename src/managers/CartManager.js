const fs = require('fs').promises;
const path = require('path');

class CartManager {
  constructor() {
    this.path = path.resolve(__dirname, '../data/carts.json');
  }

  async createCart() {
    const carts = await this.getCarts();
    const newCart = {
      id: carts.length > 0 ? Math.max(...carts.map(c => c.id)) + 1 : 1,
      products: []
    };
    carts.push(newCart);
    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return newCart;
  }

  async getCarts() {
    try {
      const data = await fs.readFile(this.path, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      await fs.writeFile(this.path, '[]');
      return [];
    }
  }

  // Método nuevo para agregar productos al carrito
  async addProductToCart(cartId, productId) {
    const carts = await this.getCarts();
    const cartIndex = carts.findIndex(c => c.id === cartId);

    if (cartIndex === -1) {
      throw new Error('Carrito no encontrado');
    }

    // Busca si el producto ya está en el carrito
    const productIndex = carts[cartIndex].products.findIndex(
      p => p.product === productId
    );

    if (productIndex === -1) {
      // Si el producto no existe en el carrito, lo agrega
      carts[cartIndex].products.push({
        product: productId,
        quantity: 1
      });
    } else {
      // Si ya existe, incrementa la cantidad
      carts[cartIndex].products[productIndex].quantity++;
    }

    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    return carts[cartIndex];
  }

  // Método nuevo para obtener un carrito por ID
  async getCartById(id) {
    const carts = await this.getCarts();
    return carts.find(c => c.id === id);
  }
}

module.exports = CartManager;
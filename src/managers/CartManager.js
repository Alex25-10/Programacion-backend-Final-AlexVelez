const fs = require('fs').promises;
const path = require('path');

class CartManager {
  constructor() {
    this.path = path.resolve(process.cwd(), 'data', 'carts.json');
    this.cartsCache = null;
    this.ensureDataDir();
  }

  async ensureDataDir() {
    try {
      await fs.mkdir(path.dirname(this.path), { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }
  }

  async getCarts() {
    if (this.cartsCache) return this.cartsCache;

    try {
      const data = await fs.readFile(this.path, 'utf8');
      this.cartsCache = JSON.parse(data);
      return this.cartsCache;
    } catch (error) {
      await this.saveCarts([]);
      return [];
    }
  }

  async saveCarts(carts) {
    await fs.writeFile(this.path, JSON.stringify(carts, null, 2));
    this.cartsCache = carts; // Actualizar caché
  }

  async createCart() {
    const carts = await this.getCarts();
    const newCart = {
      id: Date.now(), // ID único basado en timestamp
      products: [],
      createdAt: new Date().toISOString()
    };
    carts.push(newCart);
    await this.saveCarts(carts);
    return newCart;
  }

  async getCartById(id) {
    const carts = await this.getCarts();
    const cart = carts.find(c => c.id === id);
    if (!cart) throw new Error('NOT_FOUND: Carrito no encontrado');
    return cart;
  }

  async addProductToCart(cartId, productId, quantity = 1) {
    if (typeof productId !== 'number' || productId <= 0) {
      throw new Error('INVALID_PRODUCT: ID de producto inválido');
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      throw new Error('INVALID_QUANTITY: La cantidad debe ser un número positivo');
    }

    const carts = await this.getCarts();
    const cartIndex = carts.findIndex(c => c.id === cartId);

    if (cartIndex === -1) {
      throw new Error('NOT_FOUND: Carrito no encontrado');
    }

    const productIndex = carts[cartIndex].products.findIndex(
      p => p.product === productId
    );

    if (productIndex === -1) {
      carts[cartIndex].products.push({
        product: productId,
        quantity: quantity
      });
    } else {
      carts[cartIndex].products[productIndex].quantity += quantity;
    }

    carts[cartIndex].updatedAt = new Date().toISOString();
    await this.saveCarts(carts);
    return carts[cartIndex];
  }

  async removeProductFromCart(cartId, productId) {
    const carts = await this.getCarts();
    const cartIndex = carts.findIndex(c => c.id === cartId);

    if (cartIndex === -1) {
      throw new Error('NOT_FOUND: Carrito no encontrado');
    }

    const initialLength = carts[cartIndex].products.length;
    carts[cartIndex].products = carts[cartIndex].products.filter(
      p => p.product !== productId
    );

    if (initialLength === carts[cartIndex].products.length) {
      throw new Error('NOT_FOUND: Producto no encontrado en el carrito');
    }

    carts[cartIndex].updatedAt = new Date().toISOString();
    await this.saveCarts(carts);
    return carts[cartIndex];
  }
}

module.exports = CartManager;
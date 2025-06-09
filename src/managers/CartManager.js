import CartModel from "../dao/models/carts.model.js";

class CartManager {
  
  
  async createCart() {
    const newCart = await CartModel.create({ products: [] });
    return newCart;
  }

  
  async getCartById(cid) {
    const cart = await CartModel.findById(cid).populate('products.product');
    if (!cart) throw new Error("Carrito no encontrado");
    return cart;
  }

  
  async populateProducts(cart) {
    return await cart.populate('products.product');
  }

  
  async addProductToCart(cid, pid, quantity) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const existingProductIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (existingProductIndex !== -1) {
      cart.products[existingProductIndex].quantity += quantity;
    } else {
      cart.products.push({ product: pid, quantity });
    }

    await cart.save();
    return cart;
  }

  
  async removeProductFromCart(cid, pid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    return cart;
  }

  
  async clearCart(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = [];
    await cart.save();
    return cart;
  }

  
  async replaceCartProducts(cid, products) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    if (!Array.isArray(products)) throw new Error("Formato inválido");

    cart.products = products;
    await cart.save();
    return await this.populateProducts(cart);
  }

  
  async updateProductQuantity(cid, pid, quantity) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const productIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (productIndex === -1) throw new Error("Producto no encontrado en el carrito");

    cart.products[productIndex].quantity = quantity;
    await cart.save();
    return await this.populateProducts(cart);
  }
}

export { CartManager };

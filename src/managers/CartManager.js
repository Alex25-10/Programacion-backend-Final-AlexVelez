import CartModel from "../dao/models/carts.model.js";

class CartManager {
  // Crear un nuevo carrito
  async createCart() {
    const newCart = await CartModel.create({ products: [] });
    return newCart;
  }

  // Obtener carrito por ID con populate
  async getCartById(cid) {
    const cart = await CartModel.findById(cid).populate('products.product');
    if (!cart) throw new Error("Carrito no encontrado");
    return cart;
  }

  // Populate manual para vista
  async populateProducts(cart) {
    return await cart.populate('products.product');
  }

  // Agregar producto (o aumentar cantidad si ya existe)
  async addProductToCart(cid, pid, quantity) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const productIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (productIndex !== -1) {
      cart.products[productIndex].quantity += quantity;
    } else {
      cart.products.push({ product: pid, quantity });
    }

    await cart.save();
    return await this.getCartById(cid); 
  }

  // Eliminar un producto del carrito
  async removeProductFromCart(cid, pid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    return await this.getCartById(cid); 
  }

  // Vaciar el carrito completo
  async clearCart(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = [];
    await cart.save();
    return await this.getCartById(cid); 
  }

  // Reemplazar todos los productos del carrito
  async replaceProducts(cid, products) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    if (!Array.isArray(products)) throw new Error("Formato inválido");

    cart.products = products;
    await cart.save();
    return await this.getCartById(cid); 
  }

  // Actualizar la cantidad de un producto en el carrito
  async updateProductQuantity(cid, pid, quantity) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    const productIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (productIndex === -1) throw new Error("Producto no encontrado en el carrito");

    cart.products[productIndex].quantity = quantity;
    await cart.save();
    return await this.getCartById(cid);
  }
}

export { CartManager };

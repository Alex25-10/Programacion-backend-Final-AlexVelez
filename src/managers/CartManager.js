import CartModel from "../dao/models/carts.model.js";

class CartManager {
  // Eliminar un producto específico del carrito
  async removeProductFromCart(cid, pid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    return cart;
  }

  // ✅ Obtener un carrito por ID (usado en vistas)
  async getCartById(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");
    return cart;
  }

  // ✅ Popular productos (para Handlebars)
  async populateProducts(cart) {
    return await cart.populate('products.product');
  }

  // ✅ Vaciar el carrito (nuevo método)
  async clearCart(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = [];
    await cart.save();
    return cart;
  }

  // ✅ Crear un carrito vacío (nuevo método)
  async createCart() {
    const newCart = await CartModel.create({ products: [] });
    return newCart;
  }
}

export { CartManager };

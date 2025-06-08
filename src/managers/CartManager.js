import CartModel from "../dao/models/carts.model.js";

class CartManager {
  // Eliminar un producto específico del carrito
  async removeProductFromCart(cid, pid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    // Filtrar el producto a eliminar
    cart.products = cart.products.filter(p => p.product.toString() !== pid);
    await cart.save();
    return cart;
  }

  // Obtener un carrito por ID (usado en vistas)
  async getCartById(cid) {
    const cart = await CartModel.findById(cid).populate('products.product'); // Asegúrate de que los productos estén poblados
    if (!cart) throw new Error("Carrito no encontrado");
    return cart;
  }

  // Popular productos (para Handlebars)
  async populateProducts(cart) {
    return await cart.populate('products.product');
  }

  // Vaciar el carrito (nuevo método)
  async clearCart(cid) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    cart.products = [];
    await cart.save();
    return cart;
  }

  // Crear un carrito vacío (nuevo método)
  async createCart() {
    const newCart = await CartModel.create({ products: [] });
    return newCart;
  }

  // Agregar producto al carrito (nuevo método)
  async addProductToCart(cid, pid, quantity) {
    const cart = await CartModel.findById(cid);
    if (!cart) throw new Error("Carrito no encontrado");

    // Verificar si el producto ya está en el carrito
    const existingProductIndex = cart.products.findIndex(p => p.product.toString() === pid);
    if (existingProductIndex !== -1) {
      // Si el producto ya existe, actualizar la cantidad
      cart.products[existingProductIndex].quantity += quantity;
    } else {
      // Si el producto no existe, agregarlo al carrito
      cart.products.push({ product: pid, quantity });
    }

    await cart.save();
    return cart;
  }
}

export { CartManager };

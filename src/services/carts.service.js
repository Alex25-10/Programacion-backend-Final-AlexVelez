import Cart from '../dao/models/cart.model.js';


export default class CartsService {
  async createCart() {
    return await Cart.create({ products: [] });
  }

  async getCartWithProducts(cartId) {
    return await Cart.findById(cartId)
      .populate('products.product')
      .lean();
  }

  async addProductToCart(cartId, productId, quantity = 1) {
    const cart = await Cart.findById(cartId);
    const productIndex = cart.products.findIndex(
      p => p.product.toString() === productId
    );

    if (productIndex >= 0) {
      cart.products[productIndex].quantity += quantity;
    } else {
      cart.products.push({ product: productId, quantity });
    }

    cart.updatedAt = new Date();
    return await cart.save();
  }

  async removeProductFromCart(cartId, productId) {
    return await Cart.findByIdAndUpdate(
      cartId,
      { $pull: { products: { product: productId } } },
      { new: true }
    );
  }

  async clearCart(cartId) {
    return await Cart.findByIdAndUpdate(
      cartId,
      { $set: { products: [] } },
      { new: true }
    );
  }
}
import mongoose from "mongoose";

// Definición del esquema para el carrito
const cartSchema = new mongoose.Schema({
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product", // Referencia al modelo de Product
        required: true, // El campo es obligatorio
      },
      quantity: {
        type: Number,
        default: 1, // Cantidad por defecto es 1
      },
    },
  ],
});

// Creación del modelo de Carrito
const CartModel = mongoose.model("Cart", cartSchema);

export default CartModel;

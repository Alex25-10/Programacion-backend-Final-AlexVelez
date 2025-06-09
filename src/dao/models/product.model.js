import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const productSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    index: true
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Electronica', 'Ropa', 'Hogar', 'Deportes', 'Otros'],
    index: true
  },
  stock: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: Boolean, 
    default: true 
  },
  thumbnail: { 
    type: [String], 
    default: [] 
  },
  code: { 
    type: String, 
    required: true,
    unique: true
  }
}, { 
  timestamps: true 
});

productSchema.plugin(mongoosePaginate);


export const ProductModel = mongoose.models.Product || mongoose.model('Product', productSchema);
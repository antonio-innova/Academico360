import mongoose from 'mongoose';

const directorSchema = new mongoose.Schema(
  {
    // Singleton global: siempre trabajamos con key = 'global'
    key: { type: String, required: true, unique: true, default: 'global' },
    nombre: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, trim: true },
    actualizadoPor: { type: String, default: 'control' }
  },
  { timestamps: true }
);

const Director = mongoose.models.Director || mongoose.model('Director', directorSchema);

export default Director;


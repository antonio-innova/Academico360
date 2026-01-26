import mongoose from 'mongoose';

const plantelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  localidad: { type: String, required: true },
  ef: { type: String, required: true }, // Entidad Federal
  creadoPor: { type: String, default: 'control' },
  fechaCreacion: { type: Date, default: Date.now }
});

const Plantel = mongoose.models.Plantel || mongoose.model('Plantel', plantelSchema);

export default Plantel;


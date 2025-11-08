import mongoose from 'mongoose';

const profesorSchema = new mongoose.Schema({
  idU: {
    type: String,
    required: false,
    default: 'N/P'
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  telefono: {
    type: String,
    required: false
  },
  especialidad: {
    type: String,
    required: false
  },
  // Campos dinámicos para los IDs según el tipo de usuario que lo crea
  idAP: {
    type: String,
    required: false
  },
  // Referencia al usuario que creó el profesor
  creadoPor: {
    type: String,
    required: true
  },
  tipoCreador: {
    type: String,
    required: true,
    enum: ['control', 'admin']
  },
  fechaIngreso: {
    type: Date,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  estado: {
    type: Number,
    default: 1, // 1 = activo, 0 = bloqueado
    enum: [0, 1],
    required: true, // Hacer que el campo sea requerido
    set: function(valor) {
      // Convertir explícitamente a número
      const valorNumerico = Number(valor);
      // Si no es un número válido o no está en el enum, usar el valor por defecto
      return !isNaN(valorNumerico) && (valorNumerico === 0 || valorNumerico === 1) ? valorNumerico : 1;
    },
    get: function(valor) {
      // Asegurarse de que siempre se devuelva como número
      return valor === undefined ? 1 : Number(valor);
    }
  }
});

// Crear el modelo si no existe
const Profesor = mongoose.models.Profesor || mongoose.model('Profesor', profesorSchema);

export default Profesor;

import mongoose from 'mongoose';

const materiaSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: false,
    default: ''
  },
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: false
  },
  actividades: [{
    nombre: {
      type: String,
      required: true
    },
    descripcion: {
      type: String,
      default: ''
    },
    fecha: {
      type: Date,
      required: true
    },
    porcentaje: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    momento: {
      type: Number,
      enum: [1, 2, 3],
      default: 1
    },
    calificaciones: [{
      alumnoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Estudiante',
        required: true
      },
      nota: {
        type: Number,
        min: 1,
        max: 20
      },
      notaAlfabetica: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F']
      },
      tipoCalificacion: {
        type: String,
        enum: ['numerica', 'alfabetica'],
        default: 'numerica'
      },
      imagenUrl: String,
      fechaCreacion: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Campos dinámicos para los IDs según el tipo de usuario que lo crea
  idAM: {
    type: String,
    required: false
  },
  // Referencia al usuario que creó la materia
  creadoPor: {
    type: String,
    required: true
  },
  tipoCreador: {
    type: String,
    required: true,
    enum: ['control', 'admin']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  }
});

// Crear el modelo si no existe
const Materia = mongoose.models.Materia || mongoose.model('Materia', materiaSchema);

export default Materia;

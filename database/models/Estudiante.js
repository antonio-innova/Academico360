import mongoose from 'mongoose';

const estudianteSchema = new mongoose.Schema({
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
  fechaNacimiento: {
    type: Date,
    required: true
  },
  lugarNacimiento: {
    type: String,
    required: false,
    default: ''
  },
  sexo: {
    type: String,
    enum: ['M', 'F', 'Otro'],
    required: false,
    default: 'Otro'
  },
  // Campo grupo para agrupar estudiantes
  grupo: {
    type: String,
    required: false,
    default: ''
  },
  ef: {
    type: String,
    required: false,
    default: ''
  },
  edad: {
    type: Number,
    required: true
  },
  esMenorDeEdad: {
    type: Boolean,
    required: true
  },
  // Campos dinámicos para los IDs según el tipo de usuario que lo crea
  idAA: {
    type: String,
    required: false
  },
  idIA: {
    type: String,
    required: false
  },
  // Referencia al usuario que creó el estudiante
  creadoPor: {
    type: String,
    required: true
  },
  tipoCreador: {
    type: String,
    required: true,
    enum: ['control', 'docente', 'admin']
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false
  },
  registrado: {
    type: Boolean,
    default: false
  },
  estado: {
    type: Number,
    enum: [0, 1],
    default: 1
  },
  // Año escolar del estudiante
  anio: {
    type: String,
    required: false,
    default: ''
  },
  // Sección del estudiante
  seccion: {
    type: String,
    required: false,
    default: ''
  },
  // Datos del representante
  representante: {
    nombre: {
      type: String,
      required: false,
      default: ''
    },
    apellido: {
      type: String,
      required: false,
      default: ''
    },
    cedula: {
      type: String,
      required: false,
      default: ''
    },
    correo: {
      type: String,
      required: false,
      default: ''
    },
    telefono: {
      type: String,
      required: false,
      default: ''
    },
    parentesco: {
      type: String,
      enum: ['PAPA', 'MAMA', 'ABUELO', 'ABUELA', 'TIO', 'TIA', 'OTRO','Madre','Padre','Tio','Tia','Abuelo','Abuela','Otro'],
      required: false,
      default: 'Padre'
    }
  }
});

// Crear el modelo si no existe
const Estudiante = mongoose.models.Estudiante || mongoose.model('Estudiante', estudianteSchema);

export default Estudiante;

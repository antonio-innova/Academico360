import mongoose from 'mongoose';

// Esquema para las actividades dentro de una asignación
const actividadSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  descripcion: {
    type: String,
    required: false,
    default: ''
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  porcentaje: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  momento: {
    type: Number,
    required: true,
    min: 1,
    max: 4,
    validate: {
      validator: function(v) {
        return [1, 2, 3, 4].includes(v);
      },
      message: props => `${props.value} no es un momento válido. Debe ser 1, 2, 3 o 4.`
    }
  },
  // Calificaciones de los alumnos para esta actividad
  calificaciones: [{
    alumnoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudiante',
      required: true
    },
    nota: {
      type: Number,
      required: false, // No requerido para permitir NP e Inasistente
      min: 0,
      max: 100
    },
    notaAlfabetica: {
      type: String,
      required: false,
      default: ''
    },
    tipoCalificacion: {
      type: String,
      enum: ['numerica', 'alfabetica', 'np', 'inasistente'],
      default: 'numerica'
    },
    imagenUrl: {
      type: String,
      required: false,
      default: ''
    }
  }]
});

// Esquema principal para las asignaciones
const asignacionSchema = new mongoose.Schema({
  // Referencia a la materia
  materiaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  // Nombre de la materia
  materiaNombre: {
    type: String,
    required: true
  },
  // Referencia al profesor
  profesorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profesor',
    required: true
  },
  // Periodo educativo
  periodo: {
    type: String,
    required: false,
    default: ''
  },
  // Año escolar
  anio: {
    type: String,
    enum: ['1 año', '2 año', '3 año', '4 año', '5 año'],
    required: false,
    default: '1 año'
  },
  // Nombre completo del profesor
  profesorNombre: {
    type: String,
    required: true
  },
  // Lista de IDs de alumnos asignados
  alumnos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudiante'
  }],
  // Información de los alumnos con nombres
  alumnosInfo: [{
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Estudiante'
    },
    nombre: {
      type: String,
      required: true
    }
  }],
  // Lista de actividades para esta asignación
  actividades: [actividadSchema],
  // Campos dinámicos para los IDs según el tipo de usuario que lo crea
  idAAS: {
    type: String,
    required: false
  },
  // Campos para manejar la institución (IUTCM o Acacias)
  institucion: {
    type: String,
    enum: ['iutcm', 'acacias'],
    required: false
  },
  // ID para IUTCM
  idI: {
    type: String,
    required: false
  },
  // ID para Acacias
  idA: {
    type: String,
    required: false
  },
  // Referencia al usuario que creó la asignación
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
const Asignacion = mongoose.models.Asignacion || mongoose.model('Asignacion', asignacionSchema);

export default Asignacion;

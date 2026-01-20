import mongoose from 'mongoose';

const aulaSchema = new mongoose.Schema({
  // Campos básicos
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  anio: {
    type: String,
    required: true,
    enum: ['1', '2', '3', '4', '5']
  },
  seccion: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  turno: {
    type: String,
    required: true,
    enum: ['Mañana', 'Tarde', 'Noche']
  },
  periodo: {
    type: String,
    required: true,
    trim: true
  },
  alumnos: [{
    nombre: {
      type: String,
      required: true
    },
    apellido: {
      type: String,
      required: true
    },
    _id: {
      type: String,
      required: false
    },
    cedula: {
      type: String,
      required: false
    },
    idU: {
      type: String,
      required: false
    },
    // Array de IDs de materias que el estudiante ve (opcional, si no existe se asume que ve todas)
    materiasAsignadas: [{
      type: String
    }]
  }],
  asignaciones: [{
    materia: {
      id: {
        type: String,
        required: true
      },
      nombre: {
        type: String,
        required: true
      },
      codigo: {
        type: String,
        required: true
      }
    },
    profesor: {
      nombre: {
        type: String,
        required: false,
        default: ''
      },
      apellido: {
        type: String,
        required: false,
        default: ''
      }
    },
    // Objeto para controlar el bloqueo de momentos (previene subir notas pero no afecta reportes)
    momentosBloqueados: {
      1: {
        type: Boolean,
        default: false
      },
      2: {
        type: Boolean,
        default: false
      },
      3: {
        type: Boolean,
        default: false
      }
    },
    // Estructura para almacenar los puntos extras de los estudiantes por momento
    puntosPorMomento: {
      momento1: [{
        alumnoId: {
          type: String,
          required: true
        },
        puntos: {
          type: Number,
          default: 0,
          min: 0,
          max: 2
        },
        fechaActualizacion: {
          type: Date,
          default: Date.now
        }
      }],
      momento2: [{
        alumnoId: {
          type: String,
          required: true
        },
        puntos: {
          type: Number,
          default: 0,
          min: 0,
          max: 2
        },
        fechaActualizacion: {
          type: Date,
          default: Date.now
        }
      }],
      momento3: [{
        alumnoId: {
          type: String,
          required: true
        },
        puntos: {
          type: Number,
          default: 0,
          min: 0,
          max: 2
        },
        fechaActualizacion: {
          type: Date,
          default: Date.now
        }
      }]
    },
    // Mantenemos la estructura anterior para compatibilidad
    puntosExtras: [{
      alumnoId: {
        type: String,
        required: true
      },
      puntos: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      fechaActualizacion: {
        type: Date,
        default: Date.now
      }
    }],
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
          type: String,
          required: true
        },
        nota: {
          type: Number,
          min: 1,
          max: 20
        },
        notaAlfabetica: {
          type: String,
          enum: ['A', 'B', 'C', 'D', 'E', 'F', ''],
          default: ''
        },
        tipoCalificacion: {
          type: String,
          enum: ['numerica', 'alfabetica', 'np', 'inasistente'],
          default: 'numerica'
        },
        observaciones: {
          type: String,
          default: ''
        },
        evidencia: {
          type: String,
          default: ''
        },
        fechaCreacion: {
          type: Date,
          default: Date.now
        }
      }]
    }]
  }],
  estado: {
    type: Number,
    default: 1,
    enum: [0, 1]
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  creadoPor: {
    type: String,
    required: true
  },
  tipoCreador: {
    type: String,
    required: true,
    enum: ['control', 'admin']
  }
});

// Crear el modelo si no existe
const Aula = mongoose.models.Aula || mongoose.model('Aula', aulaSchema);

export default Aula;

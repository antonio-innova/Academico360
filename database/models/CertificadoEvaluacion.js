import mongoose from 'mongoose';

const certificadoEvaluacionSchema = new mongoose.Schema({
  tipoEvaluacion: {
    type: String,
    required: true,
    enum: ['final', 'revision', 'materia-pendiente']
  },
  momento: {
    type: String,
    required: false,
    enum: ['octubre', 'diciembre', 'enero', 'junio']
  },
  formato: {
    type: String,
    required: false,
    enum: ['1-3', '1-5']
  },
  // Datos del Excel de notas finales
  datosNotasFinales: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Datos del Excel de docentes
  datosDocentes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Archivos originales (nombres y referencias)
  archivoNotasFinales: {
    nombre: String,
    fechaSubida: Date
  },
  archivoDocentes: {
    nombre: String,
    fechaSubida: Date
  },
  // Metadatos
  estudiante: {
    cedula: String,
    nombres: String,
    apellidos: String
  },
  creadoPor: {
    type: String,
    required: true
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  observaciones: {
    type: String,
    default: ''
  }
});

const CertificadoEvaluacion = mongoose.models.CertificadoEvaluacion || 
  mongoose.model('CertificadoEvaluacion', certificadoEvaluacionSchema);

export default CertificadoEvaluacion;


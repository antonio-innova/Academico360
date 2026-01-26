import mongoose from 'mongoose';

const planMateriaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  numero: { type: Number, required: false },
  letras: { type: String, required: false },
  te: { type: String, required: false },
  fechaMes: { type: String, required: false },
  fechaAnio: { type: String, required: false },
  // Número de plantel asociado a la materia (opcional)
  plantelNumero: { type: String, required: false },
  // Grupo (solo aplica para "Grupo y Participación")
  grupo: { type: String, required: false }
}, { _id: false });

const planAnioSchema = new mongoose.Schema({
  grado: { type: String, enum: ['1', '2', '3', '4', '5'], required: true },
  materias: { type: [planMateriaSchema], default: [] }
}, { _id: false });

const institucionSchema = new mongoose.Schema({
  codigo: { type: String },
  denominacion: { type: String },
  direccion: { type: String },
  telefono: { type: String },
  municipio: { type: String },
  entidadFederal: { type: String },
  cdcee: { type: String },
  // Lista de planteles donde cursó estudios (corrige typo: planeles -> planteles)
  planteles: { type: [{ numero: String, nombre: String, localidad: String, ef: String }], default: [] }
}, { _id: false });

const estudianteSchema = new mongoose.Schema({
  cedula: { type: String, required: true },
  nombres: { type: String, required: true },
  apellidos: { type: String, required: true },
  fechaNacimiento: { type: String },
  lugarNacimiento: { type: String },
  pais: { type: String },
  estado: { type: String },
  municipio: { type: String },
  identidadFederal: { type: String },
}, { _id: false });

const notaCertificadaSchema = new mongoose.Schema({
  institucion: { type: institucionSchema, required: false },
  estudiante: { type: estudianteSchema, required: true },
  periodo: { type: String },
  anioEscolar: { type: String },
  planEstudio: { type: [planAnioSchema], default: [] },
  observaciones: { type: String },
  // Programas (solo para planilla 32011)
  programas: { type: [String], default: [] },
  creadoPor: { type: String },
  fechaCreacion: { type: Date, default: Date.now }
});

const NotaCertificada = mongoose.models.NotaCertificada || mongoose.model('NotaCertificada', notaCertificadaSchema);

export default NotaCertificada;




import mongoose from 'mongoose';

const NotaResumenSchema = new mongoose.Schema(
  {
    materia: { type: String, default: '' },
    momento: { type: String, default: '' },
    valor: { type: String, default: '' }
  },
  { _id: false }
);

const EstudianteResumenSchema = new mongoose.Schema(
  {
    cedula: { type: String, default: '' },
    apellido: { type: String, default: '' },
    nombre: { type: String, default: '' },
    lugarNacimiento: { type: String, default: '' },
    ef: { type: String, default: '' },
    sexo: { type: String, default: '' },
    fechaNacimiento: {
      dia: { type: String, default: '' },
      mes: { type: String, default: '' },
      anio: { type: String, default: '' }
    },
    notas: { type: [NotaResumenSchema], default: [] },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const DocenteResumenSchema = new mongoose.Schema(
  {
    nombre: { type: String, default: '' },
    apellido: { type: String, default: '' },
    cedula: { type: String, default: '' },
    raw: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: false }
);

const ResumenFinalSchema = new mongoose.Schema(
  {
    tipoEvaluacion: { type: String, default: 'resumen-final' },
    formato: { type: String, default: null },
    momento: { type: String, default: null },
    grado: { type: String, default: '' },
    seccion: { type: String, default: '' },
    contexto: { type: String, default: null },
    aulaReferencia: { type: String, default: null },
    createdBy: { type: String, default: null },
    createdByNombre: { type: String, default: '' },
    estudiantesSheet: { type: String, default: '' },
    docentesSheet: { type: String, default: '' },
    estudiantesHeaders: { type: [String], default: [] },
    docentesHeaders: { type: [String], default: [] },
    anioEscolarInicio: { type: String, default: '' },
    anioEscolarFin: { type: String, default: '' },
    mesReporte: { type: String, default: '' },
    totales: {
      estudiantes: { type: Number, default: 0 },
      docentes: { type: Number, default: 0 }
    },
    estudiantes: { type: [EstudianteResumenSchema], default: [] },
    docentes: { type: [DocenteResumenSchema], default: [] },
    archivos: {
      estudiantes: { type: String, default: '' },
      docentes: { type: String, default: '' }
    }
  },
  { timestamps: true }
);

export default mongoose.models.ResumenFinal || mongoose.model('ResumenFinal', ResumenFinalSchema);


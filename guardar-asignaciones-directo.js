const mongoose = require('mongoose');
const fs = require('fs');

// URL de conexión directa
const MONGODB_URI = 'mongodb://127.0.0.1:27017/DBAcademico';

// Conectar a MongoDB
console.log('Conectando a MongoDB...');
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Conectado exitosamente a MongoDB');
  guardarAsignaciones();
}).catch(err => {
  console.error('Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Esquema para asignaciones
const asignacionSchema = new mongoose.Schema({
  materiaId: mongoose.Schema.Types.ObjectId,
  materiaNombre: String,
  profesorId: mongoose.Schema.Types.ObjectId,
  profesorNombre: String,
  alumnos: [mongoose.Schema.Types.ObjectId],
  alumnosInfo: [{
    id: mongoose.Schema.Types.ObjectId,
    nombre: String,
    idU: String,
    cedula: String
  }],
  periodo: String,
  periodoId: String,
  anio: String,
  seccion: String,
  turno: String,
  creadoPor: String,
  tipoCreador: String,
  fechaCreacion: { type: Date, default: Date.now },
  idAAS: String
});

// Crear modelo
const Asignacion = mongoose.model('Asignacion', asignacionSchema);

// Función para guardar asignaciones
async function guardarAsignaciones() {
  try {
    // Datos de ejemplo para asignaciones (1er año)
    const asignaciones = [
      {
        materiaId: new mongoose.Types.ObjectId(),
        materiaNombre: 'Inglés y otras Lenguas Extranjeras',
        profesorId: new mongoose.Types.ObjectId(),
        profesorNombre: 'Profesor de Ejemplo',
        alumnos: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        alumnosInfo: [
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 1', idU: '12345', cedula: '12345' },
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 2', idU: '67890', cedula: '67890' }
        ],
        periodo: 'Primer Periodo 2025',
        periodoId: 'P2025-1',
        anio: '1 año',
        seccion: 'A',
        turno: 'Mañana',
        creadoPor: '20202020',
        tipoCreador: 'control',
        idAAS: `AAS${Date.now()}-1`
      },
      {
        materiaId: new mongoose.Types.ObjectId(),
        materiaNombre: 'Matemáticas',
        profesorId: new mongoose.Types.ObjectId(),
        profesorNombre: 'Profesor de Ejemplo',
        alumnos: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        alumnosInfo: [
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 1', idU: '12345', cedula: '12345' },
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 2', idU: '67890', cedula: '67890' }
        ],
        periodo: 'Primer Periodo 2025',
        periodoId: 'P2025-1',
        anio: '1 año',
        seccion: 'A',
        turno: 'Mañana',
        creadoPor: '20202020',
        tipoCreador: 'control',
        idAAS: `AAS${Date.now()}-2`
      },
      {
        materiaId: new mongoose.Types.ObjectId(),
        materiaNombre: 'Educación Física',
        profesorId: new mongoose.Types.ObjectId(),
        profesorNombre: 'Profesor de Ejemplo',
        alumnos: [new mongoose.Types.ObjectId(), new mongoose.Types.ObjectId()],
        alumnosInfo: [
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 1', idU: '12345', cedula: '12345' },
          { id: new mongoose.Types.ObjectId(), nombre: 'Alumno 2', idU: '67890', cedula: '67890' }
        ],
        periodo: 'Primer Periodo 2025',
        periodoId: 'P2025-1',
        anio: '1 año',
        seccion: 'A',
        turno: 'Mañana',
        creadoPor: '20202020',
        tipoCreador: 'control',
        idAAS: `AAS${Date.now()}-3`
      }
    ];
    
    console.log(`Intentando guardar ${asignaciones.length} asignaciones...`);
    
    // Guardar cada asignación
    for (const datos of asignaciones) {
      const nuevaAsignacion = new Asignacion(datos);
      const resultado = await nuevaAsignacion.save();
      console.log(`Asignación "${datos.materiaNombre}" guardada con ID: ${resultado._id}`);
    }
    
    console.log('Todas las asignaciones guardadas exitosamente');
    
    // Verificar que se guardaron
    const asignacionesGuardadas = await Asignacion.find({});
    console.log(`Total de asignaciones en la base de datos: ${asignacionesGuardadas.length}`);
    
    // Guardar un registro de las asignaciones
    fs.writeFileSync('asignaciones-guardadas.json', JSON.stringify(asignacionesGuardadas, null, 2));
    console.log('Se ha creado un archivo asignaciones-guardadas.json con los detalles');
    
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('Conexión cerrada');
    
  } catch (error) {
    console.error('Error al guardar asignaciones:', error);
  } finally {
    // Asegurar que la conexión se cierre
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('Conexión cerrada');
    }
  }
}

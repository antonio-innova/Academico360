import mongoose from 'mongoose';

// Desactivar el modo estricto de consulta para mayor compatibilidad
mongoose.set('strictQuery', false);

// Obtener la URL de la base de datos desde variables de entorno
const getMongoDBUri = () => {
  // En desarrollo, usar la URL por defecto si no hay variable de entorno
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI debe estar definida en producción');
    }
    return process.env.MONGODB_URI;
  }
  
  // En desarrollo, usar la URL por defecto
  return process.env.MONGODB_URI ;
};

const url = getMongoDBUri();

console.log('Configurando conexión a MongoDB:', url);

let connection = null;

// Función para conectar a MongoDB
export const connectDB = async () => {
  try {
    // Si ya está conectado o conectando, reutilizar la conexión
    if (mongoose.connection.readyState === 1) {
      console.log('Reutilizando conexión existente a MongoDB (conectado)');
      return mongoose.connection;
    }
    if (mongoose.connection.readyState === 2) {
      console.log('Reutilizando conexión existente a MongoDB (conectando)');
      return mongoose.connection;
    }

    console.log('Intentando conectar a MongoDB:', url);
    const mongooseOptions = {
      serverSelectionTimeoutMS: 10000
    };
    // Permitir configurar TLS laxo si el servidor usa certificados no estándar (solo si se habilita por env)
    if (process.env.MONGODB_TLS_INSECURE === '1' || process.env.MONGODB_ALLOW_INVALID_CERTS === '1') {
      mongooseOptions.tls = true;
      mongooseOptions.tlsAllowInvalidCertificates = true;
    }
    connection = await mongoose.connect(url, mongooseOptions);
    console.log('Mongoose conectado a MongoDB');
    console.log('Conectado exitosamente a MongoDB - DBAcademico');
    console.log('Estado actual de la conexión:', mongoose.connection.readyState, 
                '(1=conectado, 2=conectando, 3=desconectando, 0=desconectado)');

    mongoose.connection.on('disconnected', () => {
      console.log('Desconectado de MongoDB, intentando reconectar...');
      connection = null;
    });

    return connection;
  } catch (error) {
    console.error('Error al conectar a MongoDB:', error);
    throw error;
  }
};

// En entornos serverless, evitar conectar en caliente múltiples veces; iniciar bajo demanda

const db = mongoose.connection;

// Manejar eventos de conexión
db.on('connected', () => {
  console.log('Mongoose conectado a MongoDB');
  connection = true;
});

db.on('error', (err) => {
  console.error('Error de MongoDB:', err);
  connection = false;
  // Intentar reconectar automáticamente
  console.log('Intentando reconectar después de error...');
  setTimeout(connectDB, 3000);
});

db.on('disconnected', () => {
  console.log('Desconectado de MongoDB, intentando reconectar...');
  connection = false;
  setTimeout(connectDB, 3000);
});

// Función mejorada para verificar la conexión
const checkConnection = () => {
  // Verificar el estado real de la conexión de mongoose
  const readyState = mongoose.connection.readyState;
  console.log(`Verificando estado de conexión: ${readyState} (1=conectado, 2=conectando, 3=desconectando, 0=desconectado)`);
  
  // 1 = conectado
  connection = readyState === 1;
  return connection;
};

// Exportar tanto la conexión como el estado y la función de conexión
export default {
  connection: db,
  isConnected: checkConnection,
  connectDB
};

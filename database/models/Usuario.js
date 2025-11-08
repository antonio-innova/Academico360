const mongoose = require('mongoose');
let bcrypt;

// Intentar importar bcryptjs, pero no fallar si no está disponible
try {
  bcrypt = require('bcryptjs');
} catch (err) {
  console.warn('bcryptjs no está instalado. Las contraseñas no serán hasheadas.');
  console.warn('Por favor instale bcryptjs con: npm install bcryptjs');
}

// Definir el esquema
const UsuarioSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['alumno', 'docente', 'control'],
    default: 'alumno'
  },
  idU: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  idA: {
    type: String,
    required: false,
    trim: true
  },
  idI: {
    type: String,
    required: false,
    trim: true
  },
  institucion: {
    type: String,
    enum: ['iutcm', 'acacias'],
    required: false,
    trim: true
  },
  estudianteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudiante',
    required: false
  }
});

// Método para comparar contraseñas
UsuarioSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // Si bcrypt está disponible, usar comparación segura
    if (bcrypt) {
      return await bcrypt.compare(candidatePassword, this.password);
    } else {
      // Fallback a comparación directa si bcrypt no está disponible
      console.warn('Usando comparación de contraseñas insegura. Por favor instale bcryptjs.');
      return this.password === candidatePassword;
    }
  } catch (error) {
    console.error('Error al comparar contraseñas:', error);
    // Fallback a comparación directa en caso de error
    return this.password === candidatePassword;
  }
};

// Middleware para hashear la contraseña antes de guardar
UsuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Solo hashear si bcrypt está disponible
    if (bcrypt) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } else {
      console.warn('Guardando contraseña sin hashear. Por favor instale bcryptjs.');
      // La contraseña se guarda sin hashear si bcrypt no está disponible
    }
    next();
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    // Continuar sin hashear en caso de error
    next();
  }
});

/**
 * Patrón singleton para evitar el error "OverwriteModelError: Cannot overwrite `Usuario` model once compiled"
 * Este patrón verifica si el modelo ya existe en mongoose.models antes de crearlo nuevamente
 */
// Intentar diferentes nombres de colección para mayor compatibilidad
let Usuario;
try {
  // Primero intentar con el nombre de colección 'Usuarios' (plural, primera letra mayúscula)
  Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema, 'Usuarios');
} catch (error) {
  console.log('Error al usar colección "Usuarios", intentando alternativas:', error.message);
  try {
    // Intentar con 'usuarios' (todo minúsculas)
    Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema, 'usuarios');
  } catch (error2) {
    console.log('Error al usar colección "usuarios", intentando sin especificar colección:', error2.message);
    // Finalmente, intentar sin especificar colección (MongoDB usará el nombre del modelo en plural)
    Usuario = mongoose.models.Usuario || mongoose.model('Usuario', UsuarioSchema);
  }
}

module.exports = Usuario;

# 📚 Documentación Completa - Académico 360

## 📋 Tabla de Contenidos
- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Modelos de Datos](#modelos-de-datos)
- [Sistema de Autenticación](#sistema-de-autenticación)
- [Rutas API](#rutas-api)
- [Configuración y Despliegue](#configuración-y-despliegue)
- [Scripts Disponibles](#scripts-disponibles)

---

## 🎯 Resumen Ejecutivo

**Académico360** es un sistema de gestión académica integral desarrollado con tecnologías modernas que permite administrar estudiantes, profesores, aulas, calificaciones, asistencia y reportes académicos. El sistema está diseñado para instituciones educativas y ofrece interfaces diferenciadas según el tipo de usuario (estudiante, docente,control de estudios).

### Características Principales
- ✅ Gestión completa de estudiantes y profesores
- ✅ Sistema de calificaciones con 4 momentos de evaluación
- ✅ Generación de certificados y reportes en PDF
- ✅ Control de asistencia
- ✅ Asignación de materias y aulas
- ✅ Sistema multi-institución (Acacias e IUTCM)
- ✅ Autenticación basada en roles
- ✅ Generación de carnets estudiantiles con QR
- ✅ Exportación de datos a Excel

---

## 🏗️ Arquitectura del Sistema

### Patrón de Diseño
El sistema utiliza la arquitectura **Next.js App Router** con el patrón **MVC (Model-View-Controller)**:

```
┌─────────────────┐
│   Frontend      │  React 19 + Next.js 15 (App Router)
│   (Client)      │  - Componentes React
│                 │  - Tailwind CSS
└────────┬────────┘
         │
         ├── API Routes (Server-Side)
         │   
┌────────▼────────┐
│   Backend       │  Next.js API Routes
│   (Server)      │  - Lógica de negocio
│                 │  - Validaciones
└────────┬────────┘
         │
┌────────▼────────┐
│   Database      │  MongoDB + Mongoose
│   (Data Layer)  │  - Modelos
│                 │  - Esquemas
└─────────────────┘
```

### Flujo de Datos
1. **Usuario** → Interactúa con la interfaz (React)
2. **Frontend** → Envía petición a API Route
3. **API Route** → Conecta a MongoDB usando Mongoose
4. **MongoDB** → Retorna datos
5. **API Route** → Procesa y envía respuesta
6. **Frontend** → Renderiza la información

---

## 💻 Tecnologías Utilizadas

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Next.js | 15.5.7 | Framework React con SSR y App Router |
| React | 19.0.0 | Librería de UI |
| React DOM | 19.0.0 | Renderizado DOM |
| Tailwind CSS | 4.0 | Framework CSS utility-first |
| Canvas Confetti | 1.9.3 | Animaciones de celebración |
| React Toastify | 11.0.5 | Notificaciones toast |
| React to Print | 3.1.0 | Impresión de documentos |

### Backend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| Node.js | - | Runtime de JavaScript |
| Mongoose | 8.14.0 | ODM para MongoDB |
| bcryptjs | 3.0.2 | Encriptación de contraseñas |

### Generación de Documentos
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| jsPDF | 3.0.1 | Generación de PDFs |
| jsPDF-AutoTable | 5.0.2 | Tablas en PDF |
| pdf-lib | 1.17.1 | Manipulación avanzada de PDFs |
| ExcelJS | 4.4.0 | Generación de archivos Excel |
| XLSX | 0.18.5 | Lectura/escritura de Excel |
| QRCode | 1.5.4 | Generación de códigos QR |
| Puppeteer | 24.26.0 | Automatización de navegador |

### Base de Datos
| Tecnología | Tipo | Propósito |
|-----------|------|-----------|
| MongoDB | NoSQL | Base de datos principal |
| MongoDB Atlas | Cloud | Hosting de base de datos |

---

## 📁 Estructura del Proyecto

```
Academico360Mongo/
│
├── 📂 app/                          # Directorio principal de Next.js App Router
│   ├── 📂 api/                      # Rutas API (Backend)
│   │   ├── 📂 auth/                 # Autenticación
│   │   ├── 📂 alumnos/              # Gestión de alumnos
│   │   ├── 📂 estudiantes/          # CRUD estudiantes
│   │   ├── 📂 profesores/           # CRUD profesores
│   │   ├── 📂 aulas/                # Gestión de aulas/grupos
│   │   ├── 📂 materias/             # Gestión de materias
│   │   ├── 📂 calificaciones/       # Sistema de calificaciones
│   │   ├── 📂 asignaciones/         # Asignación prof-materia-aula
│   │   ├── 📂 asistencia/           # Control de asistencia
│   │   ├── 📂 reportes/             # Generación de reportes
│   │   ├── 📂 certificados-evaluacion/ # Certificados
│   │   ├── 📂 notascertificadas/    # Notas certificadas
│   │   ├── 📂 carnet/               # Carnets estudiantiles
│   │   ├── 📂 planteles/            # Gestión de planteles
│   │   ├── 📂 periodos/             # Períodos académicos
│   │   └── 📂 registro/             # Registro de usuarios
│   │
│   ├── 📂 components/               # Componentes React reutilizables
│   ├── 📂 sidebar/                  # Dashboard administrativo
│   ├── 📂 alumnos/                  # Interfaz para estudiantes
│   ├── 📂 calificaciones/           # Interfaz de calificaciones
│   ├── 📂 reportes/                 # Interfaz de reportes
│   ├── 📂 representantes/           # Gestión de representantes
│   ├── 📂 acceso-denegado/          # Página acceso denegado
│   ├── 📂 hooks/                    # React hooks personalizados
│   ├── 📂 utils/                    # Utilidades frontend
│   ├── 📂 styles/                   # Estilos adicionales
│   │
│   ├── 📄 page.js                   # Página de login/registro
│   ├── 📄 layout.js                 # Layout principal
│   ├── 📄 globals.css               # Estilos globales
│   └── 📄 favicon.ico               # Icono del sitio
│
├── 📂 database/                     # Configuración de base de datos
│   ├── 📂 models/                   # Modelos de Mongoose
│   │   ├── 📄 Usuario.js            # Modelo de usuario
│   │   ├── 📄 Estudiante.js         # Modelo de estudiante
│   │   ├── 📄 Profesor.js           # Modelo de profesor
│   │   ├── 📄 Aula.js               # Modelo de aula/grupo
│   │   ├── 📄 Materia.js            # Modelo de materia
│   │   ├── 📄 Asignacion.js         # Asignaciones
│   │   ├── 📄 NotaCertificada.js    # Notas certificadas
│   │   ├── 📄 CertificadoEvaluacion.js # Certificados
│   │   ├── 📄 ResumenFinal.js       # Resúmenes finales
│   │   ├── 📄 Director.js           # Directores
│   │   └── 📄 Plantel.js            # Planteles
│   │
│   └── 📄 db.js                     # Conexión a MongoDB
│
├── 📂 scripts/                      # Scripts de utilidad
│   ├── 📄 verificar-env.js          # Verificar variables de entorno
│   ├── 📄 actualizarEstadoMongo.js  # Actualizar estados en MongoDB
│   ├── 📄 fix-asignaciones.js       # Corregir asignaciones
│   └── ...
│
├── 📂 public/                       # Archivos estáticos
│   └── 📂 [assets]                  # Imágenes, logos, etc.
│
├── 📂 utils/                        # Utilidades globales
│
├── 📄 middleware.js                 # Middleware de Next.js (Autenticación)
├── 📄 next.config.mjs               # Configuración de Next.js
├── 📄 tailwind.config.js            # Configuración de Tailwind
├── 📄 postcss.config.mjs            # Configuración de PostCSS
├── 📄 package.json                  # Dependencias del proyecto
├── 📄 .env                          # Variables de entorno (NO SUBIR A GIT)
├── 📄 .env.example                  # Ejemplo de variables de entorno
├── 📄 .gitignore                    # Archivos ignorados por Git
│
└── 📄 README.md                     # Documentación básica
```

---

## 🗄️ Configuración de Base de Datos

### Conexión MongoDB

El archivo [database/db.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/db.js) gestiona la conexión a MongoDB:

**Características:**
- ✅ Conexión reutilizable (patrón singleton)
- ✅ Reconexión automática en caso de desconexión
- ✅ Manejo de errores robusto
- ✅ Soporte para certificados TLS personalizados
- ✅ Timeout de 10 segundos para selección de servidor

**Configuración de Variables de Entorno:**
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/DBAcademico?retryWrites=true&w=majority
MONGODB_DATABASE=DBAcademico
NODE_ENV=development
PORT=3000
```

**Función Principal:**
```javascript
export const connectDB = async () => {
  // Reutiliza conexión existente si está disponible
  // Maneja reconexiones automáticas
  // Timeout configurable
}
```

---

## 📊 Modelos de Datos

### 1. Usuario ([Usuario.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Usuario.js))

**Propósito:** Gestión de autenticación y autorización de usuarios del sistema.

**Esquema:**
```javascript
{
  tipo: String,              // 'alumno', 'docente', 'control'
  idU: String,               // Identificador único (cédula)
  password: String,          // Contraseña hasheada con bcrypt
  nombre: String,
  apellido: String,
  fechaRegistro: Date,
  idA: String,               // ID para Acacias
  idI: String,               // ID para IUTCM
  institucion: String,       // 'iutcm' o 'acacias'
  estudianteId: ObjectId     // Ref a Estudiante (si es alumno)
}
```

**Características:**
- Encriptación automática de contraseñas con bcrypt (salt: 10)
- Método `comparePassword()` para validación
- Soporte multi-institución

---

### 2. Estudiante ([Estudiante.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Estudiante.js))

**Propósito:** Almacena información completa de los estudiantes.

**Esquema:**
```javascript
{
  idU: String,
  nombre: String,
  apellido: String,
  fechaNacimiento: Date,
  lugarNacimiento: String,
  sexo: String,              // 'M', 'F', 'Otro'
  edad: Number,
  esMenorDeEdad: Boolean,
  grupo: String,             // Agrupación de estudiantes
  ef: String,                // Estado físico
  anio: String,              // Año escolar (1-5)
  seccion: String,           // Sección (A, B, C, etc.)
  
  // IDs institucionales
  idAA: String,              // ID Acacias
  idIA: String,              // ID IUTCM
  
  // Metadatos
  creadoPor: String,
  tipoCreador: String,       // 'control', 'docente', 'admin'
  fechaCreacion: Date,
  usuarioId: ObjectId,       // Ref a Usuario
  registrado: Boolean,
  estado: Number,            // 0: inactivo, 1: activo
  
  // Representante
  representante: {
    nombre: String,
    apellido: String,
    cedula: String,
    correo: String,
    telefono: String,
    parentesco: String       // 'PAPA', 'MAMA', etc.
  }
}
```

---

### 3. Profesor ([Profesor.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Profesor.js))

**Propósito:** Gestión de información del personal docente.

**Esquema:**
```javascript
{
  idU: String,
  nombre: String,
  apellido: String,
  email: String,
  telefono: String,
  especialidad: String,
  idAP: String,              // ID Acacias (Profesor)
  creadoPor: String,
  tipoCreador: String,       // 'control', 'admin'
  fechaIngreso: Date,
  fechaCreacion: Date,
  estado: Number             // 0: bloqueado, 1: activo
}
```

**Características:**
- Getters/Setters para asegurar que `estado` siempre sea numérico
- Valor por defecto: activo (1)

---

### 4. Aula ([Aula.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Aula.js))

**Propósito:** Representa grupos/secciones de estudiantes con sus asignaciones de materias y profesores.

**Esquema (simplificado):**
```javascript
{
  nombre: String,
  anio: String,              // '1', '2', '3', '4', '5'
  seccion: String,           // 'A', 'B', 'C', etc.
  turno: String,             // 'Mañana', 'Tarde', 'Noche'
  esPendiente: Boolean,      // Para notas pendientes
  periodo: String,           // Período académico
  
  // Lista de alumnos en el aula
  alumnos: [{
    nombre: String,
    apellido: String,
    _id: String,
    cedula: String,
    idU: String,
    materiasAsignadas: [String]  // IDs de materias que cursa
  }],
  
  // Asignaciones de profesores a materias
  asignaciones: [{
    materia: {
      id: String,
      nombre: String,
      codigo: String
    },
    profesor: {
      nombre: String,
      apellido: String
    },
    profesorId: ObjectId,
    profesorNombre: String,
    
    // Control de bloqueo de momentos
    momentosBloqueados: {
      1: Boolean,
      2: Boolean,
      3: Boolean,
      4: Boolean
    },
    
    // Puntos extras por momento
    puntosPorMomento: {
      momento1: [{
        alumnoId: String,
        puntos: Number,        // 0-2
        fechaActualizacion: Date
      }],
      momento2: [...],
      momento3: [...],
      momento4: [...]
    },
    
    // Actividades de evaluación
    actividades: [{
      nombre: String,
      descripcion: String,
      fecha: Date,
      porcentaje: Number,    // 0-100
      momento: Number,       // 1, 2, 3, 4
      
      // Calificaciones de estudiantes
      calificaciones: [{
        alumnoId: String,
        nota: Number,        // 1-20
        notaAlfabetica: String,  // 'A' a 'F'
        tipoCalificacion: String, // 'numerica', 'alfabetica', 'np', 'inasistente'
        observaciones: String,
        evidencia: String,
        fechaCreacion: Date
      }]
    }]
  }],
  
  estado: Number,            // 0: inactivo, 1: activo
  fechaCreacion: Date,
  creadoPor: String,
  tipoCreador: String
}
```

**Características Destacadas:**
- Sistema de **4 momentos** de evaluación
- Control de **bloqueo por momento** (impide subir notas)
- **Puntos extras** por momento (0-2 puntos)
- Soporte para **calificaciones alfanuméricas**
- Manejo de **notas pendientes (NP)** e **inasistencias**

---

### 5. Materia ([Materia.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Materia.js))

**Propósito:** Catálogo de materias/asignaturas.

**Esquema:**
```javascript
{
  codigo: String,
  nombre: String,
  descripcion: String,
  profesor: ObjectId,        // Ref a Profesor
  idAM: String,              // ID Acacias (Materia)
  creadoPor: String,
  tipoCreador: String,
  fechaCreacion: Date,
  
  // Actividades (similar a Aula.asignaciones.actividades)
  actividades: [...]
}
```

---

### 6. Asignacion ([Asignacion.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/Asignacion.js))

**Propósito:** Relaciona profesores con materias y aulas (tabla pivot).

---

### 7. NotaCertificada ([NotaCertificada.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/NotaCertificada.js))

**Propósito:** Almacena notas certificadas de estudiantes (no modificables).

---

### 8. CertificadoEvaluacion ([CertificadoEvaluacion.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/CertificadoEvaluacion.js))

**Propósito:** Gestiona certificados de evaluación emitidos.

---

### 9. ResumenFinal ([ResumenFinal.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/database/models/ResumenFinal.js))

**Propósito:** Almacena resúmenes finales de períodos académicos.

---

### 10. Director

**Propósito:** Información de directores de planteles.

---

### 11. Plantel

**Propósito:** Información de planteles/sedes educativas.

---

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant Usuario
    participant Frontend
    participant API_Auth
    participant MongoDB
    participant Middleware
    
    Usuario->>Frontend: Ingresa credenciales
    Frontend->>API_Auth: POST /api/auth
    API_Auth->>MongoDB: Buscar usuario por idU y tipo
    MongoDB-->>API_Auth: Usuario encontrado
    API_Auth->>API_Auth: comparePassword()
    alt Contraseña correcta
        API_Auth->>API_Auth: Verificar estado (si es profesor)
        API_Auth-->>Frontend: {success: true, redirectPath}
        Frontend->>Frontend: Guardar en sessionStorage/localStorage
        Frontend->>Usuario: Redirigir según tipo
    else Contraseña incorrecta
        API_Auth-->>Frontend: {success: false, message}
        Frontend->>Usuario: Mostrar error
    end
```

### Tipos de Usuario y Rutas

| Tipo Usuario | Ruta de Acceso | Permisos |
|-------------|----------------|----------|
| `alumno` | `/alumnos` | Ver calificaciones, asistencia, perfil |
| `docente` | `/sidebar` | Gestionar calificaciones, asistencia de sus aulas |
| `control` | `/sidebar` | Acceso completo: CRUD estudiantes, profesores, aulas, reportes |

### Middleware de Protección

El archivo [middleware.js](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/middleware.js) protege rutas según el tipo de usuario:

```javascript
export const config = {
  matcher: [
    '/sidebar/:path*',   // Solo para docente y control
    '/alumno/:path*',    // Solo para alumno
  ],
};
```

**Verificaciones:**
1. Existe cookie de `userId` y `userType`
2. El usuario tiene permiso para acceder a la ruta
3. Redirección automática si no cumple requisitos

### Almacenamiento de Sesión

Se utiliza **sessionStorage** y **localStorage**:

```javascript
// Datos almacenados
sessionStorage.setItem('userId', idU);
sessionStorage.setItem('userType', tipo);
sessionStorage.setItem('userName', nombre);
sessionStorage.setItem('userLastName', apellido);
sessionStorage.setItem('idA', idA);           // Solo si es Acacias
sessionStorage.setItem('idI', idI);           // Solo si es IUTCM
sessionStorage.setItem('estadoProfesor', 1);  // Solo para docentes
```

---

## 🛣️ Rutas API

El sistema cuenta con **29 endpoints API** organizados por funcionalidad:

### Autenticación y Registro

#### `POST /api/auth`
**Descripción:** Autentica usuarios en el sistema.

**Body:**
```json
{
  "user": "12345678",           // idU del usuario
  "pass": "contraseña",
  "login-type": "docente"       // 'alumno', 'docente', 'control'
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "data": [{
    "tipo": "docente",
    "idU": "12345678",
    "nombre": "Juan",
    "apellido": "Pérez",
    "idA": "...",
    "idI": "..."
  }],
  "redirectPath": "/sidebar",
  "estadoProfesor": 1
}
```

---

#### `POST /api/registro`
**Descripción:** Registra nuevos usuarios.

**Body:**
```json
{
  "login-type": "alumno",
  "idregistro": "12345678",
  "idnombre": "María",
  "idapellido": "González",
  "passregistro": "contraseña",
  "passconfirm": "contraseña",
  "institucion": "acacias",      // 'acacias' o 'iutcm'
  "estudianteId": "ObjectId..."  // Solo para alumnos
}
```

---

### Gestión de Estudiantes

#### `GET /api/estudiantes`
Obtiene lista de estudiantes filtrada por institución.

#### `POST /api/estudiantes`
Crea nuevo estudiante.

#### `PUT /api/estudiantes`
Actualiza información de estudiante.

#### `DELETE /api/estudiantes`
Elimina estudiante.

#### `GET /api/estudiantes/verificar?idU=12345678`
Verifica si existe un estudiante con esa cédula.

---

### Gestión de Profesores

#### `GET /api/profesores`
Lista todos los profesores.

#### `POST /api/profesores`
Crea nuevo profesor.

#### `PUT /api/profesores`
Actualiza información de profesor.

#### `DELETE /api/profesores`
Elimina profesor.

#### `PUT /api/profesores/cambiar-estado`
Activa/desactiva un profesor (control de acceso).

---

### Gestión de Aulas

#### `GET /api/aulas`
Lista aulas filtradas por institución.

#### `POST /api/aulas`
Crea nueva aula/grupo.

#### `PUT /api/aulas`
Actualiza configuración de aula.

#### `DELETE /api/aulas`
Elimina aula.

#### `POST /api/aulas/agregar-estudiante`
Añade estudiante a un aula.

#### `POST /api/aulas/eliminar-estudiante`
Remueve estudiante de un aula.

#### `GET /api/aulas/detalle?id=[aulaId]&profesorId=[profesorId]`
Obtiene detalles completos de un aula (incluye calificaciones).

#### `POST /api/aulas/bloquear-momento`
Bloquea un momento para evitar que se suban notas.

#### `PUT /api/aulas/puntos-extras`
Actualiza puntos extras de un estudiante en un momento específico.

---

### Asignaciones (Profesor-Materia-Aula)

#### `POST /api/asignaciones`
Asigna profesor a materia en un aula.

#### `GET /api/asignaciones`
Lista asignaciones.

#### `DELETE /api/asignaciones`
Elimina asignación.

#### `POST /api/asignaciones/guardar-asignaciones`
Guarda múltiples asignaciones.

#### `GET /api/asignaciones/verificar-asignaciones`
Verifica asignaciones de un profesor.

---

### Calificaciones

#### `POST /api/calificaciones`
Registra calificaciones de actividades.

#### `GET /api/calificaciones`
Obtiene calificaciones de un estudiante.

#### `PUT /api/calificaciones`
Actualiza calificaciones.

#### `POST /api/calificaciones/actividad`
Crea nueva actividad de evaluación.

---

### Reportes

#### `POST /api/reportes/planilla-momento`
Genera planilla de un momento específico (PDF).

#### `POST /api/reportes/certificado`
Genera certificado de notas (PDF).

#### `GET /api/reportes/listado-estudiantes`
Exporta listado de estudiantes (Excel).

#### `POST /api/reportes/boletin`
Genera boletín de calificaciones.

#### `POST /api/reportes/resumen-final`
Genera resumen final del período.

---

### Carnets

#### `POST /api/carnet`
Genera carnet estudiantil con código QR (PDF).

---

### Otros Endpoints

#### `GET /api/materias`
Lista materias disponibles.

#### `POST /api/materias`
Crea nueva materia.

#### `GET /api/periodos`
Obtiene períodos académicos.

#### `GET /api/planteles`
Lista planteles/sedes.

---

## ⚙️ Configuración y Despliegue

### Requisitos Previos
- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en MongoDB Atlas (o servidor MongoDB local)

### Instalación

1. **Clonar el repositorio:**
```bash
git clone [URL_DEL_REPOSITORIO]
cd Academico360Mongo
```

2. **Instalar dependencias:**
```bash
npm install
```

3. **Configurar variables de entorno:**
```bash
cp .env.example .env
```

Editar `.env` con tus valores:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/DBAcademico?retryWrites=true&w=majority
MONGODB_DATABASE=DBAcademico
NODE_ENV=development
PORT=3009
```

4. **Verificar configuración:**
```bash
node scripts/verificar-env.js
```

5. **Ejecutar en desarrollo:**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3009`

---

### Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con Turbopack en puerto 3009 |
| `npm run build` | Construye la aplicación para producción |
| `npm start` | Inicia servidor de producción en puerto 3009 |
| `npm run lint` | Ejecuta linter de código |

---

### Scripts de Utilidad

| Script | Ruta | Descripción |
|--------|------|-------------|
| verificar-env.js | `/scripts` | Verifica variables de entorno |
| actualizarEstadoMongo.js | `/scripts` | Actualiza estados en MongoDB |
| fix-asignaciones.js | `/scripts` | Corrige asignaciones erróneas |
| actualizarEstadoDirecto.js | `/scripts` | Actualización directa de estados |
| actualizarEstadoProfesores.js | `/scripts` | Actualiza estado de profesores |

**Ejecución:**
```bash
node scripts/[nombre-script].js
```

---

### Despliegue en Producción

#### Opción 1: Vercel (Recomendado para Next.js)

1. **Instalar Vercel CLI:**
```bash
npm i -g vercel
```

2. **Desplegar:**
```bash
vercel
```

3. **Configurar variables de entorno en Vercel Dashboard**

---

#### Opción 2: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3009

CMD ["npm", "start"]
```

**Construir y ejecutar:**
```bash
docker build -t academico360 .
docker run -p 3009:3009 academico360
```

---

## 📈 Sistema de Calificaciones

### Estructura de Momentos

El sistema divide el período académico en **4 momentos de evaluación**:

| Momento | Peso | Descripción |
|---------|------|-------------|
| Momento 1 | 25% | Primer corte evaluativo |
| Momento 2 | 25% | Segundo corte evaluativo |
| Momento 3 | 25% | Tercer corte evaluativo |
| Momento 4 | 25% | Cuarto corte evaluativo |

### Tipos de Calificaciones

1. **Numérica:** Escala 1-20 puntos
2. **Alfabética:** Escalas A, B, C, D, E, F
3. **NP (Nota Pendiente):** El estudiante debe presentar evaluación posteriormente
4. **Inasistente:** El estudiante no asistió a la evaluación

### Cálculo de Notas Finales

```javascript
// Por cada momento:
NotaMomento = Σ(Actividad.nota * Actividad.porcentaje/100) + PuntosExtras

// Nota Final del Período:
NotaFinal = (Momento1 + Momento2 + Momento3 + Momento4) / 4
```

### Puntos Extras

Cada profesor puede asignar hasta **2 puntos extras** por momento a cada estudiante.

---

## 🎨 Interfaz de Usuario

### Para Estudiantes (`/alumnos`)
- Dashboard con información personal
- Visualización de calificaciones por materia y momento
- Historial de asistencia
- Descarga de certificados

### Para Docentes (`/sidebar`)
- Panel de control de aulas asignadas
- Gestión de calificaciones por actividad
- Control de asistencia
- Generación de planillas y reportes
- Asignación de puntos extras

### Para Control de Estudios (`/sidebar`)
- **Todas las funciones de docente +**
- CRUD completo de estudiantes
- CRUD completo de profesores
- Creación y gestión de aulas
- Asignación de materias a profesores
- Generación de reportes institucionales
- Control de estados (activar/desactivar usuarios)
- Gestión de períodos académicos

---

## 🔧 Características Técnicas Avanzadas

### Optimizaciones de Rendimiento

El proyecto incluye documentación sobre optimizaciones:
- [OPTIMIZACIONES_RENDIMIENTO.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/OPTIMIZACIONES_RENDIMIENTO.md)
- [OPTIMIZACIONES_RENDIMIENTO_AVANZADAS.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/OPTIMIZACIONES_RENDIMIENTO_AVANZADAS.md)
- [OPTIMIZACIONES_RENDIMIENTO_FORMULARIOS.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/OPTIMIZACIONES_RENDIMIENTO_FORMULARIOS.md)

### Generación de PDF

Utiliza múltiples librerías según el caso de uso:
- **jsPDF:** PDFs simples (certificados, carnets)
- **jsPDF-AutoTable:** Tablas en PDFs (planillas, reportes)
- **pdf-lib:** Manipulación avanzada (firma digital, metadatos)
- **Puppeteer:** Generación desde HTML (layouts complejos)

### Código QR en Carnets

Los carnets estudiantiles incluyen código QR con:
```json
{
  "nombre": "Juan Pérez",
  "cedula": "12345678",
  "anio": "5",
  "seccion": "A",
  "periodo": "2024-2025"
}
```

---

## 🚨 Manejo de Errores

### En Frontend
```javascript
try {
  const response = await fetch('/api/endpoint', {...});
  if (!response.ok) {
    throw new Error('Error en la petición');
  }
  const data = await response.json();
} catch (error) {
  console.error('Error:', error);
  // Mostrar mensaje al usuario con React Toastify
}
```

### En Backend
```javascript
export async function POST(request) {
  try {
    await connectDB();
    // Lógica del endpoint
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🔒 Seguridad

### Buenas Prácticas Implementadas

✅ Contraseñas hasheadas con bcrypt (salt rounds: 10)  
✅ Validación de tipos de usuario en middleware  
✅ Verificación de estado de profesor antes de permitir acceso  
✅ Cookies HTTP-only para sesiones  
✅ Validación de datos en frontend y backend  
✅ Sanitización de inputs para prevenir injection  
✅ `.env` en `.gitignore` (no se sube al repositorio)

### Recomendaciones Adicionales

⚠️ Implementar rate limiting en API routes  
⚠️ Agregar CSRF tokens para formularios críticos  
⚠️ Configurar CORS apropiadamente en producción  
⚠️ Usar HTTPS en producción (obligatorio)  
⚠️ Implementar logs de auditoría para acciones críticas  

---

## 📞 Soporte y Mantenimiento

### Logs del Sistema

Los logs se generan en consola con `console.log()` y `console.error()`. En producción, se recomienda:

1. Implementar servicio de logging (ej: Winston, Pino)
2. Centralizar logs (ej: LogRocket, Sentry)
3. Configurar alertas para errores críticos

### Monitoreo de Base de Datos

MongoDB Atlas provee:
- Métricas de rendimiento
- Alertas de uso de recursos
- Backups automáticos
- Logs de consultas lentas

---

## 🗺️ Hoja de Ruta (Roadmap)

### Mejoras Sugeridas

#### Corto Plazo
- [ ] Implementar sistema de notificaciones push
- [ ] Agregar chat entre profesores y estudiantes
- [ ] Módulo de tareas/asignaciones
- [ ] Calendario académico integrado

#### Mediano Plazo
- [ ] App móvil (React Native)
- [ ] Sistema de pagos integrado
- [ ] Dashboard analytics para directivos
- [ ] Integración con sistemas externos (LMS)

#### Largo Plazo
- [ ] IA para predicción de rendimiento estudiantil
- [ ] Sistema de recomendación personalizado
- [ ] Gamificación del aprendizaje
- [ ] Portal para representantes/padres

---

## 📚 Recursos Adicionales

### Documentación Interna

- [README.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/README.md) - Guía básica de inicio
- [CONFIGURACION_VARIABLES_ENTORNO.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/CONFIGURACION_VARIABLES_ENTORNO.md) - Configuración detallada de variables
- [ACTUALIZACION_FIRMA_DIGITAL_V2.md](file:///c:/Users/Usuario%203.0/Desktop/Repositorios%20-%20copia/Academico360Mongo/ACTUALIZACION_FIRMA_DIGITAL_V2.md) - Implementación de firma digital en documentos

### Enlaces Externos

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [MongoDB Manual](https://docs.mongodb.com/manual/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

## 🤝 Contribuciones

### Flujo de Trabajo Git

```bash
# Crear rama para nueva feature
git checkout -b feature/nueva-funcionalidad

# Hacer commits descriptivos
git commit -m "feat: agregar módulo de asistencia"

# Push a la rama
git push origin feature/nueva-funcionalidad

# Crear Pull Request en GitHub
```

### Convenciones de Código

- **JavaScript:** ESLint con configuración estándar de Next.js
- **Nombres de archivos:** camelCase para archivos JS, kebab-case para componentes
- **Componentes React:** PascalCase
- **Funciones:** camelCase
- **Constantes:** UPPER_SNAKE_CASE

---

## 📄 Licencia

Este proyecto es privado y de uso exclusivo para fines educativos de las instituciones autorizadas.

---

## ✨ Créditos

**Desarrollado para:**
- Instituto Universitario de Tecnología de Cabimas (IUTCM)
- Instituto Acacias

**Stack Tecnológico:**
Next.js 15 • React 19 • MongoDB • Mongoose • Tailwind CSS • Node.js

---

**Última actualización:** ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}

---

> 💡 **Nota:** Esta documentación fue generada mediante análisis exhaustivo del código fuente. Para información más específica sobre algún módulo, consulte el código directamente o contacte al equipo de desarrollo.

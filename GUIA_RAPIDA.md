# 🚀 Guía Rápida - Académico360

## ¿Qué es Académico360?

Sistema de gestión académica desarrollado con **Next.js 15** y **MongoDB** para administrar estudiantes, profesores, calificaciones y reportes educativos.

---

## 📋 Inicio Rápido

### 1. Instalación
```bash
npm install
cp .env.example .env
# Editar .env con tu URL de MongoDB
```

### 2. Verificar Configuración
```bash
node scripts/verificar-env.js
```

### 3. Ejecutar
```bash
npm run dev
```

Abrir: `http://localhost:3009`

---

## 🔑 Acceso al Sistema

### Tipos de Usuario

| Tipo | Ruta | Permisos |
|------|------|----------|
| **Alumno** | `/alumnos` | Ver calificaciones y asistencia |
| **Docente** | `/sidebar` | Gestionar notas de sus aulas |
| **Control** | `/sidebar` | Administración completa |

### Credenciales de Prueba

Las credenciales dependen de los usuarios creados en tu base de datos MongoDB. El `idU` es generalmente la cédula del usuario.

---

## 🗄️ Modelos Principales

```
Usuario ──────┐
              ├──> Estudiante
              └──> Profesor
                      │
                      │
Aula ────────────────┼──> Asignacion ──> Materia
  │                  │
  ├── Alumnos        │
  └── Asignaciones ──┘
        │
        └── Actividades
              └── Calificaciones
```

---

## 🛣️ Endpoints Más Usados

### Autenticación
```javascript
POST /api/auth              // Login
POST /api/registro          // Registro
```

### Estudiantes
```javascript
GET  /api/estudiantes       // Listar
POST /api/estudiantes       // Crear
PUT  /api/estudiantes       // Actualizar
```

### Aulas
```javascript
GET  /api/aulas             // Listar
GET  /api/aulas/detalle     // Ver detalles completos
POST /api/aulas             // Crear
```

### Calificaciones
```javascript
POST /api/calificaciones              // Subir notas
POST /api/calificaciones/actividad    // Crear actividad
GET  /api/calificaciones              // Ver notas
```

### Reportes
```javascript
POST /api/reportes/planilla-momento   // Planilla PDF
POST /api/reportes/certificado        // Certificado PDF
POST /api/carnet                      // Carnet con QR
```

---

## 🎯 Sistema de Calificaciones

### Estructura de Momentos

El año se divide en **4 momentos** de evaluación (25% cada uno):

```
Momento 1 (25%) ──┐
Momento 2 (25%) ──┼──> Nota Final = Promedio
Momento 3 (25%) ──┤
Momento 4 (25%) ──┘
```

### Por Cada Momento

```javascript
NotaMomento = Σ(Actividad × Porcentaje) + Puntos Extras (0-2)
```

### Tipos de Nota
- **Numérica:** 1-20
- **Alfabética:** A, B, C, D, E, F
- **NP:** Nota Pendiente
- **Inasistente**

---

## 📁 Estructura de Carpetas

```
Academico360Mongo/
├── app/
│   ├── api/              ← Rutas API (Backend)
│   │   ├── auth/
│   │   ├── estudiantes/
│   │   ├── profesores/
│   │   ├── aulas/
│   │   ├── calificaciones/
│   │   └── reportes/
│   │
│   ├── sidebar/          ← Dashboard admin/docente
│   ├── alumnos/          ← Dashboard estudiante
│   └── page.js           ← Login/Registro
│
├── database/
│   ├── models/           ← Modelos Mongoose (11)
│   └── db.js             ← Conexión MongoDB
│
├── scripts/              ← Scripts de utilidad
└── .env                  ← Configuración (NO subir a Git)
```

---

## 🔧 Variables de Entorno

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.net/DBAcademico
MONGODB_DATABASE=DBAcademico
NODE_ENV=development
PORT=3009
```

---

## 📦 Dependencias Clave

| Librería | Uso |
|----------|-----|
| `mongoose` | ORM MongoDB |
| `bcryptjs` | Encriptación |
| `jspdf` | Generación PDF |
| `exceljs` | Exportar Excel |
| `qrcode` | Códigos QR |
| `puppeteer` | PDFs avanzados |

---

## 🚨 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Verificar configuración
node scripts/verificar-env.js

# Linting
npm run lint
```

---

## 🔒 Seguridad

✅ Contraseñas con bcrypt (salt: 10)  
✅ Middleware de autenticación  
✅ Verificación de roles  
✅ `.env` en `.gitignore`

---

## 📞 Problemas Comunes

### Error de Conexión a MongoDB
```bash
# Verificar URL en .env
# Verificar que MongoDB Atlas permite tu IP
# Verificar nombre de base de datos
```

### Usuario no puede iniciar sesión
```bash
# Verificar que existe en la colección Usuarios
# Verificar estado del profesor (debe ser 1, no 0)
# Verificar que la contraseña coincide
```

### Notas no se guardan
```bash
# Verificar que el momento no esté bloqueado
# Verificar permisos del profesor
# Ver logs en consola del navegador
```

---

## 📚 Documentación Completa

Para información detallada, consulta:
- **[DOCUMENTACION_COMPLETA.md](./DOCUMENTACION_COMPLETA.md)** - Documentación exhaustiva
- **[README.md](./README.md)** - Guía básica
- **[CONFIGURACION_VARIABLES_ENTORNO.md](./CONFIGURACION_VARIABLES_ENTORNO.md)** - Variables de entorno
- **[OPTIMIZACIONES_RENDIMIENTO.md](./OPTIMIZACIONES_RENDIMIENTO.md)** - Optimizaciones

---

## 💡 Tips

1. **Siempre verifica tu `.env`** antes de iniciar
2. **Usa sessionStorage** para datos de sesión
3. **Los momentos van de 1 a 4**, no de 0 a 3
4. **Puntos extras máximo: 2 por momento**
5. **Control de estudios** puede bloquear momentos

---

**¿Necesitas más ayuda?** Consulta la documentación completa o revisa el código fuente.

**Última actualización:** ${new Date().toLocaleDateString('es-ES')}

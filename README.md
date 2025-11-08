# Academico360

Sistema de gestión académica desarrollado con Next.js y MongoDB.

## 🚀 Configuración Inicial

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
# Copiar el archivo de ejemplo
cp env.example .env

# Editar .env con tus valores reales
# Especialmente MONGODB_URI para la conexión a la base de datos
```

### 3. Verificar configuración
```bash
# Verificar que las variables de entorno estén configuradas
node scripts/verificar-env.js
```

### 4. Ejecutar el servidor de desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver el resultado.

## 📋 Variables de Entorno

Este proyecto requiere configurar las siguientes variables de entorno:

- `MONGODB_URI`: URL de conexión a MongoDB
- `NODE_ENV`: Entorno de ejecución (development/production)
- `PORT`: Puerto del servidor (opcional, default: 3000)

**⚠️ IMPORTANTE**: Nunca subas el archivo `.env` al repositorio. Usa `env.example` como referencia.

## 🗄️ Base de Datos

El proyecto utiliza MongoDB como base de datos principal. La conexión se configura automáticamente a través de las variables de entorno.

### Estructura de la Base de Datos
- **Aulas**: Gestión de grupos de estudiantes
- **Estudiantes**: Información de alumnos
- **Profesores**: Datos del personal docente
- **Materias**: Asignaturas del plan de estudios
- **Calificaciones**: Sistema de evaluación
- **Asistencia**: Control de presencia

## 🛠️ Tecnologías Utilizadas

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: Sistema personalizado
- **Reportes**: PDF y Excel

## 📚 Documentación Adicional

- [Configuración de Variables de Entorno](./CONFIGURACION_VARIABLES_ENTORNO.md)
- [Actualización de Firma Digital](./ACTUALIZACION_FIRMA_DIGITAL_V2.md)
- [Optimizaciones de Rendimiento](./OPTIMIZACIONES_RENDIMIENTO.md)

## 🚀 Despliegue

La forma más fácil de desplegar tu aplicación Next.js es usar [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Consulta la [documentación de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) para más detalles.

## 📖 Aprende Más

Para aprender más sobre Next.js, consulta los siguientes recursos:

- [Documentación de Next.js](https://nextjs.org/docs) - aprende sobre las características y API de Next.js.
- [Aprende Next.js](https://nextjs.org/learn) - un tutorial interactivo de Next.js.

Puedes revisar [el repositorio de GitHub de Next.js](https://github.com/vercel/next.js) - ¡tus comentarios y contribuciones son bienvenidos!

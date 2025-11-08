# Configuración de Variables de Entorno

## Descripción
Este proyecto utiliza variables de entorno para configurar la conexión a la base de datos MongoDB y otras configuraciones sensibles.

## Archivos de Configuración

### 1. env.example
- **Propósito**: Archivo de ejemplo que muestra todas las variables de entorno necesarias
- **Contenido**: Variables con valores de ejemplo (NO valores reales)
- **Seguridad**: Este archivo SÍ se sube al repositorio

### 2. .env (CREAR MANUALMENTE)
- **Propósito**: Archivo real con las variables de entorno de tu entorno
- **Contenido**: Variables con valores reales de tu configuración
- **Seguridad**: Este archivo NUNCA se sube al repositorio (está en .gitignore)

## Configuración Inicial

### Paso 1: Crear el archivo .env
```bash
# En la raíz del proyecto
cp env.example .env
```

### Paso 2: Configurar las variables en .env
```bash
# Edita el archivo .env con tus valores reales
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/tu_base?retryWrites=true&w=majority
NODE_ENV=development
PORT=3000
```

## Variables de Entorno Disponibles

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `MONGODB_URI` | URL completa de conexión a MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/db` | Sí |
| `NODE_ENV` | Entorno de ejecución | `development`, `production` | No (default: development) |
| `PORT` | Puerto del servidor | `3000` | No (default: 3000) |

## Seguridad

### ✅ HACER
- Mantener actualizado `env.example` con nuevas variables
- Usar valores seguros en producción
- Verificar que `.env` esté en `.gitignore`

### ❌ NO HACER
- Subir archivos `.env` al repositorio
- Compartir credenciales reales
- Usar valores de ejemplo en producción

## Verificación

Para verificar que la configuración funciona:

1. Crea el archivo `.env`
2. Configura las variables
3. Ejecuta el proyecto: `npm run dev`
4. Verifica en la consola que la conexión a MongoDB sea exitosa

## Solución de Problemas

### Error: "MONGODB_URI debe estar definida en producción"
- **Causa**: Variable `MONGODB_URI` no está configurada
- **Solución**: Agregar `MONGODB_URI` al archivo `.env`

### Error de conexión a MongoDB
- **Causa**: URL incorrecta o credenciales inválidas
- **Solución**: Verificar la URL en `MONGODB_URI`

## Notas Importantes

- El proyecto está configurado para usar la URL de MongoDB por defecto en desarrollo
- En producción, siempre se requiere configurar `MONGODB_URI`
- Las variables de entorno se cargan automáticamente por Next.js
- No se requiere instalar `dotenv` adicional

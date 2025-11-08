# Actualización de Firma Digital - Versión 2.0

## Resumen de Cambios

Se han implementado mejoras significativas en la funcionalidad de firma digital, incluyendo el reposicionamiento de elementos y la adición de nueva información de firma.

## Cambios Implementados

### 1. **Reposicionamiento del QR**
- **Antes**: El QR estaba en `y: 100` (parte superior)
- **Ahora**: El QR está en `y: 700` (parte inferior izquierda)
- **Coordenadas**: `x: 50, y: 700, width: 80, height: 80`

### 2. **Nuevo Elemento: Sello/Logo**
- **Posición**: Parte inferior derecha (`x: 450, y: 700`)
- **Misma altura**: Alineado con el QR (`y: 700`)
- **Tamaño**: 80x80 píxeles (igual que el QR)
- **Propósito**: Logo institucional o sello oficial





### 3. **Nueva Información de Firma**
- **Posición**: Parte inferior derecha, encima del sello (`x: 450, y: 600`)
- **Contenido**:
  - **Firmante**: CESAR AUGUSTO ROSALES ARAUJO
  - **Fecha**: 13/8/2025, 15:50:00
  - **Razón**: Firma de documento en FirmeDigital
  - **Contacto**: cesar.aug0811@gmail.com
  - **ID**: c23630be87c58dc0
  - **Marca**: Firmado electrónicamente con www.firmedigital.com
- **Tamaño**: 200x120 píxeles

## Configuración Final

```javascript
// QR en parte inferior izquierda
QR: {
  enabled: true,
  content: "https://academico360.com/verify",
  x: 50,      // Izquierda
  y: 700,     // Parte inferior
  width: 80,
  height: 80
},

// Sello en parte inferior derecha
SELLO: {
  enabled: true,
  content: "https://academico360.com/logo",
  x: 450,     // Derecha
  y: 700,     // Misma altura que el QR
  width: 80,
  height: 80
},

// Información de firma en parte inferior derecha
FIRMA_INFO: {
  enabled: true,
  firmante: "CESAR AUGUSTO ROSALES ARAUJO",
  fecha: "13/8/2025, 15:50:00",
  razon: "Firma de documento en FirmeDigital",
  contacto: "cesar.aug0811@gmail.com",
  id: "c23630be87c58dc0",
  x: 450,     // Misma posición X que el sello
  y: 600,     // Encima del sello
  width: 200,
  height: 120
}
```

## Archivos Modificados

### 1. **`app/utils/configFirmaDigital.js`**
- Agregada configuración `FIRMA_INFO` con todos los detalles de firma
- Actualizada función `getSignConfig` para incluir la información de firma

### 2. **`app/utils/firmaDigital.js`**
- Modificado el body de la petición para incluir `firmaInfo: signConfig.firmaInfo`
- El API ahora recibirá QR, sello e información de firma

### 3. **`app/utils/testFirmaDigital.js`**
- Actualizada la función de prueba para incluir la información de firma
- Coordenadas de prueba actualizadas con todos los elementos

## Resultado Visual

Cuando firmes un PDF, ahora aparecerán **tres elementos** en la parte inferior:

1. **QR** (izquierda): Para verificación del documento
2. **Información de Firma** (derecha, arriba): Con todos los detalles del firmante
3. **Sello/Logo** (derecha, abajo): Logo institucional o sello oficial

## Estructura de la Petición al API

```json
{
  "pdfBase64": "...",
  "p12Base64": "...",
  "passphrase": "...",
  "coordinates": { "x": 100, "y": 200, "width": 250, "height": 80, "page": 1 },
  "qr": { "enabled": true, "content": "...", "x": 50, "y": 700, "width": 80, "height": 80 },
  "sello": { "enabled": true, "content": "...", "x": 450, "y": 700, "width": 80, "height": 80 },
  "firmaInfo": {
    "enabled": true,
    "firmante": "CESAR AUGUSTO ROSALES ARAUJO",
    "fecha": "13/8/2025, 15:50:00",
    "razon": "Firma de documento en FirmeDigital",
    "contacto": "cesar.aug0811@gmail.com",
    "id": "c23630be87c58dc0",
    "x": 450,
    "y": 600,
    "width": 200,
    "height": 120
  }
}
```

## Próximos Pasos

1. **Probar la funcionalidad** con un PDF real
2. **Verificar que todos los elementos** aparezcan en las posiciones correctas
3. **Ajustar coordenadas** si es necesario según el tamaño del PDF
4. **Personalizar contenido** del QR, sello e información de firma según necesidades

## Notas Técnicas

- Todos los elementos se posicionan automáticamente en cada página del PDF
- Las coordenadas están optimizadas para PDFs de tamaño A4 estándar
- La información de firma incluye todos los campos requeridos por la normativa
- El sistema mantiene compatibilidad con la funcionalidad anterior


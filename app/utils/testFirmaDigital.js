// Utilidades de prueba para la firma digital
import { obtenerTokenAuth, firmarPDF, validarPDF, base64ToBlob } from './firmaDigital';

// Función para probar solo la autenticación
export const probarAutenticacion = async () => {
  try {
    console.log('🧪 Iniciando prueba de autenticación...');
    
    const token = await obtenerTokenAuth();
    
    if (token) {
      console.log('✅ Autenticación exitosa');
      console.log('🔑 Token válido obtenido');
      return { success: true, token: token.substring(0, 20) + '...' };
    } else {
      console.log('❌ No se obtuvo token');
      return { success: false, error: 'No se obtuvo token' };
    }
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    return { success: false, error: error.message };
  }
};

// Función para probar la conectividad básica
export const probarConectividad = async () => {
  try {
    console.log('🌐 Probando conectividad con la API...');
    
    const response = await fetch('https://aqa.firmedigital.com/api/auth/token', {
      method: 'POST',
      headers: {
        'x-api-key': 'qa_key_empresa1_789888',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Respuesta del servidor:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Conectividad exitosa');
      return { success: true, status: response.status, data };
    } else {
      console.log('❌ Error de conectividad');
      const errorText = await response.text();
      return { success: false, status: response.status, error: errorText };
    }
  } catch (error) {
    console.error('❌ Error de conectividad:', error);
    return { success: false, error: error.message };
  }
};

// Función para verificar la estructura de la respuesta del token
export const verificarEstructuraToken = async () => {
  try {
    console.log('🔍 Verificando estructura de respuesta del token...');
    
    const response = await fetch('https://aqa.firmedigital.com/api/auth/token', {
      method: 'POST',
      headers: {
        'x-api-key': 'qa_key_empresa1_789888',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📋 Estructura de la respuesta:', data);
      console.log('🔑 Propiedades disponibles:', Object.keys(data));
      
      // Extraer el token de la estructura anidada
      let token = null;
      let tokenPath = '';
      
      // Verificar estructura: data.data.token (estructura anidada)
      if (data.data && data.data.token) {
        token = data.data.token;
        tokenPath = 'data.data.token';
        console.log('✅ Token encontrado en data.data.token');
      }
      // Verificar estructura: data.token (estructura directa)
      else if (data.token) {
        token = data.token;
        tokenPath = 'data.token';
        console.log('✅ Token encontrado en data.token');
      }
      // Verificar estructura: data.status && data.data.token
      else if (data.status && data.data && data.data.token) {
        token = data.data.token;
        tokenPath = 'data.status.data.token';
        console.log('✅ Token encontrado en data.status.data.token');
      }
      
      if (token) {
        console.log('🔑 Token encontrado en la respuesta');
        console.log('📏 Longitud del token:', token.length);
        console.log('📍 Ruta del token:', tokenPath);
        return { success: true, hasToken: true, tokenLength: token.length, tokenPath };
      } else {
        console.log('❌ No se encontró token en la respuesta');
        return { success: true, hasToken: false, data };
      }
    } else {
      console.log('❌ Error en la respuesta:', response.status, response.statusText);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.error('❌ Error al verificar estructura:', error);
    return { success: false, error: error.message };
  }
};

// Función para probar la API de firma con un PDF de prueba
export const probarAPIFirma = async () => {
  try {
    console.log('🧪 Probando API de firma...');
    
    // Crear un PDF de prueba simple
    const pdfPrueba = await crearPDFPrueba();
    console.log('📄 PDF de prueba creado, tamaño:', pdfPrueba.size, 'bytes');
    
    // Obtener token
    const token = await obtenerTokenAuth();
    console.log('🔑 Token obtenido para prueba de firma');
    
    // Simular certificado P12 (esto fallará, pero nos dará información)
    const p12Base64 = 'certificado_prueba_base64';
    const passphrase = 'contraseña_prueba';
    
    console.log('📤 Enviando petición de firma de prueba...');
    
    // Realizar la petición de firma
    const response = await fetch('https://aqa.firmedigital.com/api/empresa1/pdf/sign', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pdfBase64: await blobToBase64(pdfPrueba),
        p12Base64: p12Base64,
        passphrase: btoa(passphrase),
        coordinates: { x: 50, y: 650, width: 250, height: 80, page: 1 },
        qr: { enabled: true, content: "https://academico360.com/verify", x: 450, y: 650, width: 80, height: 80 },
        sello: { enabled: true, content: "https://academico360.com/logo", x: 450, y: 650, width: 80, height: 80 },
        options: {
          includeTimestamp: true,
          signatureReason: "Firma de documento en FirmeDigital",
          signatureLocation: "Venezuela",
          signatureImage: {
            x: 50,
            y: 650,
            width: 200,
            height: 120
          }
        },
        // Campos adicionales para forzar posicionamiento
        signaturePosition: {
          x: 50,
          y: 650,
          width: 200,
          height: 120
        },
        signaturePlacement: "bottom-left",
        forceSignaturePosition: true,
        signatureCoordinates: {
          x: 50,
          y: 650,
          page: 1
        }
      })
    });
    
    console.log('📊 Respuesta de la API de firma:', response.status, response.statusText);
    
    if (response.ok) {
      // Obtener la respuesta como texto para verificar si es JSON o PDF
      const responseText = await response.text();
      console.log('📋 Respuesta recibida (primeros 200 caracteres):', responseText.substring(0, 200));
      
      // Verificar si la respuesta es JSON
      if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const jsonResponse = JSON.parse(responseText);
          console.log('📋 Respuesta JSON recibida:', jsonResponse);
          
          // Verificar si es una respuesta exitosa con PDF firmado
          if (jsonResponse.success === true && jsonResponse.status === true && 
              jsonResponse.data && jsonResponse.data.signedPdfBase64URL) {
            
            console.log('✅ Respuesta exitosa del API - PDF firmado en base64');
            
            // Extraer la URL base64 del PDF firmado
            const signedPdfBase64URL = jsonResponse.data.signedPdfBase64URL;
            console.log('🔗 URL base64 del PDF firmado recibida, longitud:', signedPdfBase64URL.length);
            
            // Verificar que la URL base64 tenga el formato correcto
            if (!signedPdfBase64URL.startsWith('data:application/pdf;base64,')) {
              return { 
                success: false, 
                error: 'Formato de URL base64 inválido en la respuesta del API',
                responseType: 'INVALID_BASE64_FORMAT',
                jsonResponse: jsonResponse
              };
            }
            
            // Extraer solo la parte base64 (sin el prefijo data:application/pdf;base64,)
            const base64Data = signedPdfBase64URL.replace('data:application/pdf;base64,', '');
            console.log('📊 Datos base64 extraídos, longitud:', base64Data.length);
            
            // Convertir base64 a blob para validación
            const pdfFirmado = await base64ToBlob(base64Data, 'application/pdf');
            console.log('✅ PDF firmado convertido a blob, tamaño:', pdfFirmado.size, 'bytes');
            
            // Validar el PDF recibido
            try {
              await validarPDF(pdfFirmado);
              console.log('✅ PDF firmado es válido');
              return { 
                success: true, 
                pdfSize: pdfFirmado.size, 
                pdfType: pdfFirmado.type,
                responseType: 'SUCCESS_JSON',
                jsonResponse: jsonResponse,
                base64Length: base64Data.length
              };
            } catch (validationError) {
              console.log('❌ PDF firmado no es válido:', validationError.message);
              return { 
                success: false, 
                error: validationError.message, 
                pdfSize: pdfFirmado.size, 
                pdfType: pdfFirmado.type,
                responseType: 'INVALID_PDF_FROM_JSON',
                jsonResponse: jsonResponse
              };
            }
            
          } else if (jsonResponse.success === false || jsonResponse.status === false) {
            // Es un error del API
            console.error('❌ API devolvió error:', jsonResponse);
            
            let errorMessage = 'Error desconocido';
            if (jsonResponse.error) {
              errorMessage = jsonResponse.error;
            } else if (jsonResponse.message) {
              errorMessage = jsonResponse.message;
            }
            
            return { 
              success: false, 
              error: `API devolvió error: ${errorMessage}`,
              responseType: 'ERROR_JSON',
              jsonResponse: jsonResponse
            };
          } else {
            // JSON inesperado
            return { 
              success: false, 
              error: `API devolvió JSON inesperado: ${JSON.stringify(jsonResponse)}`,
              responseType: 'UNEXPECTED_JSON',
              jsonResponse: jsonResponse
            };
          }
          
        } catch (parseError) {
          console.error('❌ Error al parsear JSON de respuesta:', parseError);
          return { 
            success: false, 
            error: `API devolvió respuesta inesperada: ${responseText.substring(0, 100)}...`,
            responseType: 'PARSE_ERROR',
            rawResponse: responseText
          };
        }
      } else {
        // Respuesta directa como PDF (formato anterior)
        console.log('📄 Respuesta directa como PDF recibida');
        
        const pdfFirmado = new Blob([responseText], { type: 'application/pdf' });
        console.log('✅ PDF firmado recibido, tamaño:', pdfFirmado.size, 'bytes');
        console.log('📋 Tipo MIME:', pdfFirmado.type);
        
        // Validar el PDF recibido
        try {
          await validarPDF(pdfFirmado);
          console.log('✅ PDF firmado es válido');
          return { 
            success: true, 
            pdfSize: pdfFirmado.size, 
            pdfType: pdfFirmado.type,
            responseType: 'PDF_DIRECT'
          };
        } catch (validationError) {
          console.log('❌ PDF firmado no es válido:', validationError.message);
          return { 
            success: false, 
            error: validationError.message, 
            pdfSize: pdfFirmado.size, 
            pdfType: pdfFirmado.type,
            responseType: 'INVALID_PDF_DIRECT'
          };
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error en la API de firma:', errorText);
      
      // Intentar parsear el error como JSON
      try {
        const errorJson = JSON.parse(errorText);
        return { 
          success: false, 
          status: response.status, 
          error: `HTTP ${response.status}: ${errorJson.error || errorJson.message || JSON.stringify(errorJson)}`,
          responseType: 'ERROR_JSON',
          jsonError: errorJson
        };
      } catch (parseError) {
        return { 
          success: false, 
          status: response.status, 
          error: `HTTP ${response.status}: ${errorText}`,
          responseType: 'ERROR_TEXT',
          rawError: errorText
        };
      }
    }
    
  } catch (error) {
    console.error('❌ Error al probar API de firma:', error);
    return { success: false, error: error.message, responseType: 'EXCEPTION' };
  }
};

// Función auxiliar para crear PDF de prueba
const crearPDFPrueba = async () => {
  // Crear un PDF simple usando pdf-lib o crear un blob básico
  const contenido = 'Este es un PDF de prueba para la funcionalidad de firma digital.';
  return new Blob([contenido], { type: 'application/pdf' });
};

// Función auxiliar para convertir blob a base64
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Función principal de diagnóstico
export const ejecutarDiagnostico = async () => {
  console.log('🚀 Iniciando diagnóstico completo de la API de firma digital...');
  
  // Prueba 1: Conectividad básica
  console.log('\n📡 Prueba 1: Conectividad básica');
  const conectividad = await probarConectividad();
  console.log('Resultado:', conectividad);
  
  // Prueba 2: Verificar estructura de respuesta
  console.log('\n🔍 Prueba 2: Estructura de respuesta');
  const estructura = await verificarEstructuraToken();
  console.log('Resultado:', estructura);
  
  // Prueba 3: Autenticación completa
  console.log('\n🔐 Prueba 3: Autenticación completa');
  const autenticacion = await probarAutenticacion();
  console.log('Resultado:', autenticacion);
  
  // Prueba 4: API de firma
  console.log('\n✍️ Prueba 4: API de firma');
  const firma = await probarAPIFirma();
  console.log('Resultado:', firma);
  
  console.log('\n🏁 Diagnóstico completado');
  
  return {
    conectividad,
    estructura,
    autenticacion,
    firma
  };
};

// Función para probar con diferentes headers
export const probarHeadersAlternativos = async () => {
  const headersAlternativos = [
    { 'x-api-key': 'qa_key_empresa1_789888' },
    { 'X-API-Key': 'qa_key_empresa1_789888' },
    { 'X-API-KEY': 'qa_key_empresa1_789888' },
    { 'api-key': 'qa_key_empresa1_789888' },
    { 'Api-Key': 'qa_key_empresa1_789888' }
  ];
  
  console.log('🧪 Probando diferentes variaciones de headers...');
  
  for (let i = 0; i < headersAlternativos.length; i++) {
    const headers = headersAlternativos[i];
    console.log(`\n📝 Prueba ${i + 1}:`, Object.keys(headers)[0]);
    
    try {
      const response = await fetch('https://aqa.firmedigital.com/api/auth/token', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Éxito con header: ${Object.keys(headers)[0]}`);
        console.log(`   📋 Respuesta:`, data);
        return { success: true, workingHeader: Object.keys(headers)[0], data };
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log('❌ Ningún header alternativo funcionó');
  return { success: false };
};

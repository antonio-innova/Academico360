// Utilidades para la firma digital de PDFs
import { getConfig, getAuthHeaders, buildUrl, getSignConfig } from './configFirmaDigital';

// Obtener configuración para el entorno actual
const config = getConfig(process.env.NODE_ENV || 'development');

// Función para obtener el token de autenticación con reintentos
export const obtenerTokenAuth = async (headerType = 'x-api-key') => {
  let lastError;
  
  for (let attempt = 1; attempt <= config.RETRY.MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`🔐 Intento ${attempt}/${config.RETRY.MAX_ATTEMPTS} - Obteniendo token de autenticación...`);
      console.log('📡 URL:', buildUrl(config, config.AUTH.ENDPOINT));
      console.log('🔑 API Key:', config.AUTH.API_KEY);
      console.log('📋 Header usado:', headerType);
      
      const headers = getAuthHeaders(config, headerType);
      console.log('📤 Headers enviados:', headers);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUTS.AUTH);
      
      const response = await fetch(buildUrl(config, config.AUTH.ENDPOINT), {
        method: 'POST',
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('📊 Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error en respuesta del servidor:', errorText);
        
        // Si es un error de autenticación, probar con otro header
        if (response.status === 401 || response.status === 403) {
          console.log('🔍 Error de autenticación, probando con header alternativo...');
          const nextHeaderIndex = config.AUTH.HEADER_VARIATIONS.indexOf(headerType) + 1;
          if (nextHeaderIndex < config.AUTH.HEADER_VARIATIONS.length) {
            const nextHeader = config.AUTH.HEADER_VARIATIONS[nextHeaderIndex];
            console.log(`🔄 Probando con header: ${nextHeader}`);
            return await obtenerTokenAuth(nextHeader);
          }
        }
        
        throw new Error(`Error al obtener token: ${response.status} - ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Respuesta completa del servidor:', data);
      
      // Extraer el token de la estructura anidada
      let token = null;
      
      // Verificar estructura: data.data.token (estructura anidada)
      if (data.data && data.data.token) {
        token = data.data.token;
        console.log('🔑 Token extraído de data.data.token');
      }
      // Verificar estructura: data.token (estructura directa)
      else if (data.token) {
        token = data.token;
        console.log('🔑 Token extraído de data.token');
      }
      // Verificar estructura: data.status && data.data.token
      else if (data.status && data.data && data.data.token) {
        token = data.data.token;
        console.log('🔑 Token extraído de data.status.data.token');
      }
      
      if (!token) {
        console.error('❌ No se encontró token en la respuesta. Estructura recibida:', data);
        console.error('🔍 Propiedades disponibles en data:', Object.keys(data));
        if (data.data) {
          console.error('🔍 Propiedades disponibles en data.data:', Object.keys(data.data));
        }
        throw new Error('No se encontró token en la respuesta del servidor');
      }
      
      console.log('✅ Token obtenido exitosamente, longitud:', token.length);
      return token;
      
    } catch (error) {
      lastError = error;
      console.error(`❌ Intento ${attempt} fallido:`, error);
      
      if (attempt < config.RETRY.MAX_ATTEMPTS) {
        console.log(`⏳ Esperando ${config.RETRY.DELAY}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, config.RETRY.DELAY));
      }
    }
  }
  
  console.error('❌ Todos los intentos fallaron');
  throw new Error(`No se pudo obtener token después de ${config.RETRY.MAX_ATTEMPTS} intentos. Último error: ${lastError.message}`);
};

// Función para convertir un blob a base64
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]; // Remover el prefijo data:application/pdf;base64,
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Función para validar que un blob sea un PDF válido
export const validarPDF = (blob) => {
  try {
    console.log('🔍 Validando PDF recibido...');
    console.log('📊 Tamaño del blob:', blob.size, 'bytes');
    console.log('📋 Tipo MIME:', blob.type);
    
    // Verificar que el blob tenga contenido
    if (!blob || blob.size === 0) {
      throw new Error('El blob está vacío o es nulo');
    }
    
    // Verificar que el tamaño sea razonable (mínimo 1KB, máximo 50MB)
    if (blob.size < 1024) {
      throw new Error('El archivo es demasiado pequeño para ser un PDF válido');
    }
    
    if (blob.size > 50 * 1024 * 1024) {
      throw new Error('El archivo es demasiado grande para ser un PDF válido');
    }
    
    // Verificar que el tipo MIME sea PDF
    if (blob.type && blob.type !== 'application/pdf') {
      console.warn('⚠️ Tipo MIME no es application/pdf:', blob.type);
      // No lanzar error aquí, algunos servidores pueden devolver tipos incorrectos
    }
    
    // Verificar los primeros bytes para confirmar que es un PDF
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Los PDFs comienzan con "%PDF" (0x25, 0x50, 0x44, 0x46)
        if (uint8Array.length >= 4) {
          const header = String.fromCharCode(...uint8Array.slice(0, 4));
          console.log('📄 Header del archivo:', header);
          
          if (header === '%PDF') {
            console.log('✅ Archivo confirmado como PDF válido');
            resolve(true);
          } else {
            console.error('❌ Header no corresponde a un PDF:', header);
            reject(new Error('El archivo no es un PDF válido (header incorrecto)'));
          }
        } else {
          console.error('❌ Archivo demasiado corto para verificar header');
          reject(new Error('El archivo es demasiado corto para ser un PDF válido'));
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    });
    
  } catch (error) {
    console.error('❌ Error al validar PDF:', error);
    throw error;
  }
};

// Función para firmar un PDF
export const firmarPDF = async (pdfBlob, p12Base64, passphrase) => {
  try {
    console.log('✍️ Iniciando proceso de firma digital...');
    
    // Obtener el token de autenticación
    const token = await obtenerTokenAuth();
    console.log('🔑 Token obtenido, longitud:', token ? token.length : 0);
    
    // Verificar que tenemos un token válido
    if (!token || token.length < 10) {
      throw new Error('Token de autenticación inválido o muy corto');
    }
    
    // Convertir el PDF a base64
    console.log('📄 Convirtiendo PDF a base64...');
    const pdfBase64 = await blobToBase64(pdfBlob);
    console.log('📝 PDF convertido, longitud base64:', pdfBase64 ? pdfBase64.length : 0);
    
    // Verificar que el PDF se convirtió correctamente
    if (!pdfBase64 || pdfBase64.length < 100) {
      throw new Error('Error al convertir PDF a base64');
    }
    
    // Verificar que tenemos el certificado P12
    if (!p12Base64 || p12Base64.length < 100) {
      throw new Error('Certificado P12 inválido o muy corto');
    }
    
    // Codificar la passphrase en base64
    const passphraseBase64 = btoa(passphrase);
    console.log('🔒 Passphrase codificada, longitud:', passphraseBase64.length);
    
    // Obtener configuración de firma
    const signConfig = getSignConfig(config);
    
    // Preparar el body de la petición
    const body = {
      pdfBase64: pdfBase64,
      p12Base64: p12Base64,
      passphrase: passphraseBase64,
      coordinates: signConfig.coordinates,
      qr: signConfig.qr,
      sello: signConfig.sello,
      options: signConfig.options,
      // Campos adicionales para forzar posicionamiento
      signaturePosition: {
        x: 50,
        y: 620,
        width: 200,
        height: 120
      },
      signaturePlacement: "bottom-left",
      // Forzar que la información de firma aparezca en la parte inferior izquierda
      forceSignaturePosition: true,
      signatureCoordinates: {
        x: 50,
        y: 620,
        page: 1
      }
    };

    console.log('📤 Enviando petición de firma...');
    console.log('📡 URL de firma:', buildUrl(config, config.SIGN.ENDPOINT));
    console.log('🔑 Token usado:', token.substring(0, 20) + '...');
    console.log('📊 Tamaño del body:', JSON.stringify(body).length, 'caracteres');
    console.log('📋 Información de firma que se enviará:', signConfig.firmaInfo);
    console.log('⚙️ Opciones de firma que se enviarán:', signConfig.options);
    console.log('📤 Body completo que se enviará al API:', JSON.stringify(body, null, 2));

    // Realizar la petición de firma con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.TIMEOUTS.SIGN);
    
    const response = await fetch(buildUrl(config, config.SIGN.ENDPOINT), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('📊 Respuesta de firma:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Error al firmar PDF: ${response.status} - ${response.statusText}`;
      
      try {
        const errorData = await response.text();
        console.error('❌ Detalles del error:', errorData);
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch (e) {
        console.error('❌ No se pudo leer el cuerpo del error:', e);
      }
      
      throw new Error(errorMessage);
    }

    // Obtener la respuesta como texto primero para verificar si es JSON o PDF
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
            throw new Error('Formato de URL base64 inválido en la respuesta del API');
          }
          
          // Extraer solo la parte base64 (sin el prefijo data:application/pdf;base64,)
          const base64Data = signedPdfBase64URL.replace('data:application/pdf;base64,', '');
          console.log('📊 Datos base64 extraídos, longitud:', base64Data.length);
          
          // Convertir base64 a blob
          const pdfFirmadoBlob = await base64ToBlob(base64Data, 'application/pdf');
          console.log('✅ PDF firmado convertido a blob, tamaño:', pdfFirmadoBlob.size, 'bytes');
          
          // Validar que el PDF firmado sea válido
          console.log('🔍 Validando PDF firmado...');
          await validarPDF(pdfFirmadoBlob);
          
          console.log('✅ PDF firmado validado exitosamente');
          return pdfFirmadoBlob;
          
        } else if (jsonResponse.success === false || jsonResponse.status === false) {
          // Es un error del API
          console.error('❌ API devolvió error:', jsonResponse);
          
          if (jsonResponse.error) {
            throw new Error(`Error de la API: ${jsonResponse.error}`);
          } else if (jsonResponse.message) {
            throw new Error(`Error de la API: ${jsonResponse.message}`);
          } else {
            throw new Error(`Error de la API: ${JSON.stringify(jsonResponse)}`);
          }
        } else {
          // JSON inesperado
          throw new Error(`API devolvió JSON inesperado: ${JSON.stringify(jsonResponse)}`);
        }
        
      } catch (parseError) {
        console.error('❌ Error al parsear JSON de respuesta:', parseError);
        throw new Error(`API devolvió respuesta inesperada: ${responseText.substring(0, 100)}...`);
      }
    } else {
      // Respuesta directa como PDF (formato anterior)
      console.log('📄 Respuesta directa como PDF recibida');
      
      // Convertir el texto de vuelta a blob
      const pdfFirmadoBlob = new Blob([responseText], { type: 'application/pdf' });
      console.log('✅ PDF firmado recibido, tamaño:', pdfFirmadoBlob.size, 'bytes');
      
      // Validar que el PDF firmado sea válido
      console.log('🔍 Validando PDF firmado...');
      await validarPDF(pdfFirmadoBlob);
      
      console.log('✅ PDF firmado validado exitosamente');
      return pdfFirmadoBlob;
    }
  } catch (error) {
    console.error('❌ Error al firmar PDF:', error);
    throw error;
  }
};

// Función para descargar un PDF firmado
export const descargarPDFFirmado = (pdfBlob, nombreArchivo) => {
  try {
    console.log('📥 Descargando PDF firmado:', nombreArchivo);
    
    // Validar el PDF antes de descargarlo
    validarPDF(pdfBlob).then(() => {
      console.log('✅ PDF validado antes de la descarga');
      
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || 'documento_firmado.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('✅ PDF descargado exitosamente');
      
    }).catch((error) => {
      console.error('❌ Error al validar PDF antes de descarga:', error);
      throw error;
    });
    
  } catch (error) {
    console.error('❌ Error al descargar PDF:', error);
    throw error;
  }
};

// Función para convertir base64 a blob
export const base64ToBlob = async (base64Data, mimeType = 'application/pdf') => {
  try {
    console.log('🔄 Convirtiendo base64 a blob, MIME type:', mimeType);
    
    // Decodificar base64 a array de bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    console.log('📊 Array de bytes creado, longitud:', byteArray.length);
    
    // Crear blob
    const blob = new Blob([byteArray], { type: mimeType });
    console.log('✅ Blob creado exitosamente, tamaño:', blob.size, 'bytes');
    
    return blob;
  } catch (error) {
    console.error('❌ Error al convertir base64 a blob:', error);
    throw new Error(`Error al convertir base64 a blob: ${error.message}`);
  }
};

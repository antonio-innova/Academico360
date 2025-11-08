// Configuración para la firma digital
export const CONFIG_FIRMA_DIGITAL = {
  // URLs de la API
  API_BASE_URL: 'https://aqa.firmedigital.com',
  
  // Configuraciones de autenticación
  AUTH: {
    ENDPOINT: '/api/auth/token',
    API_KEY: 'hvSxFbE3PYDB52EB4YPGMJ6/92H9BesHBcpeKAmKjJk=',
    HEADER_NAME: 'x-api-key',
    TOKEN_DURATION: 24 * 60 * 60 * 1000 // 24 horas en milisegundos
  },
  
  // Configuraciones de firma
  SIGN: {
    ENDPOINT: '/api/lasacacias/pdf/sign',
    // Coordenadas por defecto para la firma (mantenidas como especificaste)
    COORDINATES: {
      x: 30, // Forzar a la izquierda - donde dice "Firma del Tutor"
      y: 670, // Bajado un poco más
      width: 250,
      height: 80,
      page: 1
    },
    // Configuración del QR por defecto (parte inferior derecha - donde dice "Sello del Instituto")
    QR: {
      enabled: true,
      content: "https://academico360.com/verify",
      x: 430, // Movido a la izquierda
      y: 660, // Bajado un poco más
      width: 80,
      height: 80
    }
  },
  
  // Configuraciones de archivos
  FILES: {
    // Tipos de archivo aceptados
    ACCEPTED_TYPES: ['.p12', '.pfx'],
    // Tamaño máximo del archivo (en bytes) - 5MB
    MAX_SIZE: 5 * 1024 * 1024,
    // Tamaño mínimo del archivo (en bytes) - 1KB
    MIN_SIZE: 1024
  },
  
  // Configuraciones de timeout
  TIMEOUTS: {
    // Timeout para obtener token (en ms)
    AUTH: 10000,
    // Timeout para firma (en ms)
    SIGN: 30000,
    // Timeout para descarga (en ms)
    DOWNLOAD: 15000
  },
  
  // Configuraciones de reintentos
  RETRY: {
    // Número máximo de reintentos
    MAX_ATTEMPTS: 3,
    // Delay entre reintentos (en ms)
    DELAY: 1000
  },
  
  // Configuraciones de logging
  LOGGING: {
    // Habilitar logging detallado
    ENABLED: true,
    // Nivel de logging (debug, info, warn, error)
    LEVEL: 'debug'
  }
};

// Función para obtener la configuración según el entorno
export const getConfig = (environment = 'production') => {
  const baseConfig = { ...CONFIG_FIRMA_DIGITAL };
  
  if (environment === 'development') {
    // Configuraciones específicas para desarrollo
    baseConfig.LOGGING.ENABLED = true;
    baseConfig.LOGGING.LEVEL = 'debug';
    baseConfig.TIMEOUTS.AUTH = 15000;
    baseConfig.TIMEOUTS.SIGN = 45000;
  }
  
  if (environment === 'testing') {
    // Configuraciones específicas para testing
    baseConfig.LOGGING.ENABLED = true;
    baseConfig.LOGGING.LEVEL = 'debug';
    baseConfig.RETRY.MAX_ATTEMPTS = 1;
  }
  
  return baseConfig;
};

// Función para validar la configuración
export const validateConfig = (config) => {
  const errors = [];
  
  if (!config.API_BASE_URL) {
    errors.push('API_BASE_URL es requerido');
  }
  
  if (!config.AUTH.API_KEY) {
    errors.push('API_KEY es requerida');
  }
  
  if (!config.AUTH.ENDPOINT) {
    errors.push('ENDPOINT de autenticación es requerido');
  }
  
  if (!config.SIGN.ENDPOINT) {
    errors.push('ENDPOINT de firma es requerido');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para obtener headers de autenticación para obtener token
export const getAuthHeaders = (config) => {
  return {
    'Content-Type': 'application/json',
    'x-api-key': 'hvSxFbE3PYDB52EB4YPGMJ6/92H9BesHBcpeKAmKjJk='
  };
};

// Función para obtener headers de firma con Bearer token
export const getSignHeaders = (token) => {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Función para construir URLs completas
export const buildUrl = (config, endpoint) => {
  return `${config.API_BASE_URL}${endpoint}`;
};

// Función para obtener configuración de firma según la nueva API
export const getSignConfig = (config, customCoordinates = null, customQR = null) => {
  return {
    coordinates: customCoordinates || config.SIGN.COORDINATES,
    qr: customQR || config.SIGN.QR
  };
};

// Función para construir el body de la petición de firma
export const buildSignRequestBody = (pdfBase64, p12Base64, passphrase, config, customCoordinates = null, customQR = null) => {
  const signConfig = getSignConfig(config, customCoordinates, customQR);
  
  return {
    pdfBase64: pdfBase64, // Solo el base64, sin la URL
    p12Base64: p12Base64, // Solo el base64, sin la URL
    passphrase: btoa(passphrase), // Codificada en base64
    coordinates: signConfig.coordinates,
    qr: signConfig.qr
  };
};

// Función para obtener token de autenticación
export const getAuthToken = async (config) => {
  const url = buildUrl(config, config.AUTH.ENDPOINT);
  const headers = getAuthHeaders(config);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers
    });
    
    if (!response.ok) {
      throw new Error(`Error al obtener token: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token || data.access_token || data.accessToken;
  } catch (error) {
    console.error('Error obteniendo token de autenticación:', error);
    throw error;
  }
};

// Función para verificar si el token está expirado
export const isTokenExpired = (tokenTimestamp, config) => {
  if (!tokenTimestamp) return true;
  const now = Date.now();
  const tokenAge = now - tokenTimestamp;
  return tokenAge >= config.AUTH.TOKEN_DURATION;
};

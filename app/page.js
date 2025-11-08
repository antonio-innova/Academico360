"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [activeTab, setActiveTab] = useState("login");
  const [formData, setFormData] = useState({
    loginType: "docente",
    user: "",
    password: "",
    registerType: "docente",
    idRegistro: "",
    nombre: "",
    apellido: "",
    institucionRegistro: "acacias", // Valor por defecto: IUTCM para registro
    passRegistro: "",
    passConfirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Actualizar el estado del formulario con el nuevo valor
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert(null);
    
    try {
      if (!formData.user || !formData.password) {
        setAlert({
          title: "Error",
          message: "Por favor ingrese usuario y contraseña",
          icon: "error"
        });
        setLoading(false);
        return;
      }
      
      console.log('Iniciando sesión con datos:', {
        user: formData.user,
        pass: formData.password,
        loginType: formData.loginType
      });
      
      // Registrar el intento de inicio de sesión
      console.log('Intento de inicio de sesión:', {
        idU: formData.user,
        tipo: formData.loginType
      });
      
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: formData.user, // Este es el idU en MongoDB
          pass: formData.password,
          'login-type': formData.loginType // Este es el tipo en MongoDB
        }),
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        console.log(`Respuesta no exitosa: ${response.status} ${response.statusText}`);
        
        // Obtener el texto de error para cualquier tipo de error HTTP
        const errorText = await response.text();
        console.log('Texto de error recibido:', errorText);
        
        let errorMessage = "Error de conexión con el servidor";
        let errorTitle = "Error";
        
        try {
          // Intentar parsear el texto como JSON para cualquier tipo de error
          if (errorText) {
            const errorData = JSON.parse(errorText);
            if (errorData.message) {
              errorMessage = errorData.message;
            }
          }
        } catch (e) {
          console.error('Error al parsear respuesta JSON:', e);
          // Si no podemos parsear como JSON, usamos el texto de error tal cual si existe
          if (errorText && errorText.trim() !== '') {
            errorMessage = errorText.substring(0, 100); // Limitamos a 100 caracteres
          }
        }
        
        // Personalizar mensaje según el código de estado
        if (response.status === 403) {
          errorTitle = "Acceso Denegado";
          if (!errorMessage || errorMessage === "Error de conexión con el servidor") {
            errorMessage = "Su cuenta ha sido desactivada. Por favor, contacte al administrador.";
          }
        } else if (response.status === 400) {
          errorTitle = "Solicitud Incorrecta";
          if (!errorMessage || errorMessage === "Error de conexión con el servidor") {
            errorMessage = "Los datos proporcionados son incorrectos. Verifique su usuario y contraseña.";
          }
        } else if (response.status === 401) {
          errorTitle = "No Autorizado";
          errorMessage = "Usuario o contraseña incorrectos.";
        }
        
        setAlert({
          title: errorTitle,
          message: errorMessage,
          icon: "error"
        });
        setLoading(false);
        return;
        
        // Ya no lanzamos el error porque lo manejamos aquí
      }

      // Obtener y verificar la respuesta JSON
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (data.success) {
        // Extraer el usuario de la respuesta
        let usuario = null;
        
        // Verificar si la respuesta tiene la estructura con data[0]
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          console.log('Detectada estructura de respuesta con array data');
          usuario = data.data[0]; // Obtener el primer usuario del array
          console.log('Usuario extraído de data[0]:', usuario);
        } else {
          // Estructura normal
          usuario = data;
          console.log('Usuario extraído directamente de data:', usuario);
        }
        
        // Verificar el estado del profesor si el tipo de usuario es 'docente'
        if ((usuario.tipo === 'docente' || data.userType === 'docente') && 
            usuario.estado !== undefined && usuario.estado === 0) {
          console.log('Acceso bloqueado: Profesor con estado inactivo');
          setAlert({
            title: "Acceso Denegado",
            message: "Su cuenta ha sido desactivada. Por favor, contacte al administrador.",
            icon: "error"
          });
          setLoading(false);
          return;
        }
        
        // Guardar información básica del usuario
        sessionStorage.setItem('userId', formData.user); // Guardamos el idU
        localStorage.setItem('userId', formData.user);
        sessionStorage.setItem('userType', usuario.tipo || data.userType); // Usamos el tipo devuelto por el servidor
        localStorage.setItem('userType', usuario.tipo || data.userType);
        
        // Guardar el estado del profesor si está disponible
        if (data.estadoProfesor !== undefined && data.estadoProfesor !== null) {
          console.log('Guardando estado del profesor:', data.estadoProfesor);
          const estadoStr = data.estadoProfesor !== null ? data.estadoProfesor.toString() : '1';
          sessionStorage.setItem('estadoProfesor', estadoStr);
          localStorage.setItem('estadoProfesor', estadoStr);
        } else {
          console.log('Estado del profesor no disponible o es nulo, estableciendo valor por defecto (1)');
          // Si no hay estado, asumimos que está activo (1)
          sessionStorage.setItem('estadoProfesor', '1');
          localStorage.setItem('estadoProfesor', '1');
        }
        
        // Guardar nombre y apellido
        const nombre = usuario.nombre || data.userName;
        const apellido = usuario.apellido || data.userLastName;
        
        if (nombre) {
          console.log('Guardando nombre:', nombre);
          sessionStorage.setItem('userName', nombre);
          localStorage.setItem('userName', nombre);
        }
        
        if (apellido) {
          console.log('Guardando apellido:', apellido);
          sessionStorage.setItem('userLastName', apellido);
          localStorage.setItem('userLastName', apellido);
        }
        
        // Guardar todos los identificadores de institución que existan en la respuesta
        const idA = usuario.idA || data.idA;
        const idI = usuario.idI || data.idI;
        const idID = usuario.idID || data.idID;
        const idAD = usuario.idAD || data.idAD;
        
        // Guardar identificadores en localStorage y sessionStorage
        if (idA) {
          console.log('Guardando idA:', idA);
          sessionStorage.setItem('idA', idA);
          localStorage.setItem('idA', idA);
        }
        
        if (idI) {
          console.log('Guardando idI:', idI);
          sessionStorage.setItem('idI', idI);
          localStorage.setItem('idI', idI);
        }
        
        // Guardar idID si existe (identificador de IUTCM)
        if (idID) {
          console.log('Guardando idID en sessionStorage y localStorage:', idID);
          sessionStorage.setItem('idID', idID);
          localStorage.setItem('idID', idID);
          
          console.log('%c¡IMPORTANTE! Usuario con idID detectado: ' + idID, 'background: #3498db; color: white; padding: 4px; border-radius: 3px; font-weight: bold;');
          console.log('%cInstitución determinada: IUTCM', 'background: #2ecc71; color: white; padding: 4px; border-radius: 3px; font-weight: bold;');
        }
        
        // Guardar idAD si existe (identificador alternativo de Acacias)
        if (idAD) {
          console.log('Guardando idAD en sessionStorage y localStorage:', idAD);
          sessionStorage.setItem('idAD', idAD);
          localStorage.setItem('idAD', idAD);
          
          console.log('%c¡IMPORTANTE! Usuario con idAD detectado: ' + idAD, 'background: #e74c3c; color: white; padding: 4px; border-radius: 3px; font-weight: bold;');
          console.log('%cInstitución determinada: Acacias', 'background: #f39c12; color: white; padding: 4px; border-radius: 3px; font-weight: bold;');
        }

        // Determinar la ruta de redirección
        const redirectPath = data.redirectPath || (data.tipo === 'alumno' ? '/alumnos' : '/sidebar');
        console.log('Datos de redirección:', {
          tipo: data.tipo,
          userType: data.userType,
          redirectPath: redirectPath
        });

        // Redirigir al usuario
        console.log('Redirigiendo a:', redirectPath);
        router.push(redirectPath);
      } else {
        setAlert({
          title: "Error",
          message: data.message || "Error de autenticación",
          icon: "error"
        });
      }
    } catch (error) {
      console.error('Error en inicio de sesión:', error);
      
      // Extraer un mensaje de error más descriptivo
      let errorMessage = "Error de conexión con el servidor";
      
      // Si el error contiene un mensaje sobre HTTP 403, es probable que sea por cuenta bloqueada
      if (error.message && error.message.includes('403')) {
        errorMessage = "Su cuenta ha sido desactivada. Por favor, contacte al administrador.";
      } else if (error.message) {
        // Si hay un mensaje de error, usarlo
        errorMessage = error.message;
      }
      
      setAlert({
        title: "Error",
        message: errorMessage,
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    if (formData.passRegistro !== formData.passConfirm) {
      setAlert({
        title: "Error",
        message: "Las contraseñas no coinciden",
        icon: "error"
      });
      setLoading(false);
      return;
    }
    
    try {
      console.log('Iniciando registro para tipo de usuario:', formData.registerType);
      console.log('Datos de registro:', {
        tipo: formData.registerType,
        id: formData.idRegistro,
        nombre: formData.nombre,
        apellido: formData.apellido,
        institucion: formData.institucionRegistro
      });
      
      // Para estudiantes, verificamos si ya existe en la colección de MongoDB
      if (formData.registerType === "alumno") {
        console.log('Verificando si el estudiante ya existe con cédula:', formData.idRegistro);
        
        const checkResponse = await fetch(`/api/estudiantes/verificar?idU=${formData.idRegistro}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const checkData = await checkResponse.json();
        
        if (checkData.exists) {
          console.log('Estudiante encontrado en la plataforma:', checkData.estudiante);
          
          // El estudiante existe, procedemos con el registro añadiendo su _id
          const response = await fetch('/api/registro', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              'login-type': formData.registerType,
              idregistro: formData.idRegistro,
              idnombre: formData.nombre,
              idapellido: formData.apellido,
              passregistro: formData.passRegistro,
              passconfirm: formData.passConfirm,
              institucion: formData.institucionRegistro, // Añadimos la institución seleccionada
              idI: formData.institucionRegistro === 'iutcm' ? formData.idRegistro : null, // ID para IUTCM
              idA: formData.institucionRegistro === 'acacias' ? formData.idRegistro : null, // ID para Acacias
              estudianteId: checkData.estudiante._id // Añadimos el _id del estudiante existente
            }),
          });
          
          const data = await response.json();
          
          if (data.success) {
            setAlert({
              title: "Éxito",
              message: "Registro completado correctamente. Se ha vinculado su cuenta con su perfil de estudiante existente.",
              icon: "success"
            });
            setActiveTab("login");
            setFormData(prev => ({
              ...prev,
              user: formData.idRegistro,
              password: formData.passRegistro
            }));
          } else {
            setAlert({
              title: "Error",
              message: data.message || "Error en el registro",
              icon: "error"
            });
          }
        } else {
          // El estudiante no existe, mostramos un mensaje de error
          setAlert({
            title: "Error",
            message: "No existe un perfil de estudiante con esta cédula. Por favor, contacte a su institución para ser registrado primero como estudiante.",
            icon: "error"
          });
        }
      } else {
        // Para docentes y control, hacemos el registro directamente
        console.log('Realizando registro directo para:', formData.registerType);
        
        const response = await fetch('/api/registro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            'login-type': formData.registerType,
            idregistro: formData.idRegistro,
            idnombre: formData.nombre,
            idapellido: formData.apellido,
            passregistro: formData.passRegistro,
            institucion: formData.institucionRegistro
          }),
        });
        
        const data = await response.json();
        console.log('Respuesta del servidor:', { status: response.status, data });
        
        if (response.ok || data.success) {
          // Registro exitoso
          console.log('Registro exitoso:', data);
          setAlert({
            title: "Éxito",
            message: "Registro completado correctamente.",
            icon: "success"
          });
          setActiveTab("login");
          setFormData(prev => ({
            ...prev,
            user: formData.idRegistro,
            password: formData.passRegistro
          }));
        } else {
          setAlert({
            title: "Error",
            message: data.message || "Error en el registro",
            icon: "error"
          });
        }
      }
    } catch (error) {
      console.error('Error en el proceso de registro:', error);
      setAlert({
        title: "Error",
        message: "Error de conexión: " + error.message,
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden transition-all duration-300 transform hover:scale-[1.01]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <h1 className="text-2xl font-bold text-center !text-white">Portal Educativo</h1>
          <p className="text-center !text-white mt-1">Academico360</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab("login")} 
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${activeTab === "login" ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => setActiveTab("register")} 
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors duration-200 ${activeTab === "register" ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-blue-500'}`}
          >
            Registrarse
          </button>
        </div>
        
        {/* Login Form */}
        <div className={`p-6 ${activeTab === "login" ? 'block' : 'hidden'}`}>
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
              <select 
                id="login-type" 
                name="loginType" 
                value={formData.loginType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="docente">Docente</option>
                <option value="alumno">Alumno</option>
                <option value="control">Control de Estudios</option>
              </select>
            </div>
            

            
            <div>
              <label htmlFor="login-id" className="block text-sm font-medium text-gray-700 mb-1">Identificador</label>
              <input 
                type="text" 
                id="login-id" 
                name="user" 
                value={formData.user}
                onChange={handleChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingrese su identificador"
              />
            </div>
            
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                id="login-password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingrese su contraseña"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : "Iniciar Sesión"}
            </button>
          </form>
        </div>
        
        {/* Register Form */}
        <div className={`p-6 ${activeTab === "register" ? 'block' : 'hidden'}`}>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label htmlFor="register-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Usuario</label>
              <select 
                id="register-type" 
                name="registerType" 
                value={formData.registerType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="docente">Docente</option>
                <option value="alumno">Alumno</option>
              </select>
            </div>
            
            {/* Selector de institución - Visible para todos los usuarios */}
            <div>
              <label htmlFor="institucion-registro" className="block text-sm font-medium text-gray-700 mb-1">Institución</label>
              <select 
                id="institucion-registro" 
                name="institucionRegistro" 
                value={formData.institucionRegistro}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="acacias">Acacias</option>
              </select>
            </div>
            
            {/* Mensaje informativo para docentes */}
            {formData.registerType === "docente" && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <strong>Nota:</strong> Al registrarse como docente, el sistema buscará su información en la base de datos de profesores de la institución seleccionada. Ingrese sus datos exactamente como fueron registrados en el sistema.
                </p>
              </div>
            )}
            
            <div>
              <label htmlFor="register-id" className="block text-sm font-medium text-gray-700 mb-1">Identificador</label>
              <input 
                type="text" 
                id="register-id" 
                name="idRegistro" 
                value={formData.idRegistro}
                onChange={handleChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingrese su identificador"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="register-nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input 
                  type="text" 
                  id="register-nombre" 
                  name="nombre" 
                  value={formData.nombre}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nombre"
                />
              </div>
              
              <div>
                <label htmlFor="register-apellido" className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input 
                  type="text" 
                  id="register-apellido" 
                  name="apellido" 
                  value={formData.apellido}
                  onChange={handleChange}
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Apellido"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input 
                type="password" 
                id="register-password" 
                name="passRegistro" 
                value={formData.passRegistro}
                onChange={handleChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ingrese su contraseña"
              />
            </div>
            
            <div>
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">Confirmar Contraseña</label>
              <input 
                type="password" 
                id="register-confirm-password" 
                name="passConfirm" 
                value={formData.passConfirm}
                onChange={handleChange}
                required 
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Confirme su contraseña"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : "Registrarse"}
            </button>
          </form>
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Academico360 - Todos los derechos reservados
        </div>
      </div>
      
      {/* Alert Modal */}
      {alert && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl transform transition-all">
            <div className="flex items-center justify-center mb-4">
              {alert.icon === "success" ? (
                <div className="bg-green-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
              ) : (
                <div className="bg-red-100 p-2 rounded-full">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </div>
              )}
              <h3 className="ml-3 text-lg font-medium text-gray-900">{alert.title}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-4">{alert.message}</p>
            <div className="text-right">
              <button 
                onClick={() => {
                  // Si hay redirección pendiente, redirigir al usuario después de cerrar la alerta
                  if (alert.redirect && alert.redirectPath) {
                    setAlert(null);
                    router.push(alert.redirectPath);
                  } else {
                    setAlert(null);
                  }
                }} 
                className={`px-4 py-2 ${alert.icon === "success" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"} text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors`}
              >
                {alert.redirect ? "Continuar" : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

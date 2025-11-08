"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ProfileCard = ({ label, value }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100">
    <h3 className="text-sm font-medium text-blue-600 mb-2">{label}</h3>
    <p className="text-xl font-bold text-gray-700">{value || 'No disponible'}</p>
  </div>
);

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="relative bg-white/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-white/20 transform transition-all duration-300 scale-100"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200/30">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

const CalificacionCard = ({ materia, calificaciones, profesor }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedEvidencia, setSelectedEvidencia] = useState(null);

  // Calcular promedio
  const promedio = calificaciones.reduce((sum, cal) => sum + parseFloat(cal.nota || 0), 0) / calificaciones.length;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="font-semibold text-blue-700 text-lg mb-1">{materia}</h4>
          <p className="text-sm text-gray-600">Profesor: {profesor}</p>
        </div>
        <div className="text-right">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium inline-block">
            Promedio: {promedio.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="space-y-3">
        {calificaciones.map((calificacion, index) => (
          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{calificacion.actividad}</p>
              <p className="text-xs text-gray-500">{new Date(calificacion.fecha).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded font-medium text-sm">
                {calificacion.nota}
              </span>
              {calificacion.evidencia && (
                <button 
                  onClick={() => {
                    setSelectedEvidencia(calificacion);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Ver evidencia"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setSelectedEvidencia(null);
        }}
        title={selectedEvidencia ? `Evidencia de ${selectedEvidencia.actividad}` : ''}
      >
        {selectedEvidencia && (
          <div className="relative w-full max-w-4xl mx-auto bg-gray-900/30 rounded-xl overflow-hidden">
            <Image
              src={selectedEvidencia.evidencia}
              alt={`Evidencia de ${selectedEvidencia.actividad}`}
              width={1200}
              height={800}
              className="w-full h-auto object-contain"
              priority
              quality={100}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

const MomentoSection = ({ momento, calificaciones }) => {
  // Agrupar calificaciones por materia
  const calificacionesPorMateria = calificaciones.reduce((acc, cal) => {
    const key = `${cal.materia}-${cal.profesor}`;
    if (!acc[key]) {
      acc[key] = {
        materia: cal.materia,
        profesor: cal.profesor,
        calificaciones: []
      };
    }
    acc[key].calificaciones.push(cal);
    return acc;
  }, {});

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Momento {momento}
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {Object.values(calificacionesPorMateria).map((grupo, index) => (
          <CalificacionCard 
            key={index}
            materia={grupo.materia}
            profesor={grupo.profesor}
            calificaciones={grupo.calificaciones}
          />
        ))}
      </div>
    </div>
  );
};

const AulaCard = ({ aula }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-xl p-6 mb-8 border border-gray-100">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">{aula.nombre}</h2>
        <p className="text-sm text-gray-600">Año: {aula.año} - Sección: {aula.seccion}</p>
      </div>
      <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
      </div>
    </div>
    {Object.entries(aula.momentos).map(([momento, calificaciones]) => (
      <MomentoSection key={momento} momento={momento} calificaciones={calificaciones} />
    ))}
  </div>
);

export default function AlumnosPage() {
  const [userData, setUserData] = useState(null);
  const [calificaciones, setCalificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Obtener los datos de usuario de las cookies
        const permisosStr = document.cookie
          .split('; ')
          .find(row => row.startsWith('permisos='));

        if (!permisosStr) {
          console.log('No se encontraron permisos');
          router.push('/');
          return;
        }

        // Decodificar los datos
        const permisos = JSON.parse(decodeURIComponent(permisosStr.split('=')[1]));
        console.log('Datos de usuario encontrados:', permisos);

        if (!permisos || permisos.userType !== 'alumno') {
          console.log('Usuario no es estudiante');
          router.push('/');
          return;
        }

        setUserData(permisos);

        // Cargar calificaciones
        const response = await fetch(`/api/calificaciones/aula?cedula=${permisos.idA}`);
        const data = await response.json();

        if (data.success) {
          setCalificaciones(data.data);
        } else {
          console.error('Error al cargar calificaciones:', data.message);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-400 to-blue-200">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
                Portal del Estudiante
              </h1>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-gray-900 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 shadow-lg"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="space-y-8">
          {/* Información Personal */}
          <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
                Información Personal
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <ProfileCard label="Cédula" value={userData.idA} />
              <ProfileCard label="Nombre" value={userData.userName} />
              <ProfileCard label="Apellido" value={userData.userLastName} />
            </div>
          </div>

          {/* Calificaciones por Aula */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-700 to-blue-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-600">
                Calificaciones por Aula
              </h2>
            </div>

            {calificaciones.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 text-center text-gray-600">
                No se encontraron calificaciones registradas.
              </div>
            ) : (
              calificaciones.map((aula, index) => (
                <AulaCard key={index} aula={aula} />
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

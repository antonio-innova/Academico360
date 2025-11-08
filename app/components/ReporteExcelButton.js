'use client';

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import confetti from 'canvas-confetti';

const ReporteExcelButton = ({ tipoReporte, label, className, showConfetti = true }) => {
  const [generando, setGenerando] = useState(false);

  const handleGenerarReporte = async () => {
    try {
      setGenerando(true);
      
      // Construir la URL para la solicitud del reporte Excel
      const url = `/api/reportes/excel?tipoReporte=${tipoReporte}`;
      
      // Realizar la solicitud para descargar el archivo
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al generar el reporte: ${response.status}`);
      }
      
      // Obtener el blob del archivo Excel
      const blob = await response.blob();
      
      // Crear un objeto URL para el blob
      const fileUrl = URL.createObjectURL(blob);
      
      // Crear un enlace temporal para descargar el archivo
      const a = document.createElement('a');
      a.href = fileUrl;
      
      // Obtener el nombre del archivo desde los headers o usar uno predeterminado
      const contentDisposition = response.headers.get('Content-Disposition');
      const fileName = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `Reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      a.download = fileName;
      
      // Hacer clic en el enlace para iniciar la descarga
      document.body.appendChild(a);
      a.click();
      
      // Limpiar
      document.body.removeChild(a);
      URL.revokeObjectURL(fileUrl);
      
      // Mostrar mensaje de éxito
      toast.success('¡Reporte Excel generado con éxito!', {
        position: 'top-center',
        autoClose: 3000,
      });
      
      // Lanzar confetti si está habilitado
      if (showConfetti) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error al generar el reporte Excel:', error);
      toast.error('Error al generar el reporte Excel', {
        position: 'top-center',
        autoClose: 3000,
      });
    } finally {
      setGenerando(false);
    }
  };

  return (
    <button
      onClick={handleGenerarReporte}
      disabled={generando}
      className={`${className || 'px-4 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center'}`}
    >
      {generando ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Generando...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {label || 'Generar Reporte Excel'}
        </>
      )}
    </button>
  );
};

export default ReporteExcelButton;

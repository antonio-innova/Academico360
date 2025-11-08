"use client";

import { useState } from 'react';
import { firmarPDF, descargarPDFFirmado } from '../utils/firmaDigital';

export default function ModalFirmaDigital({ 
  isOpen, 
  onClose, 
  pdfBlob, 
  nombreArchivo,
  onFirmaCompletada 
}) {
  const [p12Base64, setP12Base64] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isFirmando, setIsFirmando] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Función para manejar la selección del archivo P12
  const handleP12FileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remover el prefijo data:application/x-pkcs12;base64,
        setP12Base64(base64);
      };
      reader.readAsDataURL(file);
    }
  };



  // Función para firmar el PDF
  const handleFirmar = async () => {
    if (!p12Base64 || !passphrase) {
      setError('Por favor, selecciona el certificado P12 e ingresa la contraseña');
      return;
    }

    try {
      setIsFirmando(true);
      setError('');
      setSuccess('');

      // Firmar el PDF
      const pdfFirmado = await firmarPDF(pdfBlob, p12Base64, passphrase);
      
      // Descargar el PDF firmado
      const nombreFirmado = nombreArchivo ? 
        nombreArchivo.replace('.pdf', '_firmado.pdf') : 
        'documento_firmado.pdf';
      
      descargarPDFFirmado(pdfFirmado, nombreFirmado);
      
      setSuccess('PDF firmado exitosamente y descargado');
      
      // Limpiar el formulario
      setP12Base64('');
      setPassphrase('');
      
      // Notificar al componente padre
      if (onFirmaCompletada) {
        onFirmaCompletada(pdfFirmado);
      }
      
      // Cerrar el modal después de un breve retraso
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Error al firmar:', error);
      setError(`Error al firmar el PDF: ${error.message}`);
    } finally {
      setIsFirmando(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = () => {
    setP12Base64('');
    setPassphrase('');
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Firmar Documento</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">

          {/* Campo para archivo P12 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Certificado Digital (.p12)
            </label>
            <input
              type="file"
              accept=".p12"
              onChange={handleP12FileChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {p12Base64 && (
              <p className="text-sm text-green-600 mt-1">✓ Certificado seleccionado</p>
            )}
          </div>

          {/* Campo para passphrase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña del Certificado
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Ingresa la contraseña del certificado"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Mensajes de error y éxito */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleFirmar}
              disabled={!p12Base64 || !passphrase || isFirmando}
              className={`flex-1 px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                !p12Base64 || !passphrase || isFirmando
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isFirmando ? 'Firmando...' : 'Firmar PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

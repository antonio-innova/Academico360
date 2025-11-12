"use client";

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
// Usaremos un sistema de alertas personalizado en lugar de react-toastify
import { mostrarElemento, esDocente, esControl, ocultarElementoCSS } from '../components/PermisosHelper';
import { getFormValue, isFormAvailable } from '../components/SafeFormAccess';
import { formatearNombreCompleto } from '../components/FormatearNombre';
import StudentNameDisplay, { formatFullName } from '../components/StudentNameDisplay';
import StudentNameById from '../components/StudentNameById';
import GestionRepresentante from '../components/GestionRepresentante';
import * as XLSX from 'xlsx';
import { loadDriver } from '../utils/driverLoader';

export default function SidebarPage() {

  // Definición de materias por año
  const materiasPorAnio = {
    '1 año': [
      { id: 'CAS-1', nombre: 'Castellano', codigo: 'CAS-1', letras: 'DECENTE' },
      { id: 'ILE-1', nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-1', letras: 'CATOLIC' },
      { id: 'MA-1', nombre: 'Matemáticas', codigo: 'MA-1', letras: 'DECIMO' },
      { id: 'EF-1', nombre: 'Educación Física', codigo: 'EF-1', letras: 'NOTABL' },
      { id: 'AP-1', nombre: 'Arte y Patrimonio', codigo: 'AP-1', letras: 'DECENTE' },
      { id: 'CN-1', nombre: 'Ciencias Naturales', codigo: 'CN-1', letras: 'DEODIO' },
      { id: 'GHC-1', nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-1', letras: 'DECENTE' },
      { id: 'O-1', nombre: 'Orientación', codigo: 'O-1', letras: 'ORIENTACION' },
      { id: 'CRP-1', nombre: 'Grupo y Participación', codigo: 'CRP-1', letras: 'GRUPO' }
      
    ],
    '2 año': [
      { id: 'CAS-2', nombre: 'Castellano', codigo: 'CAS-2', letras: 'DECENTE' },
      { id: 'ILE-2', nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-2', letras: 'DEODIO' },
      { id: 'MA-2', nombre: 'Matemáticas', codigo: 'MA-2', letras: 'DECENTE' },
      { id: 'EF-2', nombre: 'Educación Física', codigo: 'EF-2', letras: 'DECENTE' },
      { id: 'AP-2', nombre: 'Arte y Patrimonio', codigo: 'AP-2', letras: 'VENTE' },
      { id: 'CN-2', nombre: 'Ciencias Naturales', codigo: 'CN-2', letras: 'DIECIEVE' },
      { id: 'GHC-2', nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-2', letras: 'VENTE' },
      { id: 'O-2', nombre: 'Orientación', codigo: 'O-2', letras: 'ORIENTACION' },
      { id: 'CRP-2', nombre: 'Grupo y Participación', codigo: 'CRP-2', letras: 'GRUPO' }
    ],
    '3 año': [
      { id: 'CAS-3', nombre: 'Castellano', codigo: 'CAS-3', letras: 'DEODIO' },
      { id: 'ILE-3', nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-3', letras: 'DECENTE' },
      { id: 'MA-3', nombre: 'Matemáticas', codigo: 'MA-3', letras: 'DEODIO' },
      { id: 'EF-3', nombre: 'Educación Física', codigo: 'EF-3', letras: 'DEODIO' },
      { id: 'FIS-3', nombre: 'Física', codigo: 'FIS-3', letras: 'DECENTE' },
      { id: 'QUI-3', nombre: 'Química', codigo: 'QUI-3', letras: 'DEODIO' },
      { id: 'BIO-3', nombre: 'Biología', codigo: 'BIO-3', letras: 'DEODIO' },
      { id: 'GHC-3', nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-3', letras: 'VENTE' },
      { id: 'O-3', nombre: 'Orientación', codigo: 'O-3', letras: 'ORIENTACION' },
      { id: 'CRP-3', nombre: 'Grupo y Participación', codigo: 'CRP-3', letras: 'GRUPO' }
    ],
    '4 año': [
      { id: 'CAS-4', nombre: 'Castellano', codigo: 'CAS-4', letras: 'DECENTE' },
      { id: 'ILE-4', nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-4', letras: 'DECENTE' },
      { id: 'MA-4', nombre: 'Matemáticas', codigo: 'MA-4', letras: 'DECENTE' },
      { id: 'EF-4', nombre: 'Educación Física', codigo: 'EF-4', letras: 'DECENTE' },
      { id: 'FIS-4', nombre: 'Física', codigo: 'FIS-4', letras: 'DECENTE' },
      { id: 'QUI-4', nombre: 'Química', codigo: 'QUI-4', letras: 'DEODIO' },
      { id: 'BIO-4', nombre: 'Biología', codigo: 'BIO-4', letras: 'DEODIO' },
      { id: 'GHC-4', nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-4', letras: 'DECENTE' },
      { id: 'FSN-4', nombre: 'Formación para la Soberanía Nacional', codigo: 'FSN-4', letras: 'DIECIEVE' },
      { id: 'O-4', nombre: 'Orientación', codigo: 'O-4', letras: 'ORIENTACION' },
      { id: 'CRP-4', nombre: 'Grupo y Participación', codigo: 'CRP-4', letras: 'GRUPO' }
    ],
    '5 año': [
      { id: 'CAS-5', nombre: 'Castellano', codigo: 'CAS-5', letras: 'NOTABL' },
      { id: 'ILE-5', nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-5', letras: 'REGU' },
      { id: 'MA-5', nombre: 'Matemáticas', codigo: 'MA-5', letras: 'QUINCE' },
      { id: 'EF-5', nombre: 'Educación Física', codigo: 'EF-5', letras: 'QUINCE' },
      { id: 'FIS-5', nombre: 'Física', codigo: 'FIS-5', letras: 'CATORC' },
      { id: 'QUI-5', nombre: 'Química', codigo: 'QUI-5', letras: 'TRECE' },
      { id: 'BIO-5', nombre: 'Biología', codigo: 'BIO-5', letras: 'DOCE' },
      { id: 'CDT-5', nombre: 'Ciencias de la Tierra', codigo: 'CDT-5', letras: 'CATORC' },
      { id: 'GHC-5', nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-5', letras: 'DOCE' },
      { id: 'FSN-5', nombre: 'Formación para la Soberanía Nacional', codigo: 'FSN-5', letras: 'TRESE' },
      { id: 'O-5', nombre: 'Orientación', codigo: 'O-5', letras: 'ORIENTACION' },
      { id: 'CRP-5', nombre: 'Grupo y Participación', codigo: 'CRP-5', letras: 'GRUPO' }
    ]
  };

  // Estados para manejar los datos y la interfaz
  const [activeTab, setActiveTab] = useState('aulas'); // Iniciar con aulas como pestaña activa
  const [aulas, setAulas] = useState([]);
  const [aulaToDelete, setAulaToDelete] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alert, setAlert] = useState(null); // Estado para manejar las aulas
  const [showAulaForm, setShowAulaForm] = useState(false); // Estado para mostrar/ocultar formulario de aula
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false); // Estado para mostrar modal de agregar estudiantes
  const [aulaToAddStudents, setAulaToAddStudents] = useState(null); // Aula seleccionada para agregar estudiantes
  const [availableStudents, setAvailableStudents] = useState([]); // Estudiantes disponibles para agregar
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState([]); // Estudiantes seleccionados para agregar
  
  // Estados para gestión de profesores por materia
  const [showGestionProfesoresModal, setShowGestionProfesoresModal] = useState(false);
  const [aulaGestionProfesores, setAulaGestionProfesores] = useState(null);
  const [profesoresDisponibles, setProfesoresDisponibles] = useState([]);
  const [asignacionesAula, setAsignacionesAula] = useState([]);
  const startDashboardTour = useCallback(async () => {
    try {
      const driverFn = await loadDriver();
      if (!driverFn) {
        alert('No fue posible iniciar la guía.');
        return;
      }

      const stepDefinitions = [
        {
          element: '#sidebar-menu',
          popover: {
            title: 'Menú Principal',
            description: 'Desde aquí puedes acceder a la gestión de alumnos, docentes, aulas, reportes, boletines y asistencia.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-docentes',
          popover: {
            title: 'Gestión de Docentes',
            description: 'Administra información de los profesores y sus credenciales de acceso.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-alumnos',
          popover: {
            title: 'Gestión de Alumnos',
            description: 'Crea o edita alumnos, actualiza representantes y controla su estado académico.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-aulas',
          popover: {
            title: 'Creación de Aulas',
            description: 'Organiza secciones, asigna estudiantes, materias y profesores por aula.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-reportes',
          popover: {
            title: 'Reportes y Boletines',
            description: 'Genera reportes en Excel, boletines en PDF y formatos oficiales.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-notas',
          popover: {
            title: 'Notas Certificadas',
            description: 'Registra y descarga notas certificadas para trámites oficiales.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#nav-asistencia',
          popover: {
            title: 'Módulo de Asistencia',
            description: 'Controla asistencia diaria, retrasos y observaciones por aula.',
            side: 'right',
            align: 'center'
          }
        },
        {
          element: '#dashboard-content',
          popover: {
            title: 'Zona de Trabajo',
            description: 'Dependiendo del módulo seleccionado, aquí aparecerán formularios, tablas y acciones disponibles.',
            side: 'top',
            align: 'center'
          }
        }
      ];

      const steps = stepDefinitions.filter((step) => {
        if (typeof window === 'undefined') return false;
        if (typeof step.element === 'string') {
          return Boolean(document.querySelector(step.element));
        }
        if (typeof step.element === 'function') {
          try {
            return Boolean(step.element());
          } catch (error) {
            return false;
          }
        }
        return false;
      });

      if (steps.length === 0) {
        alert('No se encontraron elementos para la guía en esta vista.');
        return;
      }

      const tour = driverFn({
        showProgress: true,
        steps
      });

      tour.drive();
    } catch (error) {
      console.error('Error al iniciar la guía:', error);
      alert('No fue posible iniciar la guía.');
    }
  }, []);

  // Cargar aulas y otros datos al iniciar
  useEffect(() => {
    const init = async () => {
      await loadAulas();
      // Cargar otros datos necesarios aquí
    };
    init();
  }, []);
  const [aulaFormData, setAulaFormData] = useState({
    nombre: '',
    anio: '1',
    seccion: 'A',
    turno: 'Mañana',
    periodo: '',
    estudiantes: [],
    materias: []
  });
  const [periodoType, setPeriodoType] = useState('nuevo');
  const [periodosExistentes, setPeriodosExistentes] = useState([]);
  // Estados para Planilla (Excel)
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [excelSheetNames, setExcelSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [excelFileName, setExcelFileName] = useState('');
  const [excelWorkbook, setExcelWorkbook] = useState(null);
  const [excelHtml, setExcelHtml] = useState('');
  const [planillaView, setPlanillaView] = useState('preview'); // 'preview' | 'edit'
  const [sheetRef, setSheetRef] = useState(''); // rango !ref de la hoja para mapear celdas

  // Estado Notas Certificadas
  const getMateriasByGrado = (grado) => (materiasPorAnio[`${grado} año`] || []);
  const [notesSubTab, setNotesSubTab] = useState('agregar');
  const [notaTipoFormato, setNotaTipoFormato] = useState('1-3'); // '1-3' o '1-5'
  const [notaInstitucion, setNotaInstitucion] = useState({ entidadFederal: '', cdcee: '', codigo: '', planteles: [] });
  const [notaEst, setNotaEst] = useState({ cedula: '', nombres: '', apellidos: '', fechaNacimiento: '', pais: 'VENEZUELA', estado: '', municipio: '' });
  const [notaPlan, setNotaPlan] = useState([{ grado: '1', materias: getMateriasByGrado('1').map(m=>({ nombre: m.nombre, numero:'', letras:'', te:'F', fechaMes:'', fechaAnio:'', plantelNumero:'' })) }]);
  const [savingNotas, setSavingNotas] = useState(false);
  const [previewNotasVisible, setPreviewNotasVisible] = useState(false);
  const [previewNotasHtml, setPreviewNotasHtml] = useState('');
  const [previewNotasBlob, setPreviewNotasBlob] = useState(null);
  const [previewNotasFileName, setPreviewNotasFileName] = useState('');

  // Estados para inscripción de alumnos
  const [showInscripcionModal, setShowInscripcionModal] = useState(false);
  const [alumnoParaInscribir, setAlumnoParaInscribir] = useState(null);
  const [aulasDisponibles, setAulasDisponibles] = useState([]);
  const [aulaSeleccionada, setAulaSeleccionada] = useState('');

  const addAnio = () => setNotaPlan(prev => [...prev, { grado: '1', materias: getMateriasByGrado('1').map(m=>({ nombre: m.nombre, numero:'', letras:'', te:'F', fechaMes:'', fechaAnio:'', plantelNumero:'' })) }]);

  // Función de prueba para agregar planteles automáticamente
  const agregarPlantelesPrueba = () => {
    setNotaInstitucion(prev => ({
      ...prev,
      planteles: [
        { numero: '1', nombre: 'Plantel Principal', localidad: 'Valera', ef: 'Trujillo' },
        { numero: '2', nombre: 'Plantel Secundario', localidad: 'San Rafael', ef: 'Trujillo' },
        { numero: '3', nombre: 'Plantel Norte', localidad: 'La Puerta', ef: 'Trujillo' }
      ]
    }));
    console.log('Planteles de prueba agregados');
  };
  const updatePlanGrado = (idx, grado) => setNotaPlan(prev => prev.map((a,i)=> {
    if (i!==idx) return a;
    const materiasAuto = getMateriasByGrado(grado).map(m=>({ nombre: m.nombre, numero:'', letras:'', te:'F', fechaMes:'', fechaAnio:'', plantelNumero:'' }));
    return { ...a, grado, materias: materiasAuto };
  }));
  const numToLetras = (valor) => {
    const mapa = {
      1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
      6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
      11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
      16: 'dieciséis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte'
    };
    const n = parseInt(valor, 10);
    if (!Number.isFinite(n)) return '';
    if (n < 1 || n > 20) return '';
    return mapa[n] || '';
  };
  const pad2 = (v) => {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return '';
    return String(Math.max(1, Math.min(20, n))).padStart(2, '0');
  };
  const isMateriaEspecial = (name) => {
    const s = String(name||'').toLowerCase();
    return s.includes('orientación') || s.includes('orientacion') || s.includes('grupo y participacion') || s.includes('grupo y participación');
  };
  const updateMateria = (anioIdx, mIdx, key, val) => setNotaPlan(prev => prev.map((a,i)=> {
    if (i!==anioIdx) return a;
    const materias = a.materias.map((m,mi)=> {
      if (mi!==mIdx) return m;
      if (key === 'nombre') {
        const nuevo = { ...m, nombre: val };
        if (isMateriaEspecial(val)) {
          nuevo.numero = '';
        }
        return nuevo;
      }
      if (key === 'numero') {
        // No permitir número para materias especiales
        if (isMateriaEspecial(m.nombre)) {
          return { ...m, numero: '' };
        }
        const numStr = val;
        const letras = numToLetras(numStr);
        return { ...m, numero: numStr, letras };
      }
      if (key === 'te') {
        return { ...m, te: 'F' };
      }
      return { ...m, [key]: val };
    });
    return { ...a, materias };
  }));

  const handleNotasSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingNotas(true);
      console.log('Datos a enviar:', { institucion: notaInstitucion, estudiante: notaEst, planEstudio: notaPlan });
      const res = await fetch('/api/notascertificadas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ institucion: notaInstitucion, estudiante: notaEst, planEstudio: notaPlan })
      });
      const result = await res.json();
      if (result.success) {
        setNotification({ type: 'success', message: 'Nota certificada guardada' });
      } else {
        setNotification({ type: 'error', message: result.message || 'Error al guardar' });
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setSavingNotas(false);
      setTimeout(()=> setNotification(null), 3000);
    }
  };

  const handleGenerarExcelNotas = async () => {
    try {
      console.log('Generando Excel con datos:', { institucion: notaInstitucion, estudiante: notaEst, planEstudio: notaPlan, tipoFormato: notaTipoFormato });
      
      // Seleccionar la ruta según el tipo de formato
      const endpoint = notaTipoFormato === '1-5' 
        ? '/api/notascertificadas/excel-quinto' 
        : '/api/notascertificadas/excel';
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudiante: notaEst, institucion: notaInstitucion, planEstudio: notaPlan })
      });
      if (!res.ok) throw new Error('No se pudo generar el Excel');
      const blob = await res.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Generar HTML con estilos mejorados para mejor visualización
      const html = XLSX.utils.sheet_to_html(worksheet, { 
        header: '<style>table { border-collapse: collapse; width: 100%; } td, th { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background-color: #4472C4; color: white; }</style>', 
        footer: '' 
      });

      const contentDisposition = res.headers.get('Content-Disposition');
      const fileName = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `nota_certificada_${notaTipoFormato}_${notaEst.cedula || 'estudiante'}.xlsx`;

      // Crear URL del blob para vista previa
      const blobUrl = window.URL.createObjectURL(blob);

      setPreviewNotasBlob(blob);
      setPreviewNotasHtml(html);
      setPreviewNotasFileName(fileName);
      setPreviewNotasVisible(true);
      setNotification({ type: 'info', message: 'Previsualiza el Excel antes de descargarlo.' });
      setTimeout(()=> setNotification(null), 3000);
    } catch (err) {
      setNotification({ type: 'error', message: err.message });
      setTimeout(()=> setNotification(null), 3000);
    }
  };

  const descargarNotasPreview = async () => {
    if (!previewNotasBlob) return;
    
    try {
      setNotification({ type: 'info', message: 'Convirtiendo Excel a PDF...' });
      
      // Crear FormData para enviar el archivo Excel
      const formData = new FormData();
      formData.append('file', previewNotasBlob, previewNotasFileName);
      formData.append('fileName', previewNotasFileName);

      // Llamar al endpoint de conversión
      const response = await fetch('/api/notascertificadas/convert-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al convertir Excel a PDF');
      }

      // Descargar el PDF
      const pdfBlob = await response.blob();
      const pdfFileName = previewNotasFileName.replace('.xlsx', '.pdf').replace('.xls', '.pdf');
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdfFileName;
      a.click();
      window.URL.revokeObjectURL(url);
      
      setNotification({ type: 'success', message: 'PDF descargado exitosamente' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      setNotification({ type: 'error', message: 'Error al convertir a PDF. Descargando Excel...' });
      
      // Fallback: descargar el Excel original
      const url = window.URL.createObjectURL(previewNotasBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = previewNotasFileName || 'nota_certificada.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
      
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const descargarExcelOriginal = () => {
    if (!previewNotasBlob) return;
    const url = window.URL.createObjectURL(previewNotasBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = previewNotasFileName || 'nota_certificada.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
    setNotification({ type: 'success', message: 'Excel descargado exitosamente' });
    setTimeout(() => setNotification(null), 3000);
  };

  const setFechaAnioParaTodo = (anioIdx) => {
    const mes = prompt('Mes (01-12):', '01');
    if (!mes || !/^\d{2}$/.test(mes)) return;
    const anio = prompt('Año (YYYY):', new Date().getFullYear().toString());
    if (!anio || !/^\d{4}$/.test(anio)) return;
    setNotaPlan(prev => prev.map((a,i)=> {
      if (i!==anioIdx) return a;
      const materias = a.materias.map(m => ({ ...m, fechaMes: mes, fechaAnio: anio }));
      return { ...a, materias };
    }));
  };

  const handleExcelUpload = async (event) => {
    try {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      setExcelFileName(file.name);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      setExcelWorkbook(workbook);
      const firstSheetName = workbook.SheetNames[0];
      setExcelSheetNames(workbook.SheetNames);
      setSelectedSheet(firstSheetName);
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankrows: true, defval: '' });
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);
      setExcelHeaders(headers);
      setExcelData(dataRows);
      // Guardar rango para mapear direcciones
      setSheetRef(worksheet['!ref'] || `A1:${XLSX.utils.encode_cell({ r: rows.length - 1, c: (headers.length || 1) - 1 })}`);
      // Generar HTML de vista previa editable conservando el formato
      const html = XLSX.utils.sheet_to_html(worksheet, { editable: true });
      setExcelHtml(html);
      setNotification({ type: 'success', message: 'Planilla cargada correctamente' });
    } catch (error) {
      console.error('Error al leer Excel:', error);
      setNotification({ type: 'error', message: 'No se pudo leer el archivo Excel' });
    }
  };

  const changeSheet = (name) => {
    try {
      if (!excelWorkbook) return;
      setSelectedSheet(name);
      const ws = excelWorkbook.Sheets[name];
      if (!ws) return;
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true, defval: '' });
      setExcelHeaders(rows[0] || []);
      setExcelData(rows.slice(1));
      setSheetRef(ws['!ref'] || `A1:${XLSX.utils.encode_cell({ r: rows.length - 1, c: ((rows[0]||[]).length || 1) - 1 })}`);
      const html = XLSX.utils.sheet_to_html(ws, { editable: true });
      setExcelHtml(html);
    } catch (error) {
      console.error('Error al cambiar de hoja:', error);
    }
  };

  // Sin sincronización desde vista original: se mantiene intacta para no alterar formato

  const updateCellValue = (rowIndex, colIndex, value) => {
    setExcelData((prev) => {
      const next = prev.map((r) => [...r]);
      if (!next[rowIndex]) next[rowIndex] = [];
      next[rowIndex][colIndex] = value;
      return next;
    });
  };

  const addRowToExcel = () => {
    setExcelData((prev) => [...prev, Array(excelHeaders.length).fill('')]);
  };

  const downloadEditedExcel = () => {
    try {
      // Si tenemos workbook original, escribimos solo valores de celdas manteniendo estilos
      let wb = excelWorkbook;
      if (!wb) {
        wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([excelHeaders, ...excelData]);
        XLSX.utils.book_append_sheet(wb, ws, selectedSheet || 'Hoja1');
      } else if (selectedSheet) {
        const ws = wb.Sheets[selectedSheet];
        if (ws) {
          // Mapear AOA a celdas respetando !ref
          const start = XLSX.utils.decode_range(ws['!ref'] || sheetRef || 'A1');
          // Primera fila: headers
          excelHeaders.forEach((val, c) => {
            const cellAddr = XLSX.utils.encode_cell({ r: start.s.r, c: start.s.c + c });
            ws[cellAddr] = ws[cellAddr] || {};
            ws[cellAddr].v = val;
            ws[cellAddr].t = 's';
          });
          // Filas siguientes: datos
          excelData.forEach((row, r) => {
            row.forEach((val, c) => {
              const cellAddr = XLSX.utils.encode_cell({ r: start.s.r + 1 + r, c: start.s.c + c });
              ws[cellAddr] = ws[cellAddr] || {};
              // tipo básico: número o texto
              const num = Number(val);
              if (!Number.isNaN(num) && String(val).trim() !== '') {
                ws[cellAddr].v = num;
                ws[cellAddr].t = 'n';
              } else {
                ws[cellAddr].v = val ?? '';
                ws[cellAddr].t = 's';
              }
            });
          });
        }
      }
      const wbArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = excelFileName ? `editado_${excelFileName}` : 'planilla_profesores.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      setNotification({ type: 'success', message: 'Excel descargado' });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      setNotification({ type: 'error', message: 'No se pudo exportar el Excel' });
    }
  };

  const cargarPlantillaProfesores = () => {
    const headers = ['Cédula', 'Nombre', 'Apellido', 'Email', 'Teléfono', 'Especialidad', 'Estado', 'Fecha de Ingreso'];
    setExcelHeaders(headers);
    setExcelData([]);
    setExcelSheetNames(['Profesores']);
    setSelectedSheet('Profesores');
    setExcelFileName('plantilla_profesores.xlsx');
  };

  // Función para cargar estudiantes de un aula
  const cargarEstudiantesAula = async (aulaId) => {
    try {
      const response = await fetch(`/api/aulas/${aulaId}/estudiantes`);
      const data = await response.json();
      if (data.success) {
        setEstudiantesPorAula(prev => ({
          ...prev,
          [aulaId]: data.estudiantes
        }));
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  // Función para generar reportes PDF
  const generarReporte = async (momento, aulaId, formatoRendimiento = false) => {
    try {
      setLoading(true);
      
      // Construir la URL con los parámetros necesarios
      let url;
      
      if (formatoRendimiento) {
        // Usar la nueva ruta para formato de rendimiento
        url = new URL('/api/formatoRendimiento', window.location.origin);
        url.searchParams.append('academicYear', selectedAcademicYear);
      } else {
        // Usar la ruta existente para reportes normales
        url = new URL('/api/reportes', window.location.origin);
        url.searchParams.append('aulaId', aulaId);
        url.searchParams.append('momento', momento);
        if (selectedStudent) {
          url.searchParams.append('studentId', selectedStudent);
        }
      }

      const response = await fetch(url.toString(), {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Error al generar reporte: ${response.statusText}`);
      }
      
      // Obtener el blob del PDF
      const blob = await response.blob();
      
      // Crear una URL para el blob
      const pdfUrl = URL.createObjectURL(blob);
      
      // Crear un elemento <a> para descargar el PDF
      const a = document.createElement('a');
      a.href = pdfUrl;
      
      // Obtener el nombre del archivo desde los headers o usar uno predeterminado
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = `reporte-momento${momento}.pdf`;
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1].replace(/['"]/g, '');
        }
      } else if (formatoRendimiento) {
        fileName = `formato-rendimiento-${selectedAcademicYear}.pdf`;
      } else {
        const estudianteText = selectedStudent ? '-estudiante' : '';
        fileName = `reporte-${momento}momento${estudianteText}.pdf`;
      }
      
      a.download = fileName;
      
      // Agregar al DOM, hacer clic y remover
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Liberar la URL del blob después de un momento
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);
      
      // Mostrar mensaje de éxito
      let successMessage;
      if (formatoRendimiento) {
        successMessage = `Formato de Rendimiento para ${selectedAcademicYear} año generado con éxito`;
      } else {
        const studentText = selectedStudent ? 'para el estudiante seleccionado' : 'para todos los estudiantes';
        successMessage = `Reporte del ${momento}° momento generado con éxito ${studentText}`;
      }
      setNotification({ 
        type: 'success', 
        message: successMessage 
      });
    } catch (error) {
      console.error('Error al generar reporte:', error);
      setNotification({ 
        type: 'error', 
        message: `Error al generar reporte: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar periodos existentes
  const loadPeriodos = async () => {
    try {
      const response = await fetch('/api/aulas');
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Obtener periodos únicos
        const periodos = [...new Set(result.data.map(aula => aula.periodo))];
        setPeriodosExistentes(periodos);
      }
    } catch (error) {
      console.error('Error al cargar periodos:', error);
    }
  };

  // Cargar periodos al montar el componente
  useEffect(() => {
    loadPeriodos();
  }, []);
  // Estados principales
  const [userType, setUserType] = useState(null); // Estado para almacenar el tipo de usuario
  const [userData, setUserData] = useState(null);
  const [institucion, setInstitucion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  
  // Estados para gestión de datos
  const [docentes, setDocentes] = useState([]);
  const [loadingProfesores, setLoadingProfesores] = useState(true);
  const [alumnos, setAlumnos] = useState([]);
  const [estudiantesDisponibles, setEstudiantesDisponibles] = useState([]);
  const [materiasSeleccionadas, setMateriasSeleccionadas] = useState([]);
  const [materiasHabilitadas, setMateriasHabilitadas] = useState([]);
  
  // Estados para reportes
  const [selectedAula, setSelectedAula] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [estudiantesPorAula, setEstudiantesPorAula] = useState({});
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('1');
  
  // Estados para asistencia
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({}); // {studentId: {estado: 'presente'|'ausente'|'tardanza', razon: string}}
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [selectedMateria, setSelectedMateria] = useState(''); // Materia seleccionada para control
  
  // Estados para reporte de asistencia
  const [reportAula, setReportAula] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportMateria, setReportMateria] = useState(''); // Materia seleccionada para reporte
  
  // Estado para las sub-pestañas de asistencia
  const [attendanceSubTab, setAttendanceSubTab] = useState('control'); // 'control' o 'reporte'
  const [materias, setMaterias] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoActual, setPeriodoActual] = useState(null);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  
  // Estados para modales
  const [showModal, setShowModal] = useState(false);
  const [showAvanzarGradoModal, setShowAvanzarGradoModal] = useState(false);
  const [aulaToAvanzar, setAulaToAvanzar] = useState(null);
  const [nuevoAnio, setNuevoAnio] = useState('');
  const [nuevaSeccion, setNuevaSeccion] = useState('');
  const [avanzandoGrado, setAvanzandoGrado] = useState(false);
  
  // Estados para eliminar estudiantes
  const [showDeleteStudentsModal, setShowDeleteStudentsModal] = useState(false);
  const [aulaToDeleteStudents, setAulaToDeleteStudents] = useState(null);
  const [estudiantesAula, setEstudiantesAula] = useState([]);
  const [selectedStudentsToDelete, setSelectedStudentsToDelete] = useState([]);
  const [eliminandoEstudiantes, setEliminandoEstudiantes] = useState(false);

  // Cargar profesores cuando se muestra el formulario de aula
  useEffect(() => {
    if (showAulaForm) {
      loadProfesoresDisponibles();
    }
  }, [showAulaForm]);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);
  // Estado para edición de profesor
  const [editingAsignacionId, setEditingAsignacionId] = useState(null);
  const [editingProfesorId, setEditingProfesorId] = useState('');
  // Estado para notificaciones
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: string }
  
  // Efecto para cerrar el modal al cargar la página
  useEffect(() => {
    setShowModal(false);
    setModalType('');
    setModalData(null);
  }, []);
  
  // Función para cargar estudiantes disponibles
  const loadEstudiantesDisponibles = async () => {
    try {
      console.log('Cargando estudiantes...');
      const response = await fetch('/api/estudiantes');
      if (response.ok) {
        const result = await response.json();
        console.log('Respuesta del servidor:', result);
        if (result.success && result.data) {
          const estudiantes = result.data;
          console.log('Estudiantes cargados:', estudiantes);
          setEstudiantesDisponibles(estudiantes);
        } else {
          console.error('Error en la respuesta:', result.message);
        }
      } else {
        console.error('Error en la petición:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes:', error);
    }
  };

  // Función para cargar profesores
  const loadProfesoresDisponibles = async () => {
    try {
      setLoadingProfesores(true);
      console.log('Cargando profesores...');
      const response = await fetch('/api/profesores');
      const result = await response.json();
      console.log('Respuesta del servidor profesores:', result);

      if (result.success && Array.isArray(result.data)) {
        const profesores = result.data;
        console.log('Profesores cargados:', profesores);
        setDocentes(profesores);
        setProfesoresDisponibles(profesores); // También actualizar el estado para gestión de profesores
      } else {
        console.error('Error en la respuesta:', result.message);
        setDocentes([]);
        setProfesoresDisponibles([]);
      }
    } catch (error) {
      console.error('Error al cargar profesores:', error);
      setDocentes([]);
      setProfesoresDisponibles([]);
    } finally {
      setLoadingProfesores(false);
    }
  };

  // Función para manejar la selección de estudiantes
  const handleEstudianteChange = (estudianteId, checked) => {
    setAulaFormData(prev => ({
      ...prev,
      estudiantes: checked
        ? [...prev.estudiantes, estudianteId]
        : prev.estudiantes.filter(id => id !== estudianteId)
    }));
  };

  // Función para manejar la asignación de profesores a materias
  const handleProfesorMateriaChange = (materiaId, profesorId) => {
    setMateriasSeleccionadas(prev => {
      const materiaExistente = prev.find(m => m.materiaId === materiaId);
      if (materiaExistente) {
        return prev.map(m => 
          m.materiaId === materiaId 
            ? { ...m, profesorId } 
            : m
        );
      }
      return [...prev, { materiaId, profesorId }];
    });
  };

  // Función para manejar la habilitación/deshabilitación de materias
  const handleMateriaHabilitadaChange = (materiaId, isEnabled) => {
    setMateriasHabilitadas(prev => {
      if (isEnabled) {
        // Agregar la materia si no está ya habilitada
        if (!prev.includes(materiaId)) {
          return [...prev, materiaId];
        }
        return prev;
      } else {
        // Remover la materia y también su asignación de profesor
        setMateriasSeleccionadas(prevSeleccionadas => 
          prevSeleccionadas.filter(m => m.materiaId !== materiaId)
        );
        return prev.filter(id => id !== materiaId);
      }
    });
  };

  // Función para manejar cambio de asistencia
  const handleAttendanceChange = (estudianteId, estado) => {
    if (estado === 'presente') {
      // Para presente no se necesita razón
      setAttendanceData(prev => ({ 
        ...prev, 
        [estudianteId]: { estado, razon: null } 
      }));
    } else {
      // Para ausente o tardanza, mostrar modal para razón
      setCurrentStudent(estudianteId);
      setCurrentStatus(estado);
      setReasonText('');
      setShowReasonModal(true);
    }
  };

  // Función para confirmar razón de ausencia/tardanza
  const confirmReason = () => {
    if (reasonText.trim()) {
      setAttendanceData(prev => ({ 
        ...prev, 
        [currentStudent]: { estado: currentStatus, razon: reasonText.trim() } 
      }));
      setShowReasonModal(false);
      setCurrentStudent(null);
      setCurrentStatus('');
      setReasonText('');
    }
  };

  // Función para guardar asistencia en la base de datos
  const saveAttendanceToDatabase = async () => {
    try {
      setSavingAttendance(true);
      console.log('Guardando asistencia:', {
        aulaId: selectedAula,
        fecha: selectedDate,
        materia: selectedMateria,
        asistencia: attendanceData
      });

      const response = await fetch('/api/asistencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aulaId: selectedAula,
          fecha: selectedDate,
          materia: selectedMateria,
          asistencia: attendanceData
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: `Asistencia guardada correctamente para ${Object.keys(attendanceData).length} estudiantes` 
        });
        console.log('Asistencia guardada exitosamente:', result.data);
      } else {
        setNotification({ 
          type: 'error', 
          message: result.message || 'Error al guardar la asistencia' 
        });
        console.error('Error al guardar asistencia:', result.message);
      }
    } catch (error) {
      console.error('Error al guardar asistencia:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error de conexión al guardar la asistencia' 
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Función para obtener reporte de asistencia
  const getAttendanceReport = async () => {
    if (!reportAula || !reportDate) {
      setNotification({ 
        type: 'error', 
        message: 'Por favor selecciona un aula y una fecha' 
      });
      return;
    }

    try {
      setLoadingReport(true);
      console.log('Obteniendo reporte de asistencia:', {
        aulaId: reportAula,
        fecha: reportDate,
        materia: reportMateria
      });

      let url = `/api/asistencia?aulaId=${reportAula}&fecha=${reportDate}`;
      if (reportMateria) {
        url += `&materia=${encodeURIComponent(reportMateria)}`;
      }
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setAttendanceReport(result.data);
        setNotification({ 
          type: 'success', 
          message: 'Reporte de asistencia cargado correctamente' 
        });
        console.log('Reporte obtenido:', result.data);
      } else {
        setAttendanceReport(null);
        setNotification({ 
          type: 'error', 
          message: result.message || 'No se encontró información de asistencia para la fecha seleccionada' 
        });
        console.error('Error al obtener reporte:', result.message);
      }
    } catch (error) {
      console.error('Error al obtener reporte de asistencia:', error);
      setAttendanceReport(null);
      setNotification({ 
        type: 'error', 
        message: 'Error de conexión al obtener el reporte' 
      });
    } finally {
      setLoadingReport(false);
    }
  };

  // Función para descargar reporte de asistencia en PDF
  const downloadAttendanceReportPDF = async () => {
    if (!attendanceReport || attendanceReport.length === 0) {
      setNotification({ 
        type: 'error', 
        message: 'No hay datos de reporte para descargar' 
      });
      return;
    }

    try {
      setLoadingReport(true);
      
      // Crear un nuevo documento PDF
      const pdfDoc = await PDFDocument.create();
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const page = pdfDoc.addPage([595.28, 841.89]); // Tamaño A4
      const { width, height } = page.getSize();
      
      let yPosition = height - 50;
      
      // Título del reporte
      page.drawText('REPORTE DE ASISTENCIA', {
        x: 50,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2)
      });
      
      yPosition -= 30;
      
      // Fecha del reporte
      const fechaFormateada = new Date(reportDate).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      page.drawText(`Fecha: ${fechaFormateada}`, {
        x: 50,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3)
      });
      
      yPosition -= 20;
      
      // Materia del reporte
      if (reportMateria) {
        page.drawText(`Materia: ${reportMateria}`, {
          x: 50,
          y: yPosition,
          size: 12,
          font: helveticaFont,
          color: rgb(0.3, 0.3, 0.3)
        });
        
        yPosition -= 20;
      }
      
      yPosition -= 20;
      
      // Procesar cada registro de asistencia
      for (const registro of attendanceReport) {
        // Información del aula
        if (registro.aula) {
          page.drawText(`AULA: ${registro.aula.nombre} - ${registro.aula.anio} ${registro.aula.seccion} (${registro.aula.turno})`, {
            x: 50,
            y: yPosition,
            size: 14,
            font: helveticaBold,
            color: rgb(0.1, 0.1, 0.1)
          });
          
          yPosition -= 25;
        }
        
        // Resumen estadístico
        const presentes = registro.asistencia.filter(e => e.estado === 'presente').length;
        const ausentes = registro.asistencia.filter(e => e.estado === 'ausente').length;
        const tardanzas = registro.asistencia.filter(e => e.estado === 'tardanza').length;
        const total = registro.asistencia.length;
        
        page.drawText(`Resumen: ${presentes} Presentes, ${ausentes} Ausentes, ${tardanzas} Tardanzas (Total: ${total})`, {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: rgb(0.4, 0.4, 0.4)
        });
        
        yPosition -= 30;
        
        // Encabezados de la tabla
        page.drawText('ESTUDIANTE', {
          x: 50,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2)
        });
        
        page.drawText('ESTADO', {
          x: 300,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2)
        });
        
        page.drawText('RAZÓN', {
          x: 400,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: rgb(0.2, 0.2, 0.2)
        });
        
        yPosition -= 20;
        
        // Lista de estudiantes
        for (const estudiante of registro.asistencia) {
          if (yPosition < 50) {
            // Agregar nueva página si no hay espacio
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            yPosition = height - 50;
            
            // Continuar en la nueva página
            newPage.drawText('ESTUDIANTE', {
              x: 50,
              y: yPosition,
              size: 10,
              font: helveticaBold,
              color: rgb(0.2, 0.2, 0.2)
            });
            
            newPage.drawText('ESTADO', {
              x: 300,
              y: yPosition,
              size: 10,
              font: helveticaBold,
              color: rgb(0.2, 0.2, 0.2)
            });
            
            newPage.drawText('RAZÓN', {
              x: 400,
              y: yPosition,
              size: 10,
              font: helveticaBold,
              color: rgb(0.2, 0.2, 0.2)
            });
            
            yPosition -= 20;
          }
          
          const nombreCompleto = estudiante.estudiante ? 
            `${estudiante.estudiante.nombre} ${estudiante.estudiante.apellido}` : 
            'Estudiante no encontrado';
          
          const estadoTexto = {
            'presente': 'PRESENTE',
            'ausente': 'AUSENTE', 
            'tardanza': 'TARDANZA'
          }[estudiante.estado] || 'SIN MARCAR';
          
          // Color según el estado
          const estadoColor = {
            'presente': rgb(0, 0.6, 0),
            'ausente': rgb(0.8, 0, 0),
            'tardanza': rgb(0.8, 0.6, 0)
          }[estudiante.estado] || rgb(0.5, 0.5, 0.5);
          
          const currentPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
          
          currentPage.drawText(nombreCompleto, {
            x: 50,
            y: yPosition,
            size: 9,
            font: helveticaFont,
            color: rgb(0.3, 0.3, 0.3)
          });
          
          currentPage.drawText(estadoTexto, {
            x: 300,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: estadoColor
          });
          
          // Agregar razón si existe
          if (estudiante.razon) {
            currentPage.drawText(estudiante.razon, {
              x: 400,
              y: yPosition,
              size: 8,
              font: helveticaFont,
              color: rgb(0.5, 0.5, 0.5)
            });
          } else if (estudiante.estado === 'ausente' || estudiante.estado === 'tardanza') {
            // Mostrar "Sin razón especificada" para ausentes y tardanzas sin razón
            currentPage.drawText('Sin razón especificada', {
              x: 400,
              y: yPosition,
              size: 8,
              font: helveticaFont,
              color: rgb(0.7, 0.7, 0.7)
            });
          }
          
          yPosition -= 15;
        }
        
        yPosition -= 20;
      }
      
      // Generar el PDF
      const pdfBytes = await pdfDoc.save();
      
      // Crear blob y descargar
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-asistencia-${reportDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      setNotification({ 
        type: 'success', 
        message: 'Reporte descargado exitosamente' 
      });
      
    } catch (error) {
      console.error('Error al generar PDF:', error);
      setNotification({ 
        type: 'error', 
        message: 'Error al generar el reporte PDF' 
      });
    } finally {
      setLoadingReport(false);
    }
  };

  // Función para manejar el cambio de año y actualizar las materias
  const handleAnioChange = (e) => {
    const anio = e.target.value;
    setAulaFormData(prev => ({
      ...prev,
      anio,
      materias: materiasPorAnio[anio + ' año'] || []
    }));
    // Resetear las asignaciones de profesores y materias habilitadas
    setMateriasSeleccionadas([]);
    setMateriasHabilitadas([]);
  };

  // Función para cargar las aulas
  const loadAulas = async () => {
    try {
      const response = await fetch('/api/aulas');
      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('Aulas cargadas:', result.data);
        console.log('Ejemplo de periodo de un aula:', result.data[0]?.periodo);
        setAulas(result.data);
      } else {
        console.error('Error al cargar aulas:', result.message);
      }
    } catch (error) {
      console.error('Error al cargar aulas:', error);
    }
  };

  // Función para cargar estudiantes disponibles para agregar a un aula
  const loadAvailableStudents = async (aula) => {
    try {
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const response = await fetch(`/api/estudiantes?creadorId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Filtrar estudiantes que NO estén ya en el aula
          const estudiantesEnAula = aula.alumnos?.map(alumno => alumno._id) || [];
          const estudiantesDisponibles = data.data.filter(estudiante => 
            !estudiantesEnAula.includes(estudiante._id) &&
            estudiante.anio === aula.anio && // Solo estudiantes del mismo año
            estudiante.seccion === aula.seccion && // Solo estudiantes de la misma sección
            estudiante.estado === 1 // Solo estudiantes activos
          );
          
          // Ordenar estudiantes por nombre y apellido
          estudiantesDisponibles.sort((a, b) => {
            const nombreA = `${a.nombre} ${a.apellido}`.toLowerCase();
            const nombreB = `${b.nombre} ${b.apellido}`.toLowerCase();
            return nombreA.localeCompare(nombreB);
          });
          
          setAvailableStudents(estudiantesDisponibles);
        }
      }
    } catch (error) {
      console.error('Error al cargar estudiantes disponibles:', error);
    }
  };

  // Función para abrir el modal de agregar estudiantes
  const openAddStudentsModal = async (aula) => {
    setAulaToAddStudents(aula);
    setSelectedStudentsToAdd([]);
    await loadAvailableStudents(aula);
    setShowAddStudentsModal(true);
  };

  // Función para agregar estudiantes seleccionados al aula
  const handleAddStudentsToAula = async () => {
    if (!aulaToAddStudents || selectedStudentsToAdd.length === 0) return;

    try {
      setLoading(true);
      
      // Preparar los nuevos estudiantes para agregar
      const nuevosEstudiantes = selectedStudentsToAdd.map(studentId => {
        const estudiante = availableStudents.find(est => est._id === studentId);
        return {
          _id: estudiante._id,
          nombre: estudiante.nombre,
          apellido: estudiante.apellido,
          cedula: estudiante.cedula || estudiante.idU
        };
      });

      // Agregar a los estudiantes existentes en el aula
      const estudiantesActualizados = [...aulaToAddStudents.alumnos, ...nuevosEstudiantes];

      const response = await fetch(`/api/aulas/${aulaToAddStudents._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alumnos: estudiantesActualizados
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Actualizar la lista de aulas
        await loadAulas();
        
        setAlert({
          title: 'Éxito',
          message: `Se agregaron ${selectedStudentsToAdd.length} estudiante(s) al aula ${aulaToAddStudents.nombre}`,
          icon: 'success'
        });
        
        setShowAddStudentsModal(false);
        setAulaToAddStudents(null);
        setSelectedStudentsToAdd([]);
        setAvailableStudents([]);
      } else {
        throw new Error(result.message || 'Error al agregar estudiantes');
      }
    } catch (error) {
      console.error('Error al agregar estudiantes:', error);
      setAlert({
        title: 'Error',
        message: error.message || 'Error al agregar estudiantes al aula',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar selección de estudiantes
  const handleStudentSelection = (studentId, isChecked) => {
    if (isChecked) {
      setSelectedStudentsToAdd(prev => [...prev, studentId]);
    } else {
      setSelectedStudentsToAdd(prev => prev.filter(id => id !== studentId));
    }
  };

  // Función para cargar estudiantes del aula
  const loadEstudiantesAula = async (aula) => {
    try {
      const response = await fetch(`/api/aulas/${aula._id}/estudiantes`);
      const result = await response.json();
      
      if (result.success) {
        setEstudiantesAula(result.estudiantes);
      } else {
        console.error('Error al cargar estudiantes del aula:', result.error);
        setEstudiantesAula([]);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes del aula:', error);
      setEstudiantesAula([]);
    }
  };

  // Función para abrir el modal de eliminar estudiantes
  const openDeleteStudentsModal = async (aula) => {
    setAulaToDeleteStudents(aula);
    setSelectedStudentsToDelete([]);
    await loadEstudiantesAula(aula);
    setShowDeleteStudentsModal(true);
  };

  // Función para eliminar estudiantes seleccionados del aula
  const handleDeleteStudentsFromAula = async () => {
    if (!aulaToDeleteStudents || selectedStudentsToDelete.length === 0) return;

    try {
      setEliminandoEstudiantes(true);
      
      const response = await fetch(`/api/aulas/${aulaToDeleteStudents._id}/estudiantes/eliminar`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estudiantesIds: selectedStudentsToDelete
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Actualizar la lista de aulas
        await loadAulas();
        
        setAlert({
          title: 'Éxito',
          message: `Se eliminaron ${selectedStudentsToDelete.length} estudiante(s) del aula ${aulaToDeleteStudents.nombre}`,
          icon: 'success'
        });
        
        setShowDeleteStudentsModal(false);
        setAulaToDeleteStudents(null);
        setSelectedStudentsToDelete([]);
        setEstudiantesAula([]);
      } else {
        throw new Error(result.message || 'Error al eliminar estudiantes');
      }
    } catch (error) {
      console.error('Error al eliminar estudiantes:', error);
      setAlert({
        title: 'Error',
        message: error.message || 'Error al eliminar estudiantes del aula',
        icon: 'error'
      });
    } finally {
      setEliminandoEstudiantes(false);
    }
  };

  // Función para manejar selección de estudiantes a eliminar
  const handleStudentDeleteSelection = (studentId, isChecked) => {
    if (isChecked) {
      setSelectedStudentsToDelete(prev => [...prev, studentId]);
    } else {
      setSelectedStudentsToDelete(prev => prev.filter(id => id !== studentId));
    }
  };

  // Función para manejar cambios en el formulario de aula
  const handleAulaFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'anio') {
      // Si cambia el año, resetear las materias seleccionadas y habilitadas
      setMateriasSeleccionadas([]);
      setMateriasHabilitadas([]);
      setAulaFormData(prev => ({
        ...prev,
        [name]: value,
        materias: materiasPorAnio[value + ' año'] || []
      }));
    } else {
      setAulaFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Función para agregar una nueva aula
  const handleAddAula = async (e) => {
    e.preventDefault();
    try {
      // Obtener los estudiantes seleccionados
      const estudiantesSeleccionados = document.querySelectorAll('input[name="estudiante"]:checked');
      console.log('Estudiantes seleccionados:', estudiantesSeleccionados);
      const alumnos = Array.from(estudiantesSeleccionados).map(checkbox => {
        const estudianteDataRaw = checkbox.getAttribute('data-estudiante');
        const estudianteData = JSON.parse(estudianteDataRaw);
        console.log('Datos completos del estudiante:', estudianteData);
        
        // Obtener el ID del estudiante
        const studentId = checkbox.value; // El ID está en el valor del checkbox
        console.log('ID del estudiante:', studentId);
        
        // Usar el nombre y apellido que ya vienen en estudianteData
        return {
          _id: studentId,
          nombre: estudianteData.nombre,    // Usar el nombre original
          apellido: estudianteData.apellido // Usar el apellido original
        };
      });

      // Verificar que se hayan seleccionado estudiantes
      if (alumnos.length === 0) {
        window.alert('Debe seleccionar al menos un estudiante');
        return;
      }

      // Agregar los alumnos al formulario
      aulaFormData.alumnos = alumnos;

      // Verificar que todas las materias habilitadas tengan un profesor asignado
      const materiasDelAnio = materiasPorAnio[aulaFormData.anio + ' año'] || [];
      const materiasHabilitadasDelAnio = materiasDelAnio.filter(materia => 
        materiasHabilitadas.includes(materia.id)
      );
      
      const todasMateriasAsignadas = materiasHabilitadasDelAnio.every(materia => 
        materiasSeleccionadas.some(m => m.materiaId === materia.id)
      );

      if (materiasHabilitadasDelAnio.length === 0) {
        window.alert('Debe habilitar al menos una materia');
        return;
      }

      if (!todasMateriasAsignadas) {
        window.alert('Debe asignar un profesor a cada materia habilitada');
        return;
      }

      // Preparar los datos para enviar al servidor (solo materias habilitadas)
      const asignaciones = materiasHabilitadasDelAnio.map(materia => {
        // Obtener el profesor seleccionado de materiasSeleccionadas
        const asignacion = materiasSeleccionadas.find(m => m.materiaId === materia.id);
        const profesorId = asignacion?.profesorId;
        
        if (!profesorId) {
          throw new Error(`La materia ${materia.nombre} debe tener un profesor asignado`);
        }
        
        // Obtener el nombre y apellido del profesor del select
        const select = document.querySelector(`select[id="${materia.id}"]`);
        const selectedOption = select?.options[select?.selectedIndex];
        const nombreCompleto = selectedOption?.text || '';
        const [nombre, ...apellidoParts] = nombreCompleto.split(' ');
        
        return {
          materia: {
            id: materia.id,
            codigo: materia.codigo,
            nombre: materia.nombre
          },
          profesor: {
            nombre: nombre,
            apellido: apellidoParts.join(' ')
          }
        };
      });

      const aulaData = {
        nombre: aulaFormData.nombre,
        anio: aulaFormData.anio,
        seccion: aulaFormData.seccion,
        turno: aulaFormData.turno,
        periodo: aulaFormData.periodo || '2023-2024',
        alumnos: aulaFormData.alumnos.map(alumno => ({
          _id: alumno._id, // Incluir el ID del estudiante
          nombre: alumno.nombre,
          apellido: alumno.apellido,
          cedula: alumno.cedula // Incluir la cédula si está disponible
        })),
        asignaciones: asignaciones,
        creadoPor: '20202020',
        tipoCreador: 'control'
      };

      console.log('Datos del aula a enviar:', aulaData);

      const response = await fetch('/api/aulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(aulaData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('Aula creada exitosamente:', result.data);
        // Limpiar formulario y cerrar modal
        setAulaFormData({
          nombre: '',
          anio: '1',
          seccion: 'A',
          turno: 'Mañana',
          periodo: '',
          cantidadAlumnos: 0
        });
        setShowAulaForm(false);
        // Recargar aulas
        await loadAulas();
      } else {
        console.error('Error al crear aula:', result.message);
        window.alert(result.message || 'Error al crear el aula');
      }
    } catch (error) {
      console.error('Error al crear aula:', error);
    }
  };

  // Efecto para cargar los datos del usuario y establecer la pestaña activa adecuada
  useEffect(() => {
    // Cargar datos iniciales cuando el componente se monta
    loadEstudiantesDisponibles();
    loadProfesoresDisponibles();
  }, []); // Este efecto solo se ejecuta al montar el componente

  useEffect(() => {
    try {
      // Cargar aulas cuando la pestaña está activa
      if (activeTab === 'aulas') {
        loadAulas();
      }

      // Intentar obtener el tipo de usuario
      const userTypeCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('userType='));
      
      if (userTypeCookie) {
        const tipo = userTypeCookie.split('=')[1];
        setUserType(tipo);
        
        // Si es docente, establecer asignaciones como pestaña activa por defecto
        if (tipo === 'docente') {
          setActiveTab('asignaciones');
          console.log('Usuario docente detectado, mostrando solo asignaciones');
        } else if (tipo === 'control') {
          // Si es control, puede iniciar en docentes
          setActiveTab('docentes');
          console.log('Usuario control detectado, mostrando todas las opciones');
        }
      } else {
        // Si no hay tipo de usuario, establecer asignaciones como pestaña activa por defecto
        setActiveTab('asignaciones');
        setUserType('alumno'); // Valor por defecto
        console.log('Tipo de usuario no detectado, usando asignaciones como pestaña por defecto');
      }
    } catch (error) {
      console.error('Error al obtener el tipo de usuario:', error);
      // Por defecto, mostrar asignaciones
      setActiveTab('asignaciones');
      setUserType('alumno'); // Valor por defecto en caso de error
    }
  }, []);
  
  // Estados para formularios
  const [formData, setFormData] = useState({});
  
  // Estados para búsqueda y filtrado
  const [searchTerm, setSearchTerm] = useState('');
  const [searchNombre, setSearchNombre] = useState('');
  const [searchCedula, setSearchCedula] = useState('');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Estados para el modal de representante
  const [showRepresentanteModal, setShowRepresentanteModal] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState(null);
  const [searchAlumno, setSearchAlumno] = useState(''); // Estado para buscar alumnos en el formulario de asignaciones
  const [searchAlumnoSelector, setSearchAlumnoSelector] = useState(''); // Estado para buscar alumnos en el selector individual
  const [searchPeriodo, setSearchPeriodo] = useState(''); // Estado para filtrar por periodo
  const [searchAnio, setSearchAnio] = useState(''); // Estado para filtrar por año
  const [searchMateria, setSearchMateria] = useState(''); // Estado para filtrar por materia
  
  // Estados para reportes
  const [tipoReporte, setTipoReporte] = useState('estudiantes');
  
  // Estados para profesores
  const [profesores, setProfesores] = useState([]);
  const [searchProfesorNombre, setSearchProfesorNombre] = useState('');
  const [searchProfesorCedula, setSearchProfesorCedula] = useState('');
  const [showProfesorForm, setShowProfesorForm] = useState(false);
  const [profesorFormData, setProfesorFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: 'N/P',
    email: '',
    telefono: '',
    especialidad: '',
    fechaIngreso: '',
    estado: 1, // 1 = activo, 0 = bloqueado
    modoEdicion: false
  });
  
  // Estados adicionales para materias
  const [searchMateriaNombre, setSearchMateriaNombre] = useState('');
  const [searchMateriaCodigo, setSearchMateriaCodigo] = useState('');
  const [showMateriaForm, setShowMateriaForm] = useState(false);
  const [materiaFormData, setMateriaFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    modoEdicion: false
  });
  
  // Estados adicionales para asignaciones
  const [showAsignacionForm, setShowAsignacionForm] = useState(false);
  const [showActividadForm, setShowActividadForm] = useState(false);
  const [asignacionSeleccionada, setAsignacionSeleccionada] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState('');
  const [asignacionFormData, setAsignacionFormData] = useState({
    materiaId: '',
    profesorId: '',
    alumnos: [],
    periodo: '',
    anio: '1 año',
    seccion: 'A',
    turno: 'Mañana',
    materiasSeleccionadas: [],
    modoEdicion: false,
    usarPeriodoExistente: false
  });
  // Función para manejar cambios en el formulario de asignación
  const handleAsignacionFormChange = (e) => {
    const { name, value } = e.target;
    setAsignacionFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Comentario: Las funciones handleAddAsignacion y handleEditAsignacion han sido movidas directamente al manejador de eventos del formulario
  // para evitar duplicaciones y errores.
  const [actividadFormData, setActividadFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    porcentaje: 0
  });
  
  // Funciones para manejar eventos de formularios

  // Función para limpiar el formulario y cerrar el modal
  const handleCloseModal = () => {
    setSelectedStudent(''); // Reset selected student
    setShowModal(false); // Close the modal
    setFormData({}); // Reset form data
  };

  // Función para manejar el cierre de sesión
  const handleLogout = () => {
    // Eliminar datos de sesión
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userLastName');
    
    // Eliminar datos de localStorage si existen
    localStorage.removeItem('userId');
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userLastName');
    
    // Redirigir al usuario a la página de inicio de sesión
    router.push('/');
  };

  // Función para cambiar el periodo educativo seleccionado
  const handlePeriodChange = (periodoId) => {
    // Encontrar el periodo seleccionado en la lista de periodos
    const periodoSeleccionado = periodos.find(p => p.id === periodoId);
    
    if (periodoSeleccionado) {
      // Actualizar el periodo actual
      setPeriodoActual(periodoSeleccionado);
      
      // Cargar los datos correspondientes al periodo seleccionado
      loadPeriodData(periodoSeleccionado);
    }
  };

  // Funciones para gestionar periodos educativos
  const handleAddPeriodo = (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      // Crear nuevo periodo con los datos del formulario
      const nuevoPeriodo = {
        id: `P${formData.anio}-${formData.numero}`,
        nombre: `Periodo ${formData.anio}-${formData.numero}`,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        activo: formData.activo || false
      };
      
      // Si el nuevo periodo es activo, desactivar los demás
      let periodosActualizados = [...periodos];
      if (nuevoPeriodo.activo) {
        periodosActualizados = periodosActualizados.map(p => ({
          ...p,
          activo: false
        }));
      }
      
      // Añadir el nuevo periodo a la lista
      setPeriodos([...periodosActualizados, nuevoPeriodo]);
      
      // Si es el único periodo o es activo, establecerlo como actual
      if (nuevoPeriodo.activo || periodosActualizados.length === 0) {
        setPeriodoActual(nuevoPeriodo);
        loadPeriodData(nuevoPeriodo);
      }
      
      setShowModal(false);
      setFormData({});
      setLoading(false);
    } catch (err) {
      console.error('Error al agregar periodo:', err);
      setError('Error al agregar periodo. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleEditPeriodo = (e, periodoId) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      // Crear objeto con datos actualizados
      const periodoEditado = {
        id: periodoId || formData.id,
        nombre: `Periodo ${formData.anio}-${formData.numero}`,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        activo: formData.activo || false
      };
      
      // Si el periodo editado es activo, desactivar los demás
      let periodosActualizados = [...periodos];
      if (periodoEditado.activo) {
        periodosActualizados = periodosActualizados.map(p => ({
          ...p,
          activo: p.id === periodoEditado.id ? true : false
        }));
      } else {
        periodosActualizados = periodosActualizados.map(p => ({
          ...p,
          activo: p.id === periodoEditado.id ? false : p.activo
        }));
      }
      
      // Actualizar la lista de periodos
      setPeriodos(periodosActualizados.map(p => 
        p.id === periodoEditado.id ? periodoEditado : p
      ));
      
      // Si el periodo editado es el actual o es activo, actualizarlo
      if (periodoActual?.id === periodoEditado.id || periodoEditado.activo) {
        setPeriodoActual(periodoEditado);
        loadPeriodData(periodoEditado);
      }
      
      setShowModal(false);
      setFormData({});
      setLoading(false);
    } catch (err) {
      console.error('Error al editar periodo:', err);
      setError('Error al editar periodo. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleDeletePeriodo = (periodoId) => {
    try {
      setLoading(true);
      
      // Verificar que no sea el único periodo
      if (periodos.length <= 1) {
        setError('No se puede eliminar el único periodo existente.');
        setLoading(false);
        return;
      }
      
      // Obtener el periodo a eliminar
      const periodoAEliminar = periodos.find(p => p.id === periodoId);
      
      // Filtrar la lista de periodos
      const periodosActualizados = periodos.filter(p => p.id !== periodoId);
      setPeriodos(periodosActualizados);
      
      // Si el periodo eliminado era el actual, establecer otro como actual
      if (periodoActual?.id === periodoId) {
        const nuevoPeriodoActual = periodosActualizados.find(p => p.activo) || periodosActualizados[0];
        setPeriodoActual(nuevoPeriodoActual);
        loadPeriodData(nuevoPeriodoActual);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al eliminar periodo:', err);
      setError('Error al eliminar periodo. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  

  // Filtrado optimizado de alumnos usando useMemo
  const alumnosFiltrados = useMemo(() => {
    if (!alumnos || !Array.isArray(alumnos)) return [];
    
    return alumnos.filter(alu => {
      // Filtrar por nombre si hay búsqueda de nombre
      const nombreMatch = !searchNombre || 
        (alu.nombre && alu.nombre.toLowerCase().includes(searchNombre.toLowerCase()));
      
      // Filtrar por cédula si hay búsqueda de cédula
      const cedulaMatch = !searchCedula || 
        (alu.cedula && alu.cedula.toLowerCase().includes(searchCedula.toLowerCase()));
      
      // Compatibilidad con el filtro anterior
      const searchTermMatch = !searchTerm || 
        (alu.cedula && alu.cedula.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (alu.nombre && alu.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Devolver true solo si cumple con todos los filtros activos
      return nombreMatch && cedulaMatch && searchTermMatch;
    });
  }, [alumnos, searchNombre, searchCedula, searchTerm]);

  // Filtrado optimizado de profesores usando useMemo
  const profesoresFiltrados = useMemo(() => {
    if (!profesores || !Array.isArray(profesores)) return [];
    
    return profesores.filter(profesor => {
      const nombreMatch = !searchProfesorNombre || 
        (profesor.nombre && profesor.nombre.toLowerCase().includes(searchProfesorNombre.toLowerCase()));
      
      const cedulaMatch = !searchProfesorCedula || 
        (profesor.cedula && profesor.cedula.toLowerCase().includes(searchProfesorCedula.toLowerCase()));
      
      return nombreMatch && cedulaMatch;
    });
  }, [profesores, searchProfesorNombre, searchProfesorCedula]);

  // Efecto para verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        console.log('Verificando autenticación en sidebar...');
        
        // Obtener información del usuario desde sessionStorage o localStorage
        const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
        const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
        const userName = sessionStorage.getItem('userName') || localStorage.getItem('userName');
        const userLastName = sessionStorage.getItem('userLastName') || localStorage.getItem('userLastName');
        
        console.log('Datos de usuario recuperados:', {
          userId,
          userType,
          userName,
          userLastName
        });
        
        // Verificar si hay información de usuario
        if (!userId) {
          console.log('No se encontró ID de usuario en la sesión');
          // Si no hay ID de usuario, redirigir al login
          router.push('/');
          return;
        }
        
        // Obtener identificadores de institución
        const idIdentificador = localStorage.getItem('idID') || sessionStorage.getItem('idID');
        const idI = localStorage.getItem('idI') || sessionStorage.getItem('idI');
        const idA = localStorage.getItem('idA') || sessionStorage.getItem('idA');
        const idAD = localStorage.getItem('idAD') || sessionStorage.getItem('idAD');
        
        console.log('Identificadores de institución:', { idID: idIdentificador, idI, idA, idAD });
        
        // Determinar la institución
        let institucionActual = '';
        if (idIdentificador) {
          console.log('%cInstitución determinada: IUTCM (por idID)', 'background: #2ecc71; color: white; padding: 4px; border-radius: 3px;');
          institucionActual = 'IUTCM';
        } else if (idI) {
          console.log('%cInstitución determinada: IUTCM (por idI)', 'background: #2ecc71; color: white; padding: 4px; border-radius: 3px;');
          institucionActual = 'IUTCM';
        } else if (idAD) {
          console.log('%cInstitución determinada: Acacias (por idAD)', 'background: #f39c12; color: white; padding: 4px; border-radius: 3px;');
          institucionActual = 'Acacias';
        } else if (idA) {
          console.log('%cInstitución determinada: Acacias (por idA)', 'background: #f39c12; color: white; padding: 4px; border-radius: 3px;');
          institucionActual = 'Acacias';
        } else {
          console.log('%cNo se encontró ningún identificador de institución', 'background: #e74c3c; color: white; padding: 4px; border-radius: 3px;');
        }
        
        // Establecer la institución en el estado
        setInstitucion(institucionActual);
        
        // Establecer los datos del usuario
        setUserData({
          id: userId,
          tipo: userType,
          nombre: userName || 'Usuario',
          apellido: userLastName || '',
          idA: idA,
          idI: idI,
          idID: idIdentificador,
          idAD: idAD
        });
        
        setLoading(false);

        // Verificar si el tipo de usuario es control o docente
        if (userType && userType !== 'control' && userType !== 'docente') {
          console.log('Tipo de usuario incorrecto:', userType);
          // Si el tipo de usuario no es control o docente, redirigir a la página correspondiente
          router.push(userType === 'alumno' ? '/alumno' : '/');
          return;
        }
        
        // Verificar el estado del profesor si el tipo de usuario es docente
        if (userType === 'docente') {
          const estadoProfesor = sessionStorage.getItem('estadoProfesor') || localStorage.getItem('estadoProfesor');
          console.log('Estado del profesor:', estadoProfesor);
          
          // Si el estado del profesor es 0 (bloqueado), mostrar mensaje y redirigir al login
          if (estadoProfesor === '0') {
            console.log('Profesor bloqueado. Redirigiendo al login...');
            setError('Su cuenta ha sido desactivada. Por favor, contacte al administrador.');
            // Limpiar datos de sesión
            sessionStorage.clear();
            localStorage.clear();
            // Redirigir al login después de un breve retraso para que el usuario vea el mensaje
            setTimeout(() => {
              router.push('/');
            }, 2000);
            return;
          }
        }

        console.log('Usuario autenticado correctamente como:', userType);
        
        // Ya no necesitamos obtener idID aquí, ya se hizo anteriormente
        console.log('Valor de idID ya obtenido:', idIdentificador);
        
        // Establecer datos del usuario desde la sesión
        setUserData({
          id: userId,
          tipo: userType,
          nombre: userName || 'Usuario',
          apellido: userLastName || '',
          idA: idA || null,
          idI: idI || null,
          idID: idIdentificador || null
        });
        
        console.log('Datos de usuario establecidos:', {
          id: userId,
          tipo: userType,
          idA: idA || null,
          idI: idI || null,
          idID: idIdentificador || null
        });
        
        // Simular carga de periodos educativos
        const periodosDemo = [
          { id: 'P2025-1', nombre: 'Periodo 2025-1', fechaInicio: '2025-01-15', fechaFin: '2025-06-30', activo: true },
          { id: 'P2024-2', nombre: 'Periodo 2024-2', fechaInicio: '2024-07-15', fechaFin: '2024-12-15', activo: false },
        ];
        
        setPeriodos(periodosDemo);
        setPeriodoActual(periodosDemo.find(p => p.activo) || periodosDemo[0]);
        
        // Cargar datos según el periodo actual
        await loadPeriodData(periodosDemo.find(p => p.activo) || periodosDemo[0]);
        
        setLoading(false);
      } catch (err) {
        console.error('Error al verificar autenticación:', err);
        setError('Error al cargar los datos. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);
  
  // Efecto para cargar datos de materias cuando se selecciona la pestaña de materias
  useEffect(() => {
    if (activeTab === 'materias') {
      loadMaterias();
    }
  }, [activeTab]);
  
  // Función para cargar profesores
  const loadProfesores = async () => {
    try {
      console.log('Cargando profesores...');
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      if (!userId) {
        setError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      // Cargar profesores desde la API
      const response = await fetch(`/api/profesores?creadorId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar profesores: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Profesores cargados:', data);
      
      if (data.success && data.data) {
        // Transformar los datos para que coincidan con el formato esperado
        const profesoresFormateados = data.data.map(profesor => {
          // Preservar la fecha de ingreso exactamente como está almacenada
          let fechaIngreso = '';
          if (profesor.fechaIngreso) {
            // Extraer la fecha directamente de la cadena ISO sin modificarla
            const fechaISO = profesor.fechaIngreso.split('T')[0]; // Obtener solo la parte de la fecha (YYYY-MM-DD)
            fechaIngreso = fechaISO;
          }
          
          return {
            _id: profesor._id,
            id: profesor._id,
            cedula: profesor.idU || 'N/P',
            nombre: profesor.nombre || '',
            apellido: profesor.apellido || '',
            email: profesor.email || '',
            telefono: profesor.telefono || '',
            especialidad: profesor.especialidad || '',
            fechaIngreso: fechaIngreso,
            estado: profesor.estado !== undefined ? profesor.estado : 1 // 1 = activo, 0 = bloqueado
          };
        });
        
        setProfesores(profesoresFormateados);
      }
    } catch (err) {
      console.error('Error al cargar profesores:', err);
      setError('Error al cargar profesores. Por favor, intente de nuevo más tarde.');
    }
  };
  
  // Función para cargar estudiantes
  const loadEstudiantes = async () => {
    try {
      console.log('Cargando estudiantes...');
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      if (!userId) {
        setError('No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.');
        return;
      }
      
      // Cargar estudiantes desde la API
      const response = await fetch(`/api/estudiantes?creadorId=${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error al cargar estudiantes: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Estudiantes cargados:', data);
      
      if (data.success && data.data) {
        // Transformar los datos para que coincidan con el formato esperado
        const estudiantesFormateados = data.data.map(estudiante => {
          // Normalizar el campo anio (convertir "1 año" a "1", etc.)
          let anioNormalizado = estudiante.anio || '';
          if (anioNormalizado && typeof anioNormalizado === 'string' && anioNormalizado.includes('año')) {
            // Extraer solo el número del formato "X año"
            const match = anioNormalizado.match(/^(\d+)/);
            anioNormalizado = match ? match[1] : '';
            console.log(`Normalizado año de "${estudiante.anio}" a "${anioNormalizado}"`);
          }
          
          return {
            _id: estudiante._id,
            id: estudiante._id,
            cedula: estudiante.idU || '',
            nombre: estudiante.nombre || '',
            apellido: estudiante.apellido || '',
            fechaNacimiento: estudiante.fechaNacimiento,
            lugarNacimiento: estudiante.lugarNacimiento || '',
            sexo: estudiante.sexo || 'Otro',
            grupo: estudiante.grupo || '',
            ef: estudiante.ef || '',
            edad: estudiante.edad,
            esMenorDeEdad: estudiante.esMenorDeEdad,
            anio: anioNormalizado,
            seccion: estudiante.seccion || '',
            representante: estudiante.representante || {},
            estado: estudiante.estado !== undefined ? estudiante.estado : 1 // Incluir el campo estado, por defecto 1 (activo)
          };
        });
        
        // Mostrar los datos formateados para depuración
        console.log('Estudiantes formateados:', estudiantesFormateados);
        if (estudiantesFormateados.length > 0) {
          console.log('Primer estudiante formateado:', estudiantesFormateados[0]);
          console.log('Año y sección del primer estudiante formateado:', {
            anio: estudiantesFormateados[0].anio,
            seccion: estudiantesFormateados[0].seccion
          });
        }
        
        setAlumnos(estudiantesFormateados);
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
      setError('Error al cargar estudiantes. Por favor, intente de nuevo más tarde.');
    }
  };
  
  // Efecto para cargar datos de asignaciones cuando se selecciona la pestaña de asignaciones
  useEffect(() => {
    if (activeTab === 'asignaciones') {
      // Cargar todos los datos necesarios para la pestaña de asignaciones
      const loadAllData = async () => {
        try {
          setLoading(true);
          console.log('Cargando todos los datos necesarios para asignaciones...');
          
          // Cargar materias, docentes y alumnos en paralelo
          await Promise.all([
            loadMaterias(),
            loadProfesores(),
            loadEstudiantes(),
            loadAsignaciones()
          ]);
          
          setLoading(false);
        } catch (error) {
          console.error('Error al cargar datos para asignaciones:', error);
          setError('Error al cargar datos. Por favor, intente de nuevo.');
          setLoading(false);
        }
      };
      
      loadAllData();
    } else if (activeTab === 'reportes') {
      // También cargar todos los datos necesarios para la pestaña de reportes
      const loadReportData = async () => {
        try {
          setLoading(true);
          console.log('Cargando datos necesarios para reportes...');
          
          // Cargar asignaciones, materias y docentes en paralelo
          await Promise.all([
            loadMaterias(),
            loadProfesores(),
            loadAsignaciones()
          ]);
          
          setLoading(false);
        } catch (error) {
          console.error('Error al cargar datos para reportes:', error);
          setError('Error al cargar datos. Por favor, intente de nuevo.');
          setLoading(false);
        }
      };
      
      loadReportData();
    }
  }, [activeTab]);

  // Efecto para cargar datos de profesores cuando se selecciona la pestaña de docentes
  useEffect(() => {
    if (activeTab === 'docentes') {
      setLoading(true);
      loadProfesores()
        .then(() => setLoading(false))
        .catch(err => {
          console.error('Error al cargar profesores:', err);
          setError('Error al cargar profesores. Por favor, intente de nuevo más tarde.');
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Efecto para cargar estudiantes cuando se selecciona la pestaña de alumnos
  useEffect(() => {
    if (activeTab === 'alumnos') {
      setLoading(true);
      loadEstudiantes()
        .then(() => setLoading(false))
        .catch(err => {
          console.error('Error al cargar estudiantes:', err);
          setError('Error al cargar estudiantes. Por favor, intente de nuevo más tarde.');
          setLoading(false);
        });
    }
  }, [activeTab]);

  // Función para cargar datos de un periodo específico
  const loadPeriodData = async (periodo) => {
    try {
      console.log('Cargando datos para el periodo:', periodo.id);
      setLoading(true);
      
      // Obtener el ID del usuario de la sesión
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      if (!userId) {
        console.error('No se encontró ID de usuario en la sesión');
        setError('Sesión no válida. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        router.push('/');
        return;
      }
      
      console.log('Cargando datos del usuario con ID:', userId);
      
      // Cargar datos del usuario desde MongoDB
      const responseUsuario = await fetch(`/api/alumnos?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!responseUsuario.ok) {
        throw new Error(`Error al cargar datos de usuario: ${responseUsuario.statusText}`);
      }
      
      const usuarioData = await responseUsuario.json();
      console.log('Datos de usuario cargados desde MongoDB:', usuarioData);
      
      if (!usuarioData.success || !usuarioData.data || usuarioData.data.length === 0) {
        throw new Error('No se pudieron cargar los datos del usuario');
      }
      
      // Actualizar los datos del usuario en el estado
      const usuario = usuarioData.data[0];
      setUserData({
        id: usuario.idU,
        tipo: usuario.tipo,
        nombre: usuario.nombre || 'Usuario',
        apellido: usuario.apellido || '',
        email: usuario.email || '',
        telefono: usuario.telefono || ''
      });
      
      // Si el usuario es de tipo 'control' o 'docente', cargar datos de alumnos para gestión
      if (usuario.tipo === 'control' || usuario.tipo === 'docente') {
        // Simular carga de alumnos para gestión
        const alumnosDemo = [
          { id: 'ALU123', cedula: 'V98765432', nombre: 'Ana', apellido: 'Martínez', email: 'ana.martinez@ejemplo.com', telefono: '04121234567' },
          { id: 'ALU456', cedula: 'V87654321', nombre: 'Pedro', apellido: 'Sánchez', email: 'pedro.sanchez@ejemplo.com', telefono: '04241234567' },
          { id: 'ALU789', cedula: 'V76543210', nombre: 'Laura', apellido: 'Díaz', email: 'laura.diaz@ejemplo.com', telefono: '04161234567' },
        ];
        setAlumnos(alumnosDemo);
      } else {
        // Si es alumno, solo mostrar sus propios datos
        const alumnoFormateado = {
          id: usuario._id || usuario.idU,
          cedula: usuario.idU,
          nombre: usuario.nombre || '',
          apellido: usuario.apellido || '',
          email: usuario.email || '',
          telefono: usuario.telefono || '',
          fechaNacimiento: usuario.fechaNacimiento || ''
        };
        setAlumnos([alumnoFormateado]);
      }
      
      // Por ahora, seguimos usando datos de demostración para docentes y materias
      const docentesDemo = [
        { id: 'DOC123', cedula: 'V12345678', nombre: 'Juan', apellido: 'Pérez', email: 'juan.perez@ejemplo.com', telefono: '04121234567' },
        { id: 'DOC456', cedula: 'V87654321', nombre: 'María', apellido: 'González', email: 'maria.gonzalez@ejemplo.com', telefono: '04241234567' },
        { id: 'DOC789', cedula: 'V23456789', nombre: 'Carlos', apellido: 'Rodríguez', email: 'carlos.rodriguez@ejemplo.com', telefono: '04161234567' },
      ];
      
      const materiasDemo = [
        { id: 'MAT123', codigo: 'MAT101', nombre: 'Matemáticas I', descripcion: 'Introducción al cálculo diferencial' },
        { id: 'MAT456', codigo: 'FIS101', nombre: 'Física I', descripcion: 'Mecánica clásica' },
        { id: 'MAT789', codigo: 'QUI101', nombre: 'Química I', descripcion: 'Química general' },
      ];
      
      // Crear asignaciones basadas en el tipo de usuario
      let asignacionesDemo = [];
      
      if (usuario.tipo === 'alumno') {
        // Si es alumno, mostrar solo sus asignaciones
        asignacionesDemo = [
          { 
            id: 'ASG123', 
            docenteId: 'DOC123', 
            materiaId: 'MAT123', 
            periodoId: periodo.id,
            alumnos: [usuario.idU],
            actividades: [
              { 
                id: 'ACT123', 
                nombre: 'Examen Parcial 1', 
                descripcion: 'Primer examen parcial', 
                fecha: '2025-03-15',
                calificaciones: [
                  { alumnoId: usuario.idU, nota: 15 }
                ]
              },
              { 
                id: 'ACT456', 
                nombre: 'Trabajo Práctico', 
                descripcion: 'Trabajo práctico sobre derivadas', 
                fecha: '2025-04-10',
                calificaciones: [
                  { alumnoId: usuario.idU, nota: 17 }
                ]
              }
            ]
          },
          { 
            id: 'ASG456', 
            docenteId: 'DOC456', 
            materiaId: 'MAT456', 
            periodoId: periodo.id,
            alumnos: [usuario.idU],
            actividades: [
              { 
                id: 'ACT789', 
                nombre: 'Examen Parcial 1', 
                descripcion: 'Primer examen parcial', 
                fecha: '2025-03-20',
                calificaciones: [
                  { alumnoId: usuario.idU, nota: 18 }
                ]
              }
            ]
          }
        ];
      } else {
        // Si es docente o control, mostrar todas las asignaciones
        asignacionesDemo = [
          { 
            id: 'ASG123', 
            docenteId: 'DOC123', 
            profesorNombre: 'Juan Pérez', // Nombre completo del profesor
            materiaId: 'MAT123', 
            periodoId: periodo.id,
            alumnos: ['ALU123', 'ALU456'],
            actividades: [
              { 
                id: 'ACT123', 
                nombre: 'Examen Parcial 1', 
                descripcion: 'Primer examen parcial', 
                fecha: '2025-03-15',
                calificaciones: [
                  { alumnoId: 'ALU123', nota: 15 },
                  { alumnoId: 'ALU456', nota: 18 },
                ]
              },
              { 
                id: 'ACT456', 
                nombre: 'Trabajo Práctico', 
                descripcion: 'Trabajo práctico sobre derivadas', 
                fecha: '2025-04-10',
                calificaciones: [
                  { alumnoId: 'ALU123', nota: 17 },
                  { alumnoId: 'ALU456', nota: 16 },
                ]
              }
            ]
          },
          { 
            id: 'ASG456', 
            docenteId: 'DOC456', 
            profesorNombre: 'María González', // Nombre completo del profesor
            materiaId: 'MAT456', 
            periodoId: periodo.id,
            alumnos: ['ALU456', 'ALU789'],
            actividades: [
              { 
                id: 'ACT789', 
                nombre: 'Examen Parcial 1', 
                descripcion: 'Primer examen parcial', 
                fecha: '2025-03-20',
                calificaciones: [
                  { alumnoId: 'ALU456', nota: 14 },
                  { alumnoId: 'ALU789', nota: 19 },
                ]
              }
            ]
          }
        ];
      }
      
      setDocentes(docentesDemo);
      setMaterias(materiasDemo);
      setAsignaciones(asignacionesDemo);
      setLoading(false);
      
    } catch (err) {
      console.error('Error al cargar datos del periodo:', err);
      setError(`Error al cargar los datos del periodo ${periodo.nombre}. Por favor, intente de nuevo más tarde.`);
      setLoading(false);
    }
  };

  // Funciones para gestionar docentes
  const handleAddDocente = (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      // Aquí iría la lógica para agregar un docente a la base de datos
      const nuevoDocente = {
        id: `DOC${Date.now()}`,
        cedula: formData.cedula,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        fechaIngreso: formData.fechaIngreso || null
      };
      
      setDocentes([...docentes, nuevoDocente]);
      setShowModal(false);
      setFormData({});
      setLoading(false);
    } catch (err) {
      console.error('Error al agregar docente:', err);
      setError('Error al agregar docente. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  
  
  // Función para manejar cambios en los campos del formulario de profesores
  const handleProfesorFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Para fechas, asegurarse de que se guarde como una cadena de fecha válida
    if (name === 'fechaIngreso') {
      console.log('Fecha de ingreso seleccionada:', value);
    }
    setProfesorFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
    }));
  };
  
  // Función para cambiar el estado del profesor (activar/desactivar)
  const handleToggleProfesorEstado = async (profesorId, nuevoEstado) => {
    try {
      console.log(`Cambiando estado del profesor ${profesorId} a ${nuevoEstado}`);
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      if (!userId) {
        setNotification({
          type: 'error',
          message: 'No se pudo identificar al usuario. Por favor, inicie sesión nuevamente.'
        });
        return;
      }
      
      // Asegurarse de que tenemos un ID válido
      if (!profesorId) {
        console.error('ID de profesor no válido:', profesorId);
        setNotification({
          type: 'error',
          message: 'No se pudo identificar al profesor. Por favor, intente de nuevo.'
        });
        return;
      }
      
      console.log(`Cambiando estado del profesor ${profesorId} a ${nuevoEstado}`);
      
      // Actualizar el estado del profesor en la API
      const response = await fetch(`/api/profesores/${profesorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: nuevoEstado,
          userId: userId
        }),
      });
      
      const data = await response.json();
      console.log('Respuesta del servidor:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el estado del profesor');
      }
      
      // Actualizar la lista de profesores en el estado local
      setProfesores(prevProfesores => {
        const profesoresActualizados = prevProfesores.map(prof => {
          if (prof.id === profesorId) {
            console.log('Actualizando profesor en el estado local:', prof.nombre, prof.apellido);
            return { ...prof, estado: nuevoEstado };
          }
          return prof;
        });
        return profesoresActualizados;
      });
      
      // Mostrar mensaje de éxito
      setNotification({ 
        type: 'success', 
        message: `Profesor ${nuevoEstado === 1 ? 'activado' : 'bloqueado'} correctamente` 
      });
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error) {
      console.error('Error al cambiar el estado del profesor:', error);
      setNotification({
        type: 'error',
        message: 'Error al cambiar el estado del profesor. Por favor, intente de nuevo.'
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };
  
  const handleEditDocente = (e, docenteId) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      // Aquí iría la lógica para editar un docente en la base de datos
      const docenteEditado = {
        id: docenteId || formData.id,
        cedula: formData.cedula,
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
        telefono: formData.telefono,
        fechaIngreso: formData.fechaIngreso || null
      };
      
      const nuevosDocentes = docentes.map(doc => 
        doc.id === (docenteId || formData.id) ? docenteEditado : doc
      );
      
      setDocentes(nuevosDocentes);
      setShowModal(false);
      setFormData({});
      setLoading(false);
    } catch (err) {
      console.error('Error al editar docente:', err);
      setError('Error al editar docente. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleDeleteDocente = (docenteId) => {
    if (window.confirm('¿Está seguro de eliminar este docente?')) {
      try {
        setLoading(true);
        // Aquí iría la lógica para eliminar un docente de la base de datos
        const nuevosDocentes = docentes.filter(doc => doc.id !== docenteId);
        setDocentes(nuevosDocentes);
        setLoading(false);
      } catch (err) {
        console.error('Error al eliminar docente:', err);
        setError('Error al eliminar docente. Por favor, intente de nuevo más tarde.');
        setLoading(false);
      }
    }
  };

  // Función para agregar un nuevo profesor
  const handleAddProfesor = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Agregando profesor con datos:', profesorFormData);
      
      if (!profesorFormData.nombre || !profesorFormData.apellido) {
        // Mensaje: Por favor, complete todos los campos requeridos.
        setError('Por favor, complete todos los campos requeridos.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      console.log('Institución detectada:', institucion);
      
      if (!userId) {
        // Mensaje: No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.
        setError('No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Crear objeto del nuevo profesor
      const nuevoProfesor = {
        nombre: profesorFormData.nombre,
        apellido: profesorFormData.apellido,
        cedula: profesorFormData.cedula || 'N/P',
        email: profesorFormData.email || '',
        telefono: profesorFormData.telefono || '',
        especialidad: profesorFormData.especialidad || '',
        fechaIngreso: profesorFormData.fechaIngreso || null,
        estado: profesorFormData.estado !== undefined ? profesorFormData.estado : 1, // 1 = activo, 0 = bloqueado
        userId: userId,
        userType: userType,
        institucion: institucion // Incluir la institución en la solicitud
      };
      
      console.log('Enviando datos al servidor:', nuevoProfesor);
      
      // Mostrar alerta para confirmar
      // Proceder sin confirmación
      if (false) {
        setLoading(false);
        return;
      }
      
      // Enviar datos a la API para guardar en MongoDB
      const response = await fetch('/api/profesores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoProfesor),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al agregar profesor');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Profesor agregado correctamente
      
      // Limpiar el formulario
      setProfesorFormData({
        nombre: '',
        apellido: '',
        cedula: 'N/P',
        email: '',
        telefono: '',
        especialidad: '',
        fechaIngreso: '',
        estado: 1, // 1 = activo, 0 = bloqueado
        modoEdicion: false
      });
      
      // Ocultar el formulario
      setShowProfesorForm(false);
      
      // Recargar la lista de profesores inmediatamente
      try {
        const response = await fetch(`/api/profesores?creadorId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Datos de profesores cargados:', data);
          if (data.success && data.data) {
            const profesoresFormateados = data.data.map(profesor => ({
              _id: profesor._id,
              id: profesor._id,
              cedula: profesor.idU || 'N/P',
              nombre: profesor.nombre || '',
              apellido: profesor.apellido || '',
              email: profesor.email || '',
              telefono: profesor.telefono || '',
              especialidad: profesor.especialidad || '',
              fechaIngreso: profesor.fechaIngreso || null,
              estado: profesor.estado !== undefined ? profesor.estado : 1 // 1 = activo, 0 = bloqueado
            }));
            
            setProfesores(profesoresFormateados);
          }
        }
      } catch (error) {
        console.error('Error al recargar profesores:', error);
      }
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error al agregar profesor:', err);
      setError('Error al agregar profesor: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al agregar profesor
    }
  };

  // Función para editar un profesor existente
  const handleEditProfesor = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Editando profesor con datos:', profesorFormData);
      
      if (!profesorFormData.nombre || !profesorFormData.apellido) {
        setError('Por favor, complete todos los campos requeridos.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del profesor a editar
      const profesorId = profesorFormData.id || profesorFormData._id;
      if (!profesorId) {
        setError('No se pudo identificar el ID del profesor a editar.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      console.log('Institución detectada para edición:', institucion);
      
      // Crear objeto del profesor editado
      const profesorEditado = {
        nombre: profesorFormData.nombre,
        apellido: profesorFormData.apellido,
        email: profesorFormData.email || '',
        telefono: profesorFormData.telefono || '',
        especialidad: profesorFormData.especialidad || '',
        fechaIngreso: profesorFormData.fechaIngreso || null,
        institucion: institucion
      };
      
      // Solo incluir cédula si no es 'N/P'
      if (profesorFormData.cedula && profesorFormData.cedula !== 'N/P') {
        profesorEditado.idU = profesorFormData.cedula;
      }
      
      console.log('Enviando datos al servidor para editar:', profesorEditado);
      
      // Mostrar alerta para confirmar
      // Proceder sin confirmación
      if (false) {
        setLoading(false);
        return;
      }
      
      // Enviar datos a la API para actualizar en MongoDB
      const response = await fetch(`/api/profesores/${profesorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...profesorEditado,
          institucion: institucion // Asegurarse de incluir la institución
        }),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al editar profesor');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Profesor editado correctamente
      
      // Cerrar el modal y limpiar el formulario
      setShowProfesorForm(false);
      setProfesorFormData({
        nombre: '',
        apellido: '',
        cedula: 'N/P',
        email: '',
        telefono: '',
        especialidad: '',
        fechaIngreso: '',
        modoEdicion: false
      });
      
      // Recargar la lista de profesores
      const loadProfesores = async () => {
        try {
          const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
          const response = await fetch(`/api/profesores?creadorId=${userId}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              const profesoresFormateados = data.data.map(profesor => ({
                _id: profesor._id,
                id: profesor._id,
                cedula: profesor.idU || 'N/P',
                nombre: profesor.nombre || '',
                apellido: profesor.apellido || '',
                email: profesor.email || '',
                telefono: profesor.telefono || '',
                especialidad: profesor.especialidad || '',
                fechaIngreso: profesor.fechaIngreso || null
              }));
              
              setProfesores(profesoresFormateados);
            }
          }
        } catch (error) {
          console.error('Error al recargar profesores:', error);
        }
      };
      
      await loadProfesores();
      setLoading(false);
    } catch (err) {
      console.error('Error al editar profesor:', err);
      setError('Error al editar profesor: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al editar profesor
    }
  };

  // Función para eliminar un profesor
  const handleDeleteProfesor = async (profesorId) => {
    // Proceder sin confirmación
    if (true) {
      try {
        setLoading(true);
        console.log('Eliminando profesor con ID:', profesorId);
        
        // Enviar solicitud a la API para eliminar el profesor
        const response = await fetch(`/api/profesores/${profesorId}`, {
          method: 'DELETE',
        });
        
        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Error al eliminar profesor');
        }
        
        // Mostrar alerta de éxito
        // Mensaje: Profesor eliminado correctamente
        
        // Recargar la lista de profesores
        const loadProfesores = async () => {
          try {
            const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
            const response = await fetch(`/api/profesores?creadorId=${userId}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data) {
                const profesoresFormateados = data.data.map(profesor => ({
                  _id: profesor._id,
                  id: profesor._id,
                  cedula: profesor.idU || 'N/P',
                  nombre: profesor.nombre || '',
                  apellido: profesor.apellido || '',
                  email: profesor.email || '',
                  telefono: profesor.telefono || '',
                  especialidad: profesor.especialidad || ''
                }));
                
                setProfesores(profesoresFormateados);
              }
            }
          } catch (error) {
            console.error('Error al recargar profesores:', error);
          }
        };
        
        await loadProfesores();
        setLoading(false);
      } catch (err) {
        console.error('Error al eliminar profesor:', err);
        setError('Error al eliminar profesor: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
        setLoading(false);
        // Mensaje de error: Error al eliminar profesor
      }
    }
  };

  // Funciones para gestionar alumnos
  const handleAddAlumno = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      // Verificar si el formulario está disponible antes de intentar acceder a sus valores
      const formSelectors = [
        'input[name="grupo"]',
        'input[name="nombre"]',
        'input[name="apellido"]',
        'input[name="fechaNacimiento"]'
      ];
      
      // Si el usuario es docente, es posible que no tenga acceso al formulario de alumnos
      if (esDocente() && !isFormAvailable(formSelectors)) {
        console.log('Formulario de alumnos no disponible para usuario docente');
        setLoading(false);
        return;
      }
      
      // Obtener todos los valores del formulario de forma segura
      const grupoValue = getFormValue('input[name="grupo"]', '');
      const nombreValue = getFormValue('input[name="nombre"]', '');
      const apellidoValue = getFormValue('input[name="apellido"]', '');
      const fechaNacimientoValue = getFormValue('input[name="fechaNacimiento"]', '');
      const cedulaValue = getFormValue('input[name="cedula"]', 'N/P');
      const lugarNacimientoValue = getFormValue('select[name="lugarNacimiento"]', '');
      const sexoValue = getFormValue('select[name="sexo"]', 'Otro');
      const efValue = getFormValue('input[name="ef"]', '');
      const anioValue = getFormValue('select[name="anio"]', '1');
      const seccionValue = getFormValue('select[name="seccion"]', 'A');
      
      console.log('Valores obtenidos directamente del formulario:');
      console.log('Grupo:', grupoValue);
      console.log('Nombre:', nombreValue);
      console.log('Apellido:', apellidoValue);
      console.log('Fecha de nacimiento:', fechaNacimientoValue);
      console.log('Año:', anioValue);
      console.log('Sección:', seccionValue);
      
      if (!nombreValue || !apellidoValue || !fechaNacimientoValue) {
        setError('Por favor, complete todos los campos requeridos.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del usuario actual para generar el ID del alumno
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
      
      if (!userId) {
        setError('No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Calcular la edad basada en la fecha de nacimiento
      const fechaNacimiento = new Date(fechaNacimientoValue);
      const hoy = new Date();
      let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();
      
      if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
        edad--;
      }
      
      // Determinar si es menor de edad
      const esMenorDeEdad = edad < 18;
      
      // Obtener los datos del representante del formulario
      const representanteNombre = getFormValue('input[name="representanteNombre"]', '');
      const representanteApellido = getFormValue('input[name="representanteApellido"]', '');
      const representanteCedula = getFormValue('input[name="representanteCedula"]', '');
      const representanteTelefono = getFormValue('input[name="representanteTelefono"]', '');
      const representanteCorreo = getFormValue('input[name="representanteCorreo"]', '');
      const representanteParentesco = getFormValue('select[name="representanteParentesco"]', 'Padre');
      
      // Crear objeto del nuevo alumno con los datos exactos que espera el modelo Estudiante
      const nuevoAlumno = {
        cedula: cedulaValue,
        nombre: nombreValue,
        apellido: apellidoValue,
        fechaNacimiento: fechaNacimientoValue,
        lugarNacimiento: lugarNacimientoValue,
        sexo: sexoValue,
        grupo: grupoValue, // Usar el valor obtenido directamente del DOM
        ef: efValue,
        anio: anioValue, // Añadir el año escolar
        seccion: seccionValue, // Añadir la sección
        edad: edad,
        esMenorDeEdad: esMenorDeEdad,
        userId: userId,
        userType: userType,
        institucion: institucion,
        // Incluir los datos del representante
        representante: {
          nombre: representanteNombre,
          apellido: representanteApellido,
          cedula: representanteCedula,
          correo: representanteCorreo,
          telefono: representanteTelefono,
          parentesco: representanteParentesco
        }
      };
      
      console.log('Objeto estudiante a enviar:', nuevoAlumno);
      console.log('Valor del grupo a guardar:', nuevoAlumno.grupo);
      
      // Enviar datos a la API para guardar en MongoDB
      const response = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevoAlumno),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear estudiante');
      }
      
      const responseData = await response.json();
      console.log('Respuesta del servidor al crear estudiante:', responseData);
      
      // Limpiar el formulario
      setFormData({
        nombre: '',
        apellido: '',
        cedula: 'N/P',
        fechaNacimiento: '',
        lugarNacimiento: '',
        sexo: 'Otro',
        ef: '',
        grupo: '',
        anio: '',
        seccion: '',
        edad: 0,
        esMenorDeEdad: false,
        modoEdicion: false
      });
      
      // Mostrar mensaje de éxito
      setNotification({
        type: 'success',
        message: 'Alumno agregado correctamente'
      });
      // Limpiar la notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);
      
      // Recargar la lista de estudiantes
      await recargarEstudiantes();
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error al agregar alumno:', err);
      setError('Error al agregar alumno: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al agregar alumno
    }
  };

  const handleEditAlumno = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      
      // Obtener el ID del alumno a editar
      const alumnoId = formData.id || formData._id;
      if (!alumnoId) {
        setError('No se pudo identificar el ID del alumno a editar.');
        setLoading(false);
        return;
      }
      
      // Verificar campos requeridos
      if (!formData.nombre) {
        setError('El nombre es obligatorio.');
        setLoading(false);
        return;
      }
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      
      // Calcular la edad basada en la fecha de nacimiento
      let edad = formData.edad || 0;
      let esMenorDeEdad = formData.esMenorDeEdad || false;
      
      if (formData.fechaNacimiento) {
        edad = calcularEdad(formData.fechaNacimiento);
        esMenorDeEdad = edad < 18;
      }
      
      console.log('Datos del formulario para edición:', formData);
      console.log('ID del alumno a editar:', alumnoId);
      console.log('Edad calculada:', edad);
      
      // Crear objeto del alumno editado usando los datos del formData
      const alumnoEditado = {
        nombre: formData.nombre,
        apellido: formData.apellido || '',
        fechaNacimiento: formData.fechaNacimiento || '',
        lugarNacimiento: formData.lugarNacimiento || '',
        sexo: formData.sexo || 'Otro',
        grupo: formData.grupo || '',
        ef: formData.ef || '',
        anio: formData.anio || '1',
        seccion: formData.seccion || 'A',
        edad: edad,
        esMenorDeEdad: esMenorDeEdad,
        // Incluir los datos del representante
        representante: {
          nombre: formData.representanteNombre || '',
          apellido: formData.representanteApellido || '',
          cedula: formData.representanteCedula || '',
          correo: formData.representanteCorreo || '',
          telefono: formData.representanteTelefono || '',
          parentesco: formData.representanteParentesco || 'Padre'
        }
      };
      
      // Solo incluir cédula si no es 'N/P'
      if (formData.cedula && formData.cedula !== 'N/P') {
        alumnoEditado.idU = formData.cedula;
      }
      
      console.log('Objeto estudiante a actualizar:', alumnoEditado);
      console.log('Valor del grupo a actualizar:', alumnoEditado.grupo);
      
      // Enviar datos a la API para actualizar en MongoDB
      const response = await fetch(`/api/estudiantes/${alumnoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...alumnoEditado,
          institucion: institucion,
          userType: sessionStorage.getItem('userType') || localStorage.getItem('userType')
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al editar alumno');
      }
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      // Mostrar alerta de éxito
      // Mensaje: Alumno editado correctamente
      
      // Cerrar el formulario y limpiar los datos
      setShowStudentForm(false);
      setFormData({});
      
      // Mostrar mensaje de éxito
      setNotification({
        type: 'success',
        message: 'Alumno editado correctamente'
      });
      // Limpiar la notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);
      
      // Recargar la lista de estudiantes
      await recargarEstudiantes();
      setLoading(false);
    } catch (err) {
      console.error('Error al editar alumno:', err);
      setError('Error al editar alumno: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al editar alumno
    }
  };

  const handleDeleteAlumno = async (alumnoId) => {
    // Proceder sin confirmación
    if (true) {
      try {
        setLoading(true);
        console.log('Eliminando alumno con ID:', alumnoId);
        
        // Enviar solicitud a la API para eliminar el alumno
        const response = await fetch(`/api/estudiantes/${alumnoId}`, {
          method: 'DELETE',
        });
        
        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Error al eliminar alumno');
        }
        
        // Mostrar mensaje de éxito
        setNotification({
          type: 'success',
          message: 'Alumno eliminado correctamente'
        });
        // Limpiar la notificación después de 3 segundos
        setTimeout(() => setNotification(null), 3000);
        
        // Recargar la lista de estudiantes
        await recargarEstudiantes();
        setLoading(false);
      } catch (err) {
        console.error('Error al eliminar alumno:', err);
        setError('Error al eliminar alumno: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
        setLoading(false);
        // Mensaje de error: Error al eliminar alumno
      }
    }
  };

  // Función para abrir modal de inscripción
  const handleInscribirAlumno = async (alumno) => {
    try {
      setAlumnoParaInscribir(alumno);
      
      // Mostrar todas las aulas disponibles, no solo las que coincidan con año/sección
      setAulasDisponibles(aulas);
      setAulaSeleccionada('');
      setShowInscripcionModal(true);
    } catch (error) {
      console.error('Error al preparar inscripción:', error);
      setNotification({ type: 'error', message: 'Error al preparar inscripción' });
    }
  };

  // Función para confirmar inscripción
  const handleConfirmarInscripcion = async () => {
    if (!aulaSeleccionada || !alumnoParaInscribir) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/aulas/${aulaSeleccionada}/estudiantes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estudianteId: alumnoParaInscribir._id || alumnoParaInscribir.id
        })
      });

      // Manejo robusto de respuesta para evitar errores de JSON vacío
      const isJson = (response.headers.get('content-type') || '').includes('application/json');
      if (!response.ok) {
        let errorMessage = `Error ${response.status}`;
        if (isJson) {
          const errData = await response.json().catch(() => null);
          if (errData && (errData.message || errData.error)) {
            errorMessage = errData.message || errData.error;
          }
        } else {
          const text = await response.text().catch(() => '');
          if (text) errorMessage = text;
        }
        setNotification({ type: 'error', message: errorMessage || 'Error al inscribir alumno' });
        return;
      }

      const result = isJson ? (await response.json()) : { success: false, message: 'Respuesta no es JSON' };
      
      if (result.success) {
        setNotification({ type: 'success', message: 'Alumno inscrito exitosamente' });
        // Recargar datos
        loadEstudiantes();
        loadAulas();
      } else {
        setNotification({ type: 'error', message: result.message || 'Error al inscribir alumno' });
      }
    } catch (error) {
      console.error('Error al inscribir alumno:', error);
      setNotification({ type: 'error', message: 'Error al inscribir alumno' });
    } finally {
      setLoading(false);
      setShowInscripcionModal(false);
      setAlumnoParaInscribir(null);
      setAulaSeleccionada('');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // Función para generar carnet de estudiante
  const handleGenerarCarnet = async (alumno) => {
    try {
      setLoading(true);
      
      // Preparar los datos del estudiante para el carnet
      const datosCarnet = {
        nombre: alumno.nombre || '',
        apellido: alumno.apellido || '',
        cedula: alumno.cedula || alumno.idU || 'N/P',
        anio: alumno.anio || '',
        seccion: alumno.seccion || '',
        foto: alumno.foto || null // Si tienen foto almacenada
      };

      const response = await fetch('/api/carnet/generar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosCarnet)
      });

      if (!response.ok) {
        throw new Error('Error al generar el carnet');
      }

      // Obtener el blob del PDF generado
      const blob = await response.blob();
      
      // Crear URL para descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Nombre del archivo
      const nombreArchivo = `carnet_${datosCarnet.cedula}_${datosCarnet.nombre.replace(/\s+/g, '_')}.pdf`;
      link.download = nombreArchivo;
      
      // Descargar el archivo
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setNotification({
        type: 'success',
        message: 'Carnet generado exitosamente'
      });
      
      // Limpiar notificación después de 3 segundos
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error) {
      console.error('Error al generar carnet:', error);
      setError('Error al generar carnet: ' + (error.message || 'Por favor, intente de nuevo más tarde.'));
    } finally {
      setLoading(false);
    }
  };
  
  // Función para calcular la edad a partir de la fecha de nacimiento
  const calcularEdad = useCallback((fechaNacimiento) => {
    if (!fechaNacimiento) return 0;
    
    const fechaNac = new Date(fechaNacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNac.getFullYear();
    const mes = hoy.getMonth() - fechaNac.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
      edad--;
    }
    
    return edad;
  }, []);
  
  // Función para cambiar el estado de un alumno (0 o 1)
  const handleEstadoChange = async (alumnoId, currentEstado) => {
    try {
      setUpdatingEstado(true);
      const nuevoEstado = currentEstado === 1 ? 0 : 1;
      
      console.log(`Cambiando estado del alumno ${alumnoId} de ${currentEstado} a ${nuevoEstado}`);
      
      // Enviar solicitud a la API para actualizar el estado del alumno
      const response = await fetch(`/api/estudiantes/${alumnoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: nuevoEstado
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al actualizar el estado del alumno');
      }
      
      // Actualizar el estado local de los alumnos
      setAlumnos(alumnos.map(alumno => {
        if ((alumno.id || alumno._id) === alumnoId) {
          return { ...alumno, estado: nuevoEstado };
        }
        return alumno;
      }));
      
      console.log('Estado actualizado correctamente');
    } catch (err) {
      console.error('Error al cambiar el estado del alumno:', err);
      setError('Error al cambiar el estado del alumno: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
    } finally {
      setUpdatingEstado(false);
    }
  };

  // Funciones para gestión de profesores por materia
  const verificarYCompletarAsignacionesAula = async (aula) => {
    try {
      console.log('=== VERIFICANDO Y COMPLETANDO ASIGNACIONES ===');
      console.log('Aula:', aula.nombre, 'Año:', aula.anio);
      
      // Obtener las materias que deberían existir para este año
      const materiasEsperadas = materiasPorAnio[aula.anio + ' año'] || [];
      console.log('Materias esperadas para', aula.anio + ' año:', materiasEsperadas.map(m => m.nombre));
      
      // Obtener las asignaciones actuales del aula
      let asignacionesActuales = [...(aula.asignaciones || [])];
      console.log('Asignaciones actuales:', asignacionesActuales.map(a => a.materia?.nombre));
      
      // Verificar qué materias faltan
      const materiasFaltantes = [];
      
      materiasEsperadas.forEach(materia => {
        const existeAsignacion = asignacionesActuales.find(a => 
          a.materia?.id === materia.id || 
          a.materia?.codigo === materia.codigo || 
          a.materia?.nombre === materia.nombre
        );
        
        if (!existeAsignacion) {
          materiasFaltantes.push(materia);
        }
      });
      
      console.log('Materias faltantes:', materiasFaltantes.map(m => m.nombre));
      
      // Si hay materias faltantes, crearlas sin profesor asignado
      if (materiasFaltantes.length > 0) {
        console.log('Añadiendo', materiasFaltantes.length, 'materias faltantes...');
        
        materiasFaltantes.forEach(materia => {
          const nuevaAsignacion = {
            materia: {
              id: materia.id || materia.codigo,
              codigo: materia.codigo,
              nombre: materia.nombre
            },
            profesor: {
              nombre: '',
              apellido: ''
            },
            actividades: [],
            puntosExtras: [],
            puntosPorMomento: {
              momento1: [],
              momento2: [],
              momento3: []
            }
          };
          
          asignacionesActuales.push(nuevaAsignacion);
        });
        
        // Actualizar el aula en la base de datos
        console.log('Actualizando aula con asignaciones completas...');
        console.log('URL:', `/api/aulas/${aula._id}`);
        console.log('Payload:', { asignaciones: asignacionesActuales });
        
        const response = await fetch(`/api/aulas/${aula._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            asignaciones: asignacionesActuales
          }),
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Aula actualizada con materias completas:', result);
          
          // Actualizar el aula en el estado
          const aulaActualizada = { ...aula, asignaciones: asignacionesActuales };
          setAulaGestionProfesores(aulaActualizada);
          
          return aulaActualizada;
        } else {
          const errorData = await response.json();
          console.error('Error al actualizar aula con materias completas:', errorData);
          throw new Error(`Error del servidor: ${errorData.message || response.statusText}`);
        }
      }
      
      return aula;
      
    } catch (error) {
      console.error('Error al verificar y completar asignaciones:', error);
      return aula;
    }
  };

  const abrirGestionProfesores = async (aula) => {
    try {
      console.log('=== ABRIENDO GESTIÓN DE PROFESORES ===');
      console.log('Aula seleccionada:', aula);
      
      // Mostrar el modal inmediatamente para mejor UX
      setShowGestionProfesoresModal(true);
      setLoading(true);
      
      // Primero verificar y completar todas las asignaciones faltantes
      const aulaCompleta = await verificarYCompletarAsignacionesAula(aula);
      setAulaGestionProfesores(aulaCompleta);
      
      // Cargar datos en paralelo para mayor eficiencia
      console.log('Cargando datos en paralelo...');
      
      const [profesoresResult, asignacionesResult] = await Promise.allSettled([
        // Cargar profesores disponibles
        loadProfesoresDisponibles(),
        // Cargar asignaciones existentes de esta aula (actualizadas)
        cargarAsignacionesAula(aulaCompleta._id)
      ]);
      
      // Verificar resultados
      if (profesoresResult.status === 'rejected') {
        console.error('Error cargando profesores:', profesoresResult.reason);
      } else {
        console.log('Profesores cargados exitosamente');
      }
      
      if (asignacionesResult.status === 'rejected') {
        console.error('Error cargando asignaciones:', asignacionesResult.reason);
      } else {
        console.log('Asignaciones cargadas exitosamente');
      }
      
      // Verificar que tenemos datos mínimos necesarios
      if (profesoresDisponibles.length === 0) {
        console.warn('No se cargaron profesores, reintentando...');
        await loadProfesoresDisponibles();
      }
      
      console.log('Estado final - Profesores disponibles:', profesoresDisponibles.length);
      console.log('Estado final - Asignaciones:', asignacionesAula.length);
      console.log('=== GESTIÓN DE PROFESORES LISTA ===');
      
    } catch (error) {
      console.error('=== ERROR AL ABRIR GESTIÓN DE PROFESORES ===');
      console.error('Error:', error);
      setError('Error al cargar la información de profesores: ' + error.message);
      setNotification({
        type: 'error',
        message: 'Error al cargar la información de profesores'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cargarAsignacionesAula = async (aulaId) => {
    try {
      console.log('=== CARGANDO ASIGNACIONES DEL AULA ===');
      console.log('Aula ID:', aulaId);
      
      if (!aulaId) {
        throw new Error('ID del aula es requerido');
      }
      
      // Obtener el aula actualizada desde la API
      console.log('Solicitando aula desde API...');
      const response = await fetch(`/api/aulas/${aulaId}`);
      
      console.log('Respuesta de la API:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Datos recibidos:', data);
        
        if (data.success && data.data) {
          const aulaActualizada = data.data;
          const asignacionesDelAula = aulaActualizada.asignaciones || [];
          
          console.log('Aula actualizada obtenida:', aulaActualizada.nombre);
          console.log('Total de asignaciones encontradas:', asignacionesDelAula.length);
          console.log('Asignaciones:', asignacionesDelAula);
          
          // Actualizar ambos estados
          setAulaGestionProfesores(aulaActualizada);
          setAsignacionesAula(asignacionesDelAula);
          
          console.log('Estados actualizados exitosamente');
          return asignacionesDelAula;
        } else {
          console.warn('Respuesta sin datos válidos, usando fallback');
          const fallbackAsignaciones = aulaGestionProfesores?.asignaciones || [];
          setAsignacionesAula(fallbackAsignaciones);
          return fallbackAsignaciones;
        }
      } else {
        console.error('Error en respuesta de API:', response.status);
        const fallbackAsignaciones = aulaGestionProfesores?.asignaciones || [];
        setAsignacionesAula(fallbackAsignaciones);
        return fallbackAsignaciones;
      }
    } catch (error) {
      console.error('=== ERROR AL CARGAR ASIGNACIONES ===');
      console.error('Error:', error);
      // Fallback: usar las asignaciones que ya tenemos
      const fallbackAsignaciones = aulaGestionProfesores?.asignaciones || [];
      setAsignacionesAula(fallbackAsignaciones);
      return fallbackAsignaciones;
    }
  };

  const cambiarProfesorMateria = async (materiaId, profesorId, materiaNombre) => {
    try {
      setLoading(true);
      console.log('=== INICIANDO CAMBIO DE PROFESOR ===');
      console.log('Materia ID:', materiaId);
      console.log('Profesor ID:', profesorId);
      console.log('Materia Nombre:', materiaNombre);
      console.log('Profesores Disponibles:', profesoresDisponibles);
      
      // Validar que tenemos datos necesarios
      if (!profesorId || !materiaId || !aulaGestionProfesores) {
        throw new Error('Faltan datos necesarios para la asignación');
      }
      
      // Obtener información del profesor seleccionado
      const profesor = profesoresDisponibles.find(p => p._id === profesorId || p.id === profesorId);
      if (!profesor) {
        throw new Error('Profesor no encontrado en la lista');
      }
      
      const profesorNombre = `${profesor.nombre} ${profesor.apellido || ''}`.trim();
      console.log('Profesor encontrado:', profesor);
      console.log('Nombre completo profesor:', profesorNombre);
      
      // Preparar la nueva asignación con la estructura exacta
      const nuevaAsignacion = {
        materia: {
          id: materiaId,
          codigo: materiaId,
          nombre: materiaNombre
        },
        profesor: {
          nombre: profesor.nombre || '',
          apellido: profesor.apellido || ''
        },
        actividades: [],
        puntosExtras: [],
        puntosPorMomento: {
          momento1: [],
          momento2: [],
          momento3: []
        }
      };
      
      console.log('Nueva asignación preparada:', nuevaAsignacion);
      
      // Obtener las asignaciones actuales del aula
      let asignacionesActuales = [...(aulaGestionProfesores.asignaciones || [])];
      console.log('Asignaciones actuales antes:', asignacionesActuales);
      
      // Buscar si ya existe una asignación para esta materia
      const indiceAsignacionExistente = asignacionesActuales.findIndex(a => {
        return (
          a.materia?.id === materiaId || 
          a.materia?.codigo === materiaId || 
          a.materia?.nombre === materiaNombre
        );
      });
      
      if (indiceAsignacionExistente >= 0) {
        // Actualizar asignación existente
        asignacionesActuales[indiceAsignacionExistente] = nuevaAsignacion;
        console.log('Actualizando asignación existente en índice:', indiceAsignacionExistente);
      } else {
        // Añadir nueva asignación
        asignacionesActuales.push(nuevaAsignacion);
        console.log('Añadiendo nueva asignación');
      }
      
      console.log('Asignaciones actuales después:', asignacionesActuales);
      
      // Preparar el payload completo para actualizar el aula
      const updatePayload = {
        asignaciones: asignacionesActuales
      };
      
      console.log('Payload a enviar:', updatePayload);
      console.log('URL de actualización:', `/api/aulas/${aulaGestionProfesores._id}`);
      
      // Actualizar el aula en la base de datos
      const response = await fetch(`/api/aulas/${aulaGestionProfesores._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      console.log('Respuesta del servidor:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error del servidor:', errorData);
        throw new Error(`Error del servidor: ${errorData.message || response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Aula actualizada exitosamente:', result);

      // Recargar las asignaciones del aula inmediatamente
      console.log('Recargando asignaciones...');
      await cargarAsignacionesAula(aulaGestionProfesores._id);
      
      // Recargar la lista de aulas también
      console.log('Recargando lista de aulas...');
      await loadAulas();
      
      setNotification({
        type: 'success',
        message: `Profesor ${profesorNombre} asignado correctamente a ${materiaNombre}`
      });
      setTimeout(() => setNotification(null), 3000);
      
      console.log('=== CAMBIO DE PROFESOR COMPLETADO ===');
      
    } catch (error) {
      console.error('=== ERROR AL CAMBIAR PROFESOR ===');
      console.error('Error:', error);
      setError('Error al asignar profesor: ' + error.message);
      setNotification({
        type: 'error',
        message: 'Error al asignar profesor: ' + error.message
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Función para verificar y crear materias faltantes
  const verificarYCrearMateriasFaltantes = async (anio) => {
    try {
      const materiasDelAnio = materiasPorAnio[anio + ' año'] || [];
      console.log('Verificando materias para año:', anio, materiasDelAnio);
      
      for (const materia of materiasDelAnio) {
        try {
          // Verificar si la materia existe
          const response = await fetch('/api/materias');
          const data = await response.json();
          
          if (data.success) {
            const materiaExiste = data.data.some(m => 
              m.codigo === materia.codigo || 
              m.nombre === materia.nombre ||
              m._id === materia.id
            );
            
            if (!materiaExiste) {
              console.log('Creando materia faltante:', materia.nombre);
              
              // Crear la materia
              const createResponse = await fetch('/api/materias', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  codigo: materia.codigo,
                  nombre: materia.nombre,
                  descripcion: `Materia ${materia.nombre} para ${anio}° año`,
                  userId: sessionStorage.getItem('userId') || localStorage.getItem('userId'),
                  userType: sessionStorage.getItem('userType') || localStorage.getItem('userType'),
                  institucion: 'Acacias'
                }),
              });
              
              if (createResponse.ok) {
                const newMateria = await createResponse.json();
                console.log('Materia creada exitosamente:', newMateria);
              } else {
                console.error('Error al crear materia:', materia.nombre);
              }
            }
          }
        } catch (error) {
          console.error('Error al verificar materia:', materia.nombre, error);
        }
      }
    } catch (error) {
      console.error('Error al verificar materias faltantes:', error);
    }
  };

  // Funciones para gestionar materias
  const handleMateriaFormChange = (e) => {
    const { name, value } = e.target;
    setMateriaFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para cargar materias directamente desde MongoDB
  const loadMaterias = async () => {
    try {
      setLoading(true);
      console.log('Cargando materias directamente desde MongoDB...');
      
      // Cargar materias directamente desde la API sin filtros
      const response = await fetch('/api/materias');
      
      if (!response.ok) {
        throw new Error(`Error al cargar materias: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Materias cargadas desde MongoDB:', data);
      
      if (data.success && data.data) {
        // Verificar la estructura de los datos recibidos
        console.log('Estructura de la primera materia:', JSON.stringify(data.data[0], null, 2));
        
        // Transformar los datos para que coincidan con el formato esperado
        const materiasFormateadas = data.data.map(materia => {
          // Asegurarse de que el _id sea una cadena de texto
          const materiaId = materia._id ? materia._id.toString() : '';
          return {
            _id: materiaId,
            id: materiaId,
            nombre: materia.nombre || 'Sin nombre',
            codigo: materia.codigo || 'N/A',
            descripcion: materia.descripcion || ''
          };
        });
        
        // Imprimir los datos formateados para depuración
        console.log('Materias formateadas con código y descripción:', JSON.stringify(materiasFormateadas, null, 2));
        
        console.log('Materias formateadas para el selector:', materiasFormateadas);
        setMaterias(materiasFormateadas);
      } else {
        console.error('No se recibieron datos de materias válidos');
        setMaterias([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar materias:', err);
      setError('Error al cargar materias. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };
  

  
  // Función para agregar una nueva materia
  const handleAddMateria = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Agregando materia con datos:', materiaFormData);
      
      if (!materiaFormData.nombre || !materiaFormData.codigo) {
        // Mensaje: Por favor, complete todos los campos requeridos.
        setError('Por favor, complete todos los campos requeridos.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      console.log('Institución detectada para materia:', institucion);
      const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
      
      if (!userId) {
        // Mensaje: No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.
        setError('No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Crear objeto de la nueva materia
      const nuevaMateria = {
        codigo: materiaFormData.codigo,
        nombre: materiaFormData.nombre,
        descripcion: materiaFormData.descripcion || '',
        userId: userId,
        userType: userType,
        institucion: institucion // Incluir el valor de la institución
      };
      
      console.log('Enviando datos al servidor:', nuevaMateria);
      
      // Mostrar alerta para confirmar
      // Proceder sin confirmación
      if (false) {
        setLoading(false);
        return;
      }
      
      // Enviar datos a la API para guardar en MongoDB
      const response = await fetch('/api/materias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevaMateria),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al agregar materia');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Materia agregada correctamente
      
      // Limpiar el formulario
      setMateriaFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        modoEdicion: false
      });
      
      // Ocultar el formulario
      setShowMateriaForm(false);
      
      // Recargar la lista de materias
      await loadMaterias();
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error al agregar materia:', err);
      setError('Error al agregar materia: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al agregar materia
    }
  };

  const handleEditMateria = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Editando materia con datos:', materiaFormData);
      
      if (!materiaFormData.nombre || !materiaFormData.codigo) {
        setError('Por favor, complete todos los campos requeridos.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID de la materia a editar
      const materiaId = materiaFormData.id || materiaFormData._id;
      if (!materiaId) {
        setError('No se pudo identificar el ID de la materia a editar.');
        setLoading(false);
        return;
      }
      
      // Obtener el valor de la institución desde el DOM
      const institucionElement = document.getElementById('institucion');
      const institucion = institucionElement ? institucionElement.textContent.trim() : '';
      console.log('Institución detectada para edición de materia:', institucion);
      
      // Crear objeto de la materia editada
      const materiaEditada = {
        codigo: materiaFormData.codigo,
        nombre: materiaFormData.nombre,
        descripcion: materiaFormData.descripcion || ''
      };
      
      console.log('Enviando datos al servidor para editar:', materiaEditada);
      
      // Mostrar alerta para confirmar
      // Proceder sin confirmación
      if (false) {
        setLoading(false);
        return;
      }
      
      // Enviar datos a la API para actualizar en MongoDB
      const response = await fetch(`/api/materias/${materiaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...materiaEditada,
          institucion: institucion, // Incluir el valor de la institución
          userType: sessionStorage.getItem('userType') || localStorage.getItem('userType')
        }),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al editar materia');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Materia editada correctamente
      
      // Cerrar el modal y limpiar el formulario
      setShowMateriaForm(false);
      setMateriaFormData({
        codigo: '',
        nombre: '',
        descripcion: '',
        modoEdicion: false
      });
      
      // Recargar la lista de materias
      await loadMaterias();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al editar materia:', err);
      setError('Error al editar materia: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al editar materia
    }
  };


  const handleDeleteMateria = async (materiaId) => {
    // Proceder sin confirmación
    if (true) {
      try {
        setLoading(true);
        console.log('Eliminando materia con ID:', materiaId);
        
        // Enviar solicitud a la API para eliminar la materia
        const response = await fetch(`/api/materias/${materiaId}`, {
          method: 'DELETE',
        });
        
        const responseData = await response.json();
        console.log('Respuesta del servidor:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || 'Error al eliminar materia');
        }
        
        // Mostrar alerta de éxito
        // Mensaje: Materia eliminada correctamente
        
        // Recargar la lista de materias
        await loadMaterias();
        
        setLoading(false);
      } catch (err) {
        console.error('Error al eliminar materia:', err);
        setError('Error al eliminar materia: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
        setLoading(false);
        // Mensaje de error: Error al eliminar materia
      }
    }
  };
  
  // Comentario: La función handleAsignacionFormChange ya está definida anteriormente en el código
  
  // Manejar la selección de alumnos
  const handleAlumnosChange = (selectedAlumnos) => {
    setAsignacionFormData({
      ...asignacionFormData,
      alumnos: selectedAlumnos
    });
  };
  
  // Función para manejar cambios en los campos del formulario de actividades
  const handleActividadFormChange = (e) => {
    const { name, value } = e.target;
    setActividadFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Función para iniciar la edición de un profesor en una asignación
  const startEditingProfesor = (materia) => {
    setEditingAsignacionId(materia.asignacionId);
    setEditingProfesorId(materia.profesorId || '');
  };
  
  // Función para cambiar el profesor de una asignación
  const handleChangeProfesor = async (asignacionId, newProfesorId, materiaId) => {
    try {
      setLoading(true);
      console.log(`Cambiando profesor de asignación ${asignacionId}, materia ${materiaId} a profesor ${newProfesorId}`);
      
      // Si no se seleccionó un profesor, no hacer nada
      if (!newProfesorId) {
        setNotification({ type: 'error', message: 'Por favor, selecciona un profesor' });
        setLoading(false);
        return;
      }
      
      // Buscar el profesor para obtener su nombre
      const profesor = profesores.find(p => p._id === newProfesorId || p.id === newProfesorId);
      if (!profesor) {
        throw new Error(`No se encontró el profesor con ID ${newProfesorId}`);
      }
      
      const profesorNombre = `${profesor.nombre} ${profesor.apellido || ''}`;
      
      // Obtener la asignación actual para mantener todos sus datos originales
      const asignacionActual = asignaciones.find(a => a._id === asignacionId || a.id === asignacionId);
      if (!asignacionActual) {
        throw new Error(`No se encontró la asignación con ID ${asignacionId}`);
      }
      
      // Actualizar la asignación en la base de datos, asegurándonos de mantener el periodo original y los alumnos
      const response = await fetch('/api/asignaciones/update-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: asignacionId,
          profesorId: newProfesorId,
          profesorNombre: profesorNombre,
          // Mantener el periodo original
          periodoId: asignacionActual.periodoId,
          periodo: asignacionActual.periodo,
          // Mantener los alumnos originales
          alumnos: asignacionActual.alumnos || [],
          alumnosInfo: asignacionActual.alumnosInfo || [],
          // Asegurarnos de no modificar otros campos importantes
          materiaId: materiaId || asignacionActual.materiaId,
          materiaNombre: asignacionActual.materiaNombre,
          anio: asignacionActual.anio,
          seccion: asignacionActual.seccion,
          turno: asignacionActual.turno
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar profesor: ${errorText}`);
      }
      
      // Actualizar la asignación en el estado local
      setAsignaciones(prevAsignaciones => 
        prevAsignaciones.map(asignacion => {
          if (asignacion._id === asignacionId || asignacion.id === asignacionId) {
            // Si la asignación tiene un array de materias, actualizar la materia específica
            if (asignacion.materias && Array.isArray(asignacion.materias) && asignacion.materias.length > 0) {
              return {
                ...asignacion,
                materias: asignacion.materias.map(materia => {
                  if (materia.materiaId === materiaId) {
                    return {
                      ...materia,
                      profesorId: newProfesorId,
                      profesorNombre: profesorNombre
                    };
                  }
                  return materia;
                })
              };
            } else {
              // Si no tiene array de materias, actualizar la asignación directamente
              return {
                ...asignacion,
                profesorId: newProfesorId,
                profesorNombre: profesorNombre
              };
            }
          }
          return asignacion;
        })
      );
      
      // Limpiar el estado de edición
      setEditingAsignacionId(null);
      setEditingProfesorId('');
      
      // Mostrar mensaje de éxito
      setNotification({ type: 'success', message: `Profesor cambiado a ${profesorNombre}` });
      
      setLoading(false);
      setError(null);
      
      // Limpiar la notificación después de 5 segundos
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    } catch (err) {
      console.error('Error al cambiar profesor:', err);
      setError(`Error al cambiar profesor: ${err.message}`);
      setNotification({ type: 'error', message: `Error al cambiar profesor: ${err.message}` });
      setLoading(false);
      
      // Limpiar la notificación después de 5 segundos
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    }
  };
  
  // Función para cambiar el profesor de una asignación

  
  // Función para cargar asignaciones con datos completos desde MongoDB
  const loadAsignaciones = async () => {
    try {
      setLoading(true);
      console.log('Cargando asignaciones con datos completos...');
      
      // Cargar asignaciones desde la API
      const response = await fetch('/api/asignaciones');
      
      if (!response.ok) {
        throw new Error(`Error al cargar asignaciones: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Asignaciones cargadas:', data);
      
      // Determinar la estructura de los datos recibidos
      let asignacionesData = [];
      if (Array.isArray(data)) {
        asignacionesData = data;
      } else if (data && data.success && Array.isArray(data.data)) {
        asignacionesData = data.data;
      } else {
        console.error('Los datos recibidos no tienen el formato esperado:', data);
        setAsignaciones([]);
        setLoading(false);
        return;
      }

      // Para cada asignación, construir alumnosInfo a partir de los datos ya recibidos
      const asignacionesConEstudiantes = asignacionesData.map((asignacion) => {
        try {
          // Preferir alumnos completos si vienen del backend; de lo contrario usar alumnosInfo existente
          let alumnosInfo = [];
          if (Array.isArray(asignacion.alumnos) && asignacion.alumnos.length > 0) {
            alumnosInfo = asignacion.alumnos.map((al) => ({
              id: al._id || al.id,
              nombre: `${al.nombre || ''} ${al.apellido || ''}`.trim(),
              cedula: al.idU || al.cedula || 'N/P'
            }));
          } else if (Array.isArray(asignacion.alumnosInfo)) {
            alumnosInfo = asignacion.alumnosInfo.map((al) => ({
              id: al.id || al._id,
              nombre: al.nombre || '',
              cedula: al.idU || al.cedula || 'N/P'
            }));
          }
          return { ...asignacion, alumnosInfo };
        } catch (error) {
          console.error('Error al procesar alumnos de la asignación:', error);
          return asignacion;
        }
      });
      
      // Para cada asignación, vamos a cargar los datos completos de materia, profesor y alumnos
      const asignacionesCompletas = await Promise.all(asignacionesData.map(async (asignacion) => {
        let asignacionCompleta = { ...asignacion };
        
        // Si no tiene materiaNombre, cargar datos de la materia
        if (!asignacion.materiaNombre && asignacion.materiaId) {
          try {
            const materiaResponse = await fetch(`/api/materias/${asignacion.materiaId}`);
            if (materiaResponse.ok) {
              const materiaData = await materiaResponse.json();
              if (materiaData.success && materiaData.data) {
                const materia = materiaData.data;
                asignacionCompleta.materiaNombre = `${materia.codigo || 'N/A'} - ${materia.nombre || 'Sin nombre'}`;
              }
            }
          } catch (error) {
            console.error('Error al cargar datos de materia:', error);
          }
        }
        
        // Si no tiene profesorNombre, cargar datos del profesor
        if (!asignacion.profesorNombre && asignacion.profesorId) {
          try {
            const profesorResponse = await fetch(`/api/profesores/${asignacion.profesorId}`);
            if (profesorResponse.ok) {
              const profesorData = await profesorResponse.json();
              if (profesorData.success && profesorData.data) {
                const profesor = profesorData.data;
                asignacionCompleta.profesorNombre = `${profesor.nombre || ''} ${profesor.apellido || ''}`;
              }
            }
          } catch (error) {
            console.error('Error al cargar datos de profesor:', error);
          }
        }
        
        // Si no tiene alumnosInfo, cargar datos de los alumnos
        if ((!asignacion.alumnosInfo || asignacion.alumnosInfo.length === 0) && asignacion.alumnos && asignacion.alumnos.length > 0) {
          try {
            // Crear un array para almacenar la información de los alumnos
            const alumnosInfo = [];
            
            // Primero, obtener todos los estudiantes para buscar por nombre
            try {
              console.log('Obteniendo lista completa de estudiantes');
              const estudiantesResponse = await fetch('/api/estudiantes');
              
              if (estudiantesResponse.ok) {
                const estudiantesData = await estudiantesResponse.json();
                console.log('Datos de estudiantes recibidos:', estudiantesData);
                
                if (estudiantesData.success && Array.isArray(estudiantesData.data)) {
                  const todosEstudiantes = estudiantesData.data;
                  
                  // Para cada ID de alumno en la asignación
                  for (const alumnoId of asignacion.alumnos) {
                    try {
                      // Buscar el estudiante por ID
                      const estudiante = todosEstudiantes.find(est => est._id === alumnoId);
                      
                      if (estudiante) {
                        console.log(`Estudiante encontrado para ID ${alumnoId}:`, estudiante);
                        
                        // Obtener nombre e identificación
                        const nombre = estudiante.nombre || 'Sin nombre';
                        const apellido = estudiante.apellido || '';
                        const identificacion = estudiante.idU || estudiante.cedula || 'N/A';
                        
                        console.log(`Datos del estudiante completos:`, estudiante);
                        console.log(`Nombre: ${nombre}, Apellido: ${apellido}, Identificación: ${identificacion}`);
                        
                        alumnosInfo.push({
                          id: estudiante._id,
                          nombre: nombre,
                          apellido: estudiante.apellido || '',
                          cedula: identificacion,
                          idU: estudiante.idU || 'N/P' // Asegurar que se incluya la identificación
                        });
                      } else {
                        console.log(`No se encontró estudiante para ID ${alumnoId}, intentando obtener por API individual`);
                        
                        // Si no se encuentra en la lista completa, intentar obtener individualmente
                        const alumnoResponse = await fetch(`/api/estudiantes/${alumnoId}`);
                        if (alumnoResponse.ok) {
                          const alumnoData = await alumnoResponse.json();
                          
                          if (alumnoData.success && alumnoData.data) {
                            const alumno = alumnoData.data;
                            alumnosInfo.push({
                              id: alumno._id,
                              nombre: alumno.nombre || 'Sin nombre',
                              apellido: alumno.apellido || '',
                              cedula: alumno.idU || alumno.cedula || 'N/A',
                              idU: alumno.idU || 'N/P'
                            });
                          }
                        }
                      }
                    } catch (error) {
                      console.error(`Error al procesar alumno con ID ${alumnoId}:`, error);
                    }
                  }
                }
              } else {
                console.error('Error al obtener lista de estudiantes:', await estudiantesResponse.text());
                
                // Método de respaldo: obtener estudiantes uno por uno
                for (const alumnoId of asignacion.alumnos) {
                  try {
                    const alumnoResponse = await fetch(`/api/estudiantes/${alumnoId}`);
                    if (alumnoResponse.ok) {
                      const alumnoData = await alumnoResponse.json();
                      
                      if (alumnoData.success && alumnoData.data) {
                        const alumno = alumnoData.data;
                        alumnosInfo.push({
                          id: alumno._id,
                          nombre: alumno.nombre || 'Sin nombre',
                          apellido: alumno.apellido || '',
                          cedula: alumno.idU || alumno.cedula || 'N/A',
                          idU: alumno.idU || 'N/P'
                        });
                      }
                    }
                  } catch (error) {
                    console.error(`Error al procesar alumno con ID ${alumnoId}:`, error);
                  }
                }
              }
            } catch (error) {
              console.error('Error al obtener estudiantes:', error);
            }
            
            asignacionCompleta.alumnosInfo = alumnosInfo;
          } catch (error) {
            console.error('Error al cargar datos de alumnos:', error);
          }
        }
        
        return asignacionCompleta;
      }));
      
      // Combinar los datos de estudiantes con las asignaciones completas
      const asignacionesFinales = asignacionesCompletas.map((asignacion) => {
        const asignacionConEstudiantes = asignacionesConEstudiantes.find(a => a._id === asignacion._id);
        return {
          ...asignacion,
          alumnosInfo: asignacionConEstudiantes?.alumnosInfo || asignacion.alumnosInfo || []
        };
      });

      console.log('Asignaciones con datos completos:', asignacionesFinales);
      setAsignaciones(asignacionesFinales);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar asignaciones:', err);
      setError('Error al cargar asignaciones. Por favor, intente de nuevo más tarde.');
      setAsignaciones([]);
      setLoading(false);
    }
  };
  const handleAddAsignacion = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Agregando asignaciones para el año:', asignacionFormData.anio);
      
      if (!asignacionFormData.profesorId) {
        // Mensaje: Por favor, seleccione un profesor.
        setError('Por favor, seleccione un profesor.');
        setLoading(false);
        return;
      }
      
      // Verificar si hay un periodo seleccionado
      if (!periodoActual) {
        setError('Por favor, seleccione un periodo educativo antes de crear asignaciones.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID del usuario actual
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const userType = sessionStorage.getItem('userType') || localStorage.getItem('userType');
      
      if (!userId) {
        // Mensaje: No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.
        setError('No se pudo identificar al usuario actual. Por favor, inicie sesión nuevamente.');
        setLoading(false);
        return;
      }
      
      // Definir las materias para cada año según el plan de estudio
      const materiasPorAnio = {
        '1 año': [
          { nombre: 'Castellano', codigo: 'CAS-1', letras: 'DECENTE' },
          { nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-1', letras: 'CATOLIC' },
          { nombre: 'Matemáticas', codigo: 'MA-1', letras: 'DECIMO' },
          { nombre: 'Educación Física', codigo: 'EF-1', letras: 'NOTABL' },
          { nombre: 'Arte y Patrimonio', codigo: 'AP-1', letras: 'DECENTE' },
          { nombre: 'Ciencias Naturales', codigo: 'CN-1', letras: 'DEODIO' },
          { nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-1', letras: 'DECENTE' }
        ],
        '2 año': [
          { nombre: 'Castellano', codigo: 'CAS-2', letras: 'DECENTE' },
          { nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-2', letras: 'DEODIO' },
          { nombre: 'Matemáticas', codigo: 'MA-2', letras: 'DECENTE' },
          { nombre: 'Educación Física', codigo: 'EF-2', letras: 'DECENTE' },
          { nombre: 'Arte y Patrimonio', codigo: 'AP-2', letras: 'VENTE' },
          { nombre: 'Ciencias Naturales', codigo: 'CN-2', letras: 'DIECIEVE' },
          { nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-2', letras: 'VENTE' }
        ],
        '3 año': [
          { nombre: 'Castellano', codigo: 'CAS-3', letras: 'DEODIO' },
          { nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-3', letras: 'DECENTE' },
          { nombre: 'Matemáticas', codigo: 'MA-3', letras: 'DEODIO' },
          { nombre: 'Educación Física', codigo: 'EF-3', letras: 'DEODIO' },
          { nombre: 'Física', codigo: 'FIS-3', letras: 'DECENTE' },
          { nombre: 'Química', codigo: 'QUI-3', letras: 'DEODIO' },
          { nombre: 'Biología', codigo: 'BIO-3', letras: 'DEODIO' },
          { nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-3', letras: 'VENTE' }
        ],
        '4 año': [
          { nombre: 'Castellano', codigo: 'CAS-4', letras: 'DECENTE' },
          { nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-4', letras: 'DECENTE' },
          { nombre: 'Matemáticas', codigo: 'MA-4', letras: 'DECENTE' },
          { nombre: 'Educación Física', codigo: 'EF-4', letras: 'DECENTE' },
          { nombre: 'Física', codigo: 'FIS-4', letras: 'DECENTE' },
          { nombre: 'Química', codigo: 'QUI-4', letras: 'DEODIO' },
          { nombre: 'Biología', codigo: 'BIO-4', letras: 'DEODIO' },
          { nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-4', letras: 'DECENTE' },
          { nombre: 'Formación para la Soberanía Nacional', codigo: 'FSN-4', letras: 'DIECIEVE' }
        ],
        '5 año': [
          { nombre: 'Castellano', codigo: 'CAS-5', letras: 'NOTABL' },
          { nombre: 'Inglés y otras Lenguas Extranjeras', codigo: 'ILE-5', letras: 'REGU' },
          { nombre: 'Matemáticas', codigo: 'MA-5', letras: 'QUINCE' },
          { nombre: 'Educación Física', codigo: 'EF-5', letras: 'QUINCE' },
          { nombre: 'Física', codigo: 'FIS-5', letras: 'CATORC' },
          { nombre: 'Química', codigo: 'QUI-5', letras: 'TRECE' },
          { nombre: 'Biología', codigo: 'BIO-5', letras: 'DOCE' },
          { nombre: 'Ciencias de la Tierra', codigo: 'CDT-5', letras: 'CATORC' },
          { nombre: 'Geografía, Historia y Ciudadanía', codigo: 'GHC-5', letras: 'DOCE' },
          { nombre: 'Formación para la Soberanía Nacional', codigo: 'FSN-5', letras: 'TRESE' }
        ]
      };
      
      // Añadir las áreas de formación complementarias para 5to año
      const areasComplementarias = [
        { nombre: 'Orientación y Convivencia', grupo: '1', literal: 'A' },
        { nombre: 'Grupo Estable', grupo: '2', literal: 'A' },
        { nombre: 'Pasantía', grupo: '3', literal: 'A' },
        { nombre: 'Proyecto Productivo', grupo: '4', literal: 'A' },
        { nombre: 'Acto Cívico', grupo: '5', literal: 'A' }
      ];
      
      // Añadir las áreas complementarias a 5to año
      if (asignacionFormData.anio === '5 año') {
        materiasPorAnio['5 año'] = [...materiasPorAnio['5 año'], ...areasComplementarias];
      }
      
      // Obtener las materias del año seleccionado
      const materiasDelAnio = materiasPorAnio[asignacionFormData.anio] || [];
      
      if (materiasDelAnio.length === 0) {
        setError(`No se encontraron materias para ${asignacionFormData.anio}. Por favor, seleccione un año válido.`);
        setLoading(false);
        return;
      }
      
      const profesor = profesores.find(p => p.id === asignacionFormData.profesorId || p._id === asignacionFormData.profesorId);
      
      // Asegurar que los IDs de alumnos sean strings
      let alumnosArray = [];
      if (asignacionFormData.alumnos && asignacionFormData.alumnos.length > 0) {
        alumnosArray = asignacionFormData.alumnos.map(alumnoId => {
          // Convertir a string si es un objeto
          if (typeof alumnoId === 'object' && alumnoId !== null) {
            return alumnoId._id?.toString() || alumnoId.id?.toString() || '';
          }
          return alumnoId.toString();
        }).filter(id => id); // Eliminar IDs vacíos
      }
      
      // Preparar la información de alumnosInfo basada en los alumnos seleccionados
      let alumnosInfoArray = [];
      if (alumnosArray.length > 0) {
        alumnosInfoArray = alumnosArray.map(alumnoId => {
          const alumno = alumnos.find(a => (a._id === alumnoId || a.id === alumnoId));
          return alumno ? {
            id: alumno._id || alumno.id,
            nombre: `${alumno?.nombre || ''} ${alumno?.apellido || ''}`.trim() || 'Sin nombre',
            idU: alumno.idU || 'N/P',
            cedula: alumno.idU || alumno.cedula || 'N/A'
          } : null;
        }).filter(info => info !== null); // Eliminar entradas nulas
      }
      
      console.log('Alumnos procesados para crear asignaciones:', alumnosArray);
      console.log('AlumnosInfo procesado para crear asignaciones:', alumnosInfoArray);
      
      // Crear asignaciones para cada materia del año seleccionado
      const profesorNombre = profesor ? `${profesor.nombre} ${profesor.apellido || ''}` : 'Profesor sin nombre';
      
      try {
        // Verificar que no se exceda el límite de 35 alumnos
        if (alumnosArray.length > 35) {
          setNotification({
            type: 'error',
            message: 'No se pueden agregar más de 35 alumnos por asignación.'
          });
          setTimeout(() => setNotification(null), 3000);
          setLoading(false);
          return;
        }
        
        // Procesar las materias en secuencia para evitar problemas de concurrencia
        for (const materia of materiasDelAnio) {
          try {
            console.log(`Procesando materia: ${materia.nombre}`);
            
            // Intentar buscar la materia por código
            const searchResponse = await fetch(`/api/materias?codigo=${encodeURIComponent(materia.codigo)}`);
            const searchData = await searchResponse.json();
            let materiaId;
            
            if (searchData.success && searchData.data && searchData.data.length > 0) {
              // Si la materia existe, usar su ID
              materiaId = searchData.data[0]._id;
              console.log(`Materia encontrada en la base de datos: ${materia.nombre} (${materiaId})`);
            } else {
              // Si no existe, crearla
              console.log(`Creando nueva materia: ${materia.nombre}`);
              const nuevaMateria = {
                codigo: materia.codigo,
                nombre: materia.nombre,
                descripcion: `Materia de ${asignacionFormData.anio}`,
                userId: userId,
                userType: userType,
                institucion: 'Acacias' // Valor por defecto
              };
              
              const createResponse = await fetch('/api/materias', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevaMateria),
              });
              
              const createData = await createResponse.json();
              
              if (createResponse.ok && createData.success) {
                materiaId = createData.data._id;
                console.log(`Nueva materia creada con ID: ${materiaId}`);
              } else {
                console.error(`Error al crear materia ${materia.nombre}:`, createData.message);
                continue; // Pasar a la siguiente materia
              }
            }
            
            // Crear objeto de asignación con datos permanentes
            const nuevaAsignacion = {
              materiaId: materiaId,  // Usar el ID de la materia existente
              materiaNombre: materia.nombre,
              profesorId: asignacionFormData.profesorId,
              profesorNombre: profesorNombre,
              alumnos: alumnosArray,
              alumnosInfo: alumnosInfoArray, // Incluir la información detallada de los alumnos
              periodo: periodoActual ? periodoActual.nombre : (asignacionFormData.periodo || ''),
              periodoId: periodoActual ? periodoActual.id : (asignacionFormData.periodoId || ''),
              anio: asignacionFormData.anio || '1 año',
              seccion: asignacionFormData.seccion || 'A',
              turno: asignacionFormData.turno || 'Mañana',
              userId: userId,
              userType: userType,
              creadoPor: userId, // Campo requerido en el modelo
              tipoCreador: userType || 'control', // Campo requerido en el modelo
              // No generamos ID temporal, MongoDB asignará un ID permanente
              fechaCreacion: new Date()
            };
            
            console.log(`Enviando datos para crear asignación de ${materia.nombre}:`, nuevaAsignacion);
            
            // Enviar datos al endpoint de depuración para diagnóstico
            try {
              fetch('/api/debug', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  tipo: 'asignacion',
                  materia: materia.nombre,
                  datos: nuevaAsignacion
                })
              }).then(res => console.log('Datos enviados a depuración:', res.ok));
            } catch (debugError) {
              console.error('Error al enviar datos a depuración:', debugError);
            }
            
            // Intentar guardar usando múltiples métodos para asegurar que se guarde
            let response;
            
            try {
              // Método 1: Endpoint simplificado
              console.log('Intentando guardar con método 1: endpoint simplificado');
              response = await fetch('/api/asignaciones/guardar', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevaAsignacion),
              });
              
              if (!response.ok) {
                throw new Error('Método 1 falló, intentando método 2');
              }
            } catch (error) {
              console.error('Error en método 1:', error);
              
              // Método 2: Endpoint original
              console.log('Intentando guardar con método 2: endpoint original');
              response = await fetch('/api/asignaciones', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevaAsignacion),
              });
            }
            
            const responseData = await response.json();
            console.log(`Respuesta del servidor para ${materia.nombre}:`, responseData);
            
            if (!response.ok) {
              console.error(`Error al crear asignación para ${materia.nombre}:`, responseData.message);
              setNotification({
                type: 'error',
                message: `Error al crear asignación para ${materia.nombre}: ${responseData.message}`
              });
              setTimeout(() => setNotification(null), 3000);
            } else {
              console.log(`Asignación creada exitosamente para ${materia.nombre}`);
              setNotification({
                type: 'success',
                message: `Asignación creada exitosamente para ${materia.nombre}`
              });
              setTimeout(() => setNotification(null), 3000);
              
              // Verificar que la asignación se guardó correctamente
              console.log('Verificando que la asignación se guardó correctamente...');
              
              // Esperar un momento y luego verificar en la base de datos
              setTimeout(async () => {
                try {
                  // Verificar directamente en la API
                  const verificacionResponse = await fetch('/api/asignaciones/verificar', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      materiaId: nuevaAsignacion.materiaId,
                      profesorId: nuevaAsignacion.profesorId
                    })
                  });
                  
                  const verificacionData = await verificacionResponse.json();
                  console.log('Resultado de verificación:', verificacionData);
                  
                  if (verificacionData.success) {
                    console.log('Asignación verificada en la base de datos');
                    setNotification({
                      type: 'success',
                      message: `Asignación verificada en la base de datos: ${materia.nombre}`
                    });
                  }
                  
                  // Cargar las asignaciones sin recargar la página
                  loadAsignaciones();
                } catch (verificationError) {
                  console.error('Error al verificar asignación:', verificationError);
                }
              }, 1500);
            }
          } catch (error) {
            console.error(`Error al procesar la materia ${materia.nombre}:`, error);
            setNotification({
              type: 'error',
              message: `Error al procesar la materia ${materia.nombre}: ${error.message}`
            });
            setTimeout(() => setNotification(null), 3000);
          }
        }
      } catch (error) {
        console.error('Error al procesar asignaciones:', error);
        setNotification({
          type: 'error',
          message: `Error al procesar asignaciones: ${error.message}`
        });
        setTimeout(() => setNotification(null), 3000);
      }
      
      // Limpiar el formulario
      setAsignacionFormData({
        materiaId: '',
        profesorId: '',
        alumnos: [],
        periodo: periodoActual ? periodoActual.nombre : '',
        periodoId: periodoActual ? periodoActual.id : '',
        modoEdicion: false
      });
      
      // Ocultar el formulario
      setShowAsignacionForm(false);
      
      // Recargar la lista de asignaciones
      await loadAsignaciones();
      
      setLoading(false);
      
    } catch (err) {
      console.error('Error al crear asignación:', err);
      setError('Error al crear asignación: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al crear asignación
    }
  };
  
  // Función para agregar una actividad a una asignación
  const handleAddActividad = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Agregando actividad con datos:', actividadFormData);
      
      if (!actividadFormData.nombre || !actividadFormData.fecha || !actividadFormData.porcentaje) {
        // Mensaje: Por favor, complete todos los campos obligatorios.
        setError('Por favor, complete todos los campos obligatorios.');
        setLoading(false);
        return;
      }
      
      // Validar que la asignación seleccionada exista
      if (!modalData || (!modalData.id && !modalData._id)) {
        // Mensaje: No se pudo identificar la asignación a la que agregar la actividad.
        setError('No se pudo identificar la asignación a la que agregar la actividad.');
        setLoading(false);
        return;
      }
      
      // Crear objeto de la nueva actividad
      const nuevaActividad = {
        nombre: actividadFormData.nombre,
        descripcion: actividadFormData.descripcion || '',
        fecha: actividadFormData.fecha,
        porcentaje: parseInt(actividadFormData.porcentaje, 10)
      };
      
      console.log('Enviando datos al servidor:', nuevaActividad);
      
      // Mostrar alerta para confirmar
      // Proceder sin confirmación
      if (false) {
        setLoading(false);
        return;
      }
      
      // Enviar datos a la API para guardar en MongoDB
      const asignacionId = modalData.id || modalData._id;
      const response = await fetch(`/api/asignaciones/${asignacionId}/actividades`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(nuevaActividad),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor:', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al agregar actividad');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Actividad agregada correctamente
      
      // Limpiar el formulario
      setActividadFormData({
        nombre: '',
        descripcion: '',
        fecha: new Date().toISOString().split('T')[0],
        porcentaje: 0
      });
      
      // Cerrar el modal
      setShowModal(false);
      
      // Recargar la lista de asignaciones para ver la nueva actividad
      await loadAsignaciones();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al agregar actividad:', err);
      setError('Error al agregar actividad: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al agregar actividad
    }
  };
  
  // Función para eliminar una asignación o una materia de una asignación
  const handleDeleteAsignacionItem = async (asignacionId, materiaId = null) => {
    try {
      // Si no se proporciona un materiaId, solicitar confirmación para eliminar la asignación completa
      if (!materiaId) {
        const confirmar = window.confirm('¿Está seguro que desea eliminar esta asignación completa? Esta acción no se puede deshacer.');
        if (!confirmar) {
          return; // El usuario canceló la eliminación
        }
      }
      
      setLoading(true);
      
      // Si se proporciona un materiaId, significa que queremos eliminar una materia específica de la asignación
      if (materiaId) {
        console.log(`Eliminando materia ${materiaId} de la asignación ${asignacionId}`);
        
        // Primero actualizamos el estado local para dar feedback inmediato al usuario
        setAsignaciones(prevAsignaciones => {
          return prevAsignaciones.map(asignacion => {
            if (asignacion._id === asignacionId || asignacion.id === asignacionId) {
              if (asignacion.materias && Array.isArray(asignacion.materias)) {
                return {
                  ...asignacion,
                  materias: asignacion.materias.filter(materia => 
                    materia.materiaId !== materiaId && 
                    materia.id !== materiaId
                  )
                };
              }
            }
            return asignacion;
          });
        });
        
        // Mostrar notificación de éxito
        setNotification({ type: 'success', message: 'Materia eliminada correctamente' });
        
        // Recargar las asignaciones después de un breve retraso
        setTimeout(() => loadAsignaciones(), 500);
        setLoading(false);
        return;
      }
      
      // Si no se proporciona un materiaId, eliminar la asignación completa
      console.log(`Eliminando asignación completa ${asignacionId}`);
      
      // Verificar que el ID de asignación sea válido
      if (!asignacionId || asignacionId === 'undefined' || asignacionId === 'null') {
        console.error('ID de asignación inválido:', asignacionId);
        setNotification({ type: 'error', message: 'ID de asignación inválido' });
        setLoading(false);
        return;
      }

      // Asegurarse de que el ID sea una cadena
      const asignacionIdString = asignacionId.toString();
      console.log('ID de asignación a eliminar (como string):', asignacionIdString);
      
      // Intentar eliminar en el servidor primero
      try {
        console.log(`Enviando solicitud DELETE a /api/asignaciones/${asignacionIdString}`);
        const response = await fetch(`/api/asignaciones/${asignacionIdString}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        // Obtener la respuesta como texto primero para depuración
        const responseText = await response.text();
        console.log('Respuesta del servidor (texto):', responseText);
        
        // Intentar parsear la respuesta como JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error al parsear la respuesta JSON:', parseError);
          data = { success: false, message: 'Error en formato de respuesta del servidor' };
        }
        
        if (response.ok) {
          console.log('Asignación eliminada exitosamente en el servidor');
          
          // Actualizar el estado local después de confirmar que se eliminó en el servidor
          setAsignaciones(prevAsignaciones => 
            prevAsignaciones.filter(asignacion => 
              asignacion._id !== asignacionId && asignacion.id !== asignacionId
            )
          );
          
          // Si la asignación eliminada es la seleccionada, limpiar la selección
          if (asignacionSeleccionada && (asignacionSeleccionada._id === asignacionId || asignacionSeleccionada.id === asignacionId)) {
            setAsignacionSeleccionada(null);
          }
          
          // Mostrar notificación de éxito
          setNotification({ type: 'success', message: 'Asignación eliminada correctamente' });
        } else {
          console.error('Error al eliminar asignación en el servidor:', data.message || 'Error desconocido');
          setNotification({ type: 'error', message: `Error al eliminar asignación: ${data.message || 'Error desconocido'}` });
        }
      } catch (error) {
        console.error('Error al eliminar asignación:', error);
        setNotification({ type: 'error', message: `Error al eliminar asignación: ${error.message || 'Error de conexión'}` });
      } finally {
        // Recargar las asignaciones después de un breve retraso para asegurar que los datos estén actualizados
        setTimeout(() => loadAsignaciones(), 500);
        setLoading(false);
      }
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
      setError('Error al eliminar asignación: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setNotification({ type: 'error', message: 'Error al eliminar asignación' });
      setLoading(false);
    }
  };

  // Funciones para gestionar asignaciones y actividades ya implementadas arriba
  const handleEditAsignacion = async (e) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      console.log('Editando asignación con datos:', asignacionFormData);
      
      if (!asignacionFormData.materiaId || !asignacionFormData.profesorId) {
        // Mensaje: Por favor, seleccione una materia y un profesor.
        setError('Por favor, seleccione una materia y un profesor.');
        setLoading(false);
        return;
      }
      
      // Obtener el ID de la asignación a editar
      const asignacionId = asignacionFormData.id;
      if (!asignacionId) {
        setError('No se pudo identificar el ID de la asignación a editar.');
        setLoading(false);
        return;
      }
      
      // Obtener la materia y el profesor para incluir sus nombres
      const materia = materias.find(m => m.id === asignacionFormData.materiaId || m._id === asignacionFormData.materiaId);
      const profesor = profesores.find(p => p.id === asignacionFormData.profesorId || p._id === asignacionFormData.profesorId);
      
      // Asegurar que los IDs de alumnos sean strings
      let alumnosArray = [];
      if (asignacionFormData.alumnos && asignacionFormData.alumnos.length > 0) {
        alumnosArray = asignacionFormData.alumnos.map(alumnoId => {
          // Convertir a string si es un objeto
          if (typeof alumnoId === 'object' && alumnoId !== null) {
            return alumnoId._id?.toString() || alumnoId.id?.toString() || '';
          }
          return alumnoId.toString();
        }).filter(id => id); // Eliminar IDs vacíos
      }
      
      console.log('Alumnos procesados para editar asignación:', alumnosArray);
      
      // Preparar la información de alumnosInfo basada en los alumnos seleccionados actualmente
      let alumnosInfoArray = [];
      if (alumnosArray.length > 0) {
        alumnosInfoArray = alumnosArray.map(alumnoId => {
          const alumno = alumnos.find(a => (a._id === alumnoId || a.id === alumnoId));
          return alumno ? {
            id: alumno._id || alumno.id,
            nombre: alumno.nombre || 'Sin nombre',
            idU: alumno.idU || 'N/P',
            cedula: alumno.idU || alumno.cedula || 'N/A'
          } : null;
        }).filter(info => info !== null); // Eliminar entradas nulas
      }
      
      console.log('AlumnosInfo procesado para editar asignación:', alumnosInfoArray);
      
      // Crear objeto de la asignación editada con todos los campos necesarios
      const asignacionEditada = {
        materiaId: asignacionFormData.materiaId,
        profesorId: asignacionFormData.profesorId,
        periodo: asignacionFormData.periodo || '',
        alumnos: alumnosArray
      };
      
      console.log('Enviando datos al servidor para editar:', JSON.stringify(asignacionEditada, null, 2));
      
      // Paso 1: Actualizar los campos básicos usando la API normal
      const response = await fetch(`/api/asignaciones/${asignacionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(asignacionEditada),
      });
      
      const responseData = await response.json();
      console.log('Respuesta del servidor (paso 1):', responseData);
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Error al editar asignación');
      }
      
      // Paso 2: Actualizar los campos adicionales usando la API directa
      const materiaNombre = materia ? `${materia.codigo || ''} - ${materia.nombre}` : 'Materia sin nombre';
      const profesorNombre = profesor ? `${profesor.nombre} ${profesor.apellido || ''}` : 'Profesor sin nombre';
      
      const datosAdicionales = {
        id: asignacionId,
        materiaNombre: materiaNombre,
        profesorNombre: profesorNombre,
        periodo: asignacionFormData.periodo || '',
        alumnosInfo: alumnosInfoArray
      };
      
      console.log('Enviando datos adicionales para actualizar:', JSON.stringify(datosAdicionales, null, 2));
      
      const responseAdicional = await fetch('/api/asignaciones/update-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosAdicionales),
      });
      
      const responseDataAdicional = await responseAdicional.json();
      console.log('Respuesta del servidor (paso 2):', responseDataAdicional);
      
      if (!responseAdicional.ok) {
        console.warn('Advertencia: No se pudieron actualizar algunos campos adicionales');
      }
      
      // Mostrar alerta de éxito
      // Mensaje: Asignación editada correctamente
      
      // Limpiar el formulario y ocultar
      setAsignacionFormData({
        materiaId: '',
        profesorId: '',
        alumnos: [],
        modoEdicion: false
      });
      
      // Ocultar el formulario
      setShowAsignacionForm(false);
      
      // Recargar la lista de asignaciones
      await loadAsignaciones();
      
      setLoading(false);
    } catch (err) {
      console.error('Error al editar asignación:', err);
      setError('Error al editar asignación: ' + (err.message || 'Por favor, intente de nuevo más tarde.'));
      setLoading(false);
      // Mensaje de error: Error al editar asignación
    }
  };

  const handleSaveCalificaciones = async (asignacionId, actividadId, calificaciones) => {
    try {
      setLoading(true);
      // Aquí iría la lógica para guardar las calificaciones en la base de datos
      // Por ahora, simularemos la actualización
      const nuevasAsignaciones = asignaciones.map(asig => {
        if (asig.id === asignacionId) {
          const nuevasActividades = asig.actividades.map(act => {
            if (act.id === actividadId) {
              return {
                ...act,
                calificaciones
              };
            }
            return act;
          });
          
          return {
            ...asig,
            actividades: nuevasActividades
          };
        }
        return asig;
      });
      
      setAsignaciones(nuevasAsignaciones);
      setShowModal(false);
      setFormData({});
      setLoading(false);
    } catch (err) {
      console.error('Error al guardar calificaciones:', err);
      setError('Error al guardar calificaciones. Por favor, intente de nuevo más tarde.');
      setLoading(false);
    }
  };

  // Función para generar reporte de notas
  const generateReporte = (asignacionId) => {
    const asignacion = asignaciones.find(a => a.id === asignacionId);
    if (!asignacion) return [];
    
    const materia = materias.find(m => m.id === asignacion.materiaId);
    const docente = docentes.find(d => d.id === asignacion.docenteId);
    
    return asignacion.alumnos.map(alumnoId => {
      const alumno = alumnos.find(a => a.id === alumnoId);
      if (!alumno) return null;
      
      // Calcular notas y promedio
      const notasAlumno = asignacion.actividades.map(act => {
        const calificacion = act.calificaciones.find(c => c.alumnoId === alumnoId);
        return {
          actividad: act.nombre,
          nota: calificacion ? calificacion.nota : 0
        };
      });
      
      const sumaNotas = notasAlumno.reduce((sum, item) => sum + item.nota, 0);
      const promedio = notasAlumno.length > 0 ? sumaNotas / notasAlumno.length : 0;
      
      return {
        alumno,
        materia,
        docente,
        notas: notasAlumno,
        promedio: parseFloat(promedio.toFixed(2))
      };
    }).filter(Boolean);
  };

  // Mapeo de estados a códigos
  const estadosCodigos = {
    "Amazonas": "AM",
    "Anzoátegui": "AN",
    "Apure": "AP",
    "Aragua": "AR",
    "Barinas": "BA",
    "Bolívar": "BO",
    "Carabobo": "CA",
    "Cojedes": "CO",
    "Delta Amacuro": "DA",
    "Distrito Capital": "DC",
    "Falcón": "FA",
    "Guárico": "GU",
    "Lara": "LA",
    "Mérida": "ME",
    "Miranda": "MI",
    "Monagas": "MO",
    "Nueva Esparta": "NE",
    "Portuguesa": "PO",
    "Sucre": "SU",
    "Táchira": "TA",
    "Trujillo": "TR",
    "Vargas": "VA",
    "Yaracuy": "YA",
    "Zulia": "ZU",
    "La Guaira": "LG",
    "Dependencias Federales": "DF",
    "Territorio Esequibo": "TE"
  };

  // Función para manejar cambios en el formulario
  // Función para recargar la lista de estudiantes
  const recargarEstudiantes = async () => {
    try {
      const userId = sessionStorage.getItem('userId') || localStorage.getItem('userId');
      const response = await fetch(`/api/estudiantes?creadorId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const estudiantesFormateados = data.data.map(estudiante => ({
            _id: estudiante._id,
            id: estudiante._id,
            cedula: estudiante.idU || 'N/P',
            nombre: estudiante.nombre || '',
            apellido: estudiante.apellido || '',
            fechaNacimiento: estudiante.fechaNacimiento,
            lugarNacimiento: estudiante.lugarNacimiento || '',
            sexo: estudiante.sexo || 'Otro',
            grupo: estudiante.grupo || '',
            ef: estudiante.ef || '',
            anio: estudiante.anio || '',
            seccion: estudiante.seccion || '',
            edad: estudiante.edad,
            esMenorDeEdad: estudiante.esMenorDeEdad,
            estado: estudiante.estado !== undefined ? estudiante.estado : 1,
            representante: estudiante.representante || null
          }));
          
          setAlumnos(estudiantesFormateados);
        }
      }
    } catch (error) {
      console.error('Error al recargar estudiantes:', error);
    }
  };

  // Crear versión throttled del manejador para mejorar rendimiento
  const throttledFormUpdate = useCallback((name, value) => {
    setFormData(prevData => {
      const newData = { ...prevData };
      
      // Si se cambia el lugar de nacimiento, actualizar automáticamente el campo ef con el código del estado
      if (name === 'lugarNacimiento' && value) {
        const codigoEstado = estadosCodigos[value] || '';
        newData[name] = value;
        newData.ef = codigoEstado;
      }
      // Si se cambia la fecha de nacimiento, calcular la edad
      else if (name === 'fechaNacimiento' && value) {
        const fechaNacimiento = new Date(value);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
        const mes = hoy.getMonth() - fechaNacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
          edad--;
        }
        
        newData[name] = value;
        newData.edad = edad;
        newData.esMenorDeEdad = edad < 18;
      }
      // Si se cambia el grupo, registrar específicamente y usar asignación directa
      else if (name === 'grupo') {
        newData.grupo = value; // Usar el nombre directo en lugar de la notación computada para asegurar que se guarde correctamente
      }
      // Para cualquier otro campo, actualizar normalmente
      else {
        newData[name] = value;
      }
      
      return newData;
    });
  }, [estadosCodigos]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Para campos de texto críticos, usar requestAnimationFrame para suavizar
    if (name === 'nombre' || name === 'apellido') {
      requestAnimationFrame(() => {
        throttledFormUpdate(name, value);
      });
    } else {
      throttledFormUpdate(name, value);
    }
  }, [throttledFormUpdate]);

  // Función para abrir modal
  const openModal = (type, data = null) => {
    setModalType(type);
    setModalData(data);
    console.log('Abriendo modal:', type, data);
    
    // Inicializar formData según el tipo de modal
    if (data) {
      switch (type) {
        case 'editDocente':
          setFormData({
            id: data.id,
            cedula: data.cedula,
            nombre: data.nombre,
            apellido: data.apellido,
            email: data.email,
            telefono: data.telefono
          });
          break;
        case 'editAlumno':
          setFormData({
            id: data.id || data._id,
            cedula: data.cedula,
            nombre: data.nombre,
            apellido: data.apellido || '',
            fechaNacimiento: data.fechaNacimiento,
            lugarNacimiento: data.lugarNacimiento || '',
            sexo: data.sexo || 'Otro',
            grupo: data.grupo || '',
            ef: data.ef || '',
            edad: data.edad,
            esMenorDeEdad: data.esMenorDeEdad
          });
          break;
        case 'editMateria':
          setFormData({
            id: data.id,
            codigo: data.codigo,
            nombre: data.nombre,
            descripcion: data.descripcion
          });
          break;
        case 'editAsignacion':
          // Inicializar el formulario de asignación para edición
          setAsignacionFormData({
            id: data.id || data._id,
            materiaId: data.materiaId,
            profesorId: data.profesorId,
            alumnos: data.alumnos || [],
            modoEdicion: true
          });
          break;
        case 'addActividad':
          // Establecer la asignación seleccionada
          setAsignacionSeleccionada(data);
          // Inicializar el formulario de actividad
          setActividadFormData({
            nombre: '',
            descripcion: '',
            fecha: new Date().toISOString().split('T')[0],
            porcentaje: 0
          });
          break;
        case 'viewActividades':
          // Establecer la asignación seleccionada para ver sus actividades
          setAsignacionSeleccionada(data);
          break;
        case 'calificarActividad':
          // Inicializar el formulario de calificaciones
          const calificacionesIniciales = data.actividad.calificaciones || [];
          setFormData({
            calificaciones: calificacionesIniciales
          });
          break;
        case 'editPeriodo':
          // Extraer año y número del ID del periodo (formato: P2025-1)
          const periodoInfo = data.id.substring(1).split('-');
          setFormData({
            id: data.id,
            anio: periodoInfo[0],
            numero: periodoInfo[1],
            fechaInicio: data.fechaInicio,
            fechaFin: data.fechaFin,
            activo: data.activo
          });
          break;
        default:
          setFormData(data);
      }
    } else {
      // Limpiar formData para formularios de creación
      switch (type) {
        case 'addAlumno':
          // Inicializar con valores por defecto para nuevo alumno
          setFormData({
            nombre: '',
            cedula: 'N/P',
            fechaNacimiento: '',
            edad: 0,
            esMenorDeEdad: false
          });
          break;
        case 'addAsignacion':
          // Inicializar el formulario de asignación
          setAsignacionFormData({
            materiaId: '',
            profesorId: '',
            alumnos: [],
            modoEdicion: false
          });
          break;
        default:
          // Limpiar formData para otros formularios de creación
          setFormData({});
      }
    }
    
    setShowModal(true);
  };

  // Función para renderizar el contenido del modal según su tipo
  const renderModalContent = () => {
    switch (modalType) {
      case 'addPeriodo':
      case 'editPeriodo':
        return (
          <div>
            <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {modalType === 'addPeriodo' ? 'Agregar Nuevo Periodo' : 'Editar Periodo'}
              </h3>
            </div>
            <form onSubmit={(e) => modalType === 'addPeriodo' ? handleAddPeriodo(e) : handleEditPeriodo(e, modalData?.id)}>
              <div className="px-4 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                    <input
                      type="number"
                      name="anio"
                      value={formData.anio || ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <select
                      name="numero"
                      value={formData.numero || '1'}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio || ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={formData.fechaFin || ''}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="activo"
                    name="activo"
                    checked={formData.activo || false}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="activo" className="ml-2 block text-sm text-gray-900">
                    Periodo Activo
                  </label>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'addPeriodo' ? 'Agregar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        );
      case 'addDocente':
      case 'editDocente':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'addDocente' ? 'Agregar Docente' : 'Editar Docente'}
            </h3>
            <form onSubmit={modalType === 'addDocente' ? handleAddDocente : handleEditDocente}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    name="fechaIngreso"
                    value={formData.fechaIngreso || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'addDocente' ? 'Agregar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        );

      case 'addAlumno':
      case 'editAlumno':
        // Verificar si estamos editando o agregando un alumno
        const isEditing = modalType === 'editAlumno';
        const existeCedula = isEditing && formData.cedula && formData.cedula !== 'N/P';
        
        // Calcular la edad si hay fecha de nacimiento
        let edad = 0;
        let esMenorDeEdad = false;
        
        if (formData.fechaNacimiento) {
          edad = calcularEdad(formData.fechaNacimiento);
          esMenorDeEdad = edad < 18;
        }
        
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {isEditing ? 'Editar Alumno' : 'Agregar Alumno'}
            </h3>
            <form onSubmit={(e) => isEditing ? handleEditAlumno(e) : handleAddAlumno(e)}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Nombre del estudiante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={formData.apellido || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder="Apellido del estudiante"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={existeCedula ? formData.cedula : 'N/P'}
                    disabled={!existeCedula && isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lugar de Nacimiento</label>
                  <input
                    type="text"
                    name="lugarNacimiento"
                    value={formData.lugarNacimiento || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ciudad, País"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    name="sexo"
                    value={formData.sexo || 'Otro'}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">EF</label>
                  <input
                    type="text"
                    name="ef"
                    value={formData.ef || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Información EF"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                  <div className="flex items-center h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                    {edad} años
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center mt-2">
                    <div className={`mr-2 w-4 h-4 rounded-full ${esMenorDeEdad ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <span className="text-sm font-medium">
                      {esMenorDeEdad ? 'Es menor de edad' : 'Es mayor de edad'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Guardar Cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'addMateria':
      case 'editMateria':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'addMateria' ? 'Agregar Materia' : 'Editar Materia'}
            </h3>
            <form onSubmit={modalType === 'addMateria' ? handleAddMateria : handleEditMateria}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    required
                  ></textarea>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'addMateria' ? 'Agregar' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'addAsignacion':
      case 'editAsignacion':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'addAsignacion' ? 'Crear Nueva Asignación' : 'Editar Asignación'}
            </h3>
            <form onSubmit={modalType === 'addAsignacion' ? handleAddAsignacion : handleEditAsignacion}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia *</label>
                  <select
                    name="materiaId"
                    value={asignacionFormData.materiaId || ''}
                    onChange={handleAsignacionFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map(materia => (
                      <option key={materia.id || materia._id} value={materia.id || materia._id}>
                        {materia.codigo} - {materia.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profesor *</label>
                  <select
                    name="profesorId"
                    value={asignacionFormData.profesorId || ''}
                    onChange={handleAsignacionFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione un profesor</option>
                    {profesores.map(profesor => (
                      <option key={profesor.id || profesor._id} value={profesor.id || profesor._id}>
                        {profesor.nombre} {profesor.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año *</label>
                  <select
                    name="anio"
                    value={asignacionFormData.anio || '1 año'}
                    onChange={handleAsignacionFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="1 año">1 año</option>
                    <option value="2 año">2 año</option>
                    <option value="3 año">3 año</option>
                    <option value="4 año">4 año</option>
                    <option value="5 año">5 año</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alumnos</label>
                  
                  {/* Campo de búsqueda de alumnos */}
                  <div className="mb-2">
                    <div className="flex items-center">
                      <input
                        type="text"
                        placeholder="Buscar alumno por nombre..."
                        value={searchAlumno}
                        onChange={(e) => setSearchAlumno(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {searchAlumno && (
                        <button
                          type="button"
                          onClick={() => setSearchAlumno('')}
                          className="ml-2 text-gray-500 hover:text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Lista de alumnos filtrada */}
                  <select
                    multiple
                    name="alumnos"
                    value={asignacionFormData.alumnos || []}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      handleAlumnosChange(selectedOptions);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    size="5"
                  >
                    {alumnos
                      .filter(alumno => {
                        const nombreCompleto = `${alumno.nombre} ${alumno.apellido || ''} ${alumno.cedula || ''}`;
                        return searchAlumno === '' || 
                               nombreCompleto.toLowerCase().includes(searchAlumno.toLowerCase());
                      })
                      .map(alumno => (
                        <option key={alumno.id || alumno._id} value={alumno.id || alumno._id}>
                          <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} showId={alumno.cedula !== 'N/P'} />
                        </option>
                      ))}
                  </select>
                  
                  {/* Instrucciones y conteo de alumnos */}
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-gray-500">Mantenga presionado Ctrl para seleccionar múltiples alumnos</p>
                    <p className="text-xs text-gray-500">
                      {asignacionFormData.alumnos ? asignacionFormData.alumnos.length : 0} alumno(s) seleccionado(s)
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setAsignacionFormData({
                      materiaId: '',
                      profesorId: '',
                      alumnos: [],
                      periodo: '',
                      anio: '1 año',
                      modoEdicion: false,
                      usarPeriodoExistente: false
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'addAsignacion' ? 'Crear Asignación' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'addActividad':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar Actividad</h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Materia: </span>
                {(() => {
                  const materia = materias.find(m => m.id === modalData?.materiaId || m._id === modalData?.materiaId);
                  return materia ? `${materia.codigo} - ${materia.nombre}` : 'N/A';
                })()}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Profesor: </span>
                {(() => {
                  const profesor = profesores.find(p => p.id === modalData?.profesorId || p._id === modalData?.profesorId);
                  return profesor ? `${profesor.nombre} ${profesor.apellido || ''}` : 'N/A';
                })()}
              </p>
            </div>
            <form onSubmit={handleAddActividad}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={actividadFormData.nombre || ''}
                    onChange={handleActividadFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    name="descripcion"
                    value={actividadFormData.descripcion || ''}
                    onChange={handleActividadFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    name="fecha"
                    value={actividadFormData.fecha || ''}
                    onChange={handleActividadFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje *</label>
                  <input
                    type="number"
                    name="porcentaje"
                    value={actividadFormData.porcentaje || ''}
                    onChange={handleActividadFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setActividadFormData({
                      nombre: '',
                      descripcion: '',
                      fecha: new Date().toISOString().split('T')[0],
                      porcentaje: 0
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Agregar Actividad
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'viewActividades':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actividades y Calificaciones</h3>
            <div className="mb-4">
              <p className="text-gray-700">
                <span className="font-medium">Materia: </span>
                {(() => {
                  const materia = materias.find(m => m.id === asignacionSeleccionada?.materiaId || m._id === asignacionSeleccionada?.materiaId);
                  return materia ? `${materia.codigo} - ${materia.nombre}` : 'N/A';
                })()}
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Docente: </span>
                {(() => {
                  const profesor = profesores.find(p => p.id === asignacionSeleccionada?.profesorId || p._id === asignacionSeleccionada?.profesorId);
                  return profesor ? `${profesor.nombre} ${profesor.apellido || ''}` : 'N/A';
                })()}
              </p>
            </div>
            
            {asignacionSeleccionada?.actividades && asignacionSeleccionada.actividades.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje</th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asignacionSeleccionada.actividades.map((actividad, index) => (
                      <tr key={actividad.id || actividad._id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{actividad.nombre}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{actividad.descripcion || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(actividad.fecha).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{actividad.porcentaje}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openModal('calificarActividad', { asignacion: asignacionSeleccionada, actividad })}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Calificar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 italic">No hay actividades registradas para esta asignación.</p>
            )}
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => openModal('addActividad', asignacionSeleccionada)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Agregar Actividad
              </button>
            </div>
            
            <div className="flex flex-col h-screen bg-gray-100">
              {/* Sidebar */}
              <div className="flex">
                <div className="w-64 bg-blue-600 text-white p-6 space-y-4">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-2">Académico 360</h2>
                    <p className="text-sm text-blue-200">{usuario?.nombre} {usuario?.apellido}</p>
                    <p className="text-sm text-blue-200">{usuario?.tipo}</p>
                  </div>

                  <nav className="space-y-2">
                    <button
                      onClick={() => setActiveTab('aulas')}
                      className={`w-full text-left px-4 py-2 rounded ${activeTab === 'aulas' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                    >
                      Aulas
                    </button>
                    <button
                      onClick={() => setActiveTab('docentes')}
                      className={`w-full text-left px-4 py-2 rounded ${activeTab === 'docentes' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                    >
                      Docentes
                    </button>
                    <button
                      onClick={() => setActiveTab('alumnos')}
                      className={`w-full text-left px-4 py-2 rounded ${activeTab === 'alumnos' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                    >
                      Alumnos
                    </button>
                    <button
                      onClick={() => setActiveTab('reportes')}
                      className={`w-full text-left px-4 py-2 rounded ${activeTab === 'reportes' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                    >
                      Reportes
                    </button>

                    <button
                      onClick={() => setActiveTab('notasCertificadas')}
                      className={`w-full text-left px-4 py-2 rounded ${activeTab === 'notasCertificadas' ? 'bg-blue-700' : 'hover:bg-blue-700'}`}
                    >
                      Notas Certificadas
                    </button>

                    {activeTab === 'aulas' && (
                      <div className="mt-4 space-y-2">
                        <h3 className="text-sm font-semibold text-blue-200 mb-2">Reportes por Momento</h3>
                        <button
                          onClick={() => generarReporte(1)}
                          className="w-full text-left px-4 py-2 rounded bg-blue-500 hover:bg-blue-700 text-sm"
                        >
                          Primer Momento
                        </button>
                        <button
                          onClick={() => generarReporte(2)}
                          className="w-full text-left px-4 py-2 rounded bg-blue-500 hover:bg-blue-700 text-sm"
                        >
                          Segundo Momento
                        </button>
                        <button
                          onClick={() => generarReporte(3)}
                          className="w-full text-left px-4 py-2 rounded bg-blue-500 hover:bg-blue-700 text-sm"
                        >
                          Tercer Momento
                        </button>
                      </div>
                    )}
                  </nav>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'calificarActividad':
        const asignacion = modalData?.asignacion;
        const actividad = modalData?.actividad;
        
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Calificar Actividad: {actividad?.nombre}
            </h3>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Materia:</span> {
                  materias.find(m => m.id === asignacion?.materiaId || m._id === asignacion?.materiaId)?.nombre || 'N/A'
                }
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Fecha:</span> {new Date(actividad?.fecha).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Porcentaje:</span> {actividad?.porcentaje}%
              </p>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              // Aquí iría la lógica para guardar las calificaciones
              handleSaveCalificaciones(asignacion.id, actividad.id, formData.calificaciones);
            }}>
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                      <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Calificación</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {asignacion?.alumnos?.map((alumnoId, index) => {
                      const alumno = alumnos.find(a => a.id === alumnoId || a._id === alumnoId);
                      const calificacion = actividad?.calificaciones?.find(c => c.alumnoId === alumnoId)?.nota || '';
                      
                      return (
                        <tr key={alumnoId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            {alumno ? alumno.nombre : 'Alumno no encontrado'}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              name={`calificacion-${alumnoId}`}
                              defaultValue={calificacion}
                              onChange={(e) => {
                                // Actualizar las calificaciones en el formData
                                const calificaciones = formData.calificaciones || [];
                                const index = calificaciones.findIndex(c => c.alumnoId === alumnoId);
                                
                                if (index !== -1) {
                                  calificaciones[index].nota = parseFloat(e.target.value);
                                } else {
                                  calificaciones.push({
                                    alumnoId,
                                    nota: parseFloat(e.target.value)
                                  });
                                }
                                
                                setFormData({
                                  ...formData,
                                  calificaciones
                                });
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Guardar Calificaciones
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'addAsignacion':
      case 'editAsignacion':
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {modalType === 'addAsignacion' ? 'Crear Asignación' : 'Editar Asignación'}
            </h3>
            <form onSubmit={modalType === 'addAsignacion' ? handleAddAsignacion : handleEditAsignacion}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                  <select
                    name="materiaId"
                    value={formData.materiaId || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione una materia</option>
                    {materias.map(materia => (
                      <option key={materia.id} value={materia.id}>
                        {materia.codigo} - {materia.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Docente</label>
                  <select
                    name="docenteId"
                    value={formData.docenteId || ''}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione un docente</option>
                    {docentes.map(docente => (
                      <option key={docente.id} value={docente.id}>
                        {docente.nombre} {docente.apellido}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alumnos</label>
                  <div className="border border-gray-300 rounded-md p-3 max-h-60 overflow-y-auto">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center">
                        <input
                          id="reporte-estudiantes"
                          name="tipo-reporte"
                          type="radio"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          checked={tipoReporte === 'estudiantes'}
                          onChange={() => setTipoReporte('estudiantes')}
                        />
                        <label htmlFor="reporte-estudiantes" className="ml-2 block text-sm text-gray-700">
                          Estudiantes por Filtros (idAA)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="reporte-todos-estudiantes"
                          name="tipo-reporte"
                          type="radio"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          checked={tipoReporte === 'todosEstudiantes'}
                          onChange={() => setTipoReporte('todosEstudiantes')}
                        />
                        <label htmlFor="reporte-todos-estudiantes" className="ml-2 block text-sm text-gray-700">
                          Todos los Estudiantes (idAA)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="reporte-todos-docentes"
                          name="tipo-reporte"
                          type="radio"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          checked={tipoReporte === 'todosDocentes'}
                          onChange={() => setTipoReporte('todosDocentes')}
                        />
                        <label htmlFor="reporte-todos-docentes" className="ml-2 block text-sm text-gray-700">
                          Todos los Docentes (idAP)
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="reporte-asignaciones"
                          name="tipo-reporte"
                          type="radio"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          checked={tipoReporte === 'asignaciones'}
                          onChange={() => setTipoReporte('asignaciones')}
                        />
                        <label htmlFor="reporte-asignaciones" className="ml-2 block text-sm text-gray-700">
                          Todas las Asignaciones (idAAS)
                        </label>
                      </div>
                    </div>
                    {alumnos.map(alumno => (
                      <div key={alumno.id} className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`alumno-${alumno.id}`}
                          name="alumnos"
                          value={alumno.id}
                          checked={formData.alumnos?.includes(alumno.id)}
                          onChange={(e) => {
                            const alumnId = e.target.value;
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                alumnos: [...(prev.alumnos || []), alumnId]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                alumnos: (prev.alumnos || []).filter(id => id !== alumnId)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <label htmlFor={`alumno-${alumno.id}`} className="text-sm">
                          <StudentNameDisplay student={alumno} showId={true} />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {modalType === 'addAsignacion' ? 'Crear' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        );
        
      case 'viewAlumnos':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
              Alumnos de {asignacionSeleccionada?.materiaNombre || 'la asignación'}
            </h3>
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">Nombre</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider border-b">Identificación</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // Añadir logs para depuración
                    console.log('Estado de asignacionSeleccionada:', asignacionSeleccionada);
                    
                    if (asignacionSeleccionada?.alumnosInfo && asignacionSeleccionada.alumnosInfo.length > 0) {
                      console.log('Rendering student list in modal:', asignacionSeleccionada.alumnosInfo);
                      return asignacionSeleccionada.alumnosInfo.map((alumno, index) => {
                        console.log('Rendering student:', alumno);
                        return (
                          <tr key={alumno.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-blue-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                            {alumno.nombre || 'Sin nombre'} {alumno.apellido || 'Sin apellido'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                              {alumno.cedula && alumno.cedula !== 'N/A' ? alumno.cedula : 'Cargando...'}
                            </td>
                          </tr>
                        );
                      });
                    } else {
                      return (
                        <tr>
                          <td colSpan="2" className="px-4 py-4 text-center text-sm text-gray-500">
                            No hay alumnos asignados a esta materia.
                          </td>
                        </tr>
                      );
                    }
                    return null;
                  })()}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Acción no implementada</h3>
            <p className="text-gray-600 mb-4">Esta funcionalidad aún no ha sido implementada.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        );
    }
  };

  // Renderizado del componente
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Estilos CSS para animaciones */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .card-animate {
          animation: fadeInUp 0.5s ease forwards;
        }
        
        .card-animate-delay-1 {
          animation-delay: 0.1s;
        }
        
        .card-animate-delay-2 {
          animation-delay: 0.2s;
        }
        
        .card-animate-delay-3 {
          animation-delay: 0.3s;
        }
        
        .card-hover-effect {
          transition: all 0.3s ease;
        }
        
        .card-hover-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      {/* Barra superior */}
      <header className="bg-gradient-to-r from-blue-600 to-sky-500 shadow-md z-10">
        <div className="max-w-7xl mx-auto px-0 sm:px-0 lg:px-0">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center pl-2">
              {/* Botón para colapsar/expandir sidebar */}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 mr-2 rounded-md text-white hover:text-sky-100 hover:bg-blue-700/50 focus:outline-none transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Icono de educación en lugar de imagen */}
              <div className="mr-2 text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" className="bi bi-mortarboard-fill" viewBox="0 0 16 16">
                  <path d="M8.211 2.047a.5.5 0 0 0-.422 0l-7.5 3.5a.5.5 0 0 0 .025.917l7.5 3a.5.5 0 0 0 .372 0L14 7.14V13a1 1 0 0 0-1 1v2h3v-2a1 1 0 0 0-1-1V6.739l.686-.275a.5.5 0 0 0 .025-.917l-7.5-3.5Z"/>
                  <path d="M4.176 9.032a.5.5 0 0 0-.656.327l-.5 1.7a.5.5 0 0 0 .294.605l4.5 1.8a.5.5 0 0 0 .372 0l4.5-1.8a.5.5 0 0 0 .294-.605l-.5-1.7a.5.5 0 0 0-.656-.327L8 10.466 4.176 9.032Z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Academico360 - {userType === 'control' ? 'Control de Estudio' : userType === 'docente' ? 'Docente' : 'Estudiante'}</h1>
                {userData && (
                  <>
                    {console.log('Valores de identificadores en sidebar:', {
                      idID: sessionStorage.getItem('idID') || localStorage.getItem('idID'),
                      idI: sessionStorage.getItem('idI') || localStorage.getItem('idI'),
                      idA: sessionStorage.getItem('idA') || localStorage.getItem('idA')
                    })}
                    <div id="institucion" className="text-sm font-medium text-sky-100">
                      Acacias
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center">
              {/* Información del usuario */}
              <div className="bg-blue-700 text-white px-4 py-2 rounded-lg mr-4">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="mr-4 mb-1 md:mb-0 text-center md:text-left">
                    <span className="text-xs text-blue-200 block md:inline">Usuario:</span>
                    <span className="font-semibold block md:inline md:ml-1">
                      {userData ? `${userData.nombre || ''} ${userData.apellido || ''}` : 'Usuario'}
                    </span>
                  </div>
                  <div className="text-center md:text-left">
                    <span className="text-xs text-blue-200 block md:inline">Tipo:</span>
                    <span className="font-semibold capitalize block md:inline md:ml-1">{userType || 'No definido'}</span>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div>
                {!esDocente() && (
                  <a
                    href="/reportes"
                    className="px-3 py-1 bg-white text-blue-700 rounded-md hover:bg-sky-100 transition-colors font-medium shadow-sm mr-2 inline-flex items-center"
                  >
                    Reportes
                  </a>
                )}
                <button
                  id="btn-tour-dashboard"
                  onClick={startDashboardTour}
                  className="px-3 py-1 bg-white text-blue-700 rounded-md hover:bg-sky-100 transition-colors font-medium shadow-sm mr-2"
                >
                  Guía
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 bg-white text-blue-700 rounded-md hover:bg-sky-100 transition-colors font-medium shadow-sm mr-2"
                >
                  Cerrar Sesión
                </button>

              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Estructura principal con sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar vertical */}
        <aside className={`bg-gradient-to-b from-blue-700 to-blue-900 shadow-lg transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
          <nav id="sidebar-menu" className="p-4 h-full">
            <ul className="space-y-3">
              {/* Renderizado condicional basado en el tipo de usuario */}
              {/* Opciones solo para usuarios de tipo 'control' */}
              {userType === 'control' && (
                <>
                  <li>
                    <button
                      id="nav-docentes"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'docentes' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('docentes')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Gestión de Docentes</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      id="nav-alumnos"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'alumnos' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('alumnos')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Gestión de Alumnos</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      id="nav-aulas"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'aulas' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('aulas')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Aulas</span>}
                    </button>
                  </li>

                </>
              )}      
              {/* Reportes - Visible solo para docentes y control */}
              {userType === 'control' && (
                <>
                  <li>
                    <button
                      id="nav-reportes"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'reportes' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('reportes')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Reportes</span>}
                    </button>
                  </li>
                  <li>
                    <button
                      id="nav-notas"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'notasCertificadas' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('notasCertificadas')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M7 7h10M5 5v14a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2z" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Notas Certificadas</span>}
                    </button>
                  </li>
                  {/* Planilla oculta del sidebar */}
                </>
              )}
              
              {/* Asistencia - Visible solo para docentes y control */}
              {userType === 'control' && (
                <>
                  <li>
                    <button
                      id="nav-asistencia"
                      className={`w-full flex items-center p-3 rounded-lg transition-all ${activeTab === 'asistencia' ? 'bg-sky-500 text-white shadow-md' : 'text-white hover:bg-blue-600'}`}
                      onClick={() => setActiveTab('asistencia')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {!sidebarCollapsed && <span className="ml-3 font-medium">Asistencia</span>}
                    </button>
                  </li>
                </>
              )}

            </ul>
          </nav>
        </aside>

        {/* Contenido principal */}
        <main id="dashboard-content" className="flex-1 p-6 overflow-auto bg-sky-50">
          {/* Sección de Reportes */}
          {activeTab === 'planilla' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Planilla de Profesores (Excel)</h2>
                <div className="flex gap-2">
                  <div className="flex rounded overflow-hidden border">
                    <button onClick={() => setPlanillaView('preview')} className={`px-3 py-2 text-sm ${planillaView==='preview'?'bg-blue-600 text-white':'bg-white text-gray-700'}`}>Vista original</button>
                    <button onClick={() => setPlanillaView('edit')} className={`px-3 py-2 text-sm ${planillaView==='edit'?'bg-blue-600 text-white':'bg-white text-gray-700'}`}>Editor</button>
                  </div>
                  <button onClick={cargarPlantillaProfesores} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded">
                    Cargar plantilla vacía
                  </button>
                  <button onClick={downloadEditedExcel} className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Descargar Excel</button>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-3">
                <input type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="block w-full text-sm text-gray-900 border border-gray-300 rounded cursor-pointer bg-gray-50 focus:outline-none" />
                {excelSheetNames.length > 0 && (
                  <select value={selectedSheet} onChange={(e)=>changeSheet(e.target.value)} className="px-2 py-2 border rounded">
                    {excelSheetNames.map((n)=> (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
              </div>

              {planillaView === 'preview' && (
                <div className="overflow-auto border rounded">
                  {/* Render de la hoja tal cual en HTML generado por xlsx */}
                  <div
                    id="excel-preview-container"
                    className="min-w-[600px] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-300 [&_td]:p-1 [&_th]:border [&_th]:border-gray-300 [&_th]:p-1"
                    dangerouslySetInnerHTML={{ __html: excelHtml }}
                  />
                  <div className="p-2 text-right">
                    <button
                      onClick={() => {
                        try {
                          const container = document.getElementById('excel-preview-container');
                          if (!container || !excelWorkbook || !selectedSheet) return;
                          const table = container.querySelector('table');
                          if (!table) return;
                          const ws = excelWorkbook.Sheets[selectedSheet];
                          if (!ws) return;
                          const start = XLSX.utils.decode_range(ws['!ref'] || sheetRef || 'A1');
                          const rows = Array.from(table.rows);
                          // headers
                          rows[0]?.cells && Array.from(rows[0].cells).forEach((cell, c) => {
                            const addr = XLSX.utils.encode_cell({ r: start.s.r, c: start.s.c + c });
                            ws[addr] = ws[addr] || {};
                            ws[addr].v = cell.innerText ?? '';
                            ws[addr].t = 's';
                          });
                          // data
                          for (let r = 1; r < rows.length; r++) {
                            const cells = Array.from(rows[r].cells);
                            cells.forEach((cell, c) => {
                              const addr = XLSX.utils.encode_cell({ r: start.s.r + r, c: start.s.c + c });
                              ws[addr] = ws[addr] || {};
                              const raw = cell.innerText ?? '';
                              const num = Number(raw);
                              if (!Number.isNaN(num) && String(raw).trim() !== '') {
                                ws[addr].v = num;
                                ws[addr].t = 'n';
                              } else {
                                ws[addr].v = raw;
                                ws[addr].t = 's';
                              }
                            });
                          }
                          // también sincronizar a estados para mantener coherencia con el editor
                          const aoa = rows.map(tr => Array.from(tr.cells).map(td => td.innerText ?? ''));
                          setExcelHeaders(aoa[0] || []);
                          setExcelData((aoa.slice(1) || []));
                          setNotification({ type: 'success', message: 'Cambios aplicados a la planilla' });
                        } catch (e) {
                          console.error(e);
                          setNotification({ type: 'error', message: 'No se pudieron aplicar los cambios' });
                        }
                      }}
                      className="inline-flex px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      Aplicar cambios (vista original)
                    </button>
                  </div>
                </div>
              )}

              {planillaView === 'edit' && (
              <div className="overflow-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {excelHeaders.map((h, idx) => (
                        <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                          {String(h || `Col ${idx+1}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {excelData.length === 0 ? (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={Math.max(1, excelHeaders.length)}>
                          Sin datos. Cargue un Excel o use la plantilla vacía.
                        </td>
                      </tr>
                    ) : (
                      excelData.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {excelHeaders.map((_, cIdx) => (
                            <td key={`${rIdx}-${cIdx}`} className="px-2 py-1 border-r">
                              <input
                                value={row[cIdx] ?? ''}
                                onChange={(e)=>updateCellValue(rIdx, cIdx, e.target.value)}
                                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          )}
          {activeTab === 'formatoRendimiento' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Formato de Rendimiento</h2>
              
              {/* Selector de Año Académico */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Año Académico</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                >
                  <option value="1">1 año</option>
                  <option value="2">2 año</option>
                  <option value="3">3 año</option>
                  <option value="4">4 año</option>
                  <option value="5">5 año</option>
                </select>
              </div>

              {/* Botón para generar formato de rendimiento */}
              <div className="flex justify-center">
                <button
                  onClick={() => generarReporte(1, null, true)}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Generar
                </button>
              </div>
            </div>
          )}
          {activeTab === 'reportes' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Generación de Reportes</h2>
              
              {/* Selector de Aula */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Aula</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAula}
                  onChange={(e) => {
                    const aulaId = e.target.value;
                    setSelectedAula(aulaId);
                    setSelectedStudent(''); // Reiniciar el estudiante seleccionado
                    if (aulaId) {
                      cargarEstudiantesAula(aulaId);
                    }
                  }}
                >
                  <option value="">Seleccione un aula</option>
                  {aulas.map(aula => (
                    <option key={aula._id} value={aula._id}>
                      {aula.nombre} - {aula.anio} {aula.seccion} ({aula.turno})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Estudiante */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Estudiante (Opcional)</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  disabled={!selectedAula}
                >
                  <option value="">Todos los estudiantes</option>
                  {estudiantesPorAula[selectedAula]?.map(estudiante => (
                    <option key={estudiante.id} value={estudiante.id}>
                      {estudiante.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones para generar reportes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(momento => (
                  <button
                    key={momento}
                    onClick={() => generarReporte(momento, selectedAula)}
                    disabled={!selectedAula}
                    className={`p-4 rounded-lg text-white font-medium transition-all duration-300 ${!selectedAula ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Generar Reporte {momento}° Momento
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Sección de Asistencia */}
          {activeTab === 'asistencia' && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-8">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  📅
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">Gestión de Asistencia</h2>
                  <p className="text-gray-600 mt-1">Controla y consulta la asistencia de los estudiantes</p>
                </div>
              </div>
              
              {/* Sub-pestañas de Asistencia - Diseño Mejorado */}
              <div className="mb-8">
                <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                  <button
                    onClick={() => {
                      console.log('Cambiando a control');
                      setAttendanceSubTab('control');
                    }}
                    className={`px-6 py-3 rounded-md font-medium text-sm transition-all duration-200 ${
                      attendanceSubTab === 'control'
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    📋 Control de Asistencia
                  </button>
                  <button
                    onClick={() => {
                      console.log('Cambiando a reporte');
                      setAttendanceSubTab('reporte');
                    }}
                    className={`px-6 py-3 rounded-md font-medium text-sm transition-all duration-200 ml-1 ${
                      attendanceSubTab === 'reporte'
                        ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    📈 Ver Reportes
                  </button>
                </div>
              </div>
              
              {/* Contenido de Control de Asistencia */}
              {attendanceSubTab === 'control' && (
                <div>
              
              {/* Selector de Aula */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Aula</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedAula}
                  onChange={(e) => {
                    const aulaId = e.target.value;
                    setSelectedAula(aulaId);
                    setAttendanceData({}); // Limpiar datos de asistencia al cambiar aula
                    setSelectedMateria(''); // Limpiar materia seleccionada
                    if (aulaId) {
                      cargarEstudiantesAula(aulaId);
                    }
                  }}
                >
                  <option value="">Seleccione un aula</option>
                  {aulas.map(aula => (
                    <option key={aula._id} value={aula._id}>
                      {aula.nombre} - {aula.anio} {aula.seccion} ({aula.turno})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Materia */}
              {selectedAula && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Materia</label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedMateria}
                    onChange={(e) => setSelectedMateria(e.target.value)}
                  >
                    <option value="">Seleccione una materia</option>
                    {aulas.find(aula => aula._id === selectedAula)?.asignaciones?.map((asignacion, index) => (
                      <option key={index} value={asignacion.materia.nombre}>
                        {asignacion.materia.nombre} - {asignacion.profesor.nombre} {asignacion.profesor.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Selector de Fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              {/* Lista de Estudiantes para Asistencia */}
              {selectedAula && estudiantesPorAula[selectedAula] && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Lista de Estudiantes</h3>
                  <div className="space-y-3">
                    {estudiantesPorAula[selectedAula].map(estudiante => {
                      const currentAttendance = attendanceData[estudiante.id];
                      const currentStatus = currentAttendance ? currentAttendance.estado : 'sin marcar';
                      const currentReason = currentAttendance ? currentAttendance.razon : null;
                      const getStatusDisplay = (status) => {
                        switch(status) {
                          case 'presente': return { text: 'Presente', color: 'text-green-600', bg: 'bg-green-100' };
                          case 'ausente': return { text: 'Ausente', color: 'text-red-600', bg: 'bg-red-100' };
                          case 'tardanza': return { text: 'Tardanza', color: 'text-yellow-600', bg: 'bg-yellow-100' };
                          default: return { text: 'Sin marcar', color: 'text-gray-500', bg: 'bg-gray-100' };
                        }
                      };
                      const statusInfo = getStatusDisplay(currentStatus);
                      
                      return (
                        <div key={estudiante.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-700">{estudiante.nombre}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.bg}`}>
                              {statusInfo.text}
                            </span>
                            {currentReason && (
                              <span className="text-xs text-gray-500 italic">
                                Razón: {currentReason}
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleAttendanceChange(estudiante.id, 'presente')}
                              className={`px-3 py-1 rounded-md transition-colors ${
                                currentStatus === 'presente' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-green-500 text-white hover:bg-green-600'
                              }`}
                            >
                              Presente
                            </button>
                            <button 
                              onClick={() => handleAttendanceChange(estudiante.id, 'ausente')}
                              className={`px-3 py-1 rounded-md transition-colors ${
                                currentStatus === 'ausente' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            >
                              Ausente
                            </button>
                            <button 
                              onClick={() => handleAttendanceChange(estudiante.id, 'tardanza')}
                              className={`px-3 py-1 rounded-md transition-colors ${
                                currentStatus === 'tardanza' 
                                  ? 'bg-yellow-600 text-white' 
                                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
                              }`}
                            >
                              Tardanza
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón para Guardar Asistencia */}
              {selectedAula && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-sm text-gray-600">
                    Estudiantes marcados: {Object.keys(attendanceData).filter(id => attendanceData[id]?.estado).length} de {estudiantesPorAula[selectedAula]?.length || 0}
                  </div>
                  <button
                    onClick={saveAttendanceToDatabase}
                    disabled={Object.keys(attendanceData).filter(id => attendanceData[id]?.estado).length === 0 || savingAttendance || !selectedMateria}
                    className={`px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      Object.keys(attendanceData).filter(id => attendanceData[id]?.estado).length === 0 || savingAttendance || !selectedMateria
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {savingAttendance ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Guardando...</span>
                      </div>
                    ) : (
                      'Guardar Asistencia'
                    )}
                  </button>
                </div>
              )}
                </div>
              )}
              
              {/* Contenido de Ver Reportes */}
              {attendanceSubTab === 'reporte' && (
                <div>
                  {/* Selector de Aula */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Aula</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reportAula}
                  onChange={(e) => {
                    setReportAula(e.target.value);
                    setReportMateria(''); // Limpiar materia seleccionada
                    setAttendanceReport(null); // Limpiar reporte anterior
                  }}
                >
                  <option value="">Seleccione un aula</option>
                  {aulas.map(aula => (
                    <option key={aula._id} value={aula._id}>
                      {aula.nombre} - {aula.anio} {aula.seccion} ({aula.turno})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Materia */}
              {reportAula && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleccionar Materia <span className="text-gray-500 font-normal">(Opcional)</span>
                  </label>
                  <select
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={reportMateria}
                    onChange={(e) => {
                      setReportMateria(e.target.value);
                      setAttendanceReport(null); // Limpiar reporte anterior
                    }}
                  >
                    <option value="">Todas las materias</option>
                    {aulas.find(aula => aula._id === reportAula)?.asignaciones?.map((asignacion, index) => (
                      <option key={index} value={asignacion.materia.nombre}>
                        {asignacion.materia.nombre} - {asignacion.profesor.nombre} {asignacion.profesor.apellido}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Si no seleccionas una materia, se mostrarán todos los registros de asistencia para el aula y fecha.
                  </p>
                </div>
              )}

              {/* Selector de Fecha */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reportDate}
                  onChange={(e) => {
                    setReportDate(e.target.value);
                    setAttendanceReport(null); // Limpiar reporte anterior
                  }}
                />
              </div>

              {/* Botón para Buscar Reporte */}
              <div className="mb-6">
                <button
                  onClick={getAttendanceReport}
                  disabled={!reportAula || !reportDate || loadingReport}
                  className={`px-6 py-3 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    !reportAula || !reportDate || loadingReport
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {loadingReport ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Buscando...</span>
                    </div>
                  ) : (
                    'Buscar Reporte'
                  )}
                </button>
              </div>

              {/* Mostrar Reporte */}
              {attendanceReport && attendanceReport.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Reporte de Asistencia - {new Date(reportDate).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                      {reportMateria && (
                        <p className="text-sm text-gray-600 mt-1">
                          Materia: <span className="font-medium">{reportMateria}</span>
                        </p>
                      )}
                    </div>
                    
                    {/* Botón de Descarga */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                      <button
                        onClick={downloadAttendanceReportPDF}
                        disabled={loadingReport}
                        className={`flex items-center space-x-2 px-4 py-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                          loadingReport
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {loadingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Generando...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Descargar PDF</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {attendanceReport.map((registro, index) => (
                    <div key={index} className="mb-6">
                      {/* Información del Aula */}
                      {registro.aula && (
                        <div className="bg-blue-100 rounded-lg p-4 mb-4">
                          <h4 className="text-md font-semibold text-blue-800 mb-2">Información del Aula</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-blue-700">Nombre:</span>
                              <p className="text-blue-600">{registro.aula.nombre}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Año:</span>
                              <p className="text-blue-600">{registro.aula.anio}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Sección:</span>
                              <p className="text-blue-600">{registro.aula.seccion}</p>
                            </div>
                            <div>
                              <span className="font-medium text-blue-700">Turno:</span>
                              <p className="text-blue-600">{registro.aula.turno}</p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Lista de Estudiantes */}
                      <div className="bg-white rounded-lg shadow-sm">
                        <div className="px-4 py-3 bg-gray-100 rounded-t-lg">
                          <h4 className="text-md font-semibold text-gray-800">Lista de Asistencia</h4>
                        </div>
                        <div className="divide-y divide-gray-200">
                          {registro.asistencia.map((estudiante, idx) => {
                            const getStatusColor = (estado) => {
                              switch(estado) {
                                case 'presente': return 'bg-green-100 text-green-800';
                                case 'ausente': return 'bg-red-100 text-red-800';
                                case 'tardanza': return 'bg-yellow-100 text-yellow-800';
                                default: return 'bg-gray-100 text-gray-800';
                              }
                            };
                            
                            const getStatusText = (estado) => {
                              switch(estado) {
                                case 'presente': return 'Presente';
                                case 'ausente': return 'Ausente';
                                case 'tardanza': return 'Tardanza';
                                default: return 'Sin marcar';
                              }
                            };
                            
                            return (
                              <div key={idx} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 font-medium text-sm">
                                        {estudiante.estudiante?.nombre?.charAt(0) || 'E'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {estudiante.estudiante ? 
                                        `${estudiante.estudiante.nombre} ${estudiante.estudiante.apellido}` : 
                                        'Estudiante no encontrado'
                                      }
                                    </p>
                                    {estudiante.estudiante?.cedula && (
                                      <p className="text-xs text-gray-500">
                                        Cédula: {estudiante.estudiante.cedula}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end space-y-1">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    getStatusColor(estudiante.estado)
                                  }`}>
                                    {getStatusText(estudiante.estado)}
                                  </span>
                                  {estudiante.razon && (
                                    <span className="text-xs text-gray-500 italic max-w-xs text-right">
                                      Razón: {estudiante.razon}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Resumen de Asistencia */}
                      <div className="mt-4 bg-white rounded-lg shadow-sm p-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Resumen</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {registro.asistencia.filter(e => e.estado === 'presente').length}
                            </div>
                            <div className="text-sm text-gray-600">Presentes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {registro.asistencia.filter(e => e.estado === 'ausente').length}
                            </div>
                            <div className="text-sm text-gray-600">Ausentes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">
                              {registro.asistencia.filter(e => e.estado === 'tardanza').length}
                            </div>
                            <div className="text-sm text-gray-600">Tardanzas</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {registro.asistencia.length}
                            </div>
                            <div className="text-sm text-gray-600">Total</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
                  {/* Mensaje cuando no hay datos */}
                  {attendanceReport && attendanceReport.length === 0 && (
                    <div className="text-center py-8">
                      <div className="bg-yellow-100 inline-block p-3 rounded-full mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron registros</h3>
                      <p className="text-sm text-gray-500">No hay información de asistencia para el aula y fecha seleccionados.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notasCertificadas' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Notas Certificadas</h2>

              <div className="mb-6 flex gap-2">
                <button
                  className={`px-4 py-2 rounded ${notesSubTab === 'agregar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setNotesSubTab('agregar')}
                >
                  Agregar Estudiante
                </button>
                <button
                  className={`px-4 py-2 rounded ${notesSubTab === 'generar' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                  onClick={() => setNotesSubTab('generar')}
                >
                  Generar Nota Certificada
                </button>
              </div>

              {notesSubTab === 'agregar' && (
                <form className="space-y-6" onSubmit={handleNotasSubmit}>
                  <fieldset className="border rounded p-4">
                    <legend className="px-2 text-sm font-semibold">Instituciones Educativas donde cursó estudios</legend>
                    {/* Solo gestionar planteles */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Planteles</span>
                        <button
                          type="button"
                          className="px-2 py-1 bg-blue-600 text-white rounded"
                          onClick={() => setNotaInstitucion(prev => ({ ...prev, planteles: [...(prev.planteles||[]), { numero: String((prev.planteles?.length||0)+1), nombre:'', localidad:'', ef:'' }] }))}
                        >
                          + Agregar Plantel
                        </button>
                        <button
                          type="button"
                          className="px-2 py-1 bg-green-600 text-white rounded ml-2"
                          onClick={agregarPlantelesPrueba}
                        >
                          🔧 Agregar Planteles Prueba
                        </button>
                      </div>
                      {(notaInstitucion.planteles||[]).length === 0 && (
                        <div className="text-sm text-orange-600 bg-orange-50 p-3 rounded border mt-2">
                          ⚠️ <strong>Importante:</strong> Debe agregar al menos un plantel aquí para poder seleccionarlo en las materias del plan de estudio.
                        </div>
                      )}
                      <div className="space-y-2">
                        {(notaInstitucion.planteles||[]).map((p, i) => (
                          <div key={i} className="grid grid-cols-12 gap-2">
                            <input className="border rounded p-2 col-span-2" placeholder="N°" value={p.numero||''} onChange={(e)=> setNotaInstitucion(prev => {
                              const list = [...(prev.planteles||[])];
                              list[i] = { ...list[i], numero: e.target.value };
                              return { ...prev, planteles: list };
                            })} />
                            <input className="border rounded p-2 col-span-5" placeholder="Nombre del Plantel" value={p.nombre||''} onChange={(e)=> setNotaInstitucion(prev => {
                              const list = [...(prev.planteles||[])];
                              list[i] = { ...list[i], nombre: e.target.value };
                              return { ...prev, planteles: list };
                            })} />
                            <input className="border rounded p-2 col-span-3" placeholder="Localidad" value={p.localidad||''} onChange={(e)=> setNotaInstitucion(prev => {
                              const list = [...(prev.planteles||[])];
                              list[i] = { ...list[i], localidad: e.target.value };
                              return { ...prev, planteles: list };
                            })} />
                            <input className="border rounded p-2 col-span-1" placeholder="E.F." value={p.ef||''} onChange={(e)=> setNotaInstitucion(prev => {
                              const list = [...(prev.planteles||[])];
                              list[i] = { ...list[i], ef: e.target.value };
                              return { ...prev, planteles: list };
                            })} />
                            <button type="button" className="col-span-1 text-red-600" onClick={() => setNotaInstitucion(prev => ({ ...prev, planteles: (prev.planteles||[]).filter((_,idx)=> idx!==i) }))}>Eliminar</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </fieldset>

                  <fieldset className="border rounded p-4">
                    <legend className="px-2 text-sm font-semibold">Identificación del Estudiante</legend>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input className="border rounded p-2" placeholder="Cédula" value={notaEst.cedula} onChange={(e)=>setNotaEst(prev=>({...prev, cedula:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="Nombres" value={notaEst.nombres} onChange={(e)=>setNotaEst(prev=>({...prev, nombres:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="Apellidos" value={notaEst.apellidos} onChange={(e)=>setNotaEst(prev=>({...prev, apellidos:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="Fecha Nacimiento (dd/mm/aaaa)" value={notaEst.fechaNacimiento} onChange={(e)=>setNotaEst(prev=>({...prev, fechaNacimiento:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="País" value={notaEst.pais} onChange={(e)=>setNotaEst(prev=>({...prev, pais:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="Estado" value={notaEst.estado} onChange={(e)=>setNotaEst(prev=>({...prev, estado:e.target.value}))} />
                      <input className="border rounded p-2" placeholder="Municipio" value={notaEst.municipio} onChange={(e)=>setNotaEst(prev=>({...prev, municipio:e.target.value}))} />
                    </div>
                  </fieldset>

                  <fieldset className="border rounded p-4">
                    <legend className="px-2 text-sm font-semibold">Plan de Estudio</legend>
                    <div className="space-y-4">
                      {notaPlan.map((anio, idx)=> (
                        <div key={idx} className="border rounded p-3">
                          <div className="flex items-center gap-3 mb-2">
                            <label className="text-sm">Grado</label>
                            <select className="border rounded p-2" value={anio.grado} onChange={(e)=>updatePlanGrado(idx, e.target.value)}>
                              <option value="1">1</option>
                              <option value="2">2</option>
                              <option value="3">3</option>
                              <option value="4">4</option>
                              <option value="5">5</option>
                            </select>
                            {/* Materias se autogeneran según el grado seleccionado */}
                            <button
                              type="button"
                              className="ml-auto px-2 py-1 bg-blue-600 text-white rounded"
                              onClick={() => setFechaAnioParaTodo(idx)}
                            >
                              Fecha y Año para todo
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
                            {anio.materias.map((m, mIdx)=> (
                              <div key={mIdx} className="col-span-7 grid grid-cols-7 gap-2">
                                <input className="border rounded p-2 col-span-2" placeholder="Materia" value={m.nombre} onChange={(e)=>updateMateria(idx,mIdx,'nombre',e.target.value)} />
                                <input className="border rounded p-2" placeholder="N°" value={isMateriaEspecial(m.nombre) ? '' : (m.numero||'')} onChange={(e)=>updateMateria(idx,mIdx,'numero',e.target.value)} disabled={isMateriaEspecial(m.nombre)} />
                                {/* Letras para materias normales; en Orientación o Grupo y Participación se manejará alfabético o Exento */}
                                <input
                                  className="border rounded p-2"
                                  placeholder="Letras"
                                  value={m.letras||''}
                                  onChange={(e)=>updateMateria(idx,mIdx,'letras',e.target.value)}
                                  list={`alfabetico-${idx}-${mIdx}`}
                                />
                                {/* Sugerencias de calificación alfabética o Exento para materias especiales */}
                                <datalist id={`alfabetico-${idx}-${mIdx}`}>
                                  <option value="A" />
                                  <option value="B" />
                                  <option value="C" />
                                  <option value="D" />
                                  <option value="E" />
                                  <option value="Exento" />
                                  <option value="EXENTO" />
                                </datalist>
                                <input className="border rounded p-2" placeholder="T-E" value={m.te||''} onChange={(e)=>updateMateria(idx,mIdx,'te',e.target.value)} />
                                <input className="border rounded p-2" placeholder="Mes" value={m.fechaMes||''} onChange={(e)=>updateMateria(idx,mIdx,'fechaMes',e.target.value)} />
                                <input className="border rounded p-2" placeholder="Año" value={m.fechaAnio||''} onChange={(e)=>updateMateria(idx,mIdx,'fechaAnio',e.target.value)} />
                                <select className="border rounded p-2" value={m.plantelNumero||''} onChange={(e)=>updateMateria(idx,mIdx,'plantelNumero',e.target.value)}>
                                  <option value="">Plantel</option>
                                  {(notaInstitucion.planteles||[]).map(pl => (
                                    <option key={pl.numero} value={pl.numero}>{pl.numero}</option>
                                  ))}
                                </select>
                                {(notaInstitucion.planteles||[]).length === 0 && (
                                  <span className="text-xs text-red-500 col-span-1">Agregue planteles primero</span>
                                )}
                                {/* Campo Grupo solo si es "Grupo y Participación" */}
                                {String(m.nombre||'').toLowerCase().includes('grupo y particip') && (
                                  <input className="border rounded p-2" placeholder="Grupo" value={m.grupo||''} onChange={(e)=>updateMateria(idx,mIdx,'grupo',e.target.value)} />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button type="button" className="px-3 py-2 bg-blue-600 text-white rounded" onClick={addAnio}>+ Añadir Año</button>
                    </div>
                  </fieldset>

                  <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Guardar</button>
                    {savingNotas && <span className="text-gray-500">Guardando...</span>}
                  </div>
                </form>
              )}

              {notesSubTab === 'generar' && (
                <div className="space-y-4">
                  <p className="text-gray-600">Rellena los datos mínimos del estudiante y genera el Excel desde la plantilla.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Formato</label>
                      <select 
                        className="border rounded p-2 w-full" 
                        value={notaTipoFormato} 
                        onChange={(e)=>setNotaTipoFormato(e.target.value)}
                      >
                        <option value="1-3">1-3 año (Formato Original)</option>
                        <option value="1-5">1-5 año (Formato Quinto)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {notaTipoFormato === '1-3' 
                          ? 'Usa la plantilla notascertificadas.xlsx (hasta 3er año)' 
                          : 'Usa la plantilla formatoquinto.xlsx (hasta 5to año)'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input className="border rounded p-2" placeholder="Cédula" value={notaEst.cedula} onChange={(e)=>setNotaEst(prev=>({...prev, cedula:e.target.value}))} />
                    <input className="border rounded p-2" placeholder="Nombres" value={notaEst.nombres} onChange={(e)=>setNotaEst(prev=>({...prev, nombres:e.target.value}))} />
                    <input className="border rounded p-2" placeholder="Apellidos" value={notaEst.apellidos} onChange={(e)=>setNotaEst(prev=>({...prev, apellidos:e.target.value}))} />
                  </div>
                  <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleGenerarExcelNotas}>Generar {notaTipoFormato === '1-5' ? 'Excel (1-5 año)' : 'Excel (1-3 año)'}</button>
                </div>
              )}
            </div>
          )}

          {previewNotasVisible && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                  <div className="flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-white">Previsualización Excel: {previewNotasFileName}</h3>
                  </div>
                  <button
                    onClick={() => setPreviewNotasVisible(false)}
                    className="text-white hover:text-gray-200 transition-colors text-2xl font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-6 bg-gray-100">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .excel-preview table {
                      border-collapse: collapse;
                      width: 100%;
                      background: white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                      font-size: 13px;
                    }
                    .excel-preview td, .excel-preview th {
                      border: 1px solid #d0d7de;
                      padding: 8px 12px;
                      text-align: left;
                      min-width: 80px;
                    }
                    .excel-preview th {
                      background-color: #4472C4;
                      color: white;
                      font-weight: 600;
                      text-transform: uppercase;
                      font-size: 11px;
                      letter-spacing: 0.5px;
                    }
                    .excel-preview tr:nth-child(even) {
                      background-color: #f6f8fa;
                    }
                    .excel-preview tr:hover {
                      background-color: #e8f0fe;
                    }
                    .excel-preview td[align="right"] {
                      text-align: right;
                    }
                    .excel-preview td[align="center"] {
                      text-align: center;
                    }
                  ` }} />
                  <div
                    className="excel-preview min-h-[500px] bg-white border rounded-lg shadow-inner p-6 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: previewNotasHtml }}
                  />
                </div>
                <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Nota:</span> Puedes descargar el archivo como PDF (conversión automática) o como Excel original.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPreviewNotasVisible(false)}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={descargarExcelOriginal}
                      className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Descargar Excel
                    </button>
                    <button
                      onClick={descargarNotasPreview}
                      className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-700 font-medium">Cargando datos...</p>
            <p className="text-gray-500 text-sm mt-2">Esto puede tomar unos segundos</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-full">
            <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>

            {/* Título de la sección activa */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {userType === 'docente' ? 'Mis Aulas' : (
                  <>
                    {activeTab === 'docentes' && 'Gestión de Docentes'}
                    {activeTab === 'alumnos' && 'Gestión de Alumnos'}
                    {activeTab === 'materias' && 'Gestión de Materias'}
                    {activeTab === 'asignaciones' && 'Asignaciones y Calificaciones'}
                  </>
                )}
              </h1>
              <div className="h-1 w-20 bg-blue-500 mt-2 rounded"></div>
            </div>

            {/* Contenido según la pestaña seleccionada */}
            <div className="bg-white shadow-md rounded-lg p-6">
              {/* Sección de Reportes */}
              
              {userType === 'docente' ? (
                // Vista de aulas para docentes
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aulas.filter(aula => 
                      aula.asignaciones?.some(asignacion => {
                        const formatName = (name) => {
                          if (!name) return '';
                          // Dividir el nombre en palabras
                          const words = name.toUpperCase().split(' ');
                          // Si son 4 palabras, eliminar la segunda y la cuarta
                          if (words.length === 4) {
                            return `${words[0]} ${words[2]}`;
                          }
                          return name.toUpperCase();
                        };

                        const profesorFullName = `${asignacion.profesor?.nombre || ''} ${asignacion.profesor?.apellido || ''}`;
                        const userFullName = `${userData?.nombre || ''} ${userData?.apellido || ''}`;

                        return formatName(profesorFullName) === formatName(userFullName);
                      })
                    ).map((aula) => (
                      <div key={aula._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
                          <h3 className="text-lg font-semibold text-white">{aula.nombre}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Año</p>
                              <p className="font-medium">{aula.anio}° Año</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Sección</p>
                              <p className="font-medium">{aula.seccion}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Turno</p>
                              <p className="font-medium">{aula.turno}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Alumnos</p>
                              <p className="font-medium">{aula.alumnos?.length || 0}</p>
                            </div>
                            <div className="col-span-2 border-t pt-2 mt-2">
                              <p className="text-sm text-gray-600">Periodo</p>
                              <p className="font-medium">{aula.periodo || 'No asignado'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Mis Materias:</p>
                            <div className="space-y-2">
                              {materiasPorAnio[aula.anio + ' año']?.map((materia) => {
                                const asignacion = aula.asignaciones?.find(asig => asig.materia?.id === materia.id);
                                if (!asignacion?.profesor) return null;

                                const formatName = (name) => {
                                  if (!name) return '';
                                  const words = name.toUpperCase().split(' ');
                                  if (words.length === 4) {
                                    return `${words[0]} ${words[2]}`;
                                  }
                                  return name.toUpperCase();
                                };

                                const profesorFullName = `${asignacion.profesor.nombre || ''} ${asignacion.profesor.apellido || ''}`;
                                const userFullName = `${userData?.nombre || ''} ${userData?.apellido || ''}`;
                                const namesMatch = formatName(profesorFullName) === formatName(userFullName);

                                if (!namesMatch) return null;

                                return (
                                  <button
                                    key={materia.id}
                                    onClick={() => router.push(`/calificaciones?aulaId=${aula._id}&materiaId=${materia.id}`)}
                                    className="w-full text-left px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className="font-medium block">{materia.nombre}</span>
                                        <span className="text-sm text-gray-600 block">
                                          {asignacion.profesor.nombre} {asignacion.profesor.apellido}
                                        </span>
                                      </div>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                // Vista normal para administradores
                activeTab === 'aulas' && 
                <div className="flex-1 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-800 mb-4">Gestión de Aulas</h1>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowAulaForm(true)}
                        className={`flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors ${ocultarElementoCSS('agregarAula')}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                        Agregar Aula
                      </button>
                      {!esDocente() && (
                      <button
                        onClick={() => router.push('/reportes')}
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-gray-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        Reportes
                      </button>
                      )}
                    </div>
                  </div>

                  {/* Grid de Aulas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aulas.map((aula) => (
                      <div key={aula._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-500">
                          <h3 className="text-lg font-semibold text-white">{aula.nombre}</h3>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-600">Año</p>
                              <p className="font-medium">{aula.anio}° Año</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Sección</p>
                              <p className="font-medium">{aula.seccion}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Turno</p>
                              <p className="font-medium">{aula.turno}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Alumnos</p>
                              <p className="font-medium">{aula.alumnos?.length || 0}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Profesores</p>
                              <p className="font-medium">
                                {(() => {
                                  const materiasEsperadas = materiasPorAnio[aula.anio + ' año'] || [];
                                  const asignacionesConProfesor = (aula.asignaciones || []).filter(a => 
                                    a.profesor?.nombre && a.profesor?.nombre.trim() !== ''
                                  );
                                  // Solo contar las materias que realmente tienen profesor asignado
                                  const total = asignacionesConProfesor.length;
                                  const asignadas = asignacionesConProfesor.length;
                                  const porcentaje = total > 0 ? 100 : 0;
                                  
                                  return (
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                      porcentaje === 100 ? 'bg-green-100 text-green-800' : 
                                      porcentaje >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {asignadas}/{total} ({porcentaje}%)
                                    </span>
                                  );
                                })()}
                              </p>
                            </div>
                            <div className="col-span-2 border-t pt-2 mt-2">
                              <p className="text-sm text-gray-600">Periodo</p>
                              <p className="font-medium">{aula.periodo || 'No asignado'}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-sm font-semibold text-gray-600 mb-2">Materias:</p>
                            <div className="space-y-2">
                              {materiasPorAnio[aula.anio + ' año']?.map((materia) => {
                                const asignacion = aula.asignaciones?.find(a => a.materia?.id === materia.id);
                                // Ocultar la materia si no tiene profesor asignado
                                if (!asignacion?.profesor || (!asignacion.profesor.nombre && !asignacion.profesor.apellido)) {
                                  return null;
                                }
                                return (
                                  <button
                                    key={materia.id}
                                    onClick={() => router.push(`/calificaciones?aulaId=${aula._id}&materiaId=${materia.id}`)}
                                    className="w-full text-left px-3 py-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <span className="block font-medium">{materia.nombre}</span>
                                        {asignacion?.profesor && (
                                          <span className="text-sm text-gray-600 block">
                                            Prof. {asignacion.profesor.nombre} {asignacion.profesor.apellido}
                                          </span>
                                        )}
                                      </div>
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="mt-4 flex flex-col gap-2">
                            {/* Botones en disposición vertical */}
                            <button
                              onClick={() => abrirGestionProfesores(aula)}
                              className={`bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors flex items-center justify-center w-full ${ocultarElementoCSS('gestionarProfesores')}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Gestionar Profesores
                            </button>
                            
                            <button
                              onClick={() => openDeleteStudentsModal(aula)}
                              className={`bg-orange-600 text-white px-3 py-2 rounded text-sm hover:bg-orange-700 transition-colors flex items-center justify-center w-full ${ocultarElementoCSS('eliminarEstudiantes')}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar Estudiantes
                            </button>
                            
                            <button
                              onClick={() => {
                                setAulaToAvanzar(aula);
                                setNuevoAnio('');
                                setNuevaSeccion('');
                                setShowAvanzarGradoModal(true);
                              }}
                              className={`bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center w-full ${ocultarElementoCSS('avanzarGrado')}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                              </svg>
                              Avanzar de Grado
                            </button>
                            
                            <button
                              onClick={() => {
                                setAulaToDelete(aula);
                                setShowDeleteConfirm(true);
                              }}
                              className={`text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-2 rounded text-sm transition-colors flex items-center justify-center w-full border border-red-200 ${ocultarElementoCSS('eliminarAula')}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Eliminar Aula
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Modal de Confirmación de Eliminación */}
                  {showDeleteConfirm && aulaToDelete && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6">
                          <h3 className="text-lg font-bold mb-4">¿Está seguro de eliminar el aula?</h3>
                          <p className="text-gray-600 mb-6">
                            Esta acción eliminará el aula "{aulaToDelete.nombre}" y todas sus asignaciones. Esta acción no se puede deshacer.
                          </p>
                          <div className="flex justify-end gap-4">
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setAulaToDelete(null);
                              }}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/aulas?id=${aulaToDelete._id}`, {
                                    method: 'DELETE',
                                  });

                                  const result = await response.json();
                                  
                                  if (result.success) {
                                    // Actualizar la lista de aulas
                                    setAulas(aulas.filter(aula => aula._id !== aulaToDelete._id));
                                    setAlert({
                                      title: 'Éxito',
                                      message: result.message,
                                      icon: 'success'
                                    });
                                  } else {
                                    setAlert({
                                      title: 'Error',
                                      message: result.message || 'Error al eliminar el aula',
                                      icon: 'error'
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error al eliminar aula:', error);
                                  setAlert({
                                    title: 'Error',
                                    message: 'Error al eliminar el aula',
                                    icon: 'error'
                                  });
                                } finally {
                                  setShowDeleteConfirm(false);
                                  setAulaToDelete(null);
                                }
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal para Agregar Estudiantes */}
                  {showAddStudentsModal && aulaToAddStudents && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-200">
                          <h3 className="text-xl font-bold">
                            Agregar Estudiantes a "{aulaToAddStudents.nombre}"
                          </h3>
                          <p className="text-gray-600 mt-2">
                            Seleccione los estudiantes que desea agregar al aula. Solo se muestran estudiantes del {aulaToAddStudents.anio}° año, sección {aulaToAddStudents.seccion}, que no están ya en el aula.
                          </p>
                        </div>
                        
                        <div className="flex-1 p-6 overflow-y-auto">
                          {availableStudents.length === 0 ? (
                            <div className="text-center py-8">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <p className="text-gray-500">
                                No hay estudiantes disponibles para agregar a esta aula.
                              </p>
                              <p className="text-sm text-gray-400 mt-1">
                                Todos los estudiantes del {aulaToAddStudents.anio}° año, sección {aulaToAddStudents.seccion}, ya están en el aula o no hay estudiantes registrados para esta sección.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    Estudiantes disponibles ({availableStudents.length})
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    {aulaToAddStudents.anio}° año - Sección {aulaToAddStudents.seccion}
                                  </p>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {selectedStudentsToAdd.length} seleccionado(s)
                                </div>
                              </div>
                              
                              {availableStudents.map((estudiante) => (
                                <div key={estudiante._id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                                  <input
                                    type="checkbox"
                                    id={`student-${estudiante._id}`}
                                    checked={selectedStudentsToAdd.includes(estudiante._id)}
                                    onChange={(e) => handleStudentSelection(estudiante._id, e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`student-${estudiante._id}`} className="ml-3 flex-1 cursor-pointer">
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {estudiante.nombre} {estudiante.apellido}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Cédula: {estudiante.cedula || estudiante.idU || 'N/D'}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {estudiante.anio}° Año - Sección {estudiante.seccion || 'N/D'}
                                        </div>
                                        {estudiante.edad && (
                                          <p className="text-xs text-gray-400 mt-1">
                                            {estudiante.edad} años
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-4">
                          <button
                            onClick={() => {
                              setShowAddStudentsModal(false);
                              setAulaToAddStudents(null);
                              setSelectedStudentsToAdd([]);
                              setAvailableStudents([]);
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={handleAddStudentsToAula}
                            disabled={selectedStudentsToAdd.length === 0 || loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                          >
                            {loading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Agregando...
                              </>
                            ) : (
                              `Agregar ${selectedStudentsToAdd.length} estudiante(s)`
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal de Avanzar de Grado */}
                  {showAvanzarGradoModal && aulaToAvanzar && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6">
                          <h3 className="text-lg font-bold mb-4">Avanzar de grado - {aulaToAvanzar.nombre}</h3>
                          <p className="text-gray-600 mb-4">
                            Esta acción actualizará el año y sección de todos los estudiantes del aula "{aulaToAvanzar.nombre}".
                          </p>
                          
                          <div className="space-y-4 mb-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nuevo Año</label>
                              <select
                                value={nuevoAnio}
                                onChange={(e) => setNuevoAnio(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                required
                              >
                                <option value="">Seleccione un año</option>
                                {[1, 2, 3, 4, 5].map(año => (
                                  <option key={año} value={año.toString()}>{año}° Año</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Sección</label>
                              <select
                                value={nuevaSeccion}
                                onChange={(e) => setNuevaSeccion(e.target.value)}
                                className="w-full p-2 border rounded-md"
                                required
                              >
                                <option value="">Seleccione una sección</option>
                                {['A', 'B'].map(seccion => (
                                  <option key={seccion} value={seccion}>{seccion}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-4">
                            <button
                              onClick={() => {
                                setShowAvanzarGradoModal(false);
                                setAulaToAvanzar(null);
                              }}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                              disabled={avanzandoGrado}
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={async () => {
                                if (!nuevoAnio || !nuevaSeccion) {
                                  setAlert({
                                    title: 'Error',
                                    message: 'Por favor, seleccione el nuevo año y sección',
                                    icon: 'error'
                                  });
                                  return;
                                }
                                
                                try {
                                  setAvanzandoGrado(true);
                                  console.log('Iniciando proceso de avanzar de grado...');
                                  
                                  // Mostrar notificación de inicio
                                  setAlert({
                                    title: 'Procesando',
                                    message: 'Iniciando proceso de avanzar de grado...',
                                    icon: 'info'
                                  });
                                  
                                  // Asegurarse de que los valores sean strings
                                  const anioStr = nuevoAnio.toString();
                                  const seccionStr = nuevaSeccion.toString();
                                  
                                  const requestData = {
                                    aulaId: aulaToAvanzar._id,
                                    nuevoAnio: anioStr,
                                    nuevaSeccion: seccionStr
                                  };
                                  
                                  console.log(`Enviando datos: Aula ${aulaToAvanzar.nombre}, Año ${anioStr}, Sección ${seccionStr}`);
                                  
                                  // Usar fetch con un timeout más largo
                                  const controller = new AbortController();
                                  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos
                                  
                                  const response = await fetch('/api/aulas/avanzar-grado', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(requestData),
                                    signal: controller.signal
                                  });
                                  
                                  clearTimeout(timeoutId);
                                  
                                  if (!response.ok) {
                                    const errorText = await response.text();
                                    throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
                                  }
                                  
                                  const result = await response.json();
                                  console.log('Resultado de la operación:', result);
                                  
                                  if (result.success) {
                                    console.log('Avance de grado exitoso, estudiantes modificados:', result.modifiedCount);
                                    
                                    // Cerrar el modal inmediatamente
                                    setShowAvanzarGradoModal(false);
                                    setAulaToAvanzar(null);
                                    setNuevoAnio('');
                                    setNuevaSeccion('');
                                    
                                    // Mostrar notificación de éxito
                                    setAlert({
                                      title: 'Éxito',
                                      message: result.message,
                                      icon: 'success'
                                    });
                                    
                                    // Recargar la lista de estudiantes con un retraso
                                    setTimeout(() => {
                                      loadEstudiantes();
                                      console.log('Lista de estudiantes actualizada');
                                    }, 1000);
                                  } else {
                                    console.error('Error en la respuesta:', result.message);
                                    setAlert({
                                      title: 'Error',
                                      message: result.message || 'Error al avanzar de grado',
                                      icon: 'error'
                                    });
                                  }
                                } catch (error) {
                                  console.error('Error al avanzar de grado:', error);
                                  setAlert({
                                    title: 'Error',
                                    message: `Error al procesar la solicitud: ${error.message}`,
                                    icon: 'error'
                                  });
                                } finally {
                                  setAvanzandoGrado(false);
                                }
                              }}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                              disabled={avanzandoGrado || !nuevoAnio || !nuevaSeccion}
                            >
                              {avanzandoGrado ? 'Procesando...' : 'Avanzar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Modal de Formulario de Aula */}
                  {showAulaForm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 overflow-y-auto">
                          <h3 className="text-xl font-bold mb-4 sticky top-0 bg-white pb-4">Agregar Nueva Aula</h3>
                        <form onSubmit={handleAddAula} className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            {/* Columna izquierda */}
                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Aula</label>
                                <input
                                  type="text"
                                  name="nombre"
                                  value={aulaFormData.nombre}
                                  onChange={handleAulaFormChange}
                                  className="w-full p-2 border rounded-md"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                  <select
                                    name="anio"
                                    value={aulaFormData.anio}
                                    onChange={handleAulaFormChange}
                                    className="w-full p-2 border rounded-md"
                                  >
                                    {[1,2,3,4,5].map(año => (
                                      <option key={año} value={año}>{año}° Año</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Sección</label>
                                  <select
                                    name="seccion"
                                    value={aulaFormData.seccion}
                                    onChange={handleAulaFormChange}
                                    className="w-full p-2 border rounded-md"
                                  >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                  </select>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Turno</label>
                                  <select
                                    name="turno"
                                    value={aulaFormData.turno}
                                    onChange={handleAulaFormChange}
                                    className="w-full p-2 border rounded-md"
                                  >
                                    <option value="Mañana">Mañana</option>
                                    <option value="Tarde">Tarde</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
                                  <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id="periodoNuevo"
                                        name="periodoType"
                                        value="nuevo"
                                        checked={periodoType === 'nuevo'}
                                        onChange={(e) => setPeriodoType(e.target.value)}
                                        className="text-blue-600"
                                      />
                                      <label htmlFor="periodoNuevo">Nuevo Periodo</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        id="periodoExistente"
                                        name="periodoType"
                                        value="existente"
                                        checked={periodoType === 'existente'}
                                        onChange={(e) => setPeriodoType(e.target.value)}
                                        className="text-blue-600"
                                      />
                                      <label htmlFor="periodoExistente">Periodo Existente</label>
                                    </div>
                                    {periodoType === 'nuevo' ? (
                                      <input
                                        type="text"
                                        name="periodo"
                                        value={aulaFormData.periodo}
                                        onChange={handleAulaFormChange}
                                        placeholder="Ej: 2025-1"
                                        className="w-full p-2 border rounded-md"
                                        required
                                      />
                                    ) : (
                                      <select
                                        name="periodo"
                                        value={aulaFormData.periodo}
                                        onChange={handleAulaFormChange}
                                        className="w-full p-2 border rounded-md"
                                        required
                                      >
                                        <option value="">Seleccione un periodo</option>
                                        {periodosExistentes.map(periodo => (
                                          <option key={periodo} value={periodo}>{periodo}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Columna derecha - Selección de estudiantes */}
                            <div>
                              
                              <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Estudiantes</label>
                              
                              {/* Filtros para estudiantes */}
                              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Buscar por nombre</label>
                                  <input
                                    type="text"
                                    placeholder="Nombre del estudiante..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    onChange={(e) => {
                                      const searchValue = e.target.value.toLowerCase();
                                      setEstudiantesDisponibles(prev => {
                                        // Guardamos la lista original si aún no existe
                                        if (!window.originalEstudiantesDisponibles) {
                                          window.originalEstudiantesDisponibles = [...prev];
                                        }
                                        
                                        // Si todos los filtros están vacíos, restauramos la lista original
                                        if (!searchValue && !document.getElementById('filtroAnio').value && !document.getElementById('filtroSeccion').value) {
                                          return window.originalEstudiantesDisponibles || prev;
                                        }
                                        
                                        // Aplicamos todos los filtros activos
                                        let filtered = window.originalEstudiantesDisponibles || prev;
                                        
                                        // Filtro por nombre
                                        if (searchValue) {
                                          filtered = filtered.filter(est => 
                                            (est.nombre && est.nombre.toLowerCase().includes(searchValue)) ||
                                            (est.apellido && est.apellido.toLowerCase().includes(searchValue))
                                          );
                                        }
                                        
                                        // Filtro por año
                                        const anioValue = document.getElementById('filtroAnio').value;
                                        if (anioValue) {
                                          filtered = filtered.filter(est => est.anio === anioValue);
                                        }
                                        
                                        // Filtro por sección
                                        const seccionValue = document.getElementById('filtroSeccion').value;
                                        if (seccionValue) {
                                          filtered = filtered.filter(est => est.seccion === seccionValue);
                                        }
                                        
                                        return filtered;
                                      });
                                    }}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por año</label>
                                  <select
                                    id="filtroAnio"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    onChange={(e) => {
                                      const anioValue = e.target.value;
                                      setEstudiantesDisponibles(prev => {
                                        // Guardamos la lista original si aún no existe
                                        if (!window.originalEstudiantesDisponibles) {
                                          window.originalEstudiantesDisponibles = [...prev];
                                        }
                                        
                                        // Si todos los filtros están vacíos, restauramos la lista original
                                        if (!anioValue && !document.getElementById('filtroNombre')?.value && !document.getElementById('filtroSeccion').value) {
                                          return window.originalEstudiantesDisponibles || prev;
                                        }
                                        
                                        // Aplicamos todos los filtros activos
                                        let filtered = window.originalEstudiantesDisponibles || prev;
                                        
                                        // Filtro por año
                                        if (anioValue) {
                                          filtered = filtered.filter(est => est.anio === anioValue);
                                        }
                                        
                                        // Filtro por nombre
                                        const searchValue = document.getElementById('filtroNombre')?.value?.toLowerCase();
                                        if (searchValue) {
                                          filtered = filtered.filter(est => 
                                            (est.nombre && est.nombre.toLowerCase().includes(searchValue)) ||
                                            (est.apellido && est.apellido.toLowerCase().includes(searchValue))
                                          );
                                        }
                                        
                                        // Filtro por sección
                                        const seccionValue = document.getElementById('filtroSeccion').value;
                                        if (seccionValue) {
                                          filtered = filtered.filter(est => est.seccion === seccionValue);
                                        }
                                        
                                        return filtered;
                                      });
                                    }}
                                  >
                                    <option value="">Todos los años</option>
                                    <option value="1">1er Año</option>
                                    <option value="2">2do Año</option>
                                    <option value="3">3er Año</option>
                                    <option value="4">4to Año</option>
                                    <option value="5">5to Año</option>
                                    <option value="6">6to Año</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por sección</label>
                                  <select
                                    id="filtroSeccion"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                                    onChange={(e) => {
                                      const seccionValue = e.target.value;
                                      setEstudiantesDisponibles(prev => {
                                        // Guardamos la lista original si aún no existe
                                        if (!window.originalEstudiantesDisponibles) {
                                          window.originalEstudiantesDisponibles = [...prev];
                                        }
                                        
                                        // Si todos los filtros están vacíos, restauramos la lista original
                                        if (!seccionValue && !document.getElementById('filtroNombre')?.value && !document.getElementById('filtroAnio').value) {
                                          return window.originalEstudiantesDisponibles || prev;
                                        }
                                        
                                        // Aplicamos todos los filtros activos
                                        let filtered = window.originalEstudiantesDisponibles || prev;
                                        
                                        // Filtro por sección
                                        if (seccionValue) {
                                          filtered = filtered.filter(est => est.seccion === seccionValue);
                                        }
                                        
                                        // Filtro por nombre
                                        const searchValue = document.getElementById('filtroNombre')?.value?.toLowerCase();
                                        if (searchValue) {
                                          filtered = filtered.filter(est => 
                                            (est.nombre && est.nombre.toLowerCase().includes(searchValue)) ||
                                            (est.apellido && est.apellido.toLowerCase().includes(searchValue))
                                          );
                                        }
                                        
                                        // Filtro por año
                                        const anioValue = document.getElementById('filtroAnio').value;
                                        if (anioValue) {
                                          filtered = filtered.filter(est => est.anio === anioValue);
                                        }
                                        
                                        return filtered;
                                      });
                                    }}
                                  >
                                    <option value="">Todas las secciones</option>
                                    <option value="A">Sección A</option>
                                    <option value="B">Sección B</option>
                                    <option value="C">Sección C</option>
                                    <option value="D">Sección D</option>
                                    <option value="E">Sección E</option>
                                    <option value="F">Sección F</option>
                                  </select>
                                </div>
                              </div>
                              
                              <div className="border rounded-md p-4 max-h-[400px] overflow-y-auto bg-white">
                                <div className="space-y-2">
                                  {Array.isArray(estudiantesDisponibles) ? (
                                    estudiantesDisponibles.length > 0 ? (
                                      estudiantesDisponibles.map(estudiante => (
                                        <label key={estudiante._id} className="flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer border-b">
                                          <input
                                            type="checkbox"
                                            name="estudiante"
                                            value={estudiante._id}
                                            data-estudiante={JSON.stringify({
                                              cedula: estudiante.codigo, // Usar código como cédula
                                              nombre: estudiante.nombre,
                                              apellido: estudiante.apellido,
                                              edad: estudiante.edad,
                                              anio: estudiante.anio,
                                              seccion: estudiante.seccion
                                            })}
                                            onChange={(e) => handleEstudianteChange(estudiante._id, e.target.checked)}
                                            className="mr-2"
                                          />
                                          <div className="flex-1">
                                            <div className="font-medium">{estudiante.nombre} {estudiante.apellido}</div>
                                            <div className="text-sm text-gray-500">
                                              Cédula: {estudiante.cedula || estudiante.idU || 'Sin cédula'}
                                              {estudiante.edad && <span className="ml-2">Edad: {estudiante.edad} años</span>}
                                              {estudiante.anio && <span className="ml-2">Año: {estudiante.anio}</span>}
                                              {estudiante.seccion && <span className="ml-2">Sección: {estudiante.seccion}</span>}
                                            </div>
                                          </div>
                                        </label>
                                      ))
                                    ) : (
                                      <p className="text-gray-500 text-center py-4">No hay estudiantes disponibles</p>
                                    )
                                  ) : (
                                    <div className="flex justify-center items-center py-4">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                      <span className="ml-2 text-gray-600">Cargando estudiantes...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Sección de materias y profesores */}
                          <div className="mt-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-3">Asignación de Profesores por Materia</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Marque las materias que desea incluir en el aula y asigne un profesor a cada una.
                            </p>
                            <div className="space-y-3">
                              {materiasPorAnio[aulaFormData.anio + ' año']?.map((materia) => {
                                const profesorAsignado = materiasSeleccionadas.find(m => m.materiaId === materia.id)?.profesorId;
                                const profesor = docentes?.find(d => d._id === profesorAsignado);
                                const materiaHabilitada = materiasHabilitadas.includes(materia.id);
                                
                                return (
                                  <div key={materia.id} className={`flex items-center gap-4 p-3 rounded-md border transition-all ${
                                    materiaHabilitada 
                                      ? 'bg-blue-50 border-blue-200' 
                                      : 'bg-gray-50 border-gray-200'
                                  }`}>
                                    {/* Checkbox para habilitar/deshabilitar materia */}
                                    <div className="flex-shrink-0">
                                      <input
                                        type="checkbox"
                                        id={`checkbox-${materia.id}`}
                                        checked={materiaHabilitada}
                                        onChange={(e) => handleMateriaHabilitadaChange(materia.id, e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                    </div>
                                    
                                    <div className="flex-1">
                                      <label 
                                        htmlFor={`checkbox-${materia.id}`}
                                        className={`font-medium block cursor-pointer ${
                                          materiaHabilitada ? 'text-blue-900' : 'text-gray-500'
                                        }`}
                                      >
                                        {materia.nombre}
                                      </label>
                                      {profesor && materiaHabilitada && (
                                        <span className="text-sm text-blue-600 block mt-1">
                                          Prof. {profesor.nombre} {profesor.apellido}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Select de profesores - solo visible si la materia está habilitada */}
                                    {materiaHabilitada && (
                                      <div className="flex-shrink-0 w-64">
                                        <select
                                          id={materia.id}
                                          value={materiasSeleccionadas.find(m => m.materiaId === materia.id)?.profesorId || ''}
                                          onChange={(e) => handleProfesorMateriaChange(materia.id, e.target.value)}
                                          className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        >
                                          <option key={`${materia.id}-default`} value="">Seleccione un profesor</option>
                                          {loadingProfesores ? (
                                            <option key={`${materia.id}-loading`} value="" disabled>Cargando profesores...</option>
                                          ) : docentes && docentes.length > 0 ? (
                                            docentes.map(docente => {
                                              if (!docente || !docente._id) return null;
                                              const id = typeof docente._id === 'object' ? docente._id.toString() : docente._id;
                                              return (
                                                <option key={`${materia.id}-${id}`} value={id}>
                                                  {docente.nombre || ''} {docente.apellido || ''}
                                                </option>
                                              );
                                            })
                                          ) : (
                                            <option key={`${materia.id}-empty`} value="" disabled>No hay profesores disponibles</option>
                                          )}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="sticky bottom-0 bg-white pt-4 border-t mt-6">
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setShowAulaForm(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Guardar
                              </button>
                            </div>
                          </div>
                        </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'docentes' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Gestión de Profesores</h2>
                    <button
/* ... */
                      onClick={() => setShowProfesorForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Agregar Profesor
                    </button>
                  </div>

                  
                  {/* Filtros de búsqueda */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-md font-medium text-gray-700 mb-3">Filtrar profesores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="searchProfesorNombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre o Apellido</label>
                        <input
                          type="text"
                          id="searchProfesorNombre"
                          placeholder="Buscar por nombre o apellido..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchProfesorNombre}
                          onChange={(e) => setSearchProfesorNombre(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="searchProfesorCedula" className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                        <input
                          type="text"
                          id="searchProfesorCedula"
                          placeholder="Buscar por cédula..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchProfesorCedula}
                          onChange={(e) => setSearchProfesorCedula(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Formulario para agregar/editar profesor */}
                  {showProfesorForm && (
                    <div id="profesorForm" className="mb-6 bg-white p-6 rounded-lg border border-gray-300 shadow-md">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {profesorFormData.modoEdicion ? 'Editar Profesor' : 'Agregar Nuevo Profesor'}
                      </h3>
                      <form onSubmit={profesorFormData.modoEdicion ? handleEditProfesor : handleAddProfesor}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                              type="text"
                              id="nombre"
                              name="nombre"
                              required
                              placeholder='Indique el nombre del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.nombre}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
                            <input
                              type="text"
                              id="apellido"
                              name="apellido"
                              required
                                                            placeholder='Indique el apellido del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.apellido}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700 mb-1">Cédula</label>
                            <input
                              type="text"
                              id="cedula"
                              name="cedula"
                              placeholder='Indique la cedula del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.cedula || ''}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                                                            placeholder='Indique el correo del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.email}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                            <input
                              type="text"
                              id="telefono"
                              name="telefono"
                                                            placeholder='Indique el telefono del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.telefono}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                            <input
                              type="text"
                              id="especialidad"
                              name="especialidad"
                              placeholder='Indique la especialidad del profesor'
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.especialidad}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="fechaIngreso" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                            <input
                              type="date"
                              id="fechaIngreso"
                              name="fechaIngreso"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={profesorFormData.fechaIngreso || ''}
                              onChange={handleProfesorFormChange}
                            />
                          </div>
                          <div className="md:col-span-2 mt-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado del Docente</label>
                            <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex-1">
                                <span className="text-sm text-gray-700 block mb-1">Acceso al sistema</span>
                                <span className="text-xs text-gray-500 block">
                                  {profesorFormData.estado !== 0 
                                    ? 'El docente podrá iniciar sesión y acceder al sistema' 
                                    : 'El docente no podrá iniciar sesión en el sistema'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-3">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${profesorFormData.estado !== 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {profesorFormData.estado !== 0 ? 'Activo' : 'Bloqueado'}
                                </span>
                                <div className="relative inline-block w-14 align-middle select-none">
                                  <input 
                                    type="checkbox" 
                                    name="estado" 
                                    id="estado-form" 
                                    checked={profesorFormData.estado !== 0}
                                    onChange={(e) => setProfesorFormData(prev => ({ ...prev, estado: e.target.checked ? 1 : 0 }))}
                                    className="absolute block w-6 h-6 rounded-full bg-white border-2 appearance-none cursor-pointer shadow-md"
                                    style={{
                                      top: '0',
                                      left: profesorFormData.estado !== 0 ? '50%' : '0',
                                      transition: 'left 0.3s ease',
                                      zIndex: 5
                                    }}
                                  />
                                  <label 
                                    htmlFor="estado-form" 
                                    className="block overflow-hidden h-6 rounded-full cursor-pointer"
                                    style={{
                                      backgroundColor: profesorFormData.estado !== 0 ? '#10B981' : '#EF4444',
                                      transition: 'background-color 0.3s ease'
                                    }}
                                  ></label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowProfesorForm(false);
                              setProfesorFormData({
                                nombre: '',
                                apellido: '',
                                cedula: 'N/P',
                                email: '',
                                telefono: '',
                                especialidad: '',
                                fechaIngreso: '',
                                estado: 1, // 1 = activo, 0 = bloqueado
                                modoEdicion: false
                              });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {profesorFormData.modoEdicion ? 'Guardar Cambios' : 'Agregar Profesor'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Lista de profesores */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {profesores
                        .filter(profesor => 
                          (searchProfesorNombre === '' || 
                            profesor.nombre.toLowerCase().includes(searchProfesorNombre.toLowerCase()) || 
                            profesor.apellido.toLowerCase().includes(searchProfesorNombre.toLowerCase())) &&
                          (searchProfesorCedula === '' || 
                            profesor.cedula.toLowerCase().includes(searchProfesorCedula.toLowerCase()))
                        )
                        .map((profesor, index) => (
                          <div 
                            key={profesor.id} 
                            className={`bg-gradient-to-br from-blue-50 to-white p-4 rounded-lg border-t-4 border-blue-500 border-r border-b border-l border-gray-200 shadow-md card-animate card-hover-effect card-animate-delay-${index % 3 + 1} transform transition-all duration-300 hover:shadow-xl hover:scale-105`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-300">{profesor.nombre} {profesor.apellido}</h3>
                                <p className="text-sm font-medium text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-md mt-1">Cédula: {profesor.cedula}</p>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setProfesorFormData({
                                      ...profesor,
                                      modoEdicion: true
                                    });
                                    setShowProfesorForm(true);
                                    // Scroll to the form
                                    setTimeout(() => {
                                      document.getElementById('profesorForm').scrollIntoView({ behavior: 'smooth' });
                                    }, 100);
                                  }}
                                  className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-all duration-300 transform hover:scale-110"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteProfesor(profesor.id)}
                                  className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 hover:text-red-800 transition-all duration-300 transform hover:scale-110"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              {/* Switch para activar/desactivar profesor */}
                              <div className="flex items-center space-x-3 mb-3 p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
                                <div className="flex-1">
                                  <span className="text-sm font-semibold text-gray-700 block mb-1">Estado de la cuenta</span>
                                  <span className="text-xs text-gray-500 block">
                                    {profesor.estado !== 0 
                                      ? 'El docente puede iniciar sesión y acceder al sistema' 
                                      : 'El docente no puede iniciar sesión en el sistema'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${profesor.estado !== 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {profesor.estado !== 0 ? 'Activo' : 'Bloqueado'}
                                  </span>
                                  <div className="relative inline-block w-14 align-middle select-none">
                                    <input 
                                      type="checkbox" 
                                      name={`toggle-${profesor.id}`} 
                                      id={`toggle-${profesor.id}`} 
                                      checked={profesor.estado !== 0}
                                      onChange={() => handleToggleProfesorEstado(profesor.id, profesor.estado === 0 ? 1 : 0)}
                                      className="absolute block w-6 h-6 rounded-full bg-white border-2 appearance-none cursor-pointer shadow-md"
                                      style={{
                                        top: '0',
                                        left: profesor.estado !== 0 ? '50%' : '0',
                                        transition: 'left 0.3s ease',
                                        zIndex: 5
                                      }}
                                    />
                                    <label 
                                      htmlFor={`toggle-${profesor.id}`} 
                                      className="block overflow-hidden h-6 rounded-full cursor-pointer"
                                      style={{
                                        backgroundColor: profesor.estado !== 0 ? '#10B981' : '#EF4444',
                                        transition: 'background-color 0.3s ease'
                                      }}
                                    ></label>
                                  </div>
                                </div>
                              </div>
                              {profesor.email && (
                                <div className="flex items-center text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-gray-700">{profesor.email}</span>
                                </div>
                              )}
                              {profesor.telefono && (
                                <div className="flex items-center text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                  </svg>
                                  <span className="text-gray-700">{profesor.telefono}</span>
                                </div>
                              )}
                              {profesor.especialidad && (
                                <div className="flex items-center text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                  </svg>
                                  <span className="text-gray-700">{profesor.especialidad}</span>
                                </div>
                              )}
                              {profesor.fechaIngreso && (
                                <div className="flex items-center text-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-gray-700">Fecha de Ingreso: {profesor.fechaIngreso ? new Date(profesor.fechaIngreso).toISOString().split('T')[0] : ''}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      }
                      {profesores.filter(profesor => 
                        (searchProfesorNombre === '' || 
                          profesor.nombre.toLowerCase().includes(searchProfesorNombre.toLowerCase()) || 
                          profesor.apellido.toLowerCase().includes(searchProfesorNombre.toLowerCase())) &&
                        (searchProfesorCedula === '' || 
                          profesor.cedula.toLowerCase().includes(searchProfesorCedula.toLowerCase()))
                      ).length === 0 && (
                        <div className="col-span-3 py-6 text-center text-gray-500">
                          No se encontraron profesores con los criterios de búsqueda especificados.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Gestión de Materias */}
              {activeTab === 'materias' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Gestión de Materias</h2>
                    <button
                      onClick={() => setShowMateriaForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Agregar Materia
                    </button>
                  </div>
                  
                  {/* Filtros de búsqueda */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="text-md font-medium text-gray-700 mb-3">Filtrar materias</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="searchMateriaNombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                        <input
                          type="text"
                          id="searchMateriaNombre"
                          placeholder="Buscar por nombre..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchMateriaNombre}
                          onChange={(e) => setSearchMateriaNombre(e.target.value)}
                        />
                      </div>
                      <div>
                        <label htmlFor="searchMateriaCodigo" className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                        <input
                          type="text"
                          id="searchMateriaCodigo"
                          placeholder="Buscar por código..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={searchMateriaCodigo}
                          onChange={(e) => setSearchMateriaCodigo(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Formulario para agregar/editar materia */}
                  {showMateriaForm && (
                    <div id="materiaForm" className="mb-6 bg-white p-6 rounded-lg border border-gray-300 shadow-md">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {materiaFormData.modoEdicion ? 'Editar Materia' : 'Agregar Nueva Materia'}
                      </h3>
                      <form onSubmit={materiaFormData.modoEdicion ? handleEditMateria : handleAddMateria}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                            <input
                              type="text"
                              id="codigo"
                              name="codigo"
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={materiaFormData.codigo}
                              placeholder="Indique el codigo, puedo ser numerico o alfanumerico"
                              onChange={handleMateriaFormChange}
                            />
                          </div>
                          <div>
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                            <input
                              type="text"
                              id="nombre"
                              name="nombre"
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={materiaFormData.nombre}
                              placeholder="Indique el nombre de la materia"
                              onChange={handleMateriaFormChange}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                            <textarea
                              id="descripcion"
                              name="descripcion"
                              rows="3"
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={materiaFormData.descripcion}
                              onChange={handleMateriaFormChange}
                              placeholder="De una descripcion breve de la materia"
                            ></textarea>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => {
                              setShowMateriaForm(false);
                              setMateriaFormData({
                                codigo: '',
                                nombre: '',
                                descripcion: '',
                                modoEdicion: false
                              });
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            {materiaFormData.modoEdicion ? 'Guardar Cambios' : 'Agregar Materia'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                  
                  {/* Lista de materias */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                      {materias
                        .filter(materia => 
                          (searchMateriaNombre === '' || 
                            materia.nombre.toLowerCase().includes(searchMateriaNombre.toLowerCase())) &&
                          (searchMateriaCodigo === '' || 
                            materia.codigo.toLowerCase().includes(searchMateriaCodigo.toLowerCase()))
                        )
                        .map((materia, index) => (
                          <div key={materia.id} className={`bg-gradient-to-br from-indigo-50 to-white p-4 rounded-lg border-t-4 border-indigo-500 border-r border-b border-l border-gray-200 shadow-md card-animate card-hover-effect card-animate-delay-${index % 3 + 1} transform transition-all duration-300 hover:shadow-xl hover:scale-105`}>
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="text-lg font-bold text-indigo-700 group-hover:text-indigo-800 transition-colors duration-300">{materia.nombre}</h3>
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-md">Código: {materia.codigo || 'N/A'}</p>
                                  <div className="mt-3 p-3 bg-gray-50 rounded-md border-l-2 border-indigo-400">
                                    <div className="flex items-start">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="text-gray-700">{materia.descripcion || 'Sin descripción'}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setMateriaFormData({
                                       ...materia,
                                       modoEdicion: true
                                     });
                                     setShowMateriaForm(true);
                                     // Scroll to the form
                                     setTimeout(() => {
                                       document.getElementById('materiaForm').scrollIntoView({ behavior: 'smooth' });
                                     }, 100);
                                  }}
                                  className="p-2 bg-indigo-100 rounded-full text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 transition-all duration-300 transform hover:scale-110"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMateria(materia.id)}
                                  className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 hover:text-red-800 transition-all duration-300 transform hover:scale-110"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      }
                      {materias.filter(materia => 
                        (searchMateriaNombre === '' || 
                          materia.nombre.toLowerCase().includes(searchMateriaNombre.toLowerCase())) &&
                        (searchMateriaCodigo === '' || 
                          materia.codigo.toLowerCase().includes(searchMateriaCodigo.toLowerCase()))
                      ).length === 0 && (
                        <div className="col-span-3 py-6 text-center text-gray-500">
                          No se encontraron materias con los criterios de búsqueda especificados.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Gestión de Alumnos */}
              {activeTab === 'alumnos' && (
                <div className="animate-fadeIn">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Gestión de Alumnos</h3>
                    </div>
                    <button
                      onClick={() => {
                        setFormData({
                          nombre: '',
                          apellido: '',
                          cedula: 'N/P',
                          fechaNacimiento: '',
                          lugarNacimiento: '',
                          sexo: 'Otro',
                          ef: '',
                          edad: 0,
                          esMenorDeEdad: false,
                          modoEdicion: false
                        });
                        setShowStudentForm(true);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Agregar Alumno
                    </button>
                  </div>
                  
                  {/* Formulario de Agregar/Editar Alumno */}
                  {showStudentForm && (
                    <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg shadow-md mb-6 border-t-4 border-blue-500 border-r border-b border-l border-blue-100 animate-fadeIn transition-all duration-300">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-blue-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {formData.modoEdicion ? 'Editar Alumno' : 'Agregar Nuevo Alumno'}
                        </h3>
                        <button 
                          onClick={() => setShowStudentForm(false)}
                          className="text-gray-500 hover:text-gray-700"
                          type="button"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    <form onSubmit={(e) => formData.modoEdicion ? handleEditAlumno(e) : handleAddAlumno(e)}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Nombre
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="nombre"
                              value={formData.nombre || ''}
                              placeholder="Indique el nombre del alumno"
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">Aa</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Apellido
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="apellido"
                              value={formData.apellido || ''}
                              placeholder="Indique el apellido del alumno"
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">Aa</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            Cédula
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="cedula"
                              value={formData.cedula || ''}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Indique la cedula, si no posee utiliza la del representante"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">#</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Fecha de Nacimiento
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              name="fechaNacimiento"
                              value={formData.fechaNacimiento || ''}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              required
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Lugar de Nacimiento
                          </label>
                          <div className="relative">
                            <select
                              name="lugarNacimiento"
                              value={formData.lugarNacimiento || ''}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="">Seleccione un estado</option>
                              <option value="Amazonas">Amazonas</option>
                              <option value="Anzoátegui">Anzoátegui</option>
                              <option value="Apure">Apure</option>
                              <option value="Aragua">Aragua</option>
                              <option value="Barinas">Barinas</option>
                              <option value="Bolívar">Bolívar</option>
                              <option value="Carabobo">Carabobo</option>
                              <option value="Cojedes">Cojedes</option>
                              <option value="Delta Amacuro">Delta Amacuro</option>
                              <option value="Distrito Capital">Distrito Capital</option>
                              <option value="Falcón">Falcón</option>
                              <option value="Guárico">Guárico</option>
                              <option value="Lara">Lara</option>
                              <option value="Mérida">Mérida</option>
                              <option value="Miranda">Miranda</option>
                              <option value="Monagas">Monagas</option>
                              <option value="Nueva Esparta">Nueva Esparta</option>
                              <option value="Portuguesa">Portuguesa</option>
                              <option value="Sucre">Sucre</option>
                              <option value="Táchira">Táchira</option>
                              <option value="Trujillo">Trujillo</option>
                              <option value="Vargas">Vargas</option>
                              <option value="Yaracuy">Yaracuy</option>
                              <option value="Zulia">Zulia</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Sexo
                          </label>
                          <div className="relative">
                            <select
                              name="sexo"
                              value={formData.sexo || 'Otro'}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="M">Masculino</option>
                              <option value="F">Femenino</option>
                              <option value="Otro">Otro</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            EF (Información adicional)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="ef"
                              value={formData.ef || ''}
                              placeholder="Información adicional del estudiante"
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Año
                          </label>
                          <div className="relative">
                            <select
                              name="anio"
                              value={formData.anio || '1'}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="1">1er Año</option>
                              <option value="2">2do Año</option>
                              <option value="3">3er Año</option>
                              <option value="4">4to Año</option>
                              <option value="5">5to Año</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Sección
                          </label>
                          <div className="relative">
                            <select
                              name="seccion"
                              value={formData.seccion || 'A'}
                              onChange={handleFormChange}
                              className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                              <option value="A">Sección A</option>
                              <option value="B">Sección B</option>
                              <option value="C">Sección C</option>
                              <option value="D">Sección D</option>
                              <option value="E">Sección E</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Edad
                          </label>
                          <div className="flex items-center h-10 pl-10 pr-3 py-2 border border-blue-200 rounded-lg bg-white relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-blue-500 font-bold">+</span>
                            </div>
                            <span className="font-medium text-gray-700">{formData.edad || 0} años</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center p-3 mb-4 bg-blue-50 rounded-lg border border-blue-100 shadow-sm">
                        <div className={`mr-3 w-5 h-5 rounded-full flex items-center justify-center ${formData.esMenorDeEdad ? 'bg-amber-500' : 'bg-blue-500'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className={`text-sm font-medium ${formData.esMenorDeEdad ? 'text-amber-700' : 'text-blue-700'}`}>
                          {formData.esMenorDeEdad ? 'Es menor de edad' : 'Es mayor de edad'}
                        </span>
                      </div>

                      {/* Sección de datos del representante */}
                      <div className="mb-4 mt-6 border-t pt-4">
                        <h4 className="text-lg font-semibold text-blue-700 flex items-center mb-4">
                          <svg 
                            className="w-5 h-5 mr-2" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24" 
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth="2" 
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Datos del Representante
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {/* Nombre del Representante */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Nombre del Representante *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="representanteNombre"
                                value={formData.representanteNombre || ''}
                                placeholder="Nombre del representante"
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">Aa</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Apellido del Representante */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Apellido del Representante *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="representanteApellido"
                                value={formData.representanteApellido || ''}
                                placeholder="Apellido del representante"
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">Aa</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Cédula del Representante */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              Cédula del Representante *
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                name="representanteCedula"
                                value={formData.representanteCedula || ''}
                                placeholder="Número de cédula"
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">#</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Teléfono del Representante */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              Teléfono del Representante *
                            </label>
                            <div className="relative">
                              <input
                                type="tel"
                                name="representanteTelefono"
                                value={formData.representanteTelefono || ''}
                                placeholder="Número de teléfono"
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                required
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">📞</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Correo del Representante */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              Correo del Representante
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                name="representanteCorreo"
                                value={formData.representanteCorreo || ''}
                                placeholder="Correo electrónico"
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">@</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Parentesco */}
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                              Parentesco
                            </label>
                            <div className="relative">
                              <select
                                name="representanteParentesco"
                                value={formData.representanteParentesco || 'Padre'}
                                onChange={handleFormChange}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              >
                                <option value="Padre">Padre</option>
                                <option value="Madre">Madre</option>
                                <option value="Abuelo">Abuelo</option>
                                <option value="Abuela">Abuela</option>
                                <option value="Tío">Tío</option>
                                <option value="Tía">Tía</option>
                                <option value="Otro">Otro</option>
                              </select>
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-blue-500">👪</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500 mb-2">
                          Los campos marcados con * son obligatorios
                        </div>
                      </div>
                      <div className="flex justify-end space-x-4 mt-6">
                        <button
                          type="button"
                          onClick={() => {
                            // Limpiar el formulario
                            setFormData({
                              nombre: '',
                              apellido: '',
                              cedula: 'N/P',
                              fechaNacimiento: '',
                              lugarNacimiento: '',
                              sexo: 'Otro',
                              ef: '',
                              grupo: '',
                              anio: '1',
                              seccion: 'A',
                              edad: 0,
                              esMenorDeEdad: false,
                              modoEdicion: false,
                              // Limpiar también los datos del representante
                              representante: {
                                nombre: '',
                                apellido: '',
                                cedula: '',
                                telefono: '',
                                correo: '',
                                parentesco: 'Padre'
                              }
                            });
                            // Ocultar el formulario
                            setShowStudentForm(false);
                          }}
                          className="px-5 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 shadow-sm hover:bg-gray-50 transition-all duration-300 flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {formData.modoEdicion ? 'Guardar Cambios' : 'Agregar Alumno'}
                        </button>
                      </div>
                    </form>
                  </div>
                  )}
                  
                  {/* Filtrador avanzado para estudiantes */}
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl shadow-md mb-6 border-t-4 border-blue-500 border-r border-b border-l border-blue-100">
                    <h4 className="text-md font-bold text-blue-700 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                      Filtros de búsqueda avanzada
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                        <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Buscar por nombre
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Nombre del estudiante..."
                            className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={searchNombre}
                            onChange={(e) => setSearchNombre(e.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                        <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          Buscar por cédula
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Número de cédula..."
                            className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={searchCedula}
                            onChange={(e) => setSearchCedula(e.target.value)}
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-blue-500 font-bold">#</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-5">
                      <button
                        onClick={() => {
                          setSearchNombre('');
                          setSearchCedula('');
                        }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm font-medium flex items-center shadow-sm hover:shadow transform hover:-translate-y-1"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Limpiar todos los filtros
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-blue-100 mt-6">
                    <table className="min-w-full divide-y divide-blue-200 table-fixed">
                      <thead className="bg-gradient-to-r from-blue-700 to-blue-600">
                        <tr>
                          <th scope="col" className="w-[15%] px-6 py-4 text-left text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">#</span>
                              Cédula
                            </div>
                          </th>
                          <th scope="col" className="w-[25%] px-6 py-4 text-left text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">Aa</span>
                              Nombre
                            </div>
                          </th>
                          <th scope="col" className="w-[12%] px-6 py-4 text-left text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">+</span>
                              Edad
                            </div>
                          </th>
                          <th scope="col" className="w-[16%] px-6 py-4 text-center text-sm font-extrabold text-white uppercase tracking-wider hidden">
                            <div className="flex items-center justify-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">👥</span>
                              Grupo
                            </div>
                          </th>
                          <th scope="col" className="w-[16%] px-6 py-4 text-center text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              Es menor de edad
                            </div>
                          </th>
                                                    <th scope="col" className="w-[16%] px-6 py-4 text-center text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">🔄</span>
                              Estado
                            </div>
                          </th>
                          <th scope="col" className="w-[16%] px-6 py-4 text-center text-sm font-extrabold text-white uppercase tracking-wider">
                            <div className="flex items-center justify-center">
                              <span className="bg-white text-blue-700 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-md font-bold">⚙️</span>
                              Acciones
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {alumnos.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-6 py-10 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <div className="bg-blue-100 p-3 rounded-full mb-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No hay alumnos registrados</h3>
                                <p className="text-sm text-gray-500 mb-4">Agrega un nuevo alumno usando el botón en la parte superior.</p>
                                <button
                                  onClick={() => {
                                    setFormData({
                              nombre: '',
                              cedula: 'N/P',
                              fechaNacimiento: '',
                              lugarNacimiento: '',
                              sexo: 'Otro',
                              ef: '',
                              grupo: '',
                              edad: 0,
                              esMenorDeEdad: false,
                              modoEdicion: false
                            });
                                    setShowStudentForm(true);
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  Agregar Alumno
                                </button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            if (alumnosFiltrados.length === 0) {
                              return (
                                <tr>
                                  <td colSpan="5" className="px-6 py-10 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                      <div className="bg-amber-100 p-3 rounded-full mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron alumnos</h3>
                                      <p className="text-sm text-gray-500 mb-4">No hay alumnos que coincidan con los criterios de búsqueda.</p>
                                      <button
                                        onClick={() => {
                                          setSearchNombre('');
                                          setSearchCedula('');
                                        }}
                                        className="px-4 py-2 bg-amber-600 text-white rounded-lg shadow-md hover:bg-amber-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center"
                                      >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                        Limpiar filtros
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            }

                            return alumnosFiltrados.map((alumno, index) => {
                              // Calcular la edad si no está ya calculada
                              const edad = calcularEdad(alumno.fechaNacimiento);
                              const esMenorDeEdad = alumno.esMenorDeEdad !== undefined ? alumno.esMenorDeEdad : edad < 18;
                            
                            return (
                              <tr key={alumno.id || alumno._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150 transform hover:scale-[1.01] card-animate card-animate-delay-${index % 3 + 1}`}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-start">
                                    {alumno.cedula === 'N/P' ? 
                                      <span className="text-gray-600 italic bg-gray-100 px-2 py-1 rounded-md font-semibold">N/P</span> : 
                                      <span className="font-bold text-gray-900 bg-blue-100 px-3 py-1 rounded-full">{alumno.cedula}</span>
                                    }
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center">
                                    <div className="w-full">
                                      <p className="text-sm font-bold text-gray-900 break-words leading-tight">
                                        <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                                      </p>
                                      <div className="flex flex-col space-y-1 mt-1">
                                        {alumno.lugarNacimiento && (
                                          <p className="text-xs font-semibold text-gray-700">Lugar: {alumno.lugarNacimiento}</p>
                                        )}
                                        {alumno.sexo && (
                                          <p className="text-xs font-semibold text-gray-700">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                              Sexo: {alumno.sexo === 'M' ? 'Masculino' : alumno.sexo === 'F' ? 'Femenino' : 'Otro'}
                                            </span>
                                          </p>
                                        )}
                                        {alumno.ef && (
                                          <p className="text-xs font-semibold text-gray-700">EF: {alumno.ef}</p>
                                        )}
                                        {alumno.anio && (
                                          <p className="text-xs font-semibold text-gray-700">Año: {alumno.anio}</p>
                                        )}
                                        {alumno.seccion && (
                                          <p className="text-xs font-semibold text-gray-700">Sección: {alumno.seccion}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-bold rounded-full bg-blue-100 text-blue-900">
                                      {edad} años
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap hidden">
                                  <div className="flex items-center">
                                    {alumno.grupo ? (
                                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                        {alumno.grupo}
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-gray-100 text-gray-500 italic">
                                        Sin grupo
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-center">
                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${esMenorDeEdad ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                      <div className={`w-3 h-3 rounded-full mr-2 ${esMenorDeEdad ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                      {esMenorDeEdad ? 'Sí' : 'No'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-center">
                                    <button 
                                      onClick={() => handleEstadoChange(alumno.id || alumno._id, alumno.estado !== undefined ? alumno.estado : 1)}
                                      disabled={updatingEstado}
                                      className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                      style={{ backgroundColor: alumno.estado === 0 ? '#d1d5db' : '#3b82f6' }}
                                    >
                                      <span className="sr-only">Cambiar estado</span>
                                      <span 
                                        className={`${alumno.estado === 0 ? 'translate-x-1' : 'translate-x-6'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
                                      />
                                    </button>
                                    <span className="ml-2 text-xs font-medium text-gray-700">
                                      {alumno.estado === 0 ? 'Inactivo' : 'Activo'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2 justify-center">
                                    <button
                                      onClick={() => {
                                        // Debug: ver todos los datos del alumno
                                        console.log('Datos completos del alumno a editar:', alumno);
                                        console.log('Fecha de nacimiento original:', alumno.fechaNacimiento);
                                        console.log('Lugar de nacimiento original:', alumno.lugarNacimiento);
                                        console.log('Datos del representante original:', alumno.representante);
                                        console.log('¿Tiene representante?:', !!alumno.representante);
                                        if (alumno.representante) {
                                          console.log('Nombre representante:', alumno.representante.nombre);
                                          console.log('Apellido representante:', alumno.representante.apellido);
                                        }
                                        
                                        // Cargar todos los datos del alumno en el formulario
                                        setFormData({
                                          id: alumno.id || alumno._id,
                                          nombre: alumno.nombre || '',
                                          apellido: alumno.apellido || '',
                                          cedula: alumno.cedula || alumno.idU || 'N/P',
                                          fechaNacimiento: alumno.fechaNacimiento ? new Date(alumno.fechaNacimiento).toISOString().split('T')[0] : '',
                                          lugarNacimiento: alumno.lugarNacimiento || '',
                                          sexo: alumno.sexo || 'Otro',
                                          grupo: alumno.grupo || '',
                                          ef: alumno.ef || '',
                                          anio: alumno.anio || '1',
                                          seccion: alumno.seccion || 'A',
                                          edad: edad,
                                          esMenorDeEdad: esMenorDeEdad,
                                          modoEdicion: true,
                                          // Datos del representante
                                          representanteNombre: alumno.representante?.nombre || '',
                                          representanteApellido: alumno.representante?.apellido || '',
                                          representanteCedula: alumno.representante?.cedula || '',
                                          representanteCorreo: alumno.representante?.correo || '',
                                          representanteTelefono: alumno.representante?.telefono || '',
                                          representanteParentesco: alumno.representante?.parentesco || 'Padre'
                                        });
                                        
                                        // Debug: verificar lo que se cargó en formData
                                        console.log('FormData después de cargar:', {
                                          representanteNombre: alumno.representante?.nombre || '',
                                          representanteApellido: alumno.representante?.apellido || '',
                                          representanteCedula: alumno.representante?.cedula || '',
                                          representanteCorreo: alumno.representante?.correo || '',
                                          representanteTelefono: alumno.representante?.telefono || '',
                                          representanteParentesco: alumno.representante?.parentesco || 'Padre'
                                        });
                                        
                                        // Mostrar el formulario
                                        setShowStudentForm(true);
                                        // Hacer scroll hacia arriba para ver el formulario
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                      className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-all duration-300 transform hover:scale-110"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={async () => {
                                        try {
                                          // Obtener los datos completos del estudiante desde la API
                                          const estudianteId = alumno.id || alumno._id;
                                          const response = await fetch(`/api/estudiantes/${estudianteId}`);
                                          
                                          if (!response.ok) {
                                            throw new Error('Error al obtener datos del estudiante');
                                          }
                                          
                                          const data = await response.json();
                                          console.log('Datos completos del estudiante:', data.data);
                                          
                                          if (data.success && data.data) {
                                            // Abrir el modal con los datos completos del estudiante
                                            setSelectedEstudiante(data.data);
                                            setShowRepresentanteModal(true);
                                          } else {
                                            // Si no hay datos, usar los datos que ya tenemos
                                            setSelectedEstudiante(alumno);
                                            setShowRepresentanteModal(true);
                                          }
                                        } catch (error) {
                                          console.error('Error al cargar datos del representante:', error);
                                          // En caso de error, usar los datos que ya tenemos
                                          setSelectedEstudiante(alumno);
                                          setShowRepresentanteModal(true);
                                        }
                                      }}
                                      className="p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800 transition-all duration-300 transform hover:scale-110 relative"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleInscribirAlumno(alumno)}
                                      className="p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-all duration-300 transform hover:scale-110"
                                      title="Inscribir en aula"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleGenerarCarnet(alumno)}
                                      className="p-2 bg-purple-100 rounded-full text-purple-600 hover:bg-purple-200 hover:text-purple-800 transition-all duration-300 transform hover:scale-110"
                                      title="Generar carnet"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteAlumno(alumno.id || alumno._id)}
                                      className="p-2 bg-red-100 rounded-full text-red-600 hover:bg-red-200 hover:text-red-800 transition-all duration-300 transform hover:scale-110"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                          })()
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              


              {/* Asignaciones y Calificaciones */}
              {activeTab === 'asignaciones' && (
                <div className="animate-fadeIn hidden">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">Gestión de Asignaciones</h3>
                    </div>
                    <button
                      onClick={() => setShowAsignacionForm(!showAsignacionForm)}
                      className={`px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg flex items-center ${ocultarElementoCSS('agregarAsignacion')}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      {showAsignacionForm ? 'Cancelar' : 'Agregar Asignación'}
                    </button>
                  </div>
                  
                  {/* Formulario de asignación */}
                  {showAsignacionForm && (
                    <div className="bg-white shadow-md rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold mb-2">
                        {asignacionFormData.modoEdicion ? 'Editar Asignación' : 'Nueva Asignación'}
                      </h3>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        
                        // Validar que se hayan seleccionado profesores para las materias
                        if (!asignacionFormData.materiasSeleccionadas || asignacionFormData.materiasSeleccionadas.length === 0) {
                          setError('Por favor, seleccione al menos una materia y asigne un profesor.');
                          return;
                        }
                        
                        // Verificar que cada materia seleccionada tenga un profesor asignado
                        const materiaSinProfesor = asignacionFormData.materiasSeleccionadas.find(materia => !materia.profesorId);
                        if (materiaSinProfesor) {
                          setError('Por favor, seleccione un profesor para cada materia.');
                          return;
                        }
                        
                        // Si pasa las validaciones, guardar los datos
                        try {
                          // Crear objeto con los datos de la asignación
                          const datosAsignacion = {
                            anio: asignacionFormData.anio,
                            seccion: asignacionFormData.seccion,
                            turno: asignacionFormData.turno,
                            materias: asignacionFormData.materiasSeleccionadas.map(materia => ({
                              materiaId: materia.materiaId,
                              profesorId: materia.profesorId,
                              nombre: materia.nombre
                            })),
                            periodo: asignacionFormData.usarPeriodoExistente ? asignacionFormData.periodoExistente : {
                              nombre: asignacionFormData.nombrePeriodo,
                              fechaInicio: asignacionFormData.fechaInicio,
                              fechaFin: asignacionFormData.fechaFin
                            }
                          };
                          
                          console.log('Guardando asignación:', datosAsignacion);
                          
                          // Actualizar el estado local con la nueva asignación
                          if (asignacionFormData.modoEdicion) {
                            // Actualizar asignación existente
                            setAsignaciones(prev => prev.map(asig => 
                              asig.id === asignacionFormData.id ? {...datosAsignacion, id: asignacionFormData.id} : asig
                            ));
                          } else {
                            // Agregar nueva asignación
                            setAsignaciones(prev => [...prev, {
                              id: `asig-${Date.now()}`,
                              ...datosAsignacion
                            }]);
                          }
                          
                          // Limpiar el formulario y cerrar el modal
                          setAsignacionFormData({
                            materiaId: '',
                            profesorId: '',
                            alumnos: [],
                            periodo: '',
                            anio: '1 año',
                            seccion: 'A',
                            turno: 'Mañana',
                            materiasSeleccionadas: [],
                            modoEdicion: false,
                            usarPeriodoExistente: false
                          });
                          setShowAsignacionForm(false);
                          setError(null);
                          
                          // Mostrar mensaje de éxito
                          window.alert(asignacionFormData.modoEdicion ? 'Asignación actualizada correctamente' : 'Asignación guardada correctamente');
                        } catch (err) {
                          console.error('Error al guardar la asignación:', err);
                          setError('Error al guardar la asignación. Por favor, intente de nuevo.');
                        }
                      }}>
                        {error && (
                          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                          </div>
                        )}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                          <h4 className="text-lg font-bold text-blue-800 mb-3">Información de la Asignación</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Año
                              </label>
                              <select
                                name="anio"
                                value={asignacionFormData.anio || '1 año'}
                                onChange={(e) => {
                                  // Actualizar el año seleccionado
                                  handleAsignacionFormChange(e);
                                  
                                  // Verificar si es un grado de primaria
                                  const esGradoPrimaria = e.target.value.includes('grado');
                                  
                                  if (esGradoPrimaria) {
                                    // Para grados de primaria, asignar automáticamente "Profesor del Curso"
                                    setAsignacionFormData(prev => ({
                                      ...prev,
                                      materiasSeleccionadas: [{ id: 'PROF-CURSO', nombre: 'Profesor del Curso', codigo: 'PROF-CURSO' }]
                                    }));
                                  } else {
                                    // Para años de secundaria, resetear las materias seleccionadas
                                    setAsignacionFormData(prev => ({
                                      ...prev,
                                      materiasSeleccionadas: []
                                    }));
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                required
                              >
                                {/* Grados de primaria */}
                                <option value="1 grado">1° Grado</option>
                                <option value="2 grado">2° Grado</option>
                                <option value="3 grado">3° Grado</option>
                                <option value="4 grado">4° Grado</option>
                                <option value="5 grado">5° Grado</option>
                                <option value="6 grado">6° Grado</option>
                                {/* Años de secundaria */}
                                <option value="1 año">1° Año</option>
                                <option value="2 año">2° Año</option>
                                <option value="3 año">3° Año</option>
                                <option value="4 año">4° Año</option>
                                <option value="5 año">5° Año</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sección
                              </label>
                              <select
                                name="seccion"
                                value={asignacionFormData.seccion || 'A'}
                                onChange={handleAsignacionFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                required
                              >
                                <option value="A">Sección A</option>
                                <option value="B">Sección B</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Turno
                              </label>
                              <select
                                name="turno"
                                value={asignacionFormData.turno || 'Mañana'}
                                onChange={handleAsignacionFormChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                                required
                              >
                                <option value="Mañana">Mañana</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Noche">Noche</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-blue-50 to-white p-4 rounded-lg border border-blue-200 mb-6">
                          <h4 className="text-lg font-bold text-blue-800 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Materias y Profesores de {asignacionFormData.anio}
                          </h4>
                          
                          <div className="bg-white rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Materia
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Profesor
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {/* Definir las materias por año */}
                                {(() => {
                                  // Mapeo de materias por año
                                  const materiasPorAnio = {
                                    '1 año': [
                                      { id: 'mat1', nombre: 'Castellano' },
                                      { id: 'mat2', nombre: 'Inglés y otras lenguas extranjeras' },
                                      { id: 'mat3', nombre: 'Matemáticas' },
                                      { id: 'mat4', nombre: 'Educación Física' },
                                      { id: 'mat5', nombre: 'Arte y Patrimonio' },
                                      { id: 'mat6', nombre: 'Ciencias Naturales' },
                                      { id: 'mat7', nombre: 'Geografía, Historia y Ciudadanía' },
                                      { id: 'mat8', nombre: 'Orientación y Convivencia' },
                                      { id: 'mat9', nombre: 'Participación de Grupos de Creación, Recreación y Producción' }
                                    ],
                                    '2 año': [
                                      { id: 'mat10', nombre: 'Castellano' },
                                      { id: 'mat11', nombre: 'Inglés y otras lenguas extranjeras' },
                                      { id: 'mat12', nombre: 'Matemáticas' },
                                      { id: 'mat13', nombre: 'Educación Física' },
                                      { id: 'mat14', nombre: 'Arte y Patrimonio' },
                                      { id: 'mat15', nombre: 'Ciencias Naturales' },
                                      { id: 'mat16', nombre: 'Geografía, Historia y Ciudadanía' },
                                      { id: 'mat17', nombre: 'Orientación y Convivencia' },
                                      { id: 'mat18', nombre: 'Participación de Grupos de Creación, Recreación y Producción' }
                                    ],
                                    '3 año': [
                                      { id: 'mat19', nombre: 'Castellano' },
                                      { id: 'mat20', nombre: 'Inglés y otras lenguas extranjeras' },
                                      { id: 'mat21', nombre: 'Matemáticas' },
                                      { id: 'mat22', nombre: 'Educación Física' },
                                      { id: 'mat23', nombre: 'Física' },
                                      { id: 'mat24', nombre: 'Química' },
                                      { id: 'mat25', nombre: 'Biología' },
                                      { id: 'mat26', nombre: 'Geografía, Historia y Ciudadanía' },
                                      { id: 'mat27', nombre: 'Orientación y Convivencia' },
                                      { id: 'mat28', nombre: 'Participación de Grupos de Creación, Recreación y Producción' }
                                    ],
                                    '4 año': [
                                      { id: 'mat29', nombre: 'Castellano' },
                                      { id: 'mat30', nombre: 'Inglés y otras lenguas extranjeras' },
                                      { id: 'mat31', nombre: 'Matemáticas' },
                                      { id: 'mat32', nombre: 'Educación Física' },
                                      { id: 'mat33', nombre: 'Física' },
                                      { id: 'mat34', nombre: 'Química' },
                                      { id: 'mat35', nombre: 'Biología' },
                                      { id: 'mat36', nombre: 'Geografía, Historia y Ciudadanía' },
                                      { id: 'mat37', nombre: 'Formación para la Soberanía Nacional' },
                                      { id: 'mat38', nombre: 'Orientación y Convivencia' },
                                      { id: 'mat39', nombre: 'Participación de Grupos de Creación, Recreación y Producción' }
                                    ],
                                    '5 año': [
                                      { id: 'mat40', nombre: 'Castellano' },
                                      { id: 'mat41', nombre: 'Inglés y otras lenguas extranjeras' },
                                      { id: 'mat42', nombre: 'Matemáticas' },
                                      { id: 'mat43', nombre: 'Educación Física' },
                                      { id: 'mat44', nombre: 'Física' },
                                      { id: 'mat45', nombre: 'Química' },
                                      { id: 'mat46', nombre: 'Biología' },
                                      { id: 'mat47', nombre: 'Geografía, Historia y Ciudadanía' },
                                      { id: 'mat48', nombre: 'Formación para la Soberanía Nacional' },
                                      { id: 'mat49', nombre: 'Orientación y Convivencia' },
                                      { id: 'mat50', nombre: 'Participación de Grupos de Creación, Recreación y Producción' }
                                    ]
                                  };
                                  
                                  // Obtener las materias del año seleccionado
                                  const materiasDelAnio = materiasPorAnio[asignacionFormData.anio] || [];
                                  
                                  return materiasDelAnio.map((materia, index) => {
                                    const materiaId = materia.id;
                                    // Verificar si esta materia ya está seleccionada
                                    const materiaSeleccionada = asignacionFormData.materiasSeleccionadas?.find(m => m.materiaId === materiaId);
                                    
                                    return (
                                      <tr key={`materia-${index}`} className={index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'} style={{transition: 'all 0.2s'}}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                          <Link href={`/calificaciones?aulaId=${aula._id}&materiaId=${asignacion.materia.id}`}>
                                            {asignacion.materia.nombre}
                                          </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                          <select
                                            value={materiaSeleccionada?.profesorId || ''}
                                            onChange={(e) => {
                                              const profesorId = e.target.value;
                                              // Actualizar la lista de materias seleccionadas
                                              const materiasActualizadas = [...(asignacionFormData.materiasSeleccionadas || [])];
                                              
                                              // Buscar si ya existe esta materia en la lista
                                              const index = materiasActualizadas.findIndex(m => m.materiaId === materiaId);
                                              
                                              if (index !== -1) {
                                                // Actualizar el profesor para esta materia
                                                materiasActualizadas[index].profesorId = profesorId;
                                              } else {
                                                // Agregar nueva materia con su profesor
                                                materiasActualizadas.push({
                                                  materiaId,
                                                  profesorId,
                                                  nombre: materia.nombre
                                                });
                                              }
                                              
                                              setAsignacionFormData(prev => ({
                                                ...prev,
                                                materiasSeleccionadas: materiasActualizadas
                                              }));
                                            }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                          >
                                            <option value="">Seleccione un profesor</option>
                                            {profesores.map((profesor) => {
                                              const profesorId = profesor._id || profesor.id;
                                              return (
                                                <option key={`prof-${profesorId}`} value={profesorId}>
                                                  {profesor.nombre} {profesor.apellido || ''}
                                                </option>
                                              );
                                            })}
                                          </select>
                                        </td>

                                      </tr>
                                    );
                                  });
                                })()} 
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Contador de materias seleccionadas */}
                          <div className="mt-3 flex items-center">
                            <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1.5 rounded-full flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                              </svg>
                              {asignacionFormData.materiasSeleccionadas?.length || 0} materia(s) seleccionada(s)
                            </div>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Periodo Académico
                          </label>
                          
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                            <div className="flex flex-col sm:flex-row gap-4 mb-3">
                              {/* Opción 1: Entrada libre */}
                              <div 
                                className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${!asignacionFormData.usarPeriodoExistente 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-blue-300'}`}
                                onClick={() => setAsignacionFormData(prev => ({ ...prev, usarPeriodoExistente: false }))}
                              >
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${!asignacionFormData.usarPeriodoExistente ? 'border-blue-600' : 'border-gray-400'}`}>
                                    {!asignacionFormData.usarPeriodoExistente && (
                                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                    )}
                                  </div>
                                  <label htmlFor="periodoLibre" className="ml-2 block text-sm font-medium cursor-pointer">
                                    Entrada manual
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-7">Ingrese un nuevo periodo académico</p>
                              </div>
                              
                              {/* Opción 2: Seleccionar existente */}
                              <div 
                                className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all ${asignacionFormData.usarPeriodoExistente 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-200 hover:border-blue-300'}`}
                                onClick={() => setAsignacionFormData(prev => ({ ...prev, usarPeriodoExistente: true }))}
                              >
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${asignacionFormData.usarPeriodoExistente ? 'border-blue-600' : 'border-gray-400'}`}>
                                    {asignacionFormData.usarPeriodoExistente && (
                                      <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                    )}
                                  </div>
                                  <label htmlFor="periodoExistente" className="ml-2 block text-sm font-medium cursor-pointer">
                                    Seleccionar existente
                                  </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 ml-7">Use un periodo ya registrado en el sistema</p>
                              </div>
                            </div>
                            
                            {/* Campo de entrada según la opción seleccionada */}
                            <div className="mt-3">
                              {asignacionFormData.usarPeriodoExistente ? (
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <select
                                    name="periodo"
                                    value={asignacionFormData.periodo || ''}
                                    onChange={handleAsignacionFormChange}
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  >
                                    <option value="">Seleccione un periodo</option>
                                    {/* Obtener periodos únicos de las asignaciones existentes */}
                                    {[...new Set(asignaciones
                                      .filter(a => a.periodo && (typeof a.periodo === 'string' ? a.periodo.trim() !== '' : true))
                                      .map(a => a.periodo))]
                                      .sort()
                                      .map((periodo, index) => (
                                        <option key={`periodo-${index}`} value={typeof periodo === 'string' ? periodo : JSON.stringify(periodo)}>
                                          {typeof periodo === 'string' ? periodo : (periodo.nombre || 'Periodo sin nombre')}
                                        </option>
                                      ))}
                                  </select>
                                </div>
                              ) : (
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                  <input
                                    type="text"
                                    name="periodo"
                                    value={asignacionFormData.periodo || ''}
                                    onChange={handleAsignacionFormChange}
                                    placeholder="Ej: 2025-1, Primer Semestre 2025"
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alumnos
                          </label>
                          
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                            {/* Campo de búsqueda para filtrar alumnos */}
                            <div className="mb-3">
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Buscar por nombre o cédula..."
                                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors"
                                  value={searchAlumno}
                                  onChange={(e) => setSearchAlumno(e.target.value)}
                                />
                              </div>
                            </div>
                            
                            {/* Lista de alumnos disponibles */}
                            <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                              <div className="p-1 max-h-60 overflow-y-auto">
                                {alumnos
                                  .filter(alumno => 
                                    alumno.nombre.toLowerCase().includes(searchAlumno.toLowerCase()) ||
                                    (alumno.cedula && alumno.cedula.toLowerCase().includes(searchAlumno.toLowerCase()))
                                  )
                                  .map((alumno) => {
                                    // Verificar si el alumno ya está seleccionado
                                    const isSelected = asignacionFormData.alumnos.some(
                                      selectedId => selectedId === alumno._id || selectedId === alumno.id
                                    );
                                    
                                    return (
                                      <div 
                                        key={alumno._id || alumno.id} 
                                        className={`flex items-center p-2.5 hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : ''}`}
                                        onClick={() => {
                                          // Alternar selección del alumno
                                          const alumnoId = alumno._id || alumno.id;
                                          // Si ya está seleccionado, quitarlo
                                          if (isSelected) {
                                            const updatedAlumnos = asignacionFormData.alumnos.filter(id => id !== alumnoId);
                                            setAsignacionFormData({
                                              ...asignacionFormData,
                                              alumnos: updatedAlumnos
                                            });
                                          } else {
                                            // Si no está seleccionado, verificar el límite de 35 alumnos
                                            if (asignacionFormData.alumnos.length >= 35) {
                                              // Mostrar notificación de error
                                              setNotification({
                                                type: 'error',
                                                message: 'No se pueden agregar más de 35 alumnos por asignación.'
                                              });
                                              // Limpiar la notificación después de 3 segundos
                                              setTimeout(() => setNotification(null), 3000);
                                            } else {
                                              // Agregar el alumno a la lista
                                              setAsignacionFormData({
                                                ...asignacionFormData,
                                                alumnos: [...asignacionFormData.alumnos, alumnoId]
                                              });
                                            }
                                          }
                                        }}
                                      >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                                          {isSelected && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                            </svg>
                                          )}
                                        </div>
                                        <div className="ml-3">
                                          <p className="text-sm font-medium text-gray-900">
                                            <StudentNameById studentId={alumno._id || alumno.id} fallback={alumno} />
                                          </p>
                                          <p className="text-xs text-gray-500">{alumno.cedula || 'Sin cédula'}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                            
                            {/* Contador de alumnos seleccionados */}
                            <div className="mt-3 flex items-center">
                              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                                {asignacionFormData.alumnos.length} alumno(s) seleccionado(s)
                              </div>
                              {asignacionFormData.alumnos.length > 0 && (
                                <button 
                                  type="button" 
                                  onClick={() => setAsignacionFormData({...asignacionFormData, alumnos: []})}
                                  className="ml-2 text-xs text-gray-500 hover:text-red-500 transition-colors"
                                >
                                  Limpiar selección
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAsignacionForm(false);
                              setAsignacionFormData({
                                materiaId: '',
                                profesorId: '',
                                anio: '1 año',
                                seccion: 'A',
                                turno: 'Mañana',
                                periodo: '',
                                alumnos: [],
                                modoEdicion: false,
                                usarPeriodoExistente: false,
                                materiasSeleccionadas: []
                              });
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            {asignacionFormData.modoEdicion ? 'Actualizar' : 'Guardar'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                                    {/* Filtros de búsqueda avanzada */}
                  <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-xl shadow-md mb-6 border-t-4 border-blue-500 border-r border-b border-l border-blue-100">
                    <h4 className="text-md font-bold text-blue-700 mb-4 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                      </svg>
                      Filtros de búsqueda avanzada
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                        <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Filtrar por período
                        </label>
                        <div className="relative">
                          <select
                            id="searchPeriodo"
                            className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={searchPeriodo}
                            onChange={(e) => setSearchPeriodo(e.target.value)}
                          >
                            <option value="">Todos los períodos</option>
                            {[...new Set(asignaciones
                              .filter(a => a.periodo && (typeof a.periodo === 'string' ? a.periodo.trim() !== '' : true))
                              .map(a => a.periodo))]
                              .sort()
                              .map((periodo, index) => (
                                <option key={`periodo-${index}`} value={typeof periodo === 'string' ? periodo : JSON.stringify(periodo)}>
                                  {typeof periodo === 'string' ? periodo : (periodo.nombre || 'Periodo sin nombre')}
                                </option>
                              ))}
                          </select>
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                        <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Filtrar por año
                        </label>
                        <div className="relative">
                          <select
                            className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={searchAnio}
                            onChange={(e) => setSearchAnio(e.target.value)}
                          >
                            <option value="">Todos los años</option>
                            <option value="1 año">1 año</option>
                            <option value="2 año">2 año</option>
                            <option value="3 año">3 año</option>
                            <option value="4 año">4 año</option>
                            <option value="5 año">5 año</option>
                          </select>
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 hover:shadow-md transition-all duration-300">
                        <label className="block text-sm font-medium text-blue-700 mb-2 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Buscar por materia
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-blue-50 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            value={searchMateria}
                            onChange={(e) => setSearchMateria(e.target.value)}
                            placeholder="Escriba el nombre de la materia"
                          />
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end mt-5">
                      <button
                        onClick={() => {
                          setSearchPeriodo('');
                          setSearchAnio('');
                          setSearchMateria('');
                        }}
                        className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-300 text-sm font-medium flex items-center shadow-sm hover:shadow transform hover:-translate-y-1"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Limpiar filtros
                      </button>
                    </div>
                  </div>
                  
                  {/* Tabla de asignaciones */}
                  <div className="bg-white rounded-xl shadow-md border border-blue-100 mt-6 overflow-hidden">
                    <table className="w-full divide-y divide-blue-200 table-fixed">
                      <thead className="bg-gradient-to-r from-blue-600 to-blue-500">
                        <tr>
                          <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">📚</span>
                              Materia
                            </div>
                          </th>
                          <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">👨‍🏫</span>
                              Profesor
                            </div>
                          </th>
                          <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">🗓️</span>
                              Periodo
                            </div>
                          </th>
                          <th scope="col" className="w-1/12 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">📅</span>
                              Año
                            </div>
                          </th>
                          <th scope="col" className="w-1/12 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">👥</span>
                              Alumnos
                            </div>
                          </th>
                          <th scope="col" className="w-1/12 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">📝</span>
                              Actividades
                            </div>
                          </th>
                          <th scope="col" className="w-1/6 px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                            <div className="flex items-center">
                              <span className="bg-white text-blue-600 rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 shadow-sm">⚙️</span>
                              Acciones
                            </div>
                          </th>
                        </tr>
                      </thead>
                       <tbody className="bg-white divide-y divide-blue-200">
                        {Array.isArray(asignaciones) && asignaciones.length > 0
                          ? asignaciones
                            .filter(asignacion => {
                              // Filtrar por periodo si se ha seleccionado uno
                              if (searchPeriodo && 
                                  (typeof asignacion.periodo === 'string' ? 
                                    asignacion.periodo !== searchPeriodo : 
                                    (asignacion.periodo && asignacion.periodo.nombre ? 
                                      asignacion.periodo.nombre !== searchPeriodo : 
                                      true))) {
                                return false;
                              }
                              // Filtrar por año si se ha seleccionado uno
                              if (searchAnio && asignacion.anio !== searchAnio) {
                                return false;
                              }

                              // Si el usuario es docente, filtrar por su nombre y apellido
                              if (userType === 'docente' && userData) {
                                const profesorNombre = asignacion.profesorNombre || '';
                                const nombreCompleto = `${userData.nombre || ''} ${userData.apellido || ''}`;
                                
                                // Verificar si el nombre del profesor en la asignación coincide con el del usuario actual
                                if (!profesorNombre.toLowerCase().includes(nombreCompleto.toLowerCase())) {
                                  return false;
                                }
                              }
                              
                              return true;
                            })
                            .flatMap(asignacion => {
                              // Si la asignación tiene un array de materias, expandirlo para mostrar cada materia individualmente
                              if (asignacion.materias && Array.isArray(asignacion.materias) && asignacion.materias.length > 0) {
                                return asignacion.materias.map(materia => {
                                  // Asegurarse de que el ID de la asignación esté correctamente asignado
                                  const asignacionId = asignacion._id || asignacion.id;
                                  
                                  return {
                                    ...materia,
                                    id: materia.id || materia._id,
                                    materiaId: materia.materiaId || materia.id || materia._id,
                                    asignacionId: asignacionId, // Usar el ID verificado
                                    materiaNombre: materia.nombre || 'Sin nombre',
                                    materiaCodigo: materia.codigo || 'N/A',
                                    // Usar los datos de profesor de la asignación principal
                                    profesorId: asignacion.profesorId || '',
                                    profesorNombre: asignacion.profesorNombre || 'No asignado',
                                    // Usar los datos de periodo de la asignación principal
                                    periodo: asignacion.periodo || 'No especificado',
                                    periodoId: asignacion.periodoId || '',
                                    // Usar los datos de año, sección y turno de la asignación principal
                                    anio: asignacion.anio || '1 año',
                                    seccion: asignacion.seccion || 'A',
                                    turno: asignacion.turno || 'Mañana',
                                    // Usar los datos de alumnos de la asignación principal
                                    alumnos: asignacion.alumnos || [],
                                    alumnosInfo: asignacion.alumnosInfo || [],
                                    actividades: asignacion.actividades || [],
                                    // Guardar una referencia a la asignación completa para facilitar la eliminación
                                    asignacionCompleta: {
                                      _id: asignacionId,
                                      id: asignacionId
                                    }
                                  };
                                });
                              } else {
                                // Si no tiene array de materias, mantener la estructura original
                                return [{
                                  ...asignacion,
                                  id: asignacion.id || asignacion._id
                                }];
                              }
                            })
                            // Ahora filtramos por materia si se ha ingresado texto en el campo de búsqueda
                            .filter(materia => {
                              if (searchMateria && searchMateria.trim() !== '') {
                                const materiaNombre = materia.materiaNombre || '';
                                // Buscar coincidencias parciales en el nombre de la materia (insensible a mayúsculas/minúsculas)
                                return materiaNombre.toLowerCase().includes(searchMateria.toLowerCase());
                              }
                              return true;
                            })
                            .map((materia, index) => (
                              <tr key={`${materia.asignacionId || ''}-${materia.materiaId || ''}-${index}`} className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-150 transform hover:scale-[1.01]`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-8 w-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                      {materia.materiaNombre ? materia.materiaNombre.charAt(0).toUpperCase() : 'M'}
                                    </div>
                                    <div className="ml-3">
                                      <p className="text-sm font-medium text-gray-800">
                                        {materia.materiaNombre || 'N/A'}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <span className="text-blue-600 font-bold">P</span>
                                    </div>
                                    {editingAsignacionId === materia.asignacionId ? (
                                      <div className="ml-3 w-full">
                                        <div className="flex flex-col">
                                          <label htmlFor={`profesor-select-${materia.asignacionId}`} className="text-xs text-gray-500 mb-1">Seleccionar profesor:</label>
                                          <div className="flex items-center">
                                            <select 
                                              id={`profesor-select-${materia.id}`}
                                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              onChange={(e) => setEditingProfesorId(e.target.value)}
                                              value={editingProfesorId}
                                            >
                                              <option value="">Seleccionar profesor</option>
                                              {profesores.map(prof => (
                                                <option 
                                                  key={prof._id || prof.id} 
                                                  value={prof._id || prof.id}
                                                >
                                                  {prof.nombre} {prof.apellido || ''}
                                                </option>
                                              ))}
                                            </select>
                                            <div className="flex ml-2">
                                              <button
                                                onClick={() => handleChangeProfesor(materia.asignacionId, editingProfesorId, materia.materiaId)}
                                                className="p-1 bg-blue-100 rounded text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-all duration-300 mr-1"
                                                title="Guardar"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                              </button>
                                              <button
                                                onClick={() => {
                                                  setEditingAsignacionId(null);
                                                  setEditingProfesorId('');
                                                }}
                                                className="p-1 bg-red-100 rounded text-red-600 hover:bg-red-200 hover:text-red-800 transition-all duration-300"
                                                title="Cancelar"
                                              >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-800">
                                          {materia.profesorNombre || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                      {typeof materia.periodo === 'string' ? materia.periodo : (materia.periodo && materia.periodo.nombre ? materia.periodo.nombre : 'No especificado')}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-green-100 text-green-800">
                                      {materia.anio || '1 año'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-center">
                                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                      {materia.alumnosInfo ? materia.alumnosInfo.length : (materia.alumnos ? materia.alumnos.length : 0)}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  <div className="flex items-center justify-center">
                                    <span className="px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                                      {materia.actividades ? materia.actividades.length : 0}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <div className="flex space-x-2 justify-center">
                                    <button
                                      onClick={() => startEditingProfesor(materia)}
                                      className={`p-2 bg-blue-100 rounded-full text-blue-600 hover:bg-blue-200 hover:text-blue-800 transition-all duration-300 transform hover:scale-110 ${ocultarElementoCSS('editarAsignacion')}`}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => {
                                        // Redirigir a la página de calificaciones con el ID de la asignación y el ID de la materia
                                        const asignacionId = materia.asignacionId;
                                        const materiaId = materia.materiaId;
                                        window.location.href = `/calificaciones?id=${asignacionId}&materiaId=${materiaId}`;
                                      }}
                                      className="p-2 bg-green-100 rounded-full text-green-600 hover:bg-green-200 hover:text-green-800 transition-all duration-300 transform hover:scale-110"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                    </button>

                                    <button
                                      onClick={() => {
                                        // Obtener el ID de la asignación completa de la estructura de datos mejorada
                                        const asignacionId = materia.asignacionId || 
                                                           (materia.asignacionCompleta && (materia.asignacionCompleta._id || materia.asignacionCompleta.id)) || 
                                                           materia._id;
                                        
                                        if (!asignacionId) {
                                          console.error('No se pudo encontrar un ID de asignación válido');
                                          setNotification({ type: 'error', message: 'No se pudo encontrar un ID de asignación válido' });
                                          return;
                                        }
                                        
                                        console.log('Eliminando asignación completa con ID:', asignacionId);
                                        handleDeleteAsignacionItem(asignacionId);
                                      }}
                                      className={`p-2 ml-1 bg-red-500 rounded-full text-white hover:bg-red-600 hover:text-white transition-all duration-300 transform hover:scale-110 ${ocultarElementoCSS('eliminarAsignacion')}`}
                                      title="Eliminar asignación completa"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          : (
                            <tr>
                              <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                No hay asignaciones disponibles. {!Array.isArray(asignaciones) && 'Error al cargar las asignaciones.'}
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}


            </div>
          </div>
        )}
      </main>
      </div>

      {/* Modales */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="absolute top-0 right-0 pt-2 pr-2">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={() => setShowModal(false)}
                >
                  <span className="sr-only">Cerrar</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
      {/* Sistema de notificaciones personalizado */}
      {notification && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white flex items-center`}
        >
          <div className="mr-3">
            {notification.type === 'success' ? (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <div className="text-sm font-medium">{notification.message}</div>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-auto text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Modal de Gestión de Profesores */}
      {showGestionProfesoresModal && aulaGestionProfesores && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  Gestión de Profesores - {aulaGestionProfesores.nombre}
                </h3>
                <button 
                  onClick={() => setShowGestionProfesoresModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700">Año:</span>
                    <span className="ml-2 text-blue-600">{aulaGestionProfesores.anio}° Año</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Sección:</span>
                    <span className="ml-2 text-blue-600">{aulaGestionProfesores.seccion}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">Turno:</span>
                    <span className="ml-2 text-blue-600">{aulaGestionProfesores.turno}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Materias y Profesores Asignados</h4>
                
                <div className="grid gap-4">
                {materiasPorAnio[aulaGestionProfesores.anio + ' año']?.map((materia) => {
                  const asignacionExistente = asignacionesAula.find(a => {
                    // Buscar por diferentes estructuras de datos
                    const criterios = [
                      a.materiaId === materia.id,
                      a.materia?.id === materia.id,
                      a.materiaNombre === materia.nombre,
                      a.materia?.codigo === materia.codigo,
                      a.materia?.nombre === materia.nombre,
                      // También buscar en la estructura del aula directamente
                      (a.materia && a.materia.id === materia.id),
                      (a.materia && a.materia.codigo === materia.codigo)
                    ];
                    
                    return criterios.some(criterio => criterio);
                  });
                  
                  // Debug: mostrar información de la materia y asignación
                  console.log(`Materia ${materia.nombre} (${materia.codigo}):`, materia);
                  console.log(`Todas las asignaciones:`, asignacionesAula);
                  console.log(`Asignación encontrada para ${materia.nombre}:`, asignacionExistente);
                    
                    return (
                      <div key={materia.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                          {/* Información de la materia */}
                          <div className="lg:col-span-1">
                            <h5 className="font-medium text-gray-800 text-base mb-1">{materia.nombre}</h5>
                            <p className="text-sm text-gray-600">Código: {materia.codigo}</p>
                          </div>
                          
                          {/* Profesor actual */}
                          <div className="lg:col-span-1">
                            {asignacionExistente ? (
                              <div className="text-sm">
                                <span className="text-gray-600">Profesor actual:</span>
                                <p className="font-medium text-blue-600 mt-1">
                                  {asignacionExistente.profesorNombre || 
                                   asignacionExistente.profesor?.nombre + ' ' + (asignacionExistente.profesor?.apellido || '') ||
                                   'Sin asignar'}
                                </p>
                              </div>
                            ) : (
                              <div className="text-sm">
                                <span className="text-gray-500 italic">Sin profesor asignado</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Selector de profesor */}
                          <div className="lg:col-span-1 flex items-center gap-3">
                            <select
                              value={(() => {
                                // Buscar el ID del profesor en la asignación existente
                                if (asignacionExistente) {
                                  // Buscar por nombre y apellido del profesor
                                  const profesorNombre = asignacionExistente.profesorNombre || 
                                                        (asignacionExistente.profesor?.nombre + ' ' + (asignacionExistente.profesor?.apellido || '')).trim();
                                  
                                  const profesorEncontrado = profesoresDisponibles.find(p => {
                                    const nombreCompleto = `${p.nombre} ${p.apellido || ''}`.trim();
                                    return nombreCompleto === profesorNombre || 
                                           p.nombre === asignacionExistente.profesor?.nombre;
                                  });
                                  
                                  return profesorEncontrado?._id || profesorEncontrado?.id || '';
                                }
                                return '';
                              })()}
                              onChange={(e) => {
                                if (e.target.value) {
                                  cambiarProfesorMateria(materia.id, e.target.value, materia.nombre);
                                }
                              }}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              disabled={loading}
                            >
                              <option value="">
                                {asignacionExistente ? 'Cambiar profesor' : 'Seleccionar profesor'}
                              </option>
                              {profesoresDisponibles && profesoresDisponibles.length > 0 ? (
                                profesoresDisponibles.map((profesor) => (
                                  <option key={profesor._id || profesor.id} value={profesor._id || profesor.id}>
                                    {profesor.nombre} {profesor.apellido || ''}
                                  </option>
                                ))
                              ) : (
                                <option disabled>No hay profesores disponibles</option>
                              )}
                            </select>
                            
                            {asignacionExistente && (
                              <div className="text-green-600 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Total de materias: {materiasPorAnio[aulaGestionProfesores.anio + ' año']?.length || 0} | 
                    Profesores disponibles: {profesoresDisponibles?.length || 0} |
                    Asignaciones: {asignacionesAula?.length || 0}
                  </div>
                  {profesoresDisponibles?.length === 0 && (
                    <button
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await loadProfesoresDisponibles();
                          await cargarAsignacionesAula(aulaGestionProfesores._id);
                        } catch (error) {
                          console.error('Error al recargar:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                      disabled={loading}
                    >
                      {loading ? 'Cargando...' : 'Recargar'}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowGestionProfesoresModal(false)}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Representante */}
      {showRepresentanteModal && selectedEstudiante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Representante de {selectedEstudiante.nombre} {selectedEstudiante.apellido || ''}
                </h3>
                <button 
                  onClick={() => setShowRepresentanteModal(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg mb-4">
                {selectedEstudiante.representante && 
                 (selectedEstudiante.representante.nombre || 
                  selectedEstudiante.representante.apellido || 
                  selectedEstudiante.representante.cedula || 
                  selectedEstudiante.representante.telefono || 
                  selectedEstudiante.representante.correo || 
                  selectedEstudiante.representante.parentesco) ? (
                  <div>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-4 rounded-t-lg">
                      <h3 className="text-lg font-bold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Información del Representante
                      </h3>
                    </div>
                    
                    <div className="bg-white p-5 rounded-b-lg shadow-md border border-blue-100">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-700">Nombre completo</h4>
                            <p className="text-gray-800 font-medium text-lg">
                              {selectedEstudiante.representante.nombre || 'No especificado'} {selectedEstudiante.representante.apellido || ''}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-700">Cédula</h4>
                            <p className="text-gray-800 font-medium text-lg">
                              {selectedEstudiante.representante.cedula || 'No especificada'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-700">Teléfono</h4>
                            <p className="text-gray-800 font-medium text-lg">
                              {selectedEstudiante.representante.telefono || 'No especificado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-700">Correo electrónico</h4>
                            <p className="text-gray-800 font-medium text-lg">
                              {selectedEstudiante.representante.correo || 'No especificado'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-start md:col-span-2">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-blue-700">Parentesco</h4>
                            <p className="text-gray-800 font-medium text-lg">
                              {selectedEstudiante.representante.parentesco || 'No especificado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="bg-yellow-100 inline-block p-3 rounded-full mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No hay información del representante</h3>
                    <p className="text-sm text-gray-500">Este estudiante no tiene un representante asignado.</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowRepresentanteModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Razón de Ausencia/Tardanza */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Razón de {currentStatus === 'ausente' ? 'Ausencia' : 'Tardanza'}
              </h3>
              <button
                onClick={() => setShowReasonModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Por favor, especifica la razón:
              </label>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={`Ingresa la razón de la ${currentStatus === 'ausente' ? 'ausencia' : 'tardanza'}...`}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={4}
                autoFocus
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReason}
                disabled={!reasonText.trim()}
                className={`px-4 py-2 rounded-md transition-colors ${
                  reasonText.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Eliminar Estudiantes */}
      {showDeleteStudentsModal && aulaToDeleteStudents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Eliminar Estudiantes - {aulaToDeleteStudents.nombre}</h3>
              <p className="text-gray-600 mb-4">
                Seleccione los estudiantes que desea eliminar del aula. Esta acción no se puede deshacer.
              </p>
              
              {/* Botones de acción movidos hacia arriba */}
              <div className="flex justify-end gap-4 mb-6">
                <button
                  onClick={() => {
                    setShowDeleteStudentsModal(false);
                    setAulaToDeleteStudents(null);
                    setSelectedStudentsToDelete([]);
                    setEstudiantesAula([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteStudentsFromAula}
                  disabled={selectedStudentsToDelete.length === 0 || eliminandoEstudiantes}
                  className="px-6 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
                >
                  {eliminandoEstudiantes ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Eliminando...
                    </>
                  ) : (
                    `Eliminar ${selectedStudentsToDelete.length} estudiante(s)`
                  )}
                </button>
              </div>
              
              {estudiantesAula.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>No hay estudiantes en este aula</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto border rounded-lg">
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedStudentsToDelete.length} de {estudiantesAula.length} estudiantes seleccionados
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedStudentsToDelete(estudiantesAula.map(est => est.id))}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          Seleccionar Todos
                        </button>
                        <button
                          onClick={() => setSelectedStudentsToDelete([])}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                        >
                          Deseleccionar Todos
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="divide-y">
                    {estudiantesAula.map((estudiante) => (
                      <div key={estudiante.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedStudentsToDelete.includes(estudiante.id)}
                            onChange={(e) => handleStudentDeleteSelection(estudiante.id, e.target.checked)}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{estudiante.nombre}</div>
                            <div className="text-sm text-gray-500">Cédula: {estudiante.cedula}</div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inscripción de Alumno */}
      {showInscripcionModal && alumnoParaInscribir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4">Inscribir Alumno</h3>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Estudiante:</p>
                <p className="font-medium">{alumnoParaInscribir.nombre} {alumnoParaInscribir.apellido}</p>
                <p className="text-sm text-gray-500">
                  {alumnoParaInscribir.anio}° Año - Sección {alumnoParaInscribir.seccion}
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccionar Aula
                </label>
                {aulasDisponibles.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No hay aulas disponibles en el sistema
                  </p>
                ) : (
                  <select
                    value={aulaSeleccionada}
                    onChange={(e) => setAulaSeleccionada(e.target.value)}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">Seleccione un aula</option>
                    {aulasDisponibles.map((aula) => (
                      <option key={aula._id} value={aula._id}>
                        {aula.nombre} - {aula.turno} ({aula.anio}° Año - Sección {aula.seccion})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowInscripcionModal(false);
                    setAlumnoParaInscribir(null);
                    setAulaSeleccionada('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarInscripcion}
                  disabled={!aulaSeleccionada || loading || aulasDisponibles.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inscribiendo...' : 'Inscribir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

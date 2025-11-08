"use client";

import React, { useEffect, useState } from 'react';
// Evitar logs ruidosos: no usar handleApiResponse aquí

export default function StudentNameById({ studentId, fallback, showId = false, className = '' }) {
  const [data, setData] = useState(null);
  const [loadedId, setLoadedId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function load() {
      if (!studentId || loadedId === studentId) return;
      try {
        const res = await fetch(`/api/estudiantes/${studentId}`, { signal: controller.signal, cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) {
            setData(json?.data || null);
            setLoadedId(studentId);
          }
        } else {
          // Silenciar 404 y usar fallback si lo hay
          setLoadedId(studentId);
        }
      } catch (err) {
        if (isMounted) {
          // Silenciar errores de abort o red temporal
        }
      }
    }

    load();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [studentId, loadedId]);

  const s = data || fallback || {};
  const nombre = s.nombre || '';
  const apellido = s.apellido || '';
  const cedula = s.idU || s.cedula || '';

  if (!nombre && !apellido) {
    return <span className={className}>Sin nombre</span>;
  }

  return (
    <span className={className}>
      {apellido} {nombre}
      {showId && cedula ? ` (${cedula})` : ''}
    </span>
  );
}



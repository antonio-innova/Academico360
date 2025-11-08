// Estilos para el switch
export const toggleStyles = `
  .toggle-checkbox {
    position: absolute;
    top: 0;
    left: 0;
    height: 24px;
    width: 24px;
    z-index: 5;
    transition: transform 0.3s ease, border-color 0.3s ease;
  }
  .toggle-checkbox:checked {
    transform: translateX(100%);
    border-color: #10B981;
  }
  .toggle-checkbox:not(:checked) {
    transform: translateX(0);
    border-color: #EF4444;
  }
  .toggle-label {
    background-color: #e5e7eb;
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    transition: background-color 0.3s ease;
    position: relative;
  }
  .toggle-label:before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 9999px;
    transition: background-color 0.3s ease;
    background-color: #e5e7eb;
  }
  .toggle-checkbox:checked + .toggle-label:before {
    background-color: #10B981;
  }
  .toggle-checkbox:not(:checked) + .toggle-label:before {
    background-color: #EF4444;
  }
`;

// Función para añadir estilos al documento
export function applyToggleStyles() {
  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = toggleStyles;
    document.head.appendChild(styleElement);
    
    return styleElement;
  }
  return null;
}

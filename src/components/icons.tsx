import React from 'react';

// Si ya tienes definiciones para estos iconos en tu archivo, asegúrate de que estén exportadas así:
// export const NombreDelIcono = (props: React.SVGProps<SVGSVGElement>) => ( ... );

// Icono de Check (Círculo Verde)
export const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-8.81"></path>
    <path d="M22 4L12 14.01l-3-3"></path>
  </svg>
);

// Icono de X (Círculo Rojo)
export const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="15" y1="9" x2="9" y2="15"></line>
    <line x1="9" y1="9" x2="15" y2="15"></line>
  </svg>
);

// Icono de Impresora
export const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M6 18H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-2"></path>
    <path d="M18 14H6V6h12z"></path>
    <path d="M6 18v4a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-4"></path>
    <path d="M12 2v4"></path>
  </svg>
);

// Icono de Guardar (Disquete)
export const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
    <polyline points="17 21 17 13 7 13 7 21"></polyline>
    <polyline points="7 3 7 8 15 8"></polyline>
  </svg>
);

// Icono de Reintentar (Flechas circulares) - ¡La pieza que faltaba!
export const RetryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 2v6h6M2.5 12h6"/>
    <path d="M21.5 22v-6h-6M21.5 12h-6"/>
    <path d="M2.5 12a10 10 0 0 1 10-10v0a10 10 0 0 1 10 10v0a10 10 0 0 1-10 10v0a10 10 0 0 1-10-10v0"/>
  </svg>
);
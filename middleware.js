import { NextResponse } from 'next/server';

export function middleware(request) {
  // En Next.js, no podemos acceder directamente a localStorage o sessionStorage en el middleware
  // porque son APIs del navegador y el middleware se ejecuta en el servidor.
  // En su lugar, verificaremos la autenticación en el componente de la página.
  
  // Verificamos si hay una cookie de autenticación (que se establece en la API de autenticación)
  const authCookie = request.cookies.get('userId');
  const userTypeCookie = request.cookies.get('userType');
  
  // Rutas protegidas
  const protectedRoutes = ['/sidebar', '/alumno'];
  
  // Rutas específicas por tipo de usuario
  const routesByUserType = {
    'alumno': ['/alumno'],
    'docente': ['/sidebar'],
    'control': ['/sidebar']
  };
  
  // Verificar si la ruta actual está protegida
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );
  
  // Si la ruta está protegida pero no hay usuario autenticado, redirigir al login
  if (isProtectedRoute && !authCookie) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Si el usuario está autenticado pero intenta acceder a una ruta no permitida para su tipo
  if (authCookie && userTypeCookie && isProtectedRoute) {
    const userType = userTypeCookie.value;
    const allowedRoutes = routesByUserType[userType] || [];
    const isAllowedRoute = allowedRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    );
    
    if (!isAllowedRoute) {
      // Redirigir a la ruta correspondiente según el tipo de usuario
      if (userType === 'alumno') {
        return NextResponse.redirect(new URL('/alumno', request.url));
      } else {
        return NextResponse.redirect(new URL('/sidebar', request.url));
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/sidebar/:path*',
    '/alumno/:path*',
  ],
};

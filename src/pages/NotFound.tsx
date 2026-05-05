import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("Ruta no encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-2 text-xl font-semibold text-muted-foreground">Página no encontrada</p>
        <p className="mb-4 text-sm text-muted-foreground">ONUr no encontró la sección solicitada.</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Volver a ONUr
        </a>
      </div>
    </div>
  );
};

export default NotFound;

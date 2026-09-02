import { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (documento) => {
    try {
      console.log("1. Iniciando login con documento:", documento);

      const strapiUrl = `${import.meta.env.VITE_API_PROFILE}?filters[document_number][$eq]=${documento}&populate=*`;
      
      const strapiResponse = await fetch(strapiUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_TOKEN_STRAPI}`,
          'Content-Type': 'application/json'
        }
      });
      
      const strapiResult = await strapiResponse.json();

      if (!strapiResult.data || strapiResult.data.length === 0) {
        alert('Acceso denegado: No tienes un perfil autorizado.');
        return { success: false }; // CAMBIO AQUÍ
      }
      
      const alohaUrl = `${import.meta.env.VITE_API_EMPLEADO}?documento=${documento}`;
      const alohaResponse = await fetch(alohaUrl);
      const alohaResult = await alohaResponse.json();

      if (!alohaResult.ok || alohaResult.data.length === 0) {
        alert('Usuario no encontrado en el sistema base.');
        return { success: false }; // CAMBIO AQUÍ
      }

      const userData = alohaResult.data[0];

      if (userData.status.toLowerCase() !== 'activo') {
        alert('Acceso denegado: El colaborador se encuentra inactivo.');
        return { success: false }; // CAMBIO AQUÍ
      }

      const profileAttributes = strapiResult.data[0].attributes;
      let allowedModules = [];

      // Validamos usando el nombre exacto de tu campo en Strapi: sst_modules_webs
      if (profileAttributes.sst_modules_webs && profileAttributes.sst_modules_webs.data) {
        const modulosData = profileAttributes.sst_modules_webs.data;

        // Validamos si Strapi devuelve un arreglo (múltiples módulos) o un objeto (un solo módulo)
        if (Array.isArray(modulosData)) {
          allowedModules = modulosData.map(mod => mod.attributes.module_id);
        } else {
          allowedModules = [modulosData.attributes.module_id];
        }
      }
      
      console.log("6. Módulos permitidos encontrados:", allowedModules);
      
      setUser({
        ...userData,
        allowedModules
      });
      
      console.log("¡Login exitoso! Módulos:", allowedModules);
      
      // CAMBIO PRINCIPAL AQUÍ:
      return { success: true, allowedModules }; 

    } catch (error) {
      console.error("ERROR CRÍTICO EN EL LOGIN:", error);
      alert('Error de conexión.');
      return { success: false }; // CAMBIO AQUÍ
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
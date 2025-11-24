/**
 * config.js
 * 
 * Configuración de la aplicación usando variables de entorno.
 * 
 * Las variables de entorno se pueden definir de dos formas:
 * 1. En window.ENV (inyectado desde el servidor o definido en un script)
 * 2. Usando valores por defecto para desarrollo local
 * 
 * @module config
 */

/**
 * Obtiene una variable de entorno del objeto window.ENV o usa un valor por defecto.
 * 
 * @param {string} key - Nombre de la variable de entorno
 * @param {string} defaultValue - Valor por defecto si no se encuentra la variable
 * @returns {string} Valor de la variable de entorno o el valor por defecto
 */
function getEnvVar(key, defaultValue) {
    // Primero intenta obtener de window.ENV (inyectado desde el servidor)
    if (window.ENV && window.ENV[key]) {
        return window.ENV[key];
    }
    
    // Si no existe, usa el valor por defecto
    return defaultValue;
}

/**
 * Configuración de la aplicación
 */
const config = {
    /**
     * URL base de la API del backend.
     * Se puede configurar mediante la variable de entorno VITE_API_URL o API_URL
     */
    API_BASE_URL: getEnvVar('API_URL', 'http://localhost:5000/api'),
};

// Exportar configuración
export default config;


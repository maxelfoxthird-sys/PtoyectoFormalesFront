/**
 * app.js
 * 
 * Punto de entrada principal de la aplicación.
 * Inicializa todos los componentes y configura la aplicación.
 * 
 * @module app
 */

import Sidebar from './components/Sidebar.js';
import Tabs from './components/Tabs.js';
import MainView from './components/MainView.js';
import state from './state.js';

/**
 * Clase App
 * 
 * Gestiona el ciclo de vida de la aplicación y coordina los componentes.
 */
class App {
    /**
     * Crea una nueva instancia de la aplicación.
     */
    constructor() {
        this.sidebar = null;
        this.tabs = null;
        this.mainView = null;
    }

    /**
     * Inicializa la aplicación.
     * 
     * Crea instancias de todos los componentes y configura
     * los listeners necesarios.
     * 
     * @public
     */
    init() {
        try {
            // Verificar que el DOM esté listo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                this.start();
            }
        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
            this.showError('Error al inicializar la aplicación. Por favor, recarga la página.');
        }
    }

    /**
     * Inicia la aplicación después de que el DOM esté listo.
     * 
     * @private
     */
    start() {
        // Verificar conectividad con el backend (opcional)
        this.checkBackendConnection();

        // Inicializar componentes
        this.sidebar = new Sidebar();
        this.tabs = new Tabs();
        this.mainView = new MainView();

        // Configurar listeners globales
        this.setupGlobalListeners();

        console.log('✓ JWT Analyzer inicializado correctamente');
    }

    /**
     * Verifica la conexión con el backend.
     * 
     * @private
     */
    async checkBackendConnection() {
        try {
            const jwtService = (await import('./services/JwtService.js')).default;
            await jwtService.healthCheck();
            console.log('✓ Conexión con el backend establecida');
        } catch (error) {
            console.warn('⚠ No se pudo conectar con el backend:', error.message);
            console.warn('⚠ Algunas funcionalidades pueden no estar disponibles');
            
            // Mostrar advertencia al usuario (opcional)
            // this.showWarning('El backend no está disponible. Algunas funciones pueden no funcionar.');
        }
    }

    /**
     * Configura listeners globales de la aplicación.
     * 
     * @private
     */
    setupGlobalListeners() {
        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('Error global:', event.error);
            this.showError('Ha ocurrido un error inesperado. Por favor, recarga la página.');
        });

        // Manejar errores de promesas no capturadas
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Promesa rechazada no manejada:', event.reason);
            this.showError('Ha ocurrido un error al procesar una operación.');
        });

        // Listener para cambios en el estado de carga
        state.on('state:changed', (newState) => {
            if (newState.error) {
                console.error('Error en el estado:', newState.error);
            }
        });
    }

    /**
     * Muestra un mensaje de error al usuario.
     * 
     * @param {string} message - Mensaje de error
     * 
     * @private
     */
    showError(message) {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            contentArea.innerHTML = `
                <div class="alert alert-error">
                    <strong>Error:</strong> ${message}
                </div>
            `;
        }
    }

    /**
     * Muestra una advertencia al usuario.
     * 
     * @param {string} message - Mensaje de advertencia
     * 
     * @private
     */
    showWarning(message) {
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            const existingContent = contentArea.innerHTML;
            contentArea.innerHTML = `
                <div class="alert alert-warning">
                    <strong>Advertencia:</strong> ${message}
                </div>
                ${existingContent}
            `;
        }
    }
}

// Crear e inicializar la aplicación
const app = new App();
app.init();

// Exportar para uso en otros módulos si es necesario
export default app;



/**
 * Tabs.js
 * 
 * Componente de pestañas que permite cambiar entre diferentes vistas:
 * - Análisis
 * - Verificar JWT
 * - Crear JWT
 * 
 * @module components/Tabs
 */

import state from '../state.js';

/**
 * Clase Tabs
 * 
 * Gestiona la navegación por pestañas y actualiza el estado global.
 */
class Tabs {
    /**
     * Crea una nueva instancia del componente Tabs.
     */
    constructor() {
        this.container = document.getElementById('tabs');
        this.tabButtons = this.container.querySelectorAll('.tab-btn');

        this.init();
    }

    /**
     * Inicializa el componente y configura los event listeners.
     * 
     * @private
     */
    init() {
        // Event listeners para cada botón de pestaña
        this.tabButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const tabName = button.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Suscribirse a cambios en la pestaña activa
        state.on('tab:changed', () => this.updateActiveTab());
    }

    /**
     * Cambia a una pestaña específica.
     * 
     * @param {string} tabName - Nombre de la pestaña: 'analysis', 'verify', 'create'
     * 
     * @public
     */
    switchTab(tabName) {
        const validTabs = ['analysis', 'verify', 'create'];
        
        if (!validTabs.includes(tabName)) {
            console.warn(`Pestaña inválida: ${tabName}`);
            return;
        }

        state.setState({ activeTab: tabName }, 'tab:changed');
    }

    /**
     * Actualiza la apariencia visual de las pestañas según el estado.
     * 
     * @private
     */
    updateActiveTab() {
        const activeTab = state.get('activeTab');

        this.tabButtons.forEach((button) => {
            if (button.dataset.tab === activeTab) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    /**
     * Obtiene el nombre de la pestaña activa.
     * 
     * @returns {string} Nombre de la pestaña activa
     * 
     * @public
     */
    getActiveTab() {
        return state.get('activeTab');
    }
}

export default Tabs;



/**
 * state.js
 * 
 * Sistema de estado centralizado usando el patrón Pub/Sub.
 * Permite comunicación entre componentes sin acoplamiento directo.
 * 
 * @module state
 */

/**
 * Clase StateManager
 * 
 * Gestiona el estado global de la aplicación y notifica a los
 * suscriptores cuando el estado cambia.
 */
class StateManager {
    /**
     * Crea una nueva instancia del gestor de estado.
     */
    constructor() {
        this.state = {
            selectedJwt: null,      // JWT actualmente seleccionado
            activeTab: 'analysis',   // Pestaña activa: 'analysis', 'verify', 'create'
            jwtList: [],             // Lista de JWTs disponibles
            loading: false,          // Estado de carga
            error: null,             // Mensaje de error actual
        };

        this.subscribers = new Map(); // Map<event, Set<callback>>
    }

    /**
     * Obtiene el estado actual.
     * 
     * @returns {Object} Estado actual (copia)
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Obtiene un valor específico del estado.
     * 
     * @param {string} key - Clave del estado a obtener
     * @returns {*} Valor del estado
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Actualiza el estado y notifica a los suscriptores.
     * 
     * @param {Object} updates - Objeto con las propiedades a actualizar
     * @param {string} event - Nombre del evento a emitir (opcional)
     * 
     * @example
     * stateManager.setState({ selectedJwt: jwt }, 'jwt:selected');
     */
    setState(updates, event = null) {
        const previousState = { ...this.state };
        
        // Actualizar estado
        this.state = { ...this.state, ...updates };

        // Emitir evento específico si se proporciona
        if (event) {
            this.emit(event, this.state, previousState);
        }

        // Emitir evento genérico de cambio de estado
        this.emit('state:changed', this.state, previousState);
    }

    /**
     * Suscribe un callback a un evento.
     * 
     * @param {string} event - Nombre del evento
     * @param {Function} callback - Función a ejecutar cuando se emita el evento
     * @returns {Function} Función para cancelar la suscripción
     * 
     * @example
     * const unsubscribe = stateManager.on('jwt:selected', (newState) => {
     *   console.log('JWT seleccionado:', newState.selectedJwt);
     * });
     * 
     * // Más tarde...
     * unsubscribe();
     */
    on(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, new Set());
        }

        this.subscribers.get(event).add(callback);

        // Retornar función de desuscripción
        return () => {
            const callbacks = this.subscribers.get(event);
            if (callbacks) {
                callbacks.delete(callback);
            }
        };
    }

    /**
     * Emite un evento a todos los suscriptores.
     * 
     * @param {string} event - Nombre del evento
     * @param {...any} args - Argumentos a pasar a los callbacks
     * 
     * @private
     */
    emit(event, ...args) {
        const callbacks = this.subscribers.get(event);
        if (callbacks) {
            callbacks.forEach((callback) => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error en callback del evento "${event}":`, error);
                }
            });
        }
    }

    /**
     * Limpia todas las suscripciones.
     * Útil para limpieza cuando se destruye la aplicación.
     */
    clear() {
        this.subscribers.clear();
    }
}

// Exportar instancia singleton
export default new StateManager();



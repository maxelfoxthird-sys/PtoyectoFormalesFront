/**
 * Sidebar.js
 * 
 * Componente de la barra lateral que muestra la lista de JWTs
 * y permite agregar JWTs personalizados.
 * 
 * @module components/Sidebar
 */

import state from '../state.js';

/**
 * Clase Sidebar
 * 
 * Gestiona la renderización e interacción de la barra lateral.
 */
class Sidebar {
    /**
     * Crea una nueva instancia del componente Sidebar.
     */
    constructor() {
        this.container = document.getElementById('sidebar');
        this.jwtList = document.getElementById('jwt-list');
        this.customInput = document.getElementById('custom-jwt-input');
        this.addButton = document.getElementById('add-custom-jwt-btn');

        this.init();
    }

    /**
     * Inicializa el componente y configura los event listeners.
     * 
     * @private
     */
    init() {
        // Cargar lista de JWTs
        this.loadJwtList();

        // Event listeners
        this.addButton.addEventListener('click', () => this.handleAddCustomJwt());
        this.customInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddCustomJwt();
            }
        });

        // Suscribirse a cambios en la lista de JWTs
        state.on('jwtList:updated', () => this.render());
        
        // Suscribirse a cambios en el JWT seleccionado
        state.on('jwt:selected', () => this.updateActiveItem());
    }

    /**
     * Carga la lista de JWTs desde el servicio.
     * 
     * @private
     */
    async loadJwtList() {
        try {
            state.setState({ loading: true });
            
            // Importar dinámicamente para evitar dependencias circulares
            const jwtService = (await import('../services/JwtService.js')).default;
            const jwts = await jwtService.fetchJwts();
            
            state.setState({ 
                jwtList: jwts,
                loading: false 
            }, 'jwtList:updated');
        } catch (error) {
            console.error('Error al cargar lista de JWTs:', error);
            state.setState({ 
                loading: false,
                error: error.message 
            });
        }
    }

    /**
     * Renderiza la lista de JWTs en el DOM.
     * 
     * @private
     */
    render() {
        const jwtList = state.get('jwtList');
        const selectedJwt = state.get('selectedJwt');

        // Limpiar lista actual
        this.jwtList.innerHTML = '';

        if (jwtList.length === 0) {
            this.jwtList.innerHTML = `
                <li class="jwt-list-item" style="text-align: center; color: var(--color-text-light);">
                    No hay JWTs disponibles
                </li>
            `;
            return;
        }

        // Renderizar cada JWT
        jwtList.forEach((jwt) => {
            const item = this.createJwtListItem(jwt, jwt.id === selectedJwt?.id);
            this.jwtList.appendChild(item);
        });
    }

    /**
     * Crea un elemento de lista para un JWT.
     * 
     * @param {Object} jwt - Objeto JWT con id, token, name, createdAt, valido, secreto, tipo_error
     * @param {boolean} isActive - Si el item está activo
     * @returns {HTMLElement} Elemento li creado
     * 
     * @private
     */
    createJwtListItem(jwt, isActive) {
        const li = document.createElement('li');
        li.className = `jwt-list-item ${isActive ? 'active' : ''}`;
        li.dataset.jwtId = jwt.id;

        // Formatear fecha
        let formattedDate = '';
        try {
            const date = new Date(jwt.createdAt);
            if (!isNaN(date.getTime())) {
                formattedDate = date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                });
            } else {
                formattedDate = 'Fecha no disponible';
            }
        } catch (e) {
            formattedDate = 'Fecha no disponible';
        }

        // Preview del token (primeros 40 caracteres)
        const tokenPreview = jwt.token && jwt.token.length > 40 
            ? jwt.token.substring(0, 40) + '...' 
            : (jwt.token || 'Sin token');

        // Badge de estado (válido/inválido)
        let statusBadge = '';
        if (jwt.valido !== null && jwt.valido !== undefined) {
            if (jwt.valido === true) {
                statusBadge = '<span class="jwt-status-badge jwt-status-valid">✓ Válido</span>';
            } else {
                statusBadge = '<span class="jwt-status-badge jwt-status-invalid">✗ Inválido</span>';
            }
        }

        // Información adicional
        let additionalInfo = '';
        
        // Siempre mostrar el secreto si existe
        // El backend envía 'secreto', pero verificamos ambos nombres por compatibilidad
        const secreto = jwt.secreto || jwt.secret;
        
        if (secreto && secreto !== null && secreto !== undefined && secreto !== '' && secreto !== 'unknown') {
            additionalInfo += `<div class="jwt-list-item-info jwt-secret-info"><strong>Secreto:</strong> <span class="jwt-secret-value">${this.escapeHtml(String(secreto))}</span></div>`;
        } else {
            additionalInfo += `<div class="jwt-list-item-info jwt-secret-info"><strong>Secreto:</strong> <span class="jwt-secret-missing">No disponible</span></div>`;
        }
        
        if (jwt.tipo_error) {
            additionalInfo += `<div class="jwt-list-item-info jwt-list-item-error"><strong>Error:</strong> ${this.escapeHtml(jwt.tipo_error)}</div>`;
        }

        li.innerHTML = `
            <div class="jwt-list-item-header">
                <span class="jwt-list-item-title">${this.escapeHtml(jwt.name)}</span>
                ${statusBadge}
            </div>
            <div class="jwt-list-item-preview">${this.escapeHtml(tokenPreview)}</div>
            ${additionalInfo}
            <div class="jwt-list-item-footer">
                <span class="jwt-list-item-date">${formattedDate}</span>
            </div>
        `;

        // Event listener para selección
        li.addEventListener('click', () => this.handleJwtSelect(jwt));

        return li;
    }

    /**
     * Maneja la selección de un JWT.
     * 
     * @param {Object} jwt - JWT seleccionado
     * 
     * @private
     */
    handleJwtSelect(jwt) {
        state.setState({ selectedJwt: jwt }, 'jwt:selected');
    }

    /**
     * Actualiza el item activo en la lista.
     * 
     * @private
     */
    updateActiveItem() {
        const selectedJwt = state.get('selectedJwt');
        const items = this.jwtList.querySelectorAll('.jwt-list-item');

        items.forEach((item) => {
            const jwtId = item.dataset.jwtId;
            if (selectedJwt && jwtId === selectedJwt.id) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Maneja la adición de un JWT personalizado.
     * 
     * @private
     */
    handleAddCustomJwt() {
        const token = this.customInput.value.trim();

        if (!token) {
            alert('Por favor, ingresa un JWT válido');
            return;
        }

        // Validar formato básico de JWT (tres partes separadas por puntos)
        const parts = token.split('.');
        if (parts.length !== 3) {
            alert('El formato del JWT no es válido. Debe tener tres partes separadas por puntos.');
            return;
        }

        // Crear nuevo JWT
        const newJwt = {
            id: Date.now(), // ID temporal basado en timestamp
            token: token,
            name: `JWT Personalizado ${new Date().toLocaleTimeString()}`,
            createdAt: new Date().toISOString(),
        };

        // Agregar a la lista
        const currentList = state.get('jwtList');
        const updatedList = [newJwt, ...currentList];
        
        state.setState({ 
            jwtList: updatedList,
            selectedJwt: newJwt 
        }, 'jwtList:updated');

        // Limpiar input
        this.customInput.value = '';

        // Seleccionar el nuevo JWT
        state.emit('jwt:selected');
    }

    /**
     * Escapa HTML para prevenir XSS.
     * 
     * @param {string} text - Texto a escapar
     * @returns {string} Texto escapado
     * 
     * @private
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

export default Sidebar;



/**
 * MainView.js
 * 
 * Componente principal que renderiza el contenido dinámico
 * según la pestaña activa y el JWT seleccionado.
 * 
 * @module components/MainView
 */

import state from '../state.js';
import jwtService from '../services/JwtService.js';

/**
 * Clase MainView
 * 
 * Gestiona la renderización del contenido principal de la aplicación.
 */
class MainView {
    /**
     * Crea una nueva instancia del componente MainView.
     */
    constructor() {
        this.container = document.getElementById('content-area');
        this.currentAnalysis = null;
        this.lexicalResult = null;
        this.decoderResult = null;
        this.syntaxResult = null;

        this.init();
    }

    /**
     * Inicializa el componente y configura los listeners.
     * 
     * @private
     */
    init() {
        // Suscribirse a cambios en la pestaña activa
        state.on('tab:changed', () => this.render());
        
        // Suscribirse a cambios en el JWT seleccionado
        state.on('jwt:selected', () => this.render());
    }

    /**
     * Renderiza el contenido según el estado actual.
     * 
     * @private
     */
    render() {
        const activeTab = state.get('activeTab');
        const selectedJwt = state.get('selectedJwt');

        // Renderizar según la pestaña activa
        switch (activeTab) {
            case 'analysis':
                if (!selectedJwt) {
                    this.renderEmptyState();
                } else {
                    this.renderAnalysis(selectedJwt);
                }
                break;
            case 'verify':
                if (!selectedJwt) {
                    this.renderEmptyState();
                } else {
                    this.renderVerify(selectedJwt);
                }
                break;
            case 'create':
                this.renderCreate();
                break;
            default:
                this.renderEmptyState();
        }
    }

    /**
     * Renderiza el estado vacío cuando no hay JWT seleccionado.
     * 
     * @private
     */
    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state">
                <p>Selecciona un JWT de la lista o ingresa uno personalizado para comenzar</p>
            </div>
        `;
    }

    /**
     * Renderiza la vista de análisis de JWT.
     * 
     * Muestra el JWT seleccionado con un botón para procesar el análisis léxico.
     * 
     * @param {Object} jwt - JWT a analizar
     * 
     * @private
     */
    renderAnalysis(jwt) {
        this.container.innerHTML = this.buildAnalysisInitialHTML(jwt);
        this.setupAnalysisListeners(jwt);
    }

    /**
     * Construye el HTML inicial para la vista de análisis.
     * Muestra el JWT y un botón para procesar.
     * 
     * @param {Object} jwt - JWT a mostrar
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildAnalysisInitialHTML(jwt) {
        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Token JWT</h3>
                </div>
                <div class="card-body">
                    <div class="jwt-token-display">
                        <div class="jwt-token-value" id="jwt-token-value">
                            ${this.escapeHtml(jwt.token)}
                        </div>
                        <button class="btn btn-secondary" id="copy-jwt-btn">Copiar</button>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Análisis Léxico</h3>
                    <span class="step-status" id="lexical-status"></span>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" id="process-lexical-btn">Procesar</button>
                    <div class="step-result" id="lexical-result"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Decoder</h3>
                    <span class="step-status" id="decoder-status"></span>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" id="process-decoder-btn" disabled>Procesar</button>
                    <div class="step-result" id="decoder-result"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Análisis Sintáctico</h3>
                    <span class="step-status" id="syntax-status"></span>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" id="process-syntax-btn" disabled>Procesar</button>
                    <div class="step-result" id="syntax-result"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Análisis Semántico</h3>
                    <span class="step-status" id="semantic-status"></span>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" id="process-semantic-btn" disabled>Procesar</button>
                    <div class="step-result" id="semantic-result"></div>
                </div>
            </div>
        `;
    }

    /**
     * Configura los event listeners para la vista de análisis.
     * 
     * @param {Object} jwt - JWT a analizar
     * 
     * @private
     */
    setupAnalysisListeners(jwt) {
        const copyBtn = document.getElementById('copy-jwt-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(jwt.token).then(() => {
                    copyBtn.textContent = 'Copiado';
                    setTimeout(() => copyBtn.textContent = 'Copiar', 2000);
                });
            });
        }

        const processBtn = document.getElementById('process-lexical-btn');
        if (processBtn) {
            processBtn.addEventListener('click', () => {
                this.processLexicalAnalysis(jwt.token);
            });
        }

        const decoderBtn = document.getElementById('process-decoder-btn');
        if (decoderBtn) {
            decoderBtn.addEventListener('click', () => {
                this.processDecoderAnalysis();
            });
        }

        const syntaxBtn = document.getElementById('process-syntax-btn');
        if (syntaxBtn) {
            syntaxBtn.addEventListener('click', () => {
                this.processSyntaxAnalysis();
            });
        }

        const semanticBtn = document.getElementById('process-semantic-btn');
        if (semanticBtn) {
            semanticBtn.addEventListener('click', () => {
                this.processSemanticAnalysis();
            });
        }
    }

    /**
     * Procesa el análisis léxico del JWT.
     * 
     * @param {string} jwtToken - Token JWT a analizar
     * 
     * @private
     */
    async processLexicalAnalysis(jwtToken) {
        const processBtn = document.getElementById('process-lexical-btn');
        const statusDiv = document.getElementById('lexical-status');
        const resultDiv = document.getElementById('lexical-result');

        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';
        statusDiv.textContent = 'Procesando...';
        resultDiv.innerHTML = '';

        try {
            const result = await jwtService.analyzeLexical(jwtToken);
            
            if (result.valid) {
                this.lexicalResult = result;
                statusDiv.textContent = 'Completado';
                statusDiv.className = 'step-status status-success';
                resultDiv.innerHTML = this.buildLexicalResultHTML(result, true);
                
                // Habilitar botón del decoder
                const decoderBtn = document.getElementById('process-decoder-btn');
                if (decoderBtn) {
                    decoderBtn.disabled = false;
                }
            } else {
                statusDiv.textContent = 'Error';
                statusDiv.className = 'step-status status-error';
                resultDiv.innerHTML = this.buildLexicalResultHTML(result, false);
            }

            processBtn.style.display = 'none';

        } catch (error) {
            statusDiv.textContent = 'Error';
            statusDiv.className = 'step-status status-error';
            resultDiv.innerHTML = `<div class="alert alert-error">${this.escapeHtml(error.message)}</div>`;
            processBtn.disabled = false;
            processBtn.textContent = 'Procesar';
        }
    }

    /**
     * Construye el HTML para mostrar el resultado del análisis léxico.
     * 
     * @param {Object} result - Resultado del análisis léxico
     * @param {boolean} isValid - Si el JWT es válido
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildLexicalResultHTML(result, isValid) {
        if (isValid) {
            return `
                <div class="tokens-breakdown">
                    <div class="token-part">
                        <strong>Header</strong>
                        <div class="token-part-value">${this.escapeHtml(result.header)}</div>
                    </div>
                    <div class="token-part">
                        <strong>Payload</strong>
                        <div class="token-part-value">${this.escapeHtml(result.payload)}</div>
                    </div>
                    <div class="token-part">
                        <strong>Signature</strong>
                        <div class="token-part-value">${this.escapeHtml(result.signature)}</div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="alert alert-error">
                    ${this.escapeHtml(result.error || 'Formato inválido')}
                </div>
            `;
        }
    }

    /**
     * Procesa la decodificación del JWT usando el resultado del análisis léxico.
     * 
     * @private
     */
    async processDecoderAnalysis() {
        if (!this.lexicalResult || !this.lexicalResult.valid) {
            return;
        }

        const processBtn = document.getElementById('process-decoder-btn');
        const statusDiv = document.getElementById('decoder-status');
        const resultDiv = document.getElementById('decoder-result');

        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';
        statusDiv.textContent = 'Procesando...';
        resultDiv.innerHTML = '';

        try {
            const result = await jwtService.decodeJwt(this.lexicalResult);
            this.decoderResult = result;
            
            statusDiv.textContent = 'Completado';
            statusDiv.className = 'step-status status-success';
            resultDiv.innerHTML = this.buildDecoderResultHTML(result);
            processBtn.style.display = 'none';

            // Habilitar botón del análisis sintáctico
            const syntaxBtn = document.getElementById('process-syntax-btn');
            if (syntaxBtn) {
                syntaxBtn.disabled = false;
            }

        } catch (error) {
            statusDiv.textContent = 'Error';
            statusDiv.className = 'step-status status-error';
            resultDiv.innerHTML = `<div class="alert alert-error">${this.escapeHtml(error.message)}</div>`;
            processBtn.disabled = false;
            processBtn.textContent = 'Procesar';
        }
    }

    /**
     * Construye el HTML para mostrar el resultado de la decodificación.
     * 
     * @param {Object} result - Resultado de la decodificación
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildDecoderResultHTML(result) {
        // result es un array [header_json_string, payload_json_string]
        const headerJson = Array.isArray(result) && result[0] ? result[0] : '';
        const payloadJson = Array.isArray(result) && result[1] ? result[1] : '';

        return `
            <div class="tokens-breakdown">
                <div class="token-part">
                    <strong>Header (JSON)</strong>
                    <div class="json-viewer">
                        <pre>${this.escapeHtml(headerJson)}</pre>
                    </div>
                </div>
                <div class="token-part">
                    <strong>Payload (JSON)</strong>
                    <div class="json-viewer">
                        <pre>${this.escapeHtml(payloadJson)}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Procesa el análisis sintáctico del JWT usando el resultado del decoder.
     * 
     * @private
     */
    async processSyntaxAnalysis() {
        if (!this.decoderResult || !Array.isArray(this.decoderResult)) {
            return;
        }

        const processBtn = document.getElementById('process-syntax-btn');
        const statusDiv = document.getElementById('syntax-status');
        const resultDiv = document.getElementById('syntax-result');

        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';
        statusDiv.textContent = 'Procesando...';
        resultDiv.innerHTML = '';

        try {
            const result = await jwtService.analyzeSyntax(this.decoderResult);
            this.syntaxResult = result;
            
            if (result.valid) {
                statusDiv.textContent = 'Completado';
                statusDiv.className = 'step-status status-success';
                
                // Habilitar botón del análisis semántico solo si es válido
                const semanticBtn = document.getElementById('process-semantic-btn');
                if (semanticBtn) {
                    semanticBtn.disabled = false;
                }
            } else {
                statusDiv.textContent = 'Error';
                statusDiv.className = 'step-status status-error';
            }
            
            resultDiv.innerHTML = this.buildSyntaxResultHTML(result);
            processBtn.style.display = 'none';

        } catch (error) {
            statusDiv.textContent = 'Error';
            statusDiv.className = 'step-status status-error';
            resultDiv.innerHTML = `<div class="alert alert-error">${this.escapeHtml(error.message)}</div>`;
            processBtn.disabled = false;
            processBtn.textContent = 'Procesar';
        }
    }

    /**
     * Construye el HTML para mostrar el resultado del análisis sintáctico.
     * 
     * @param {Object} result - Resultado del análisis sintáctico
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildSyntaxResultHTML(result) {
        const isValid = result.valid === true;
        const errors = result.errors || [];
        const header = result.header || {};
        const payload = result.payload || {};

        let errorsHTML = '';
        if (errors.length > 0) {
            errorsHTML = `
                <div class="alert alert-error">
                    <strong>Errores encontrados:</strong>
                    <ul style="margin: var(--spacing-sm) 0 0 0; padding-left: var(--spacing-lg);">
                        ${errors.map(error => `<li>${this.escapeHtml(error)}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        return `
            ${errorsHTML}
            <div class="tokens-breakdown">
                <div class="token-part">
                    <strong>Header</strong>
                    <div class="json-viewer">
                        <pre>${this.formatJSON(header)}</pre>
                    </div>
                </div>
                <div class="token-part">
                    <strong>Payload</strong>
                    <div class="json-viewer">
                        <pre>${this.formatJSON(payload)}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Procesa el análisis semántico del JWT usando el resultado del análisis sintáctico.
     * 
     * @private
     */
    async processSemanticAnalysis() {
        if (!this.syntaxResult || !this.syntaxResult.valid) {
            return;
        }

        const processBtn = document.getElementById('process-semantic-btn');
        const statusDiv = document.getElementById('semantic-status');
        const resultDiv = document.getElementById('semantic-result');

        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';
        statusDiv.textContent = 'Procesando...';
        resultDiv.innerHTML = '';

        try {
            const result = await jwtService.analyzeSemantic(this.syntaxResult);
            
            if (result.valid) {
                statusDiv.textContent = 'Completado';
                statusDiv.className = 'step-status status-success';
            } else {
                statusDiv.textContent = 'Error';
                statusDiv.className = 'step-status status-error';
            }
            
            resultDiv.innerHTML = this.buildSemanticResultHTML(result);
            processBtn.style.display = 'none';

        } catch (error) {
            statusDiv.textContent = 'Error';
            statusDiv.className = 'step-status status-error';
            resultDiv.innerHTML = `<div class="alert alert-error">${this.escapeHtml(error.message)}</div>`;
            processBtn.disabled = false;
            processBtn.textContent = 'Procesar';
        }
    }

    /**
     * Construye el HTML para mostrar el resultado del análisis semántico.
     * 
     * @param {Object} result - Resultado del análisis semántico
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildSemanticResultHTML(result) {
        const isValid = result.valid === true;
        const header = result.header || {};
        const payload = result.payload || {};

        let errorHTML = '';
        if (!isValid && result.error) {
            errorHTML = `
                <div class="alert alert-error">
                    <strong>Error:</strong> ${this.escapeHtml(result.error)}
                    ${result.error_type ? `<br><small>Tipo: ${this.escapeHtml(result.error_type)}</small>` : ''}
                </div>
            `;
        }

        return `
            ${errorHTML}
            <div class="tokens-breakdown">
                <div class="token-part">
                    <strong>Header</strong>
                    <div class="json-viewer">
                        <pre>${this.formatJSON(header)}</pre>
                    </div>
                </div>
                <div class="token-part">
                    <strong>Payload</strong>
                    <div class="json-viewer">
                        <pre>${this.formatJSON(payload)}</pre>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Construye el HTML para la vista de análisis.
     * 
     * @param {Object} analysis - Resultado del análisis
     * @param {Object} jwt - JWT original
     * @returns {string} HTML generado
     * 
     * @private
     */
    buildAnalysisHTML(analysis, jwt) {
        const { decoded, semantic } = analysis;

        let semanticHTML = '';
        if (semantic) {
            const isValid = semantic.valid !== false;
            semanticHTML = `
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Análisis Semántico</h3>
                        <span class="badge ${isValid ? 'badge-success' : 'badge-error'}">
                            ${isValid ? 'Válido' : 'Inválido'}
                        </span>
                    </div>
                    <div class="card-body">
                        ${semantic.valid === false 
                            ? `<div class="alert alert-error">${this.escapeHtml(semantic.error || 'Error en análisis semántico')}</div>`
                            : '<p>El JWT cumple con todas las validaciones semánticas.</p>'
                        }
                    </div>
                </div>
            `;
        }

        return `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Token JWT</h3>
                </div>
                <div class="card-body">
                    <div class="json-viewer">
                        <pre>${this.escapeHtml(jwt.token)}</pre>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Header (Decodificado)</h3>
                </div>
                <div class="card-body">
                    <div class="json-viewer">
                        <pre>${this.formatJSON(decoded.header)}</pre>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Payload (Decodificado)</h3>
                </div>
                <div class="card-body">
                    <div class="json-viewer">
                        <pre>${this.formatJSON(decoded.payload)}</pre>
                    </div>
                </div>
            </div>

            ${semanticHTML}
        `;
    }

    /**
     * Renderiza la vista de verificación de JWT.
     * 
     * @param {Object} jwt - JWT a verificar
     * 
     * @private
     */
    renderVerify(jwt) {
        this.container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Verificar Firma Criptográfica</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label" for="verify-secret">Clave Secreta</label>
                        <input 
                            type="text" 
                            id="verify-secret" 
                            class="form-input" 
                            placeholder="Ingresa la clave secreta para verificar la firma"
                            value="secret"
                        >
                    </div>
                    <button id="verify-btn" class="btn btn-primary">Verificar JWT</button>
                    <div id="verify-result" style="margin-top: 1.5rem;"></div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Token JWT</h3>
                </div>
                <div class="card-body">
                    <div class="json-viewer">
                        <pre>${this.escapeHtml(jwt.token)}</pre>
                    </div>
                </div>
            </div>
        `;

        // Event listener para el botón de verificación
        const verifyBtn = document.getElementById('verify-btn');
        const secretInput = document.getElementById('verify-secret');
        const resultDiv = document.getElementById('verify-result');

        verifyBtn.addEventListener('click', async () => {
            const secret = secretInput.value.trim();

            if (!secret) {
                alert('Por favor, ingresa una clave secreta');
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verificando...';

            try {
                const result = await jwtService.verifyJwt(jwt.token, secret);

                // Construir el JSON de respuesta completo
                const responseJson = result.rawResponse || {
                    success: result.valid !== undefined,
                    valid: result.valid,
                    algorithm: result.algorithm,
                    header: result.header,
                    payload: result.payload,
                    error: result.error,
                };

                if (result.valid) {
                    resultDiv.innerHTML = `
                        <div class="alert alert-success">
                            <strong>✓ JWT Válido</strong>
                            <p>La firma criptográfica es válida.</p>
                            <p><strong>Algoritmo:</strong> ${this.escapeHtml(result.algorithm)}</p>
                        </div>
                        <div class="card" style="margin-top: 1rem;">
                            <div class="card-header">
                                <h4 class="card-title">Respuesta Completa del Servicio</h4>
                            </div>
                            <div class="card-body">
                                <div class="json-viewer">
                                    <pre>${this.formatJSON(responseJson)}</pre>
                                </div>
                            </div>
                        </div>
                        <div class="card" style="margin-top: 1rem;">
                            <div class="card-header">
                                <h4 class="card-title">Payload Verificado</h4>
                            </div>
                            <div class="card-body">
                                <div class="json-viewer">
                                    <pre>${this.formatJSON(result.payload)}</pre>
                                </div>
                            </div>
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="alert alert-error">
                            <strong>✗ JWT Inválido</strong>
                            <p>${this.escapeHtml(result.error || 'La firma criptográfica no es válida')}</p>
                            ${result.algorithm ? `<p><strong>Algoritmo detectado:</strong> ${this.escapeHtml(result.algorithm)}</p>` : ''}
                        </div>
                        <div class="card" style="margin-top: 1rem;">
                            <div class="card-header">
                                <h4 class="card-title">Respuesta Completa del Servicio</h4>
                            </div>
                            <div class="card-body">
                                <div class="json-viewer">
                                    <pre>${this.formatJSON(responseJson)}</pre>
                                </div>
                            </div>
                        </div>
                    `;
                }
            } catch (error) {
                resultDiv.innerHTML = `
                    <div class="alert alert-error">
                        <strong>Error:</strong> ${this.escapeHtml(error.message)}
                    </div>
                `;
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verificar JWT';
            }
        });
    }

    /**
     * Renderiza la vista de creación de JWT.
     * 
     * @private
     */
    renderCreate() {
        this.container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Crear Nuevo JWT</h3>
                </div>
                <div class="card-body">
                    <div class="form-group">
                        <label class="form-label" for="create-header">Header (JSON)</label>
                        <textarea 
                            id="create-header" 
                            class="form-textarea code" 
                            placeholder='{"alg": "HS256", "typ": "JWT"}'
                        >{"alg": "HS256", "typ": "JWT"}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="create-payload">Payload (JSON)</label>
                        <textarea 
                            id="create-payload" 
                            class="form-textarea code" 
                            placeholder='{"sub": "1234567890", "name": "John Doe", "iat": 1516239022}'
                        >{"sub": "1234567890", "name": "John Doe", "iat": 1516239022}</textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="create-secret">Clave Secreta</label>
                        <input 
                            type="text" 
                            id="create-secret" 
                            class="form-input" 
                            placeholder="secret"
                            value="secret"
                        >
                    </div>

                    <button id="create-btn" class="btn btn-success">Crear JWT</button>
                    <div id="create-result" style="margin-top: 1.5rem;"></div>
                </div>
            </div>
        `;

        // Event listener para el botón de creación
        const createBtn = document.getElementById('create-btn');
        const headerTextarea = document.getElementById('create-header');
        const payloadTextarea = document.getElementById('create-payload');
        const secretInput = document.getElementById('create-secret');
        const resultDiv = document.getElementById('create-result');

        createBtn.addEventListener('click', async () => {
            try {
                // Validar y parsear JSON
                const header = JSON.parse(headerTextarea.value.trim());
                const payload = JSON.parse(payloadTextarea.value.trim());
                const secret = secretInput.value.trim() || 'secret';

                createBtn.disabled = true;
                createBtn.textContent = 'Creando...';

                const token = await jwtService.createJwt(header, payload, secret);

                resultDiv.innerHTML = `
                    <div class="alert alert-success">
                        <strong>✓ JWT Creado Exitosamente</strong>
                    </div>
                    <div class="card" style="margin-top: 1rem;">
                        <div class="card-header">
                            <h4 class="card-title">Token Generado</h4>
                        </div>
                        <div class="card-body">
                            <div class="json-viewer">
                                <pre>${this.escapeHtml(token)}</pre>
                            </div>
                            <button id="copy-token-btn" class="btn btn-secondary" style="margin-top: 1rem;">
                                Copiar Token
                            </button>
                        </div>
                    </div>
                `;

                // Event listener para copiar token
                document.getElementById('copy-token-btn').addEventListener('click', () => {
                    navigator.clipboard.writeText(token).then(() => {
                        alert('Token copiado al portapapeles');
                    }).catch(() => {
                        alert('Error al copiar el token');
                    });
                });

            } catch (error) {
                if (error instanceof SyntaxError) {
                    resultDiv.innerHTML = `
                        <div class="alert alert-error">
                            <strong>Error de JSON:</strong> ${this.escapeHtml(error.message)}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `
                        <div class="alert alert-error">
                            <strong>Error:</strong> ${this.escapeHtml(error.message)}
                        </div>
                    `;
                }
            } finally {
                createBtn.disabled = false;
                createBtn.textContent = 'Crear JWT';
            }
        });
    }

    /**
     * Formatea un objeto JSON para visualización.
     * 
     * @param {Object} obj - Objeto a formatear
     * @returns {string} JSON formateado
     * 
     * @private
     */
    formatJSON(obj) {
        return JSON.stringify(obj, null, 2);
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

export default MainView;


/**
 * JwtService.js
 * 
 * Servicio para interactuar con la API del backend.
 * Maneja todas las operaciones relacionadas con JWTs:
 * - Obtener lista de JWTs
 * - Análisis de JWT
 * - Verificación de JWT
 * - Creación de JWT
 * 
 * @module services/JwtService
 */

import config from '../config.js';

/**
 * URL base de la API del backend.
 * Se obtiene de la configuración (variables de entorno).
 * 
 * @constant {string}
 */
const API_BASE_URL = config.API_BASE_URL;

/**
 * Clase JwtService
 * 
 * Proporciona métodos para interactuar con los endpoints de la API.
 * Todos los métodos devuelven Promesas para manejo asíncrono.
 */
class JwtService {
    /**
     * Realiza una petición HTTP al backend.
     * 
     * @param {string} endpoint - Ruta del endpoint (sin /api)
     * @param {Object} options - Opciones de fetch (method, body, etc.)
     * @returns {Promise<Object>} Respuesta JSON del servidor
     * @throws {Error} Si la petición falla
     * 
     * @private
     */
    async _fetch(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const config = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
            }
            throw error;
        }
    }

    /**
     * Obtiene la lista de JWTs guardados desde la base de datos.
     * 
     * @returns {Promise<Array<Object>>} Lista de objetos JWT con estructura:
     *   - id: Identificador único
     *   - token: Token JWT completo
     *   - name: Nombre descriptivo
     *   - createdAt: Fecha de creación
     *   - valido: Boolean indicando si el JWT es válido
     *   - tipo_error: Tipo de error si el JWT es inválido
     * 
     * @example
     * const jwts = await jwtService.fetchJwts();
     * console.log(jwts); // [{ id: '...', token: '...', name: '...', ... }]
     */
    async fetchJwts() {
        try {
            const response = await this._fetch('/jwts', { method: 'GET' });
            
            if (!response.success) {
                throw new Error(response.error || 'Error al obtener la lista de JWTs');
            }
            
            return response.jwts || [];
        } catch (error) {
            throw new Error(`Error al obtener JWTs: ${error.message}`);
        }
    }

    /**
     * Realiza el análisis léxico de un JWT (Fase 1).
     * 
     * Valida el formato del JWT y separa los componentes (header, payload, signature).
     * 
     * @param {string} jwt - Token JWT completo
     * @returns {Promise<Object>} Resultado del análisis léxico con:
     *   - valid: Boolean indicando si el formato es válido
     *   - tokens: Array con los tres componentes del JWT
     *   - header: String del header codificado
     *   - payload: String del payload codificado
     *   - signature: String de la firma
     *   - error: Mensaje de error si el formato es inválido
     * 
     * @example
     * const result = await jwtService.analyzeLexical(token);
     * console.log(result.valid); // true o false
     */
    async analyzeLexical(jwt) {
        try {
            const response = await this._fetch(`/analyze/lexical/${encodeURIComponent(jwt)}`, {
                method: 'GET',
            });

            if (!response.success) {
                throw new Error(response.error || 'Error en análisis léxico');
            }

            return response.result;
        } catch (error) {
            throw new Error(`Error al analizar JWT léxicamente: ${error.message}`);
        }
    }

    /**
     * Decodifica los componentes del JWT usando el resultado del análisis léxico.
     * 
     * @param {Object} lexicalResult - Resultado del análisis léxico con header, payload, signature, tokens, valid
     * @returns {Promise<Object>} Resultado de la decodificación con:
     *   - result: Array con [header_json_string, payload_json_string]
     * 
     * @example
     * const lexicalResult = await jwtService.analyzeLexical(token);
     * const decoded = await jwtService.decodeJwt(lexicalResult);
     * console.log(decoded.result[0]); // JSON string del header
     */
    async decodeJwt(lexicalResult) {
        try {
            const response = await this._fetch('/analyze/decoder', {
                method: 'POST',
                body: JSON.stringify(lexicalResult),
            });

            if (!response.success) {
                throw new Error(response.error || 'Error en decodificación');
            }

            return response.result;
        } catch (error) {
            throw new Error(`Error al decodificar JWT: ${error.message}`);
        }
    }

    /**
     * Realiza el análisis sintáctico del JWT usando el resultado del decoder.
     * 
     * @param {Array} decoderResult - Resultado del decoder [header_json_string, payload_json_string]
     * @returns {Promise<Object>} Resultado del análisis sintáctico con:
     *   - valid: Boolean indicando si es válido
     *   - errors: Array de errores si existen
     *   - header: Objeto header parseado
     *   - payload: Objeto payload parseado
     * 
     * @example
     * const decoderResult = await jwtService.decodeJwt(lexicalResult);
     * const syntax = await jwtService.analyzeSyntax(decoderResult);
     * console.log(syntax.valid); // true o false
     */
    async analyzeSyntax(decoderResult) {
        try {
            const response = await this._fetch('/analyze/syntax', {
                method: 'POST',
                body: JSON.stringify({
                    result: decoderResult
                }),
            });

            if (!response.success) {
                throw new Error(response.error || 'Error en análisis sintáctico');
            }

            return response.result;
        } catch (error) {
            throw new Error(`Error al analizar sintácticamente: ${error.message}`);
        }
    }

    /**
     * Realiza el análisis semántico del JWT usando el resultado del análisis sintáctico.
     * 
     * @param {Object} syntaxResult - Resultado del análisis sintáctico con header y payload como objetos
     * @returns {Promise<Object>} Resultado del análisis semántico con:
     *   - valid: Boolean indicando si es válido
     *   - header: Objeto header validado
     *   - payload: Objeto payload validado
     *   - error: Mensaje de error si no es válido
     *   - error_type: Tipo de error si existe
     * 
     * @example
     * const syntaxResult = await jwtService.analyzeSyntax(decoderResult);
     * const semantic = await jwtService.analyzeSemantic(syntaxResult);
     * console.log(semantic.valid); // true o false
     */
    async analyzeSemantic(syntaxResult) {
        try {
            const response = await this._fetch('/analyze/semantic', {
                method: 'POST',
                body: JSON.stringify({
                    header: syntaxResult.header,
                    payload: syntaxResult.payload
                }),
            });

            if (!response.success) {
                return {
                    valid: false,
                    error: response.error || 'Error en análisis semántico',
                    error_type: response.error_type || 'SemanticError'
                };
            }

            return response.result;
        } catch (error) {
            throw new Error(`Error al analizar semánticamente: ${error.message}`);
        }
    }

    /**
     * Realiza el análisis completo de un JWT.
     * 
     * Incluye análisis léxico, decodificación y análisis semántico.
     * 
     * @param {string} jwt - Token JWT completo
     * @returns {Promise<Object>} Resultado del análisis con:
     *   - lexical: Resultado del análisis léxico
     *   - decoded: Header y payload decodificados
     *   - semantic: Resultado del análisis semántico
     * 
     * @example
     * const analysis = await jwtService.analyzeJwt(token);
     * console.log(analysis.decoded.header); // { alg: 'HS256', typ: 'JWT' }
     */
    async analyzeJwt(jwt) {
        try {
            // 1. Análisis léxico
            const lexicalResponse = await this._fetch(`/analyze/lexical/${encodeURIComponent(jwt)}`, {
                method: 'GET',
            });

            if (!lexicalResponse.success) {
                throw new Error(lexicalResponse.error || 'Error en análisis léxico');
            }

            const lexicalResult = lexicalResponse.result;

            // 2. Decodificación
            const decoderResponse = await this._fetch('/analyze/decoder', {
                method: 'POST',
                body: JSON.stringify({
                    header: lexicalResult.header,
                    payload: lexicalResult.payload,
                }),
            });

            if (!decoderResponse.success) {
                throw new Error(decoderResponse.error || 'Error en decodificación');
            }

            const decodedResult = decoderResponse.result;

            // 3. Análisis semántico
            let semanticResult = null;
            try {
                const semanticResponse = await this._fetch('/analyze/semantic', {
                    method: 'POST',
                    body: JSON.stringify({
                        header: decodedResult.header,
                        payload: decodedResult.payload,
                    }),
                });

                semanticResult = semanticResponse.success ? semanticResponse.result : null;
            } catch (error) {
                // El análisis semántico puede fallar, pero no es crítico
                console.warn('Análisis semántico falló:', error);
            }

            return {
                lexical: lexicalResult,
                decoded: decodedResult,
                semantic: semanticResult,
            };
        } catch (error) {
            throw new Error(`Error al analizar JWT: ${error.message}`);
        }
    }

    /**
     * Verifica la firma criptográfica de un JWT.
     * 
     * @param {string} jwt - Token JWT completo
     * @param {string} secret - Clave secreta para verificar la firma
     * @returns {Promise<Object>} Resultado de la verificación con:
     *   - valid: Boolean indicando si la firma es válida
     *   - algorithm: Algoritmo usado
     *   - header: Header decodificado
     *   - payload: Payload decodificado (si es válido)
     *   - error: Mensaje de error (si no es válido)
     * 
     * @example
     * const result = await jwtService.verifyJwt(token, 'my-secret-key');
     * if (result.valid) {
     *   console.log('JWT válido');
     * }
     */
    async verifyJwt(jwt, secret) {
        const url = `${API_BASE_URL}/analyze/crypto-verification`;
        const defaultOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                jwt: jwt,
                secret: secret,
            }),
        };

        try {
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            // El backend puede devolver 400 cuando el JWT es inválido,
            // pero con success: true y valid: false. En ese caso, procesamos la respuesta normalmente.
            if (!response.ok && (!data.success || data.valid !== false)) {
                throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
            }

            // Si success es true (incluso con valid: false), procesamos la respuesta
            if (data.success) {
                return {
                    valid: data.valid || false,
                    algorithm: data.algorithm,
                    header: data.header,
                    payload: data.payload,
                    error: data.error,
                    rawResponse: data, // Respuesta completa del backend
                };
            }

            // Si success es false, hay un error real
            throw new Error(data.error || 'Error al verificar JWT');
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
            }
            throw new Error(`Error al verificar JWT: ${error.message}`);
        }
    }

    /**
     * Crea y firma un nuevo JWT.
     * 
     * @param {Object} header - Header del JWT (debe incluir 'alg' y 'typ')
     * @param {Object} payload - Payload del JWT
     * @param {string} secret - Clave secreta para firmar el JWT
     * @returns {Promise<string>} Token JWT completo codificado
     * 
     * @example
     * const token = await jwtService.createJwt(
     *   { alg: 'HS256', typ: 'JWT' },
     *   { sub: '123', name: 'John Doe' },
     *   'my-secret-key'
     * );
     */
    async createJwt(header, payload, secret = 'secret') {
        try {
            const response = await this._fetch('/analyze/encoder', {
                method: 'POST',
                body: JSON.stringify({
                    header: header,
                    payload: payload,
                    secret: secret,
                }),
            });

            if (!response.success || !response.jwt) {
                throw new Error(response.error || 'Error al crear JWT');
            }

            return response.jwt;
        } catch (error) {
            throw new Error(`Error al crear JWT: ${error.message}`);
        }
    }

    /**
     * Verifica el estado de salud de la API.
     * 
     * @returns {Promise<Object>} Estado de la API
     * 
     * @example
     * const health = await jwtService.healthCheck();
     * console.log(health.status); // 'healthy'
     */
    async healthCheck() {
        return this._fetch('/health', { method: 'GET' });
    }
}

// Exportar instancia singleton
export default new JwtService();


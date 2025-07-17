/**
 * Cliente para comunicación con la API
 */
class ApiClient {
    constructor() {
        this.baseUrl = '';
        this.requestCache = new Map();
    }

    /**
     * Generar nodos y rutas
     */
    async generateNodes(estado, nNodos) {
        try {
            const response = await fetch('/api/generate-nodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    estado: estado,
                    n_nodos: nNodos
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error al generar nodos');
            }

            return data;

        } catch (error) {
            console.error('Error en generateNodes:', error);
            throw error;
        }
    }

    /**
     * Obtener una ruta específica
     */
    async getRoute(origen, destino) {
        // Crear clave para cache
        const cacheKey = `${origen.lat},${origen.lng}-${destino.lat},${destino.lng}`;
        
        // Verificar cache
        if (this.requestCache.has(cacheKey)) {
            return this.requestCache.get(cacheKey);
        }

        try {
            const response = await fetch('/api/route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    origen: origen,
                    destino: destino
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Error al obtener ruta');
            }

            // Guardar en cache
            this.requestCache.set(cacheKey, data.ruta);
            
            return data.ruta;

        } catch (error) {
            console.error('Error en getRoute:', error);
            throw error;
        }
    }

    /**
     * Obtener múltiples rutas alternativas
     */
    async getAlternativeRoutes(origen, destino) {
        const rutas = [];
        
        try {
            // Ruta principal
            const rutaPrincipal = await this.getRoute(origen, destino);
            if (rutaPrincipal) {
                rutaPrincipal.tipo = 'Ruta Principal';
                rutaPrincipal.descripcion = 'Ruta más directa calculada';
                rutas.push(rutaPrincipal);
            }

            // Intentar rutas alternativas con pequeñas variaciones
            const variaciones = this._generateRouteVariations(origen, destino);
            
            for (const variacion of variaciones) {
                try {
                    const rutaAlternativa = await this.getRoute(variacion.origen, variacion.destino);
                    
                    if (rutaAlternativa && !this._isRouteSimilar(rutaPrincipal, rutaAlternativa)) {
                        rutaAlternativa.tipo = variacion.tipo;
                        rutaAlternativa.descripcion = variacion.descripcion;
                        rutas.push(rutaAlternativa);
                    }
                    
                } catch (error) {
                    console.warn('Error obteniendo ruta alternativa:', error);
                }
                
                // Pausa entre requests
                await this._sleep(300);
                
                // Limitar número de rutas alternativas
                if (rutas.length >= 3) break;
            }

        } catch (error) {
            console.error('Error obteniendo rutas alternativas:', error);
        }

        return rutas;
    }

    /**
     * Generar variaciones de ruta
     */
    _generateRouteVariations(origen, destino) {
        const variaciones = [];
        const offset = 0.01; // ~1km de variación

        // Variación 1: Punto de origen ligeramente desplazado al norte
        variaciones.push({
            origen: {
                lat: origen.lat + offset,
                lng: origen.lng
            },
            destino: destino,
            tipo: 'Ruta Norte',
            descripcion: 'Variante por el lado norte'
        });

        // Variación 2: Punto de origen ligeramente desplazado al sur
        variaciones.push({
            origen: {
                lat: origen.lat - offset,
                lng: origen.lng
            },
            destino: destino,
            tipo: 'Ruta Sur',
            descripcion: 'Variante por el lado sur'
        });

        // Variación 3: Punto de destino ligeramente desplazado
        variaciones.push({
            origen: origen,
            destino: {
                lat: destino.lat + offset * 0.5,
                lng: destino.lng + offset * 0.5
            },
            tipo: 'Ruta Alternativa',
            descripcion: 'Acceso alternativo al destino'
        });

        return variaciones;
    }

    /**
     * Verificar si dos rutas son similares
     */
    _isRouteSimilar(ruta1, ruta2, threshold = 0.1) {
        if (!ruta1 || !ruta2) return false;
        
        const distDiff = Math.abs(ruta1.distancia.value - ruta2.distancia.value) / ruta1.distancia.value;
        const timeDiff = Math.abs(ruta1.duracion.value - ruta2.duracion.value) / ruta1.duracion.value;
        
        return distDiff < threshold && timeDiff < threshold;
    }

    /**
     * Función de pausa
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Limpiar cache
     */
    clearCache() {
        this.requestCache.clear();
    }

    /**
     * Obtener estadísticas del cache
     */
    getCacheStats() {
        return {
            size: this.requestCache.size,
            keys: Array.from(this.requestCache.keys())
        };
    }

    /**
     * Validar respuesta de ruta
     */
    _validateRouteResponse(ruta) {
        return ruta && 
               ruta.distancia && 
               ruta.duracion && 
               ruta.puntos_ruta && 
               Array.isArray(ruta.puntos_ruta) &&
               ruta.puntos_ruta.length > 0;
    }

    /**
     * Manejar errores de red
     */
    _handleNetworkError(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Error de conexión. Verifica tu conexión a internet.');
        }
        
        if (error.message.includes('timeout')) {
            throw new Error('Tiempo de espera agotado. El servidor tardó demasiado en responder.');
        }
        
        throw error;
    }

    /**
     * Obtener información de estado del servidor
     */
    async getServerStatus() {
        try {
            const response = await fetch('/api/status');
            return await response.json();
        } catch (error) {
            return { status: 'offline', error: error.message };
        }
    }
}
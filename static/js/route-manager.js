/**
 * Gestor de rutas múltiples
 */
class RouteManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.routesData = [];
    }

    /**
     * Obtener múltiples rutas para cada destino
     */
    async getMultipleRoutes(origen, destinos) {
        const allRoutes = [];
        
        for (let i = 0; i < destinos.length; i++) {
            const destino = destinos[i];
            console.log(`Buscando rutas para destino ${i + 1}/${destinos.length}...`);
            
            try {
                // Obtener múltiples rutas para este destino
                const rutasDestino = await this._getRoutesForDestination(origen, destino, i);
                
                allRoutes.push({
                    indice: i,
                    destino: destino,
                    rutas: rutasDestino
                });
                
                // Pausa para no sobrecargar el servidor
                await this._sleep(500);
                
            } catch (error) {
                console.error(`Error obteniendo rutas para destino ${i + 1}:`, error);
                // Agregar destino sin rutas
                allRoutes.push({
                    indice: i,
                    destino: destino,
                    rutas: []
                });
            }
        }
        
        this.routesData = allRoutes;
        return allRoutes;
    }

    /**
     * Obtener múltiples rutas para un destino específico
     */
    async _getRoutesForDestination(origen, destino, index) {
        const rutas = [];
        
        try {
            // Ruta 1: Directa
            const rutaDirecta = await this.apiClient.getRoute(origen, destino);
            if (rutaDirecta) {
                rutaDirecta.tipo = 'Opción 1';
                rutaDirecta.descripcion = 'Ruta calculada directamente';
                rutas.push(rutaDirecta);
            }

            // Ruta 2: Variante Norte
            const rutaNorte = await this._getRouteVariant(origen, destino, 'norte');
            if (rutaNorte && !this._areRoutesSimilar(rutaDirecta, rutaNorte)) {
                rutaNorte.tipo = 'Opción 2';
                rutaNorte.descripcion = 'Ruta variante por zona norte';
                rutas.push(rutaNorte);
            }

            // Ruta 3: Variante Sur  
            const rutaSur = await this._getRouteVariant(origen, destino, 'sur');
            if (rutaSur && !this._isRouteSimilarToAny(rutaSur, rutas)) {
                rutaSur.tipo = 'Opción 3';
                rutaSur.descripción = 'Ruta variante por zona sur';
                rutas.push(rutaSur);
            }

            // Ruta 4: Con punto intermedio (si la distancia > 50km)
            if (this._getDistanceKm(rutaDirecta) > 50) {
                const rutaIntermedia = await this._getRouteWithWaypoint(origen, destino);
                if (rutaIntermedia && !this._isRouteSimilarToAny(rutaIntermedia, rutas)) {
                    rutaIntermedia.tipo = 'Opción 4';
                    rutaIntermedia.descripcion = 'Ruta con punto intermedio';
                    rutas.push(rutaIntermedia);
                }
            }

        } catch (error) {
            console.error(`Error obteniendo rutas para destino ${index + 1}:`, error);
        }

        return rutas;
    }

    /**
     * Obtener variante de ruta por dirección
     */
    async _getRouteVariant(origen, destino, direccion) {
        try {
            // Crear punto intermedio según la dirección
            const midLat = (origen.lat + destino.lat) / 2;
            const midLng = (origen.lng + destino.lng) / 2;
            
            let waypoint;
            const offset = 0.015; // ~1.5km de desplazamiento
            
            switch(direccion) {
                case 'norte':
                    waypoint = {
                        lat: midLat + offset,
                        lng: midLng
                    };
                    break;
                case 'sur':
                    waypoint = {
                        lat: midLat - offset,
                        lng: midLng
                    };
                    break;
                case 'este':
                    waypoint = {
                        lat: midLat,
                        lng: midLng + offset
                    };
                    break;
                case 'oeste':
                    waypoint = {
                        lat: midLat,
                        lng: midLng - offset
                    };
                    break;
                default:
                    return null;
            }

            // Obtener ruta pasando por el waypoint
            const ruta1 = await this.apiClient.getRoute(origen, waypoint);
            const ruta2 = await this.apiClient.getRoute(waypoint, destino);

            if (ruta1 && ruta2) {
                return this._combineRoutes(ruta1, ruta2);
            }
        } catch (error) {
            console.error(`Error obteniendo ruta variante ${direccion}:`, error);
        }
        
        return null;
    }

    /**
     * Obtener ruta con un solo punto intermedio
     */
    async _getRouteWithWaypoint(origen, destino) {
        try {
            // Generar punto intermedio inteligente
            const waypoint = this._generateSingleWaypoint(origen, destino);
            
            if (!waypoint) return null;

            const ruta1 = await this.apiClient.getRoute(origen, waypoint);
            const ruta2 = await this.apiClient.getRoute(waypoint, destino);

            if (ruta1 && ruta2) {
                return this._combineRoutes(ruta1, ruta2);
            }

        } catch (error) {
            console.error('Error obteniendo ruta con waypoint:', error);
        }
        
        return null;
    }

    /**
     * Generar un punto de paso inteligente
     */
    _generateSingleWaypoint(origen, destino) {
        const distance = this._calculateDistance(origen.lat, origen.lng, destino.lat, destino.lng);
        
        if (distance < 30) return null; // No agregar waypoint para rutas muy cortas
        
        // Punto intermedio con ligera desviación
        const factor = 0.4 + Math.random() * 0.2; // Entre 40% y 60% del camino
        const offset = (Math.random() - 0.5) * 0.02; // Desviación aleatoria
        
        return {
            lat: origen.lat + (destino.lat - origen.lat) * factor + offset,
            lng: origen.lng + (destino.lng - origen.lng) * factor + offset
        };
    }

    /**
     * Combinar dos rutas en una sola
     */
    _combineRoutes(ruta1, ruta2) {
        return {
            distancia: {
                text: `${(parseFloat(ruta1.distancia.text) + parseFloat(ruta2.distancia.text)).toFixed(1)} km`,
                value: ruta1.distancia.value + ruta2.distancia.value
            },
            duracion: {
                text: `${Math.round((ruta1.duracion.value + ruta2.duracion.value) / 60)} min`,
                value: ruta1.duracion.value + ruta2.duracion.value
            },
            puntos_ruta: [...ruta1.puntos_ruta, ...ruta2.puntos_ruta],
            pasos: [...(ruta1.pasos || []), ...(ruta2.pasos || [])]
        };
    }

    /**
     * Verificar si dos rutas son similares
     */
    _areRoutesSimilar(ruta1, ruta2, threshold = 0.1) {
        if (!ruta1 || !ruta2) return false;
        
        const distDiff = Math.abs(ruta1.distancia.value - ruta2.distancia.value) / ruta1.distancia.value;
        const timeDiff = Math.abs(ruta1.duracion.value - ruta2.duracion.value) / ruta1.duracion.value;
        
        return distDiff < threshold && timeDiff < threshold;
    }

    /**
     * Verificar si una ruta es similar a cualquiera en una lista
     */
    _isRouteSimilarToAny(nuevaRuta, rutasExistentes, threshold = 0.15) {
        return rutasExistentes.some(rutaExistente => 
            this._areRoutesSimilar(nuevaRuta, rutaExistente, threshold)
        );
    }

    /**
     * Obtener distancia en kilómetros de una ruta
     */
    _getDistanceKm(ruta) {
        if (!ruta || !ruta.distancia) return 0;
        return ruta.distancia.value / 1000;
    }

    /**
     * Calcular distancia directa entre dos puntos usando Haversine
     */
    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this._deg2rad(lat2 - lat1);
        const dLon = this._deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    _deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    /**
     * Sleep function para pausas
     */
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtener todas las rutas almacenadas
     */
    getAllRoutes() {
        return this.routesData;
    }

    /**
     * Obtener rutas para un destino específico
     */
    getRoutesForDestination(destinationIndex) {
        const destino = this.routesData.find(d => d.indice === destinationIndex);
        return destino ? destino.rutas : [];
    }

    /**
     * Obtener estadísticas de rutas
     */
    getRouteStats() {
        let totalRoutes = 0;
        let totalDistance = 0;
        let totalTime = 0;
        let longestRoute = 0;

        this.routesData.forEach(destino => {
            destino.rutas.forEach(ruta => {
                totalRoutes++;
                const distanceKm = this._getDistanceKm(ruta);
                const timeMin = ruta.duracion.value / 60;
                
                totalDistance += distanceKm;
                totalTime += timeMin;
                
                if (distanceKm > longestRoute) {
                    longestRoute = distanceKm;
                }
            });
        });

        return {
            totalDestinations: this.routesData.length,
            totalRoutes,
            totalDistance: totalDistance.toFixed(1),
            totalTime: Math.round(totalTime),
            longestRoute: longestRoute.toFixed(1),
            averageRoutesPerDestination: (totalRoutes / this.routesData.length).toFixed(1)
        };
    }
}
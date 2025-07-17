class RouteManager {
    constructor(apiClient) {
        this.apiClient = apiClient;
        this.routesData = [];
    }

    async getCompleteRoutes(estado, nNodos) {
        try {
            const data = await this.apiClient.generateCompleteRoutes(estado, nNodos);
            this.routesData = data.rutas_data;
            return data;
        } catch (error) {
            console.error('Error obteniendo rutas completas:', error);
            throw error;
        }
    }

    getAllRoutes() {
        return this.routesData;
    }

    getRoutesForDestination(destinationIndex) {
        const destino = this.routesData.find(d => d.indice === destinationIndex);
        return destino ? destino.rutas : [];
    }

    getRouteStats() {
        let totalRoutes = 0;
        let totalDistance = 0;
        let longestRoute = 0;

        this.routesData.forEach(destino => {
            destino.rutas.forEach(ruta => {
                totalRoutes++;
                const distanceKm = ruta.distancia.value / 1000;
                
                totalDistance += distanceKm;
                
                if (distanceKm > longestRoute) {
                    longestRoute = distanceKm;
                }
            });
        });

        return {
            totalDestinations: this.routesData.length,
            totalRoutes,
            totalDistance: totalDistance.toFixed(1),
            longestRoute: longestRoute.toFixed(1),
            averageRoutesPerDestination: (totalRoutes / this.routesData.length).toFixed(1)
        };
    }
}
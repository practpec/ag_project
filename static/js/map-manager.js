/**
 * Gestor del mapa Leaflet
 */
class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.routeLayers = [];
        this.currentBounds = null;
    }

    /**
     * Inicializar el mapa
     */
    init() {
        this.map = L.map('map').setView([23.6345, -102.5528], 6);

        // Agregar capa de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(this.map);

        // Agregar controles adicionales
        L.control.scale().addTo(this.map);
    }

    /**
     * Limpiar todos los elementos del mapa
     */
    clearMap() {
        // Limpiar marcadores
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Limpiar rutas
        this.routeLayers.forEach(layer => this.map.removeLayer(layer));
        this.routeLayers = [];

        this.currentBounds = null;
    }

    /**
     * Agregar nodo principal al mapa
     */
    addPrincipalNode(nodeData) {
        const principalIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="marker-pin">
                    <div class="pulse"></div>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker(
            [nodeData.lat, nodeData.lng], 
            { icon: principalIcon }
        ).addTo(this.map);

        marker.bindPopup(`
            <div style="text-align: center; padding: 10px;">
                <h4>🏛️ ${nodeData.nombre}</h4>
                <p><strong>Nodo Principal</strong></p>
                <p>📍 ${nodeData.lat.toFixed(4)}, ${nodeData.lng.toFixed(4)}</p>
            </div>
        `);

        this.markers.push(marker);
        this._updateBounds([nodeData.lat, nodeData.lng]);

        return marker;
    }

    /**
     * Agregar nodo secundario al mapa
     */
    addSecondaryNode(nodeData, index) {
        const secondaryIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
                <div class="marker-pin secondary-marker" data-destination="${index}">
                    <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(45deg);
                        color: white;
                        font-weight: bold;
                        font-size: 12px;
                    ">${index + 1}</div>
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        const marker = L.marker(
            [nodeData.lat, nodeData.lng], 
            { icon: secondaryIcon }
        ).addTo(this.map);

        marker.bindPopup(`
            <div style="padding: 15px;">
                <h4>🎯 Destino ${index + 1}</h4>
                <hr style="margin: 10px 0;">
                <p><strong>📍 Coordenadas:</strong><br>${nodeData.lat.toFixed(4)}, ${nodeData.lng.toFixed(4)}</p>
                <p><strong>📏 Distancia directa:</strong> ${nodeData.distancia_directa} km</p>
            </div>
        `);

        this.markers.push(marker);
        this._updateBounds([nodeData.lat, nodeData.lng]);

        return marker;
    }

    /**
     * Agregar ruta al mapa
     */
    addRoute(routeData, destinationIndex, routeIndex) {
        if (!routeData.puntos_ruta || routeData.puntos_ruta.length === 0) {
            return null;
        }

        const routePoints = routeData.puntos_ruta.map(punto => [punto.lat, punto.lng]);
        
        const polyline = L.polyline(routePoints, {
            color: this._getRouteColor(destinationIndex, routeIndex),
            weight: 4,
            opacity: 0.7,
            dashArray: routeIndex % 2 === 0 ? null : '10, 5',
            className: `route-${destinationIndex}-${routeIndex}`
        }).addTo(this.map);

        polyline.bindPopup(`
            <div style="text-align: center;">
                <h4>Ruta ${routeIndex + 1} hacia Destino ${destinationIndex + 1}</h4>
                <p><strong>🛣️ ${routeData.distancia.text}</strong></p>
                <p><strong>⏱️ ${routeData.duracion.text}</strong></p>
                <p><strong>📍 Tipo:</strong> ${routeData.tipo || 'Ruta por carretera'}</p>
            </div>
        `);

        this.routeLayers.push(polyline);

        // Actualizar bounds con los puntos de la ruta
        routePoints.forEach(point => this._updateBounds(point));

        return polyline;
    }

    /**
     * Resaltar una ruta específica
     */
    highlightRoute(destinationIndex, routeIndex) {
        // Desvanecer todas las rutas
        this.routeLayers.forEach(layer => {
            layer.setStyle({ opacity: 0.3, weight: 2 });
        });

        // Resaltar la ruta seleccionada
        const targetClass = `route-${destinationIndex}-${routeIndex}`;
        this.routeLayers.forEach(layer => {
            if (layer.options.className === targetClass) {
                layer.setStyle({ 
                    opacity: 1, 
                    weight: 6,
                    color: '#e74c3c'
                });
                layer.bringToFront();
            }
        });
    }

    /**
     * Restaurar opacidad normal de todas las rutas
     */
    resetRouteHighlight() {
        this.routeLayers.forEach((layer, index) => {
            const originalColor = this._getRouteColorByIndex(index);
            layer.setStyle({ 
                opacity: 0.7, 
                weight: 4,
                color: originalColor
            });
        });
    }

    /**
     * Centrar el mapa en todas las rutas
     */
    fitToRoutes() {
        if (this.currentBounds) {
            this.map.fitBounds(this.currentBounds, { padding: [20, 20] });
        }
    }

    /**
     * Obtener colores para las rutas
     */
    _getRouteColor(destinationIndex, routeIndex) {
        const colors = [
            '#e74c3c', '#3498db', '#f39c12', '#27ae60', '#9b59b6',
            '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#95a5a6',
            '#e91e63', '#ff5722', '#607d8b', '#795548', '#009688'
        ];
        
        // Combinar índice de destino y ruta para obtener colores únicos
        const colorIndex = (destinationIndex * 3 + routeIndex) % colors.length;
        return colors[colorIndex];
    }

    _getRouteColorByIndex(layerIndex) {
        const colors = [
            '#e74c3c', '#3498db', '#f39c12', '#27ae60', '#9b59b6',
            '#e67e22', '#1abc9c', '#34495e', '#f1c40f', '#95a5a6',
            '#e91e63', '#ff5722', '#607d8b', '#795548', '#009688'
        ];
        return colors[layerIndex % colors.length];
    }

    /**
     * Actualizar bounds para ajustar la vista del mapa
     */
    _updateBounds(latLng) {
        if (!this.currentBounds) {
            this.currentBounds = L.latLngBounds();
        }
        this.currentBounds.extend(latLng);
    }
}
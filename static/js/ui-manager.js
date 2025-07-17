class UIManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.isLoading = false;
        this.isPanelCollapsed = false;
    }

    toggleLoading(show) {
        const loading = document.getElementById('loading');
        const btn = document.getElementById('generar-btn');
        
        this.isLoading = show;
        
        if (show) {
            loading.classList.add('show');
            btn.disabled = true;
            btn.innerHTML = '⏳ Generando...';
        } else {
            loading.classList.remove('show');
            btn.disabled = false;
            btn.innerHTML = '🚀 Generar Mapa';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.innerHTML = `<strong>❌ Error:</strong> ${message}`;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 6000);
    }

    updateRoutesPanel(routesData) {
        const panelContent = document.getElementById('panel-content');
        
        if (!routesData || routesData.length === 0) {
            panelContent.innerHTML = `
                <div class="no-routes">
                    <p>No se encontraron rutas</p>
                </div>
            `;
            return;
        }

        let html = '';
        
        routesData.forEach((destinoData, index) => {
            const rutas = destinoData.rutas || [];
            
            html += `
                <div class="destination-item">
                    <div class="destination-header" onclick="toggleDestination(${index})" data-destination="${index}">
                        <div class="destination-title">
                            🎯 Destino ${index + 1}
                            <div style="font-size: 0.8em; font-weight: normal; margin-top: 2px;">
                                ${rutas.length} ruta${rutas.length !== 1 ? 's' : ''} disponible${rutas.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div class="toggle-icon">▼</div>
                    </div>
                    <div class="routes-list" id="routes-${index}">
                        ${this._generateRoutesHTML(rutas, index)}
                    </div>
                </div>
            `;
        });
        
        panelContent.innerHTML = html;
    }

    _generateRoutesHTML(rutas, destinationIndex) {
        if (rutas.length === 0) {
            return `
                <div class="route-item">
                    <div class="route-header">
                        <span class="route-type">❌ Sin rutas disponibles</span>
                    </div>
                    <div class="route-details">
                        No se pudieron calcular rutas para este destino
                    </div>
                </div>
            `;
        }

        let html = '';
        
        rutas.forEach((ruta, routeIndex) => {
            const routeId = `route-${destinationIndex}-${routeIndex}`;
            
            html += `
                <div class="route-item" id="${routeId}" data-destination="${destinationIndex}" data-route="${routeIndex}">
                    <div class="route-header">
                        <span class="route-type">${ruta.tipo || 'Ruta ' + (routeIndex + 1)}</span>
                        <div class="route-controls">
                            <button class="route-btn" onclick="highlightRoute(${destinationIndex}, ${routeIndex})" title="Ver en mapa">
                                👁️
                            </button>
                        </div>
                    </div>
                    
                    <div class="route-details">
                        ${ruta.descripcion || 'Camino hacia el destino'}
                    </div>
                    
                    <div class="route-stats">
                        <div class="route-stat">
                            <span>🛣️</span>
                            <span>${ruta.distancia.text}</span>
                        </div>
                        <div class="route-stat">
                            <span>📍</span>
                            <span>${ruta.puntos_ruta ? ruta.puntos_ruta.length : 0} puntos</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    highlightRouteInPanel(destinationIndex, routeIndex) {
        document.querySelectorAll('.route-item').forEach(item => {
            item.classList.remove('highlighted');
        });

        const routeElement = document.getElementById(`route-${destinationIndex}-${routeIndex}`);
        if (routeElement) {
            routeElement.classList.add('highlighted');
            
            routeElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    }

    expandDestination(destinationIndex) {
        const header = document.querySelector(`[data-destination="${destinationIndex}"]`);
        const routesList = document.getElementById(`routes-${destinationIndex}`);
        
        if (header && routesList) {
            header.classList.add('active');
            routesList.classList.add('show');
        }
    }

    collapseAllDestinations() {
        document.querySelectorAll('.destination-header').forEach(header => {
            header.classList.remove('active');
        });
        document.querySelectorAll('.routes-list').forEach(list => {
            list.classList.remove('show');
        });
    }

    togglePanel() {
        const panel = document.querySelector('.routes-panel');
        const btn = document.querySelector('.collapse-btn');
        
        this.isPanelCollapsed = !this.isPanelCollapsed;
        
        if (this.isPanelCollapsed) {
            panel.classList.add('collapsed');
            btn.innerHTML = '+';
        } else {
            panel.classList.remove('collapsed');
            btn.innerHTML = '−';
        }
    }

    updatePanelHeader(stats) {
        const headerTitle = document.querySelector('.panel-header h3');
        if (headerTitle && stats) {
            headerTitle.innerHTML = `🛣️ ${stats.totalRoutes} Rutas para ${stats.totalDestinations} Destinos`;
        }
    }

    validateForm() {
        const estado = document.getElementById('estado').value;
        const nNodos = parseInt(document.getElementById('n_nodos').value);

        if (!estado) {
            this.showError('Por favor selecciona un estado');
            return false;
        }

        if (nNodos < 1 || nNodos > 15) {
            this.showError('El número de destinos debe estar entre 1 y 15');
            return false;
        }

        return true;
    }

    getFormValues() {
        return {
            estado: document.getElementById('estado').value,
            nNodos: parseInt(document.getElementById('n_nodos').value)
        };
    }
}
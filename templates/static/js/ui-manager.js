/**
 * Gestor de la interfaz de usuario
 */
class UIManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.isLoading = false;
        this.isPanelCollapsed = false;
    }

    /**
     * Mostrar/ocultar loading
     */
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

    /**
     * Mostrar error
     */
    showError(message) {
        const errorDiv = document.getElementById('error-message');
        errorDiv.innerHTML = `<strong>❌ Error:</strong> ${message}`;
        errorDiv.classList.add('show');
        
        setTimeout(() => {
            errorDiv.classList.remove('show');
        }, 6000);
    }

    /**
     * Actualizar panel de rutas
     */
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
            const destino = destinoData.destino;
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

    /**
     * Generar HTML para las rutas de un destino
     */
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
                        ${ruta.descripcion || 'Camino disponible hacia el destino'}
                    </div>
                    
                    <div class="route-stats">
                        <div class="route-stat">
                            <span>🛣️</span>
                            <span>${ruta.distancia.text}</span>
                        </div>
                        <div class="route-stat">
                            <span>⏱️</span>
                            <span>${ruta.duracion.text}</span>
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

    /**
     * Generar HTML para los pasos de una ruta
     */
    _generateStepsHTML(pasos) {
        if (!pasos || pasos.length === 0) {
            return '';
        }

        let html = `
            <div class="route-steps" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <div style="font-weight: 600; margin-bottom: 8px; font-size: 0.9em;">📋 Instrucciones:</div>
        `;

        pasos.slice(0, 3).forEach((paso, index) => {
            html += `
                <div style="font-size: 0.8em; margin-bottom: 4px; color: #666;">
                    ${index + 1}. ${paso.instruccion} (${paso.distancia})
                </div>
            `;
        });

        if (pasos.length > 3) {
            html += `
                <div style="font-size: 0.8em; color: #999; font-style: italic;">
                    ... y ${pasos.length - 3} pasos más
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Resaltar una ruta específica en el panel
     */
    highlightRouteInPanel(destinationIndex, routeIndex) {
        // Quitar highlight de todas las rutas
        document.querySelectorAll('.route-item').forEach(item => {
            item.classList.remove('highlighted');
        });

        // Agregar highlight a la ruta seleccionada
        const routeElement = document.getElementById(`route-${destinationIndex}-${routeIndex}`);
        if (routeElement) {
            routeElement.classList.add('highlighted');
            
            // Hacer scroll hacia el elemento si no está visible
            routeElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'nearest' 
            });
        }
    }

    /**
     * Expandir destino en el panel
     */
    expandDestination(destinationIndex) {
        const header = document.querySelector(`[data-destination="${destinationIndex}"]`);
        const routesList = document.getElementById(`routes-${destinationIndex}`);
        
        if (header && routesList) {
            header.classList.add('active');
            routesList.classList.add('show');
        }
    }

    /**
     * Colapsar todos los destinos
     */
    collapseAllDestinations() {
        document.querySelectorAll('.destination-header').forEach(header => {
            header.classList.remove('active');
        });
        document.querySelectorAll('.routes-list').forEach(list => {
            list.classList.remove('show');
        });
    }

    /**
     * Toggle del panel principal
     */
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

    /**
     * Actualizar mensaje de loading con progreso
     */
    updateLoadingProgress(current, total, message) {
        const loadingDiv = document.getElementById('loading');
        const progressText = loadingDiv.querySelector('p:last-child');
        
        if (progressText) {
            progressText.innerHTML = `${message} (${current}/${total})`;
        }
    }

    /**
     * Mostrar resumen de estadísticas en el header del panel
     */
    updatePanelHeader(stats) {
        const headerTitle = document.querySelector('.panel-header h3');
        if (headerTitle && stats) {
            headerTitle.innerHTML = `🛣️ ${stats.totalRoutes} Rutas para ${stats.totalDestinations} Destinos`;
        }
    }

    /**
     * Validar formulario
     */
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

    /**
     * Obtener valores del formulario
     */
    getFormValues() {
        return {
            estado: document.getElementById('estado').value,
            nNodos: parseInt(document.getElementById('n_nodos').value)
        };
    }
}
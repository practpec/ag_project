class AGUI {
    constructor(entitiesData) {
        this.entities = entitiesData;
        this.currentMapData = null;
        this.currentScenario = null;
        this.activeTab = 'resumen';
    }

    setMapData(mapData) {
        this.currentMapData = mapData;
        this.updateMapSummary();
    }

    updateMapSummary() {
        const summaryContent = document.getElementById('summary-content');
        const scenarioConfig = document.getElementById('scenario-config');
        
        if (this.currentMapData) {
            let totalRutas = 0;
            if (this.currentMapData.rutas_data) {
                this.currentMapData.rutas_data.forEach(destino => {
                    totalRutas += destino.rutas ? destino.rutas.length : 0;
                });
            }
            
            summaryContent.innerHTML = `
                <div class="summary-grid">
                    <div class="summary-item">
                        <span class="summary-label">Punto de Inicio</span>
                        <span class="summary-value">${this.currentMapData.punto_inicio || 'No definido'}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Destinos</span>
                        <span class="summary-value">${this.currentMapData.nodos_secundarios ? this.currentMapData.nodos_secundarios.length : 0}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Rutas Generadas</span>
                        <span class="summary-value">${totalRutas}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Estado</span>
                        <span class="summary-value">Listo</span>
                    </div>
                </div>
            `;
            
            scenarioConfig.style.display = 'block';
            this.initializeDisasterDetails();
            this.updateVehicles();
        } else {
            summaryContent.innerHTML = `
                <div class="no-map-data">
                    <div class="empty-state">
                        <p class="warning-text">No hay datos de mapa disponibles</p>
                        <p>Para usar el algoritmo genético, primero debes generar un mapa en la pestaña correspondiente.</p>
                        <button onclick="showModule('mapas')" class="btn btn-primary">
                            Ir a Generar Mapa
                        </button>
                    </div>
                </div>
            `;
            scenarioConfig.style.display = 'none';
        }
    }

    initializeDisasterDetails() {
        const select = document.getElementById('tipo-desastre');
        if (select) {
            this.showDisasterDetails();
        }
    }

    showDisasterDetails() {
        const select = document.getElementById('tipo-desastre');
        const detailsDiv = document.getElementById('disaster-details');
        
        if (!select || !detailsDiv) return;

        const selectedType = select.value;
        const disaster = this.entities.tipos_desastre.find(d => d.tipo === selectedType);
        
        if (disaster) {
            const prioritiesTable = disaster.prioridad.map(p => `
                <tr>
                    <td>${p.categoria}</td>
                    <td><span class="priority-level ${p.nivel}">${p.nivel}</span></td>
                </tr>
            `).join('');

            detailsDiv.innerHTML = `
                <h5>Prioridades de Insumos - ${disaster.tipo.charAt(0).toUpperCase() + disaster.tipo.slice(1)}</h5>
                <p style="margin-bottom: 15px; color: #a0aec0; font-size: 0.9em;">
                    El algoritmo genético utilizará estas prioridades para optimizar la distribución:
                </p>
                <table class="priority-table">
                    <thead>
                        <tr>
                            <th>Categoría de Insumo</th>
                            <th>Nivel de Prioridad</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prioritiesTable}
                    </tbody>
                </table>
            `;
        }
    }

    updateVehicles() {
        const cantidad = parseInt(document.getElementById('cantidad-vehiculos').value) || 3;
        const vehiclesList = document.getElementById('vehicles-list');
        
        if (!vehiclesList) return;

        if (cantidad === 0) {
            vehiclesList.innerHTML = '<p style="text-align: center; color: #718096; padding: 20px;">No hay vehículos configurados</p>';
            return;
        }

        let tableRows = '';
        for (let i = 0; i < cantidad; i++) {
            const vehicleOptions = this.entities.tipos_vehiculos.map(v => 
                `<option value="${v.tipo}" data-modelo="${v.modelo}" data-capacidad="${v.maximo_peso_ton}" data-velocidad="${v.velocidad_kmh}" data-consumo="${v.consumo_litros_km}">
                    ${v.modelo} (${v.tipo})
                </option>`
            ).join('');

            tableRows += `
                <tr>
                    <td>Vehículo ${i + 1}</td>
                    <td>
                        <select class="vehicle-select vehicle-type" data-index="${i}" onchange="updateVehicleDetails(${i})">
                            ${vehicleOptions}
                        </select>
                    </td>
                    <td id="vehicle-specs-${i}">-</td>
                    <td>
                        <button type="button" onclick="removeVehicle(${i})" class="btn btn-danger btn-small">
                            Eliminar
                        </button>
                    </td>
                </tr>
            `;
        }
        
        vehiclesList.innerHTML = `
            <table class="vehicles-table">
                <thead>
                    <tr>
                        <th>Identificador</th>
                        <th>Tipo de Vehículo</th>
                        <th>Especificaciones</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;
        
        // Actualizar especificaciones de todos los vehículos
        for (let i = 0; i < cantidad; i++) {
            this.updateVehicleDetails(i);
        }
    }

    updateVehicleDetails(index) {
        const select = document.querySelector(`[data-index="${index}"]`);
        const specsCell = document.getElementById(`vehicle-specs-${index}`);
        
        if (!select || !specsCell) return;

        const selectedOption = select.selectedOptions[0];
        const capacidad = selectedOption.dataset.capacidad;
        const velocidad = selectedOption.dataset.velocidad;
        const consumo = selectedOption.dataset.consumo;

        specsCell.innerHTML = `${capacidad}t • ${velocidad}km/h • ${consumo}L/km`;
    }

    addVehicle() {
        const cantidadInput = document.getElementById('cantidad-vehiculos');
        const nuevaCantidad = parseInt(cantidadInput.value) + 1;
        
        if (nuevaCantidad <= 10) {
            cantidadInput.value = nuevaCantidad;
            this.updateVehicles();
        } else {
            alert('Máximo 10 vehículos permitidos');
        }
    }

    removeVehicle(index) {
        const cantidadInput = document.getElementById('cantidad-vehiculos');
        const nuevaCantidad = Math.max(1, parseInt(cantidadInput.value) - 1);
        cantidadInput.value = nuevaCantidad;
        this.updateVehicles();
    }

    autoConfigureVehicles() {
        if (!this.currentMapData || !this.currentMapData.nodos_secundarios) {
            alert('Genera un mapa primero para usar la configuración automática');
            return;
        }

        const numDestinos = this.currentMapData.nodos_secundarios.length;
        const cantidadInput = document.getElementById('cantidad-vehiculos');
        
        // Configurar cantidad óptima (igual al número de destinos)
        cantidadInput.value = Math.min(numDestinos, 10);
        this.updateVehicles();
        
        // Distribución automática de tipos de vehículos
        const vehicleSelects = document.querySelectorAll('.vehicle-type');
        const tipos = ['camion', 'van', 'auto'];
        
        vehicleSelects.forEach((select, index) => {
            const tipoIndex = index % tipos.length;
            select.value = tipos[tipoIndex];
            this.updateVehicleDetails(index);
        });

        alert(`✅ Configuración automática aplicada:\n- ${cantidadInput.value} vehículos\n- Distribución equilibrada de tipos`);
    }

    async generateScenario() {
        if (!this.currentMapData) {
            alert('No hay datos de mapa. Genera un mapa primero.');
            return;
        }

        const tipoDesastre = document.getElementById('tipo-desastre').value;
        const vehiculos = [];
        
        document.querySelectorAll('.vehicle-type').forEach((select, index) => {
            vehiculos.push({
                vehiculo_id: index + 1,
                tipo: select.value
            });
        });

        const data = {
            tipo_desastre: tipoDesastre,
            vehiculos: vehiculos
        };

        try {
            const response = await fetch('/api/ag/create-scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                this.currentScenario = result.escenario;
                this.showScenarioResult(result.escenario);
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al generar escenario');
        }
    }

    showScenarioResult(escenario) {
        const resultDiv = document.getElementById('scenario-result');
        const overviewDiv = document.getElementById('scenario-overview');
        
        // Mostrar resumen general
        overviewDiv.innerHTML = `
            <h4>Escenario: ${escenario.tipo_desastre.charAt(0).toUpperCase() + escenario.tipo_desastre.slice(1)}</h4>
            <div class="overview-stats">
                <div class="stat-item">
                    <span class="stat-value">${escenario.estadisticas.total_destinos}</span>
                    <span class="stat-label">Destinos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${escenario.estadisticas.total_vehiculos}</span>
                    <span class="stat-label">Vehículos</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${escenario.estadisticas.rutas_abiertas}</span>
                    <span class="stat-label">Rutas Abiertas</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${escenario.estadisticas.rutas_cerradas}</span>
                    <span class="stat-label">Rutas Bloqueadas</span>
                </div>
            </div>
        `;

        // Actualizar contenido de tabs
        this.updateTabContent(escenario);
        
        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth' });
    }

    updateTabContent(escenario) {
        // Tab Resumen
        document.getElementById('tab-resumen').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Aspecto</th>
                        <th>Valor</th>
                        <th>Detalles</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Tipo de Desastre</td>
                        <td>${escenario.tipo_desastre.charAt(0).toUpperCase() + escenario.tipo_desastre.slice(1)}</td>
                        <td>Configuración de prioridades específicas</td>
                    </tr>
                    <tr>
                        <td>Punto de Partida</td>
                        <td>${escenario.punto_partida}</td>
                        <td>Ubicación base para distribución</td>
                    </tr>
                    <tr>
                        <td>Total Destinos</td>
                        <td>${escenario.estadisticas.total_destinos}</td>
                        <td>Ubicaciones que requieren ayuda</td>
                    </tr>
                    <tr>
                        <td>Total Rutas</td>
                        <td>${escenario.estadisticas.total_rutas}</td>
                        <td>Caminos disponibles generados</td>
                    </tr>
                    <tr>
                        <td>Rutas Disponibles</td>
                        <td>${escenario.estadisticas.rutas_abiertas}</td>
                        <td>Caminos transitables</td>
                    </tr>
                    <tr>
                        <td>Rutas Bloqueadas</td>
                        <td>${escenario.estadisticas.rutas_cerradas}</td>
                        <td>Caminos no disponibles</td>
                    </tr>
                    <tr>
                        <td>Categorías de Insumos</td>
                        <td>${escenario.categorias_insumos.length}</td>
                        <td>Tipos de ayuda humanitaria</td>
                    </tr>
                </tbody>
            </table>
        `;

        // Tab Vehículos
        const vehiculosTable = escenario.vehiculos_disponibles.map(v => `
            <tr>
                <td>Vehículo ${v.vehiculo_id}</td>
                <td>${v.modelo}</td>
                <td>${v.tipo}</td>
                <td>${v.capacidad_kg} kg</td>
                <td>${v.velocidad_kmh} km/h</td>
                <td>${v.consumo_litros_km} L/km</td>
            </tr>
        `).join('');
        
        document.getElementById('tab-vehiculos').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Modelo</th>
                        <th>Tipo</th>
                        <th>Capacidad</th>
                        <th>Velocidad</th>
                        <th>Consumo</th>
                    </tr>
                </thead>
                <tbody>
                    ${vehiculosTable}
                </tbody>
            </table>
        `;

        // Tab Rutas
        const rutasTable = escenario.rutas_estado.map(r => `
            <tr>
                <td>Ruta ${r.id_destino_ruta}</td>
                <td>${r.destino}</td>
                <td>${r.distancia_km} km</td>
                <td><span class="route-status ${r.estado}">${r.estado}</span></td>
                <td>${r.razon_bloqueo || 'N/A'}</td>
                <td>${r.vehiculos_permitidos.join(', ')}</td>
            </tr>
        `).join('');
        
        document.getElementById('tab-rutas').innerHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Destino</th>
                        <th>Distancia</th>
                        <th>Estado</th>
                        <th>Razón Bloqueo</th>
                        <th>Vehículos Permitidos</th>
                    </tr>
                </thead>
                <tbody>
                    ${rutasTable}
                </tbody>
            </table>
        `;

        // Tab Prioridades
        const prioridadesTable = escenario.desastre_detalles.prioridad.map(p => `
            <tr>
                <td>${p.categoria}</td>
                <td><span class="priority-level ${p.nivel}">${p.nivel}</span></td>
                <td>${this.getPriorityDescription(p.nivel)}</td>
            </tr>
        `).join('');
        
        const insumosTable = escenario.categorias_insumos.map(cat => `
            <tr>
                <td>${cat.categoria}</td>
                <td>${cat.peso_unitario_kg} kg</td>
                <td>${cat.subcategorias ? cat.subcategorias.length : 0} subcategorías</td>
            </tr>
        `).join('');
        
        document.getElementById('tab-prioridades').innerHTML = `
            <h4>Prioridades para ${escenario.tipo_desastre}</h4>
            <p style="margin-bottom: 20px; color: #a0aec0;">
                El algoritmo genético utilizará estas prioridades para optimizar la distribución de insumos:
            </p>
            
            <table class="data-table" style="margin-bottom: 30px;">
                <thead>
                    <tr>
                        <th>Categoría de Insumo</th>
                        <th>Nivel de Prioridad</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    ${prioridadesTable}
                </tbody>
            </table>
            
            <h5 style="color: #ffd700; margin-bottom: 15px;">Categorías de Insumos Disponibles</h5>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Categoría</th>
                        <th>Peso por Unidad</th>
                        <th>Subcategorías</th>
                    </tr>
                </thead>
                <tbody>
                    ${insumosTable}
                </tbody>
            </table>
        `;
    }

    getPriorityDescription(nivel) {
        switch(nivel) {
            case 'alta': return 'Crítico para la supervivencia inmediata';
            case 'media': return 'Importante para bienestar y recuperación';
            case 'baja': return 'Útil para mejorar condiciones generales';
            default: return 'Sin descripción';
        }
    }

    showTab(tabName) {
        // Ocultar todos los tabs
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Mostrar tab seleccionado
        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
        
        this.activeTab = tabName;
    }

    exportScenario() {
        if (this.currentScenario) {
            const dataStr = JSON.stringify(this.currentScenario, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `escenario_${this.currentScenario.tipo_desastre}_${Date.now()}.json`;
            link.click();
            URL.revokeObjectURL(url);
        } else {
            alert('No hay escenario para exportar');
        }
    }

    resetScenario() {
        if (confirm('¿Estás seguro de que quieres regenerar el escenario? Se perderán los datos actuales.')) {
            this.generateScenario();
        }
    }

    async executeAG() {
        if (!this.currentScenario) {
            alert('Genera un escenario primero');
            return;
        }

        alert('🧬 Función de ejecutar Algoritmo Genético pendiente de implementar');
        // TODO: Implementar ejecución del AG
    }
}

// Funciones globales para compatibilidad con HTML
function mostrarDetallesDesastre() {
    if (window.agUI) {
        window.agUI.showDisasterDetails();
    }
}

function actualizarVehiculos() {
    if (window.agUI) {
        window.agUI.updateVehicles();
    }
}

function updateVehicleDetails(index) {
    if (window.agUI) {
        window.agUI.updateVehicleDetails(index);
    }
}

function agregarVehiculo() {
    if (window.agUI) {
        window.agUI.addVehicle();
    }
}

function removeVehicle(index) {
    if (window.agUI) {
        window.agUI.removeVehicle(index);
    }
}

function configuracionAutomatica() {
    if (window.agUI) {
        window.agUI.autoConfigureVehicles();
    }
}

function generarEscenario() {
    if (window.agUI) {
        window.agUI.generateScenario();
    }
}

function showTab(tabName) {
    if (window.agUI) {
        window.agUI.showTab(tabName);
    }
}

function exportarEscenario() {
    if (window.agUI) {
        window.agUI.exportScenario();
    }
}

function resetearEscenario() {
    if (window.agUI) {
        window.agUI.resetScenario();
    }
}

function ejecutarAG() {
    if (window.agUI) {
        window.agUI.executeAG();
    }
}
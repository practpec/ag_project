let mapManager;
let routeManager;
let uiManager;
let apiClient;
let agManager;
let currentData = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    apiClient = new ApiClient();
    mapManager = new MapManager();
    routeManager = new RouteManager(apiClient);
    uiManager = new UIManager(mapManager);
    agManager = new AGManager();
    
    mapManager.init();
    
    console.log('✅ Aplicación inicializada correctamente');
}

async function generarMapa() {
    if (!uiManager.validateForm()) {
        return;
    }

    const { estado, nNodos } = uiManager.getFormValues();
    
    uiManager.toggleLoading(true);
    
    mapManager.clearMap();

    try {
        const data = await routeManager.getCompleteRoutes(estado, nNodos);
        
        currentData = {
            punto_inicio: estado,
            nodo_principal: data.nodo_principal,
            nodos_secundarios: data.nodos_secundarios,
            rutas_data: data.rutas_data
        };
        
        // Notificar al AG Manager sobre los nuevos datos
        agManager.setMapData(currentData);
        
        // Notificar al AG UI sobre los nuevos datos
        if (window.agUI) {
            window.agUI.setMapData(currentData);
        }
        
        await mostrarResultados(currentData);
        
        const stats = routeManager.getRouteStats();
        uiManager.updatePanelHeader(stats);
        
        // Llamar función global para actualizar AG
        if (typeof onMapGenerated === 'function') {
            onMapGenerated(currentData);
        }
        
        console.log('✅ Mapa generado correctamente');
        console.log(`📊 Total: ${stats.totalRoutes} rutas para ${stats.totalDestinations} destinos`);

    } catch (error) {
        console.error('❌ Error generando mapa:', error);
        uiManager.showError(`No se pudo generar el mapa: ${error.message}`);
    } finally {
        uiManager.toggleLoading(false);
    }
}

async function mostrarResultados(data) {
    mapManager.addPrincipalNode(data.nodo_principal);
    
    data.rutas_data.forEach((destinoData, index) => {
        const destino = destinoData.destino;
        const rutas = destinoData.rutas || [];
        
        mapManager.addSecondaryNode(destino, index);
        
        rutas.forEach((ruta, routeIndex) => {
            mapManager.addRoute(ruta, index, routeIndex);
        });
    });
    
    mapManager.fitToRoutes();
    
    uiManager.updateRoutesPanel(data.rutas_data);
}

function highlightRoute(destinationIndex, routeIndex) {
    mapManager.highlightRoute(destinationIndex, routeIndex);
    
    uiManager.highlightRouteInPanel(destinationIndex, routeIndex);
    
    uiManager.expandDestination(destinationIndex);
}

function toggleDestination(destinationIndex) {
    const header = document.querySelector(`[data-destination="${destinationIndex}"]`);
    const routesList = document.getElementById(`routes-${destinationIndex}`);
    
    if (header && routesList) {
        const isActive = header.classList.contains('active');
        
        if (isActive) {
            header.classList.remove('active');
            routesList.classList.remove('show');
            mapManager.resetRouteHighlight();
        } else {
            uiManager.collapseAllDestinations();
            
            header.classList.add('active');
            routesList.classList.add('show');
        }
    }
}

function togglePanel() {
    uiManager.togglePanel();
}

function clearHighlight() {
    mapManager.resetRouteHighlight();
    document.querySelectorAll('.route-item').forEach(item => {
        item.classList.remove('highlighted');
    });
}

// Funciones para obtener datos actuales (usado por AG)
function getCurrentMapData() {
    return currentData;
}

function getCurrentAGManager() {
    return agManager;
}

// Funciones de navegación entre módulos
function showModule(moduleName) {
    // Ocultar todos los módulos
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.module-nav .btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar módulo seleccionado
    document.getElementById('module-' + moduleName).classList.add('active');
    document.getElementById('btn-' + moduleName).classList.add('active');
    
    // Si es AG, actualizar datos del mapa
    if (moduleName === 'algoritmo' && window.agUI) {
        window.agUI.updateMapSummary();
    }
}

// Función llamada cuando se genera mapa
function onMapGenerated(data) {
    currentData = data;
    if (window.agUI) {
        window.agUI.setMapData(data);
    }
}

// Manejo de errores globales
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    if (uiManager) {
        uiManager.showError('Ha ocurrido un error inesperado');
    }
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada:', e.reason);
    if (uiManager) {
        uiManager.showError('Error de conexión o procesamiento');
    }
    e.preventDefault();
});
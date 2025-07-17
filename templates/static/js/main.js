/**
 * Script principal - Coordina todos los componentes
 */

// Instancias globales
let mapManager;
let routeManager;
let uiManager;
let apiClient;
let currentData = null;

/**
 * Inicialización cuando se carga la página
 */
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Inicializar la aplicación
 */
function initializeApp() {
    // Crear instancias de los gestores
    apiClient = new ApiClient();
    mapManager = new MapManager();
    routeManager = new RouteManager(apiClient);
    uiManager = new UIManager(mapManager);
    
    // Inicializar el mapa
    mapManager.init();
    
    console.log('✅ Aplicación inicializada correctamente');
}

/**
 * Función principal para generar el mapa (llamada desde HTML)
 */
async function generarMapa() {
    // Validar formulario
    if (!uiManager.validateForm()) {
        return;
    }

    const { estado, nNodos } = uiManager.getFormValues();
    
    // Mostrar loading
    uiManager.toggleLoading(true);
    
    // Limpiar mapa y cache
    mapManager.clearMap();
    apiClient.clearCache();

    try {
        // Paso 1: Generar nodos base
        uiManager.updateLoadingProgress(1, 3, 'Generando ubicaciones...');
        const nodosData = await apiClient.generateNodes(estado, nNodos);
        
        // Paso 2: Obtener múltiples rutas para cada destino
        uiManager.updateLoadingProgress(2, 3, 'Calculando rutas múltiples...');
        const rutasData = await routeManager.getMultipleRoutes(
            nodosData.nodo_principal, 
            nodosData.nodos_secundarios
        );
        
        // Paso 3: Mostrar en mapa y panel
        uiManager.updateLoadingProgress(3, 3, 'Actualizando visualización...');
        currentData = {
            nodo_principal: nodosData.nodo_principal,
            nodos_secundarios: nodosData.nodos_secundarios,
            rutas_data: rutasData
        };
        
        await mostrarResultados(currentData);
        
        // Actualizar estadísticas
        const stats = routeManager.getRouteStats();
        uiManager.updatePanelHeader(stats);
        
        console.log('✅ Mapa generado correctamente');
        console.log(`📊 Total: ${stats.totalRoutes} rutas para ${stats.totalDestinations} destinos`);

    } catch (error) {
        console.error('❌ Error generando mapa:', error);
        uiManager.showError(`No se pudo generar el mapa: ${error.message}`);
    } finally {
        uiManager.toggleLoading(false);
    }
}

/**
 * Mostrar resultados en mapa y panel
 */
async function mostrarResultados(data) {
    // Agregar nodo principal
    mapManager.addPrincipalNode(data.nodo_principal);
    
    // Agregar nodos secundarios y sus rutas
    data.rutas_data.forEach((destinoData, index) => {
        const destino = destinoData.destino;
        const rutas = destinoData.rutas || [];
        
        // Agregar marcador del destino
        mapManager.addSecondaryNode(destino, index);
        
        // Agregar todas las rutas para este destino
        rutas.forEach((ruta, routeIndex) => {
            mapManager.addRoute(ruta, index, routeIndex);
        });
    });
    
    // Ajustar vista del mapa
    mapManager.fitToRoutes();
    
    // Actualizar panel de rutas
    uiManager.updateRoutesPanel(data.rutas_data);
}

/**
 * Resaltar una ruta específica (llamada desde HTML)
 */
function highlightRoute(destinationIndex, routeIndex) {
    // Resaltar en el mapa
    mapManager.highlightRoute(destinationIndex, routeIndex);
    
    // Resaltar en el panel
    uiManager.highlightRouteInPanel(destinationIndex, routeIndex);
    
    // Expandir el destino en el panel si no está visible
    uiManager.expandDestination(destinationIndex);
}

/**
 * Toggle de destino en el panel (llamada desde HTML)
 */
function toggleDestination(destinationIndex) {
    const header = document.querySelector(`[data-destination="${destinationIndex}"]`);
    const routesList = document.getElementById(`routes-${destinationIndex}`);
    
    if (header && routesList) {
        const isActive = header.classList.contains('active');
        
        if (isActive) {
            // Colapsar
            header.classList.remove('active');
            routesList.classList.remove('show');
            // Restaurar vista normal del mapa
            mapManager.resetRouteHighlight();
        } else {
            // Colapsar otros destinos primero
            uiManager.collapseAllDestinations();
            
            // Expandir este destino
            header.classList.add('active');
            routesList.classList.add('show');
        }
    }
}

/**
 * Toggle del panel principal (llamada desde HTML)
 */
function togglePanel() {
    uiManager.togglePanel();
}

/**
 * Limpiar resaltado de rutas
 */
function clearHighlight() {
    mapManager.resetRouteHighlight();
    document.querySelectorAll('.route-item').forEach(item => {
        item.classList.remove('highlighted');
    });
}

/**
 * Manejar errores globales
 */
window.addEventListener('error', function(e) {
    console.error('Error global:', e.error);
    if (uiManager) {
        uiManager.showError('Ha ocurrido un error inesperado');
    }
});

/**
 * Manejar errores de promesas no capturadas
 */
window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesa rechazada:', e.reason);
    if (uiManager) {
        uiManager.showError('Error de conexión o procesamiento');
    }
    e.preventDefault();
});
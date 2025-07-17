class AGManager {
    constructor() {
        this.currentMapData = null;
        this.currentScenario = null;
        this.tiposVehiculos = [
            {"id": 1, "modelo": "Corolla", "tipo": "auto"},
            {"id": 2, "modelo": "Hilux", "tipo": "camion"},
            {"id": 3, "modelo": "Sprinter", "tipo": "van"}
        ];
    }

    setMapData(mapData) {
        this.currentMapData = mapData;
    }

    async createScenario(config) {
        try {
            const response = await fetch('/api/ag/create-scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            
            if (data.success) {
                this.currentScenario = data.escenario;
                return data.escenario;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error creating scenario:', error);
            throw error;
        }
    }

    async executeGeneticAlgorithm(scenario) {
        try {
            const response = await fetch('/api/ag/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ escenario: scenario })
            });

            const data = await response.json();
            
            if (data.success) {
                return data.resultado;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error executing AG:', error);
            throw error;
        }
    }

    exportScenario(scenario, filename = null) {
        const dataStr = JSON.stringify(scenario, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || `escenario_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    getVehicleTypes() {
        return this.tiposVehiculos;
    }

    getCurrentScenario() {
        return this.currentScenario;
    }

    getCurrentMapData() {
        return this.currentMapData;
    }
}
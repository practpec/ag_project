class ApiClient {
    constructor() {
        this.baseUrl = '';
    }

    async generateCompleteRoutes(estado, nNodos) {
        try {
            const response = await fetch('/api/generate-complete-routes', {
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
                throw new Error(data.error || 'Error al generar rutas');
            }

            return data;

        } catch (error) {
            console.error('Error en generateCompleteRoutes:', error);
            throw error;
        }
    }

    async getServerStatus() {
        try {
            const response = await fetch('/api/status');
            return await response.json();
        } catch (error) {
            return { status: 'offline', error: error.message };
        }
    }
}
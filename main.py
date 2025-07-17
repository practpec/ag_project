from flask import Flask, render_template, request, jsonify
from services.maps_service import OSMService
from services.geo_service import GeoServiceOSM

app = Flask(__name__)

# Inicializar servicios
geo_service = GeoServiceOSM()
osm_service = OSMService()

@app.route("/")
def index():
    """Página principal con el mapa"""
    estados = geo_service.get_estados()
    return render_template("index.html", estados=estados)

@app.route("/api/generate-nodes", methods=["POST"])
def generate_nodes():
    """API endpoint para generar nodos y rutas"""
    try:
        data = request.get_json()
        estado = data.get('estado', 'Chiapas')
        n_nodos = data.get('n_nodos', 5)
        
        # Generar nodos secundarios
        nodos_data = geo_service.generar_nodos_secundarios(estado, n_nodos)
        
        # Obtener rutas con OpenStreetMap
        rutas_data = osm_service.obtener_rutas_multiples(
            nodos_data['nodo_principal'], 
            nodos_data['nodos_secundarios']
        )
        
        return jsonify({
            'success': True,
            'nodo_principal': nodos_data['nodo_principal'],
            'nodos_secundarios': nodos_data['nodos_secundarios'],
            'rutas': rutas_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/route", methods=["POST"])
def get_route():
    """API endpoint para obtener una ruta específica"""
    try:
        data = request.get_json()
        origen = data.get('origen')
        destino = data.get('destino')
        
        ruta = osm_service.obtener_ruta(origen, destino)
        
        return jsonify({
            'success': True,
            'ruta': ruta
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
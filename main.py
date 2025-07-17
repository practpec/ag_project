from flask import Flask, render_template, request, jsonify, send_from_directory, session
from services.maps_service import OSMService
from services.geo_service import GeoServiceOSM
import json
import random

app = Flask(__name__)
app.secret_key = 'emergencia_logistics_2025'

geo_service = GeoServiceOSM()
osm_service = OSMService()

def cargar_entities():
    """Cargar todos los archivos JSON de entities"""
    entities = {}
    
    try:
        with open('entities/desastres.json', 'r', encoding='utf-8') as f:
            entities['desastres'] = json.load(f)
        
        with open('entities/vehiculos.json', 'r', encoding='utf-8') as f:
            entities['vehiculos'] = json.load(f)
        
        with open('entities/categorias_insumos.json', 'r', encoding='utf-8') as f:
            entities['categorias_insumos'] = json.load(f)
            
    except Exception as e:
        print(f"Error cargando entities: {e}")
        entities = {'desastres': [], 'vehiculos': [], 'categorias_insumos': []}
    
    return entities

@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('templates/static', filename)

@app.route("/")
def index():
    estados = geo_service.get_estados()
    entities = cargar_entities()
    
    return render_template("index.html", 
                         estados=estados,
                         tipos_desastre=entities['desastres'],
                         tipos_vehiculos=entities['vehiculos'],
                         categorias_insumos=entities['categorias_insumos'])

@app.route("/api/generate-complete-routes", methods=["POST"])
def generate_complete_routes():
    try:
        data = request.get_json()
        estado = data.get('estado', 'Chiapas')
        n_nodos = data.get('n_nodos', 5)
        
        nodos_data = geo_service.generar_nodos_secundarios(estado, n_nodos)
        
        rutas_completas = osm_service.obtener_rutas_completas_optimizado(
            nodos_data['nodo_principal'], 
            nodos_data['nodos_secundarios']
        )
        
        # Guardar datos en sesión para AG
        session['mapa_data'] = {
            'punto_inicio': estado,
            'nodos_secundarios': nodos_data['nodos_secundarios'],
            'rutas_data': rutas_completas
        }
        
        return jsonify({
            'success': True,
            'nodo_principal': nodos_data['nodo_principal'],
            'nodos_secundarios': nodos_data['nodos_secundarios'],
            'rutas_data': rutas_completas
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route("/api/ag/create-scenario", methods=["POST"])
def create_scenario():
    try:
        data = request.get_json()
        mapa_data = session.get('mapa_data')
        
        if not mapa_data:
            return jsonify({'success': False, 'error': 'No hay datos de mapa'}), 400
        
        entities = cargar_entities()
        
        # Crear destinos_rutas en el formato especificado
        destinos_rutas = []
        ruta_id = 1
        
        for i, nodo in enumerate(mapa_data['nodos_secundarios']):
            destino_name = f"destino{i+1}"
            distancia = nodo.get('distancia_directa', 25)
            
            # Ruta principal
            destinos_rutas.append({
                "id_destino_ruta": ruta_id,
                "salida": "salida unica",
                "destino": destino_name,
                "distancia_km": distancia
            })
            ruta_id += 1
            
            # Agregar ruta alternativa si hay múltiples rutas en rutas_data
            ruta_destino = next((r for r in mapa_data['rutas_data'] if r['indice'] == i), None)
            if ruta_destino and len(ruta_destino.get('rutas', [])) > 1:
                distancia_alt = ruta_destino['rutas'][1]['distancia']['value'] / 1000
                destinos_rutas.append({
                    "id_destino_ruta": ruta_id,
                    "salida": "salida unica", 
                    "destino": destino_name,
                    "distancia_km": round(distancia_alt, 1)
                })
                ruta_id += 1
        
        # Generar rutas_estado con detalles
        rutas_estado = []
        vehiculos_entities = entities['vehiculos']
        tipos_disponibles = [v['tipo'] for v in vehiculos_entities]
        
        for ruta in destinos_rutas:
            # Vehiculos permitidos (1-3 tipos aleatorios)
            num_tipos = random.randint(1, len(tipos_disponibles))
            vehiculos_permitidos = random.sample(tipos_disponibles, num_tipos)
            
            # Estado de ruta (85% abiertas, 15% cerradas)
            estado = "abierta" if random.random() > 0.15 else "cerrada"
            
            # Razón del bloqueo si está cerrada
            razon_bloqueo = None
            if estado == "cerrada":
                razones = [
                    "Derrumbe en carretera",
                    "Puente dañado", 
                    "Inundación parcial",
                    "Bloqueo por manifestantes",
                    "Mantenimiento vial"
                ]
                razon_bloqueo = random.choice(razones)
            
            rutas_estado.append({
                "id_destino_ruta": ruta["id_destino_ruta"],
                "estado": estado,
                "vehiculos_permitidos": vehiculos_permitidos,
                "razon_bloqueo": razon_bloqueo,
                "destino": ruta["destino"],
                "distancia_km": ruta["distancia_km"]
            })
        
        # Procesar vehículos con detalles completos
        vehiculos_configurados = []
        vehiculos_solicitados = data.get('vehiculos', [])
        
        for i, vehiculo_config in enumerate(vehiculos_solicitados):
            tipo_vehiculo = vehiculo_config.get('tipo')
            
            # Buscar detalles del vehículo en entities
            vehiculo_entity = next((v for v in vehiculos_entities if v['tipo'] == tipo_vehiculo), None)
            
            if vehiculo_entity:
                vehiculos_configurados.append({
                    "vehiculo_id": i + 1,
                    "tipo": vehiculo_entity['tipo'],
                    "modelo": vehiculo_entity['modelo'],
                    "velocidad_kmh": vehiculo_entity['velocidad_kmh'],
                    "consumo_litros_km": vehiculo_entity['consumo_litros_km'],
                    "maximo_peso_ton": vehiculo_entity['maximo_peso_ton'],
                    "capacidad_kg": vehiculo_entity['maximo_peso_ton'] * 1000
                })
        
        # Buscar detalles del tipo de desastre
        tipo_desastre = data.get('tipo_desastre')
        desastre_entity = next((d for d in entities['desastres'] if d['tipo'] == tipo_desastre), None)
        
        escenario = {
            "punto_partida": mapa_data['punto_inicio'],
            "tipo_desastre": tipo_desastre,
            "desastre_detalles": desastre_entity,
            "vehiculos_disponibles": vehiculos_configurados,
            "destinos_rutas": [destinos_rutas],
            "rutas_estado": rutas_estado,
            "categorias_insumos": entities['categorias_insumos'],
            "estadisticas": {
                "total_destinos": len(set(r['destino'] for r in destinos_rutas)),
                "total_rutas": len(destinos_rutas),
                "rutas_abiertas": len([r for r in rutas_estado if r['estado'] == 'abierta']),
                "rutas_cerradas": len([r for r in rutas_estado if r['estado'] == 'cerrada']),
                "total_vehiculos": len(vehiculos_configurados)
            }
        }
        
        session['escenario_actual'] = escenario
        
        return jsonify({'success': True, 'escenario': escenario})
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/api/entities/<entity_type>", methods=["GET"])
def get_entity_data(entity_type):
    """Obtener datos específicos de una entidad"""
    try:
        entities = cargar_entities()
        if entity_type in entities:
            return jsonify({'success': True, 'data': entities[entity_type]})
        else:
            return jsonify({'success': False, 'error': 'Entidad no encontrada'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route("/api/status")
def get_status():
    return jsonify({
        'status': 'online',
        'message': 'Servidor funcionando correctamente'
    })

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)
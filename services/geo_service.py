import random
import math

class GeoServiceOSM:
    """Servicio para manejo de datos geográficos con OpenStreetMap"""
    
    def __init__(self):
        self.ESTADOS_COORDS = {
            "Chiapas": {"lat": 16.75, "lng": -93.1167, "nombre": "Chiapas"},
            "CDMX": {"lat": 19.4326, "lng": -99.1332, "nombre": "Ciudad de México"},
            "Jalisco": {"lat": 20.6597, "lng": -103.3496, "nombre": "Jalisco"},
            "Nuevo León": {"lat": 25.6866, "lng": -100.3161, "nombre": "Nuevo León"},
            "Yucatán": {"lat": 20.7099, "lng": -89.0943, "nombre": "Yucatán"},
            "Oaxaca": {"lat": 17.0732, "lng": -96.7266, "nombre": "Oaxaca"},
            "Puebla": {"lat": 19.0414, "lng": -98.2063, "nombre": "Puebla"},
            "Veracruz": {"lat": 19.1738, "lng": -96.1342, "nombre": "Veracruz"},
            "Guanajuato": {"lat": 21.0190, "lng": -101.2574, "nombre": "Guanajuato"},
            "Michoacán": {"lat": 19.5665, "lng": -101.7068, "nombre": "Michoacán"},
            "Guerrero": {"lat": 17.4392, "lng": -99.5451, "nombre": "Guerrero"},
            "Sonora": {"lat": 29.2972, "lng": -110.3309, "nombre": "Sonora"},
            "Tamaulipas": {"lat": 24.2669, "lng": -98.8363, "nombre": "Tamaulipas"},
            "Sinaloa": {"lat": 25.1721, "lng": -107.4795, "nombre": "Sinaloa"},
            "Coahuila": {"lat": 27.0587, "lng": -101.7068, "nombre": "Coahuila"},
            "Quintana Roo": {"lat": 19.1817, "lng": -88.4791, "nombre": "Quintana Roo"},
            "Baja California": {"lat": 30.8406, "lng": -115.2838, "nombre": "Baja California"},
            "San Luis Potosí": {"lat": 22.1565, "lng": -100.9855, "nombre": "San Luis Potosí"}
        }
    
    def get_estados(self):
        """Obtener lista de estados disponibles"""
        return list(self.ESTADOS_COORDS.keys())
    
    def get_coordenadas_estado(self, estado):
        """Obtener coordenadas de un estado específico"""
        return self.ESTADOS_COORDS.get(estado)
    
    def calcular_distancia_haversine(self, lat1, lon1, lat2, lon2):
        """
        Calcular distancia entre dos puntos usando la fórmula de Haversine
        """
        R = 6371  # Radio de la Tierra en kilómetros
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def generar_coordenadas_mexico_inteligentes(self, estado_base, cantidad=100):
        """
        Generar coordenadas más inteligentes cerca de ciudades conocidas
        """
        coordenadas = []
        
        # Ciudades principales por estado
        ciudades_mexico = {
            "Chiapas": [
                (16.7569, -93.1292),  # Tuxtla Gutiérrez
                (16.7409, -92.6375),  # San Cristóbal
                (17.5569, -93.4016),  # Palenque
                (16.2418, -93.7636),  # Tapachula
            ],
            "CDMX": [
                (19.4326, -99.1332),  # Centro
                (19.3629, -99.2837),  # Santa Fe
                (19.5047, -99.1181),  # Satélite
                (19.2911, -99.0940),  # Coyoacán
            ],
            "Jalisco": [
                (20.6597, -103.3496), # Guadalajara
                (20.5888, -103.4224), # Zapopan
                (20.6668, -105.2064), # Puerto Vallarta
                (20.5230, -103.4068), # Tlaquepaque
            ],
            # Agregar más según necesidad
        }
        
        base_coords = self.get_coordenadas_estado(estado_base)
        ciudades_estado = ciudades_mexico.get(estado_base, [])
        
        # Si no hay ciudades definidas, usar el centro del estado
        if not ciudades_estado:
            ciudades_estado = [(base_coords['lat'], base_coords['lng'])]
        
        # Generar puntos alrededor de las ciudades
        for ciudad_lat, ciudad_lng in ciudades_estado:
            puntos_por_ciudad = cantidad // len(ciudades_estado)
            
            for _ in range(puntos_por_ciudad):
                # Generar punto aleatorio en un radio de 50km alrededor de la ciudad
                angle = random.uniform(0, 2 * math.pi)
                radius = random.uniform(5, 50)  # Entre 5 y 50 km
                
                # Convertir a grados (aproximación)
                lat_offset = (radius / 111.32) * math.cos(angle)
                lng_offset = (radius / (111.32 * math.cos(math.radians(ciudad_lat)))) * math.sin(angle)
                
                nueva_lat = ciudad_lat + lat_offset
                nueva_lng = ciudad_lng + lng_offset
                
                # Verificar que esté dentro de México
                if 14.5 <= nueva_lat <= 32.7 and -118.4 <= nueva_lng <= -86.7:
                    coordenadas.append({"lat": nueva_lat, "lng": nueva_lng})
        
        # Completar con puntos aleatorios si es necesario
        while len(coordenadas) < cantidad:
            lat = random.uniform(
                max(14.5, base_coords['lat'] - 2),
                min(32.7, base_coords['lat'] + 2)
            )
            lng = random.uniform(
                max(-118.4, base_coords['lng'] - 2),
                min(-86.7, base_coords['lng'] + 2)
            )
            coordenadas.append({"lat": lat, "lng": lng})
        
        return coordenadas[:cantidad]
    
    def filtrar_nodos_por_distancia(self, nodo_principal, nodos_candidatos, radio_km=100):
        """
        Filtrar nodos que estén dentro del radio especificado
        """
        nodos_filtrados = []
        
        for nodo in nodos_candidatos:
            distancia = self.calcular_distancia_haversine(
                nodo_principal["lat"], nodo_principal["lng"],
                nodo["lat"], nodo["lng"]
            )
            
            if distancia <= radio_km:
                nodos_filtrados.append({
                    "lat": nodo["lat"],
                    "lng": nodo["lng"],
                    "distancia_directa": round(distancia, 2)
                })
        
        return nodos_filtrados
    
    def generar_nodos_secundarios(self, estado, cantidad_nodos):
        """
        Generar nodos secundarios para un estado específico
        """
        nodo_principal = self.get_coordenadas_estado(estado)
        
        if not nodo_principal:
            raise ValueError(f"Estado '{estado}' no encontrado")
        
        # Generar nodos inteligentes cerca de ciudades
        nodos_candidatos = self.generar_coordenadas_mexico_inteligentes(
            estado, cantidad_nodos * 5
        )
        
        # Filtrar nodos dentro del radio de 100km
        nodos_filtrados = self.filtrar_nodos_por_distancia(
            nodo_principal, nodos_candidatos, 100
        )
        
        # Si no hay suficientes nodos, generar algunos aleatorios
        if len(nodos_filtrados) < cantidad_nodos:
            nodos_extra = self._generar_nodos_aleatorios_cerca(
                nodo_principal, cantidad_nodos - len(nodos_filtrados)
            )
            nodos_filtrados.extend(nodos_extra)
        
        # Seleccionar solo la cantidad solicitada
        nodos_secundarios = random.sample(
            nodos_filtrados, 
            min(cantidad_nodos, len(nodos_filtrados))
        )
        
        return {
            "nodo_principal": nodo_principal,
            "nodos_secundarios": nodos_secundarios
        }
    
    def _generar_nodos_aleatorios_cerca(self, nodo_central, cantidad):
        """
        Generar nodos aleatorios cerca de un punto central
        """
        nodos = []
        
        for _ in range(cantidad * 3):  # Generar extra para filtrar
            # Generar punto aleatorio en círculo de 100km
            angle = random.uniform(0, 2 * math.pi)
            radius = random.uniform(10, 100)  # Entre 10 y 100 km
            
            lat_offset = (radius / 111.32) * math.cos(angle)
            lng_offset = (radius / (111.32 * math.cos(math.radians(nodo_central['lat'])))) * math.sin(angle)
            
            nueva_lat = nodo_central['lat'] + lat_offset
            nueva_lng = nodo_central['lng'] + lng_offset
            
            # Verificar que esté dentro de México
            if 14.5 <= nueva_lat <= 32.7 and -118.4 <= nueva_lng <= -86.7:
                distancia = self.calcular_distancia_haversine(
                    nodo_central['lat'], nodo_central['lng'],
                    nueva_lat, nueva_lng
                )
                
                if distancia <= 100:
                    nodos.append({
                        "lat": nueva_lat,
                        "lng": nueva_lng,
                        "distancia_directa": round(distancia, 2)
                    })
                    
                    if len(nodos) >= cantidad:
                        break
        
        return nodos[:cantidad]
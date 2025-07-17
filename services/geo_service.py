import folium
import random
from geopy.distance import geodesic

# Coordenadas aproximadas del centro de algunos estados
ESTADOS_COORDS = {
    "Chiapas": (16.75, -93.1167),
    "CDMX": (19.4326, -99.1332),
    "Jalisco": (20.6597, -103.3496),
    "Nuevo León": (25.6866, -100.3161),
    "Yucatán": (20.7099, -89.0943),
    "Oaxaca": (17.0732, -96.7266),
    "Puebla": (19.0414, -98.2063),
}

# Esta función genera un mapa con nodos y rutas desde el estado seleccionado
def generar_mapa(estado, n_nodos):
    nodo_principal = ESTADOS_COORDS[estado]
    mapa = folium.Map(location=nodo_principal, zoom_start=8)
    
    # Nodo principal (estado seleccionado)
    folium.Marker(
        location=nodo_principal,
        popup=f"Nodo principal: {estado}",
        icon=folium.Icon(color='red', icon='star')
    ).add_to(mapa)

    # Generar nodos aleatorios dentro del país
    nodos_secundarios = []
    for _ in range(n_nodos * 2):  # Generar el doble por si varios quedan fuera del rango
        lat = random.uniform(14.5, 27.0)
        lon = random.uniform(-118.0, -86.0)
        nodos_secundarios.append((lat, lon))

    # Filtrar nodos dentro de 100km del nodo principal
    nodos_dentro_rango = []
    for nodo in nodos_secundarios:
        distancia_km = geodesic(nodo_principal, nodo).km
        if distancia_km <= 100:
            nodos_dentro_rango.append((nodo, round(distancia_km, 2)))

    # Dibujar rutas y marcadores
    for nodo, distancia in nodos_dentro_rango[:n_nodos]:  # Solo mostrar máximo n_nodos
        folium.Marker(
            location=nodo,
            popup=f"Distancia: {distancia} km",
            icon=folium.Icon(color='blue')
        ).add_to(mapa)

        folium.PolyLine([nodo_principal, nodo], color="blue", weight=2.5, opacity=0.7).add_to(mapa)

    # Círculo de 100km
    folium.Circle(
        location=nodo_principal,
        radius=100000,  # metros
        color='green',
        fill=True,
        fill_opacity=0.1
    ).add_to(mapa)

    return mapa

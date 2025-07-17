
# 🧠 Algoritmo Genético para Distribución Logística de Ayuda Humanitaria

## 📝 Descripción del Problema

Este proyecto implementa un sistema de asignación óptima de vehículos e insumos para la atención de desastres naturales en una región afectada, utilizando un **algoritmo genético**.

La región se modela como un conjunto de **nodos conectados entre sí por rutas**. Cada ejecución representa la convinacion de vehiculos, los insumos de cada vehiculo y las rutas tomadas segun su destino, esto considerando(bloqueo de caminos, restricciones por tipo de vehículo, punto de partida aleatorio, etc.).

El objetivo del sistema es maximizar la cobertura logística y la eficiencia del uso de recursos en la entrega de insumos humanitarios a múltiples destinos, **teniendo en cuenta restricciones reales** como peso, rutas, tipo de vehículo y prioridades de insumos según el tipo de desastre.

---

## 🎯 Objetivo del Algoritmo Genético

**Asignar óptimamente vehículos a destinos** con la mejor combinación posible de insumos, de manera que:

- Se cubran la mayor cantidad posible de destinos afectados.
- Se entreguen insumos relevantes con base en la prioridad del desastre.
- Se aproveche al máximo la capacidad de carga de cada vehículo.
- Se respeten restricciones de ruta y tipo de vehículo.
- Cada vehículo haga **un solo trayecto a un único destino**.

---

## 📦 Datos de Entrada

Los datos de entrada están definidos en archivos JSON que representan el escenario completo. Estos archivos incluyen:

### 1. `vehiculos.json`
Lista de vehículos disponibles con sus características:
- Tipo (auto, van, camión)
- Capacidad de carga máxima (toneladas)
- Velocidad
- Consumo de combustible

### 2. `categorias_insumos.json`
Lista de categorías de insumos disponibles para enviar, con su peso promedio por unidad.

### 3. `desastres.json`
Definición de tipos de desastre y su prioridad asociada a cada categoría de insumos (alta, media, baja).

### 4. `nodos.json`
Lista de ubicaciones o puntos geográficos (pueden ser tanto orígenes como destinos).

### 5. `rutas.json`
Lista de rutas entre nodos, con distancia (en km).

### 6. `escenario.json`
Archivo que representa el escenario específico de ejecución:
- Tipo de desastre (solo uno por escenario)
- Punto de partida del convoy (aleatorio)
- Ubicaciones afectadas (destinos)
- Rutas habilitadas y restricciones de vehículos por ruta
- Vehículos disponibles

---

## 🔄 Aleatoriedad

El sistema genera aleatoriamente los siguientes elementos en cada simulación de escenario:

- **Punto de partida (origen de vehículos)**: Se selecciona aleatoriamente de entre los nodos.
- **Rutas habilitadas / bloqueadas**: Determina cuáles caminos están disponibles.
- **Restricciones de vehículos por ruta**: Qué tipos de vehículos pueden usar cada ruta.
- **Tipo de desastre del escenario**: Puede variar entre terremoto, inundación, incendio, etc.
- **Destinos afectados**: Se seleccionan de entre los nodos como ubicaciones de entrega.

---

## 🧬 ¿Qué hace el algoritmo genético?

El AG tiene como responsabilidad principal:

- Decidir **qué vehículo** irá a **qué destino**.
- Seleccionar **qué cantidad de cada tipo de insumo** llevará ese vehículo.
- Asegurarse de que la combinación de carga sea válida (no exceda peso).
- Evaluar rutas válidas según restricciones.
- Optimizar el aprovechamiento de carga y prioridad de insumos.

---

## 🧬 Estructura del cromosoma

Cada individuo (solución) está compuesto por un conjunto de genes, donde **cada gen representa un vehículo con su asignación**:

```json
{
  "vehiculo_id": 2,
  "origen": "Ubicacion2",
  "destino": "Ubicacion4",
  "ruta": ["Ubicacion2", "Ubicacion4"],
  "insumos": {
    "Alimentación básica": 80,
    "Medicamentos e insumos médicos": 20
  }
}
```

---

## 📤 Datos de Salida

El algoritmo genético devuelve la mejor solución encontrada, representada como:

- Una lista de vehículos con:
  - Su destino asignado.
  - La ruta utilizada.
  - Los insumos transportados.
- El valor de la función de fitness de esa solución.
- Estadísticas globales como:
  - Porcentaje de cobertura de destinos.
  - Aprovechamiento promedio de la capacidad de carga.
  - Cantidad de insumos prioritarios entregados.

---

## 🧠 Función de Fitness

Una función compuesta que combina varios criterios:

```
fitness = 
  (peso_entregado_relevante * ponderación_prioridad) +
  (porcentaje_aprovechamiento_carga * 0.2) -
  (penalizaciones: exceso de peso, rutas inválidas, insumos irrelevantes)
```

---

## ⚠️ Restricciones Importantes

- Cada vehículo puede visitar **solo un destino** por ejecución.
- No se permite exceder la capacidad de carga del vehículo.
- Solo pueden circular por rutas habilitadas y compatibles con su tipo.
- Las rutas deben estar disponibles según el escenario.
- No se permiten repeticiones de destino por más de un vehículo (opcionalmente configurable).

---

## 🧪 Posibles mejoras futuras

- Reintentos con caminos alternativos.
- Validación por condiciones climáticas por nodo.
- Introducción de costos y tiempo como restricciones adicionales.
- Modelado de múltiples turnos o fases de entrega.

---

## 🧰 Requisitos Técnicos

- Node.js / Python (según implementación del AG)
- Archivos JSON configurables en `data/`
- Motor de AG propio o biblioteca como `DEAP`, `pygad`, o implementación desde cero

---

## 👨‍💻 Autor

Desarrollado como solución de optimización logística en contextos de emergencia, con un enfoque en arquitectura limpia, modularidad y separación de capas.

"""
LECCIÓN 4: FUNCIONES

Una función agrupa instrucciones reutilizables.
Ejecuta:
    python programacion/python/04_funciones.py
"""


def saludar(nombre):
    """Devuelve un saludo para el nombre recibido."""
    return f"Hola, {nombre}. ¡Bienvenido a Python!"


def calcular_promedio(numeros):
    """Calcula el promedio de una lista no vacía de números."""
    if not numeros:
        raise ValueError("La lista debe contener al menos un número.")

    return sum(numeros) / len(numeros)


def es_aprobatoria(calificacion, minimo=6):
    """Indica si una calificación alcanza el mínimo indicado."""
    if not 0 <= calificacion <= 10:
        raise ValueError("La calificación debe estar entre 0 y 10.")

    return calificacion >= minimo


print(saludar("Estudiante"))

datos = [8, 9, 7, 10]
print("Promedio:", calcular_promedio(datos))
print("¿Aprobó?", es_aprobatoria(8))

# RETO:
# 1. Crea una función que reciba dos números y devuelva el mayor.
# 2. Prueba la función con tres pares de números distintos.

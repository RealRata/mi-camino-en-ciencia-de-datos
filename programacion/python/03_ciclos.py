"""
LECCIÓN 3: CICLOS

Un ciclo repite instrucciones.
Ejecuta:
    python programacion/python/03_ciclos.py
"""

# for recorre una secuencia.
print("Conteo con for:")
for numero in range(1, 6):
    print(numero)

# while repite mientras la condición sea verdadera.
print("\nConteo con while:")
contador = 1
while contador <= 5:
    print(contador)
    contador += 1  # Importante: actualizar el contador para evitar un ciclo infinito.

# Recorrer una lista.
materias = ["Matemáticas", "Programación", "Estadística"]
print("\nMaterias:")
for materia in materias:
    print("-", materia)

# Acumular valores.
calificaciones = [8, 9, 7, 10]
suma = 0

for calificacion in calificaciones:
    suma += calificacion

promedio = suma / len(calificaciones)
print("\nPromedio:", promedio)

# RETO:
# Crea una lista con cinco números.
# Usa un ciclo para calcular su suma y su promedio.

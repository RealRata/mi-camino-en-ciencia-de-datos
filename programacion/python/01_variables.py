"""
LECCIÓN 1: VARIABLES, TIPOS DE DATOS Y OPERACIONES

Ejecuta:
    python programacion/python/01_variables.py
"""

# Una variable guarda un dato con un nombre.
nombre = "Estudiante"
edad = 18
estatura_metros = 1.70
esta_aprendiendo = True

print("Hola,", nombre)
print("Edad:", edad)
print("Estatura:", estatura_metros, "metros")
print("¿Está aprendiendo Python?", esta_aprendiendo)

# Tipos de datos básicos.
print("\nTipos de datos:")
print(type(nombre))           # str: texto
print(type(edad))             # int: entero
print(type(estatura_metros))  # float: decimal
print(type(esta_aprendiendo)) # bool: verdadero o falso

# Operaciones matemáticas.
a = 10
b = 3

print("\nOperaciones:")
print("Suma:", a + b)
print("Resta:", a - b)
print("Multiplicación:", a * b)
print("División:", a / b)
print("División entera:", a // b)
print("Residuo:", a % b)
print("Potencia:", a ** b)

# Conversión de tipos.
edad_como_texto = str(edad)
numero_como_entero = int("25")
precio = float("19.90")

print("\nConversiones:")
print(edad_como_texto, type(edad_como_texto))
print(numero_como_entero, type(numero_como_entero))
print(precio, type(precio))

# RETO:
# 1. Cambia el nombre y la edad.
# 2. Crea dos variables numéricas llamadas numero_1 y numero_2.
# 3. Imprime su suma, resta y multiplicación.

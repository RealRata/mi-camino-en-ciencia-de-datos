"""
LECCIÓN 2: CONDICIONALES

Los condicionales permiten ejecutar instrucciones según una condición.
Ejecuta:
    python programacion/python/02_condicionales.py
"""

calificacion = 8.5

if calificacion >= 6:
    print("Resultado: aprobado")
else:
    print("Resultado: no aprobado")

# elif permite revisar más de dos posibilidades.
temperatura = 22

if temperatura >= 30:
    print("Hace calor.")
elif temperatura >= 18:
    print("La temperatura es templada.")
else:
    print("Hace frío.")

# Operadores de comparación: ==, !=, >, <, >=, <=
# Operadores lógicos: and, or, not
edad = 20
tiene_identificacion = True

if edad >= 18 and tiene_identificacion:
    print("Se cumplen ambas condiciones.")
else:
    print("Falta cumplir alguna condición.")

# Entrada validada: evitar que el programa falle si se escribe texto.
texto = input("\nEscribe tu edad en años: ").strip()

try:
    edad_usuario = int(texto)
    if edad_usuario < 0:
        print("La edad no puede ser negativa.")
    elif edad_usuario >= 18:
        print("Eres mayor de edad.")
    else:
        print("Eres menor de edad.")
except ValueError:
    print("Entrada no válida: escribe un número entero.")

# RETO:
# Pide una calificación entre 0 y 10.
# Si está fuera del intervalo, informa que no es válida.
# Si es válida, indica si se aprobó (6 o más).

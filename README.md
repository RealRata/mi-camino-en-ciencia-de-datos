# Ciencia de Datos desde Cero

Repositorio educativo abierto para estudiar los contenidos de la Licenciatura en Ciencia de Datos de la UNAM y practicar los fundamentos mediante ejercicios, código y proyectos.

## Documento académico de referencia

**Plan de Estudios de la Licenciatura en Ciencia de Datos, Sistema Escolarizado**, aprobado por el H. Consejo Universitario el 27 de marzo de 2019. La entidad académica responsable que indica el documento es el Instituto de Investigaciones en Matemáticas y en Sistemas (IIMAS).

La licenciatura tiene una duración de ocho semestres y está organizada en tres etapas:

1. **Etapa básica (primero a cuarto semestre):** corresponde a una carrera de origen. El documento presenta nueve trayectorias distintas; las asignaturas y créditos dependen de la carrera y entidad.
2. **Etapa intermedia (quinto a séptimo semestre):** desarrolla competencias propias de Ciencia de Datos y contempla asignaturas de Matemáticas, Computación, área Socioeconómico-Administrativa y Ciencias-Sociales.
3. **Etapa de profundización (octavo semestre):** permite profundizar en campos profesionales y de aplicación mediante asignaturas obligatorias y optativas.

## Guía web

- [Página principal del proyecto](https://realrata.github.io/mi-camino-en-ciencia-de-datos/)
- [Plan de estudios desglosado por etapas, carreras de origen y semestres](https://realrata.github.io/mi-camino-en-ciencia-de-datos/plan-estudios.html)

La guía web transcribe las carreras de origen, las asignaturas comunes de Ciencia de Datos y el catálogo de optativas que aparecen en el documento proporcionado. También señala las diferencias internas de conteo y distribución que aparecen entre el resumen y las tablas del propio plan, sin resolverlas mediante información externa.

## Nuevas formas de aprender

La plataforma incluye una guía de aprendizaje activo con seis métodos: misiones por problemas, laboratorios de datos, proyectos integradores, retos de programación, aprendizaje enseñando y portafolio de evidencias. También incluye un ciclo de estudio en cinco pasos, criterios de evaluación y un proyecto práctico de análisis de mercados y tianguis.

- [Abrir nuevas formas de aprender](https://realrata.github.io/mi-camino-en-ciencia-de-datos/formas-de-aprender.html)

Estos métodos son propuestas didácticas complementarias; no sustituyen ni modifican las asignaturas oficiales.

## Materiales didácticos

Los ejercicios, explicaciones, prácticas, evaluaciones y proyectos que se incorporen al repositorio son materiales complementarios de aprendizaje. No son asignaturas oficiales, no sustituyen los programas de cada materia ni modifican el plan de estudios de la UNAM.

## Estructura del repositorio

```text
.
├── index.html
├── plan-estudios.html
├── styles.css
├── script.js
└── programacion/
    └── python/
        ├── README.md
        ├── 01_variables.py
        ├── 02_condicionales.py
        ├── 03_ciclos.py
        └── 04_funciones.py
```

## Uso público

Cualquier persona puede consultar los materiales sin tener una cuenta de GitHub. Para ejecutar los ejercicios de Python en una computadora, descarga el repositorio con **Code → Download ZIP**, descomprime la carpeta y ábrela en un editor de código compatible con Python.

El avance marcado en la página web se guarda localmente en el navegador y dispositivo de cada visitante; no se comparte entre personas ni dispositivos.

## Alcance y precisión

El documento de 2019 es la fuente de referencia de esta guía. La información de la carrera de origen debe leerse según la trayectoria correspondiente. La oferta de grupos y asignaturas puede estar sujeta a la programación académica de la UNAM. Esta plataforma es un recurso educativo independiente.


## Asistente de IA

El chat usa un backend seguro en Cloudflare Workers. La clave de OpenAI se guarda como secreto del Worker y nunca se publica en GitHub ni en el navegador.

### Activación inicial (una sola vez)

1. En GitHub abre **Settings → Secrets and variables → Actions**.
2. Crea estos tres **Repository secrets**:
   - `CLOUDFLARE_API_TOKEN`: token de Cloudflare con permisos para desplegar Workers Scripts en la cuenta.
   - `CLOUDFLARE_ACCOUNT_ID`: identificador de tu cuenta de Cloudflare.
   - `OPENAI_API_KEY`: clave de API de OpenAI con facturación y acceso a la API habilitados.
3. En el repositorio abre **Actions → Deploy Data Quest AI → Run workflow**.
4. Cuando termine correctamente, el flujo despliega el Worker, guarda la clave como secreto y configura automáticamente la URL del backend en `script.js`. GitHub Pages publicará el cambio.

Para actualizaciones posteriores del backend, vuelve a ejecutar **Deploy Data Quest AI**. No escribas la clave API en archivos, mensajes, capturas ni commits.

El Worker utiliza la API de Responses de OpenAI con el modelo `gpt-6-luna`. Consulta [la referencia de modelos de OpenAI](https://developers.openai.com/api/reference/resources/responses/methods/create) y [la documentación de Workers](https://developers.cloudflare.com/workers/).

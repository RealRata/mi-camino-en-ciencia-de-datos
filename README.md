# Mi camino en Ciencia de Datos

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


## Asistente de IA (configuración pendiente de despliegue)

La página incluye un chat lateral. Para activar respuestas reales, despliega el backend de Cloudflare Workers incluido en `worker/worker.js`. GitHub Pages solo publica archivos estáticos y no puede guardar de forma segura una clave API.

1. Crea una cuenta en Cloudflare y configura Wrangler siguiendo la [guía oficial](https://developers.cloudflare.com/workers/wrangler/).
2. Desde la raíz del repositorio, ejecuta `npx wrangler login`.
3. Despliega el Worker con `npx wrangler deploy`.
4. Guarda la clave de OpenAI como secreto del Worker, nunca en el repositorio: `npx wrangler secret put OPENAI_API_KEY`.
5. Copia la dirección `*.workers.dev` que te entregue Cloudflare y añade `/api/chat`.
6. En `script.js`, reemplaza la cadena vacía de `window.DATA_QUEST_CHAT_API || ""` por la dirección completa del endpoint, por ejemplo `https://TU-WORKER.workers.dev/api/chat`, y publica el cambio.

El Worker usa la API de Responses de OpenAI y limita el historial enviado. La clave se mantiene en el servidor. Consulta [cómo proteger las claves API](https://developers.openai.com/api/docs/guides/api-keys) y la [documentación de Workers](https://developers.cloudflare.com/workers/).

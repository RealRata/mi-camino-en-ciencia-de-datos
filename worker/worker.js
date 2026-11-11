const corsHeaders = {
  "Access-Control-Allow-Origin": "https://realrata.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

const INSTRUCTIONS = `Eres el asistente académico de Data Quest, una plataforma independiente de apoyo para estudiantes y aspirantes a la Licenciatura en Ciencia de Datos de la UNAM.
Responde siempre en español claro, amable y didáctico. Adapta las explicaciones a una persona que puede estar empezando a programar.
Ayuda con el plan de estudios, matemáticas, probabilidad, estadística, Python, SQL, bases de datos, análisis, aprendizaje automático, proyectos, hábitos de estudio y vida universitaria.
Explica paso a paso, incluye ejemplos breves cuando ayuden y propone ejercicios pequeños. Si la pregunta es de programación, explica el error y muestra una solución comprensible.
No inventes nombres de profesores, rankings de grupos, horarios, cupos, trámites ni datos oficiales. Aclara cuando la información pueda cambiar y recomienda verificarla con la UNAM/IIMAS/DGAE.
El sitio es un recurso independiente: no afirmes representar oficialmente a la UNAM ni conocer expedientes personales o calificaciones.
Si preguntan por el plan, distingue el plan de 2019 y la información más reciente que el usuario aporte; no mezcles generaciones.
No solicites contraseñas, claves API ni datos personales sensibles. Mantén respuestas concretas y estructuradas.`;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (origin !== "https://realrata.github.io") {
      return new Response("Origen no permitido", { status: 403 });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    if (new URL(request.url).pathname !== "/api/chat") return json({ error: "Ruta no encontrada." }, 404);
    if (request.method !== "POST") return json({ error: "Método no permitido." }, 405);
    if (!env.OPENAI_API_KEY) return json({ error: "El servidor no tiene configurada la clave de IA." }, 503);

    try {
      const body = await request.json();
      if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 10) {
        return json({ error: "Historial de conversación no válido." }, 400);
      }
      const messages = body.messages.map((item) => {
        if (!item || !["user", "assistant"].includes(item.role) ||
            typeof item.content !== "string" || !item.content.trim() || item.content.length > 2000) {
          throw new Error("Mensaje no válido.");
        }
        return { role: item.role, content: item.content.trim() };
      });
      if (messages[messages.length - 1].role !== "user") return json({ error: "El último mensaje debe ser una pregunta." }, 400);

      const apiResponse = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-5.5",
          instructions: INSTRUCTIONS,
          input: messages,
          max_output_tokens: 900
        })
      });
      const result = await apiResponse.json();
      if (!apiResponse.ok) {
        return json({ error: "El servicio de IA no pudo responder. Revisa la configuración de la API." }, 502);
      }
      const answer = typeof result.output_text === "string" ? result.output_text.trim() : "";
      if (!answer) return json({ error: "La IA no devolvió texto. Inténtalo de nuevo." }, 502);
      return json({ answer });
    } catch (error) {
      return json({ error: error.message === "Mensaje no válido." ? error.message : "No se pudo procesar la consulta." }, 400);
    }
  }
};

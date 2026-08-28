// api/calificar.js
// Método Cebolla — prueba de conexión con Claude
// Requiere el secret ANTHROPIC_API_KEY en Cloudflare Workers
// (configúralo con: npx wrangler secret put ANTHROPIC_API_KEY
//  o desde el dashboard: Worker → Configuración → Variables y secretos)

export default {
    async fetch(request, env, ctx) {
          const corsHeaders = {
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          };

      if (request.method === 'OPTIONS') {
              return new Response(null, { status: 200, headers: corsHeaders });
      }

      if (!env.ANTHROPIC_API_KEY) {
              return new Response(JSON.stringify({
                        ok: false,
                        error: 'Falta ANTHROPIC_API_KEY. Configúrala con "npx wrangler secret put ANTHROPIC_API_KEY" y vuelve a desplegar.'
              }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const esPrueba = request.method === 'GET';
          let mensaje = 'Responde solamente: Conexion correcta con Metodo Cebolla.';
          if (!esPrueba) {
                  try {
                            const body = await request.json();
                            mensaje = (body && body.mensaje) || 'Responde solamente: Conexion correcta.';
                  } catch (e) {
                            // cuerpo vacío o no-JSON: se usa el mensaje por defecto
                  }
          }

      try {
              const r = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                                    'content-type': 'application/json',
                                    'x-api-key': env.ANTHROPIC_API_KEY,
                                    'anthropic-version': '2023-06-01'
                        },
                        body: JSON.stringify({
                                    model: 'claude-sonnet-4-6',
                                    max_tokens: 200,
                                    messages: [{ role: 'user', content: mensaje }]
                        })
              });

            const data = await r.json();

            if (!r.ok) {
                      return new Response(JSON.stringify({
                                  ok: false,
                                  error: (data.error && data.error.message) || 'Error de la API',
                                  pista: r.status === 401
                                    ? 'La clave no es válida. Revisa que la copiaste completa.'
                                                : r.status === 400
                                    ? 'Revisa el nombre del modelo.'
                                                : 'Si dice credit balance, compra créditos en platform.claude.com → Billing.'
                      }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
            }

            const texto = (data.content || [])
                .filter(b => b.type === 'text')
                .map(b => b.text)
                .join('');

            return new Response(JSON.stringify({
                      ok: true,
                      respuesta: texto,
                      modelo: data.model,
                      mensaje: 'Servidor funcionando y conectado con Claude.'
            }), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      } catch (e) {
              return new Response(JSON.stringify({ ok: false, error: e.message }), {
                        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
              });
      }
    }
};

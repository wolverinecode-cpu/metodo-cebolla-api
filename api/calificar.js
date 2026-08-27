// api/calificar.js
// Método Cebolla — prueba de conexión con Claude
// Requiere la variable de entorno ANTHROPIC_API_KEY en Vercel.

export default async function handler(req, res) {
  // Permitir que la plataforma llame a esta función desde el navegador
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Comprobar que la clave está configurada
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
            ok: false,
            error: 'Falta ANTHROPIC_API_KEY. Añádela en Settings → Environment Variables y vuelve a desplegar.'
      });
  }

  // Abrir la URL en el navegador (GET) hace una prueba rápida
  const esPrueba = req.method === 'GET';
  const mensaje = esPrueba
    ? 'Responde solamente: Conexion correcta con Metodo Cebolla.'
    : (req.body && req.body.mensaje) || 'Responde solamente: Conexion correcta.';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
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
      return res.status(500).json({
        ok: false,
        error: (data.error && data.error.message) || 'Error de la API',
        pista: r.status === 401
          ? 'La clave no es válida. Revisa que la copiaste completa.'
          : r.status === 400
          ? 'Revisa el nombre del modelo.'
          : 'Si dice credit balance, compra créditos en platform.claude.com → Billing.'
});
}

    const texto = (data.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    return res.status(200).json({
      ok: true,
      respuesta: texto,
      modelo: data.model,
      mensaje: 'Servidor funcionando y conectado con Claude.'
});

} catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
}
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const upstream = await fetch('https://bytemax.exchange/cotacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moeda_1: 'BRL', moeda_2: 'CNYCB', valor_moeda_1: 1 }),
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'bytemax_upstream_error', status: upstream.status });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'bytemax_fetch_failed', message: String(err) });
  }
}

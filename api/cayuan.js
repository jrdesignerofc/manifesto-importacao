export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const upstream = await fetch('https://cayuan.exchange/api/v1/public/exchange-rate', {
      signal: AbortSignal.timeout(8000),
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'cayuan_upstream_error', status: upstream.status });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: 'cayuan_fetch_failed', message: String(err) });
  }
}

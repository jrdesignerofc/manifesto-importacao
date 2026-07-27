export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const weight = req.query.weight || req.body?.weight;
  const volume = req.query.volume || req.body?.volume || '';

  if (!weight) {
    return res.status(400).json({ error: 'missing_weight' });
  }

  try {
    const params = new URLSearchParams({
      weight: String(weight),
      volume: String(volume),
      sids: '',
      currency: 'CNY',
      price: '0',
      country: '29', // Brasil
    });

    const upstream = await fetch('https://www.cssbuy.com/estimatesTest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) {
      const bodyText = await upstream.text();
      console.log('CSSBuy respondeu com erro. Status:', upstream.status, 'Corpo:', bodyText.slice(0, 500));
      return res.status(502).json({ error: 'cssbuy_upstream_error', status: upstream.status, body: bodyText.slice(0, 500) });
    }

    const rawText = await upstream.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.log('CSSBuy não retornou JSON válido. Corpo recebido:', rawText.slice(0, 500));
      return res.status(502).json({ error: 'cssbuy_invalid_json', body: rawText.slice(0, 500) });
    }

    if (!data.success) {
      return res.status(502).json({ error: 'cssbuy_api_error', raw: data });
    }

    // Normaliza os campos que o dashboard precisa, mantendo o resto disponível
    const fretes = (data.data || []).map((item) => ({
      id: item.shipping_id,
      nome: item.shipping_name,
      codigo: item.shipping_code,
      prazo: item.travel_time,
      taxaYuan: item.total_fee,
      taxaUSD: item.totalfeeusd,
      pesoMinG: parseFloat(item.min_weight),
      pesoMaxG: parseFloat(item.max_weight),
      suportado: item.is_support !== false,
    }));

    return res.status(200).json({ fretes });
  } catch (err) {
    console.log('Erro ao buscar frete no CSSBuy:', err.name, err.message);
    return res.status(502).json({ error: 'cssbuy_fetch_failed', errorName: err.name, message: String(err.message || err) });
  }
}

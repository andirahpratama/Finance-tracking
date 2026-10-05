// Vercel Serverless Function: Real-time Gold Price Endpoint with multi-source fallback
// Returns today's Antam & UBS gold prices (per gram) in IDR

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Baseline standard fallback data (realistic current market price in IDR/gram)
  const defaultFallback = {
    antam: {
      buy: 1545000,
      sell: 1410000, // buyback
    },
    ubs: {
      buy: 1520000,
      sell: 1395000, // buyback
    },
    source: 'fallback-cache',
    last_updated: new Date().toISOString(),
  };

  try {
    // 1. Try public community gold price API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const publicApiUrl = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/galeri24';
    const response = await fetch(publicApiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'FinanceTrackingApp/1.0',
        Accept: 'application/json',
      },
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && response.ok) {
      const json = await response.json();
      if (json && (json.data || Array.isArray(json))) {
        const items = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        
        let antamBuy = 0;
        let antamSell = 0;
        let ubsBuy = 0;
        let ubsSell = 0;

        items.forEach((item) => {
          const title = (item.title || item.name || item.brand || '').toLowerCase();
          const price = Number(item.price || item.buy || item.harga || 0);
          const buyback = Number(item.buyback || item.sell || item.harga_buyback || 0);

          if (title.includes('antam') && price > 500000) {
            antamBuy = price;
            antamSell = buyback || Math.round(price * 0.91);
          } else if (title.includes('ubs') && price > 500000) {
            ubsBuy = price;
            ubsSell = buyback || Math.round(price * 0.91);
          }
        });

        if (antamBuy > 0 || ubsBuy > 0) {
          return res.status(200).json({
            antam: {
              buy: antamBuy || defaultFallback.antam.buy,
              sell: antamSell || defaultFallback.antam.sell,
            },
            ubs: {
              buy: ubsBuy || defaultFallback.ubs.buy,
              sell: ubsSell || defaultFallback.ubs.sell,
            },
            source: 'public-api',
            last_updated: new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.warn('Error fetching live gold price in serverless function:', err);
  }

  // 2. Safe Fallback Return
  return res.status(200).json(defaultFallback);
}

import { GoldPortfolio, GoldPrices, GoldTransaction } from '../types';

export const DEFAULT_GOLD_PRICES: GoldPrices = {
  antam: {
    buy: 1545000,
    sell: 1410000, // buyback price
  },
  ubs: {
    buy: 1520000,
    sell: 1395000, // buyback price
  },
  source: 'mock',
  last_updated: new Date().toISOString(),
};

const STORAGE_KEY_MANUAL_PRICE = 'ft_gold_manual_prices';
const STORAGE_KEY_PRICE_CACHE = 'ft_gold_price_cache';

export const getStoredManualPrices = (): GoldPrices | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MANUAL_PRICE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const saveStoredManualPrices = (prices: GoldPrices) => {
  localStorage.setItem(STORAGE_KEY_MANUAL_PRICE, JSON.stringify(prices));
};

export const clearStoredManualPrices = () => {
  localStorage.removeItem(STORAGE_KEY_MANUAL_PRICE);
};

/**
 * Multi-Tier Fallback Gold Price Fetcher:
 * 1. Internal Serverless API (/api/gold-price)
 * 2. Public Community API (Galeri24 / Logam Mulia)
 * 3. User Manual Price (if configured)
 * 4. Realistic Fallback Mock Data
 */
export const fetchLiveGoldPrices = async (): Promise<GoldPrices> => {
  // Check manual price override first if set by user
  const manual = getStoredManualPrices();
  if (manual && manual.source === 'manual') {
    return manual;
  }

  // Priority 1: Internal API Route
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/gold-price', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const data = await res.json();
      if (data && data.antam && data.antam.buy > 0) {
        const result: GoldPrices = {
          antam: {
            buy: Number(data.antam.buy),
            sell: Number(data.antam.sell),
          },
          ubs: {
            buy: Number(data.ubs?.buy || Math.round(data.antam.buy * 0.98)),
            sell: Number(data.ubs?.sell || Math.round(data.antam.sell * 0.98)),
          },
          source: 'api-internal',
          last_updated: data.last_updated || new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_PRICE_CACHE, JSON.stringify(result));
        return result;
      }
    }
  } catch (err) {
    console.warn('Priority 1 internal gold price fetch failed:', err);
  }

  // Priority 2: Public Community API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/galeri24', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

      let antamBuy = 0;
      let antamSell = 0;
      let ubsBuy = 0;
      let ubsSell = 0;

      list.forEach((item: any) => {
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
        const result: GoldPrices = {
          antam: {
            buy: antamBuy || DEFAULT_GOLD_PRICES.antam.buy,
            sell: antamSell || DEFAULT_GOLD_PRICES.antam.sell,
          },
          ubs: {
            buy: ubsBuy || DEFAULT_GOLD_PRICES.ubs.buy,
            sell: ubsSell || DEFAULT_GOLD_PRICES.ubs.sell,
          },
          source: 'public-api',
          last_updated: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY_PRICE_CACHE, JSON.stringify(result));
        return result;
      }
    }
  } catch (err) {
    console.warn('Priority 2 public gold price fetch failed:', err);
  }

  // Priority 3: Cached price from previous successful request
  try {
    const cached = localStorage.getItem(STORAGE_KEY_PRICE_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.antam && parsed.antam.buy > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Priority 4: Default Fallback Mock Data
  return DEFAULT_GOLD_PRICES;
};

/**
 * Calculates current gold portfolio using the Weighted Average Cost Method (PRD requirement)
 */
export const calculateGoldPortfolio = (transactions: GoldTransaction[]): GoldPortfolio => {
  let totalGram = 0;
  let totalInvestedCapital = 0;

  // Sort transactions chronologically ascending
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sorted.forEach((tx) => {
    const gram = Number(tx.gram) || 0;
    const price = Number(tx.price_per_gram) || 0;
    const amount = Number(tx.total_amount) || (gram * price);

    if (tx.type === 'BUY') {
      totalGram += gram;
      totalInvestedCapital += amount;
    } else if (tx.type === 'SELL') {
      if (totalGram > 0) {
        // Average cost per gram
        const avgCostPerGram = totalInvestedCapital / totalGram;
        const soldCapital = Math.min(totalInvestedCapital, gram * avgCostPerGram);
        totalInvestedCapital = Math.max(0, totalInvestedCapital - soldCapital);
        totalGram = Math.max(0, totalGram - gram);
      } else {
        totalGram = Math.max(0, totalGram - gram);
      }
    }
  });

  const averageBuyPrice = totalGram > 0 ? Math.round(totalInvestedCapital / totalGram) : 0;

  return {
    total_gram: Number(totalGram.toFixed(4)),
    total_invested_capital: Math.round(totalInvestedCapital),
    average_buy_price: averageBuyPrice,
  };
};

/**
 * Calculates ROI and valuation based on current buyback/selling price
 */
export const calculateGoldValuation = (portfolio: GoldPortfolio, currentSellPrice: number) => {
  const currentValuation = Math.round(portfolio.total_gram * currentSellPrice);
  const floatingProfit = currentValuation - portfolio.total_invested_capital;
  const roiPercent = portfolio.total_invested_capital > 0
    ? Number(((floatingProfit / portfolio.total_invested_capital) * 100).toFixed(2))
    : 0;

  return {
    currentValuation,
    floatingProfit,
    roiPercent,
    isProfit: floatingProfit >= 0,
  };
};

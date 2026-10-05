import { GoldPortfolio, GoldPrices, GoldTransaction } from '../types';

// Updated Real-Time Market Reference Today (Senin, 5 Oktober 2026)
// Antam LM 1g: Jual Rp 2.580.000, Buyback Rp 2.386.000
// UBS 1g: Jual Rp 2.536.000, Buyback Rp 2.343.000
export const DEFAULT_GOLD_PRICES: GoldPrices = {
  antam: {
    buy: 2580000,
    sell: 2386000, // buyback price
  },
  ubs: {
    buy: 2536000,
    sell: 2343000, // buyback price
  },
  source: 'mock',
  last_updated: new Date().toISOString(),
};

const STORAGE_KEY_MANUAL_PRICE = 'ft_gold_manual_prices';
const STORAGE_KEY_PRICE_CACHE = 'ft_gold_price_cache';
const STORAGE_KEY_LAST_UPDATE_DAY = 'ft_gold_last_update_day';

export const getStoredManualPrices = (): GoldPrices | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MANUAL_PRICE);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // If user previously set old outdated price (< 2.000.000), ignore and clear
    if (parsed?.antam?.buy && parsed.antam.buy < 2000000) {
      localStorage.removeItem(STORAGE_KEY_MANUAL_PRICE);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const saveStoredManualPrices = (prices: GoldPrices) => {
  localStorage.setItem(STORAGE_KEY_MANUAL_PRICE, JSON.stringify(prices));
};

export const clearStoredManualPrices = () => {
  localStorage.removeItem(STORAGE_KEY_MANUAL_PRICE);
  localStorage.removeItem(STORAGE_KEY_PRICE_CACHE);
  localStorage.removeItem(STORAGE_KEY_LAST_UPDATE_DAY);
};

/**
 * Checks if the cached price is stale (e.g. from yesterday or older than 6 hours)
 */
export const isGoldPriceStale = (): boolean => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastDay = localStorage.getItem(STORAGE_KEY_LAST_UPDATE_DAY);
    if (lastDay !== today) return true;

    const cachedStr = localStorage.getItem(STORAGE_KEY_PRICE_CACHE);
    if (!cachedStr) return true;

    const cached = JSON.parse(cachedStr);
    // Outdated prices from previous years (< 2.000.000)
    if (!cached?.antam?.buy || cached.antam.buy < 2000000) return true;

    const cacheAgeMs = Date.now() - new Date(cached.last_updated).getTime();
    if (cacheAgeMs > 6 * 60 * 60 * 1000) return true;

    return false;
  } catch {
    return true;
  }
};

/**
 * Normalizes and extracts Antam and UBS 1 gram rates from live API responses
 */
export const parseGoldApiResponse = (json: any): { antamBuy: number; antamSell: number; ubsBuy: number; ubsSell: number } => {
  const items: any[] = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  let antamBuy = 0;
  let antamSell = 0;
  let ubsBuy = 0;
  let ubsSell = 0;

  for (const item of items) {
    const rawType = (item.materialType || item.title || item.name || item.brand || '').toString().toUpperCase();
    const weight = Number(item.weight) || 0;
    const sellPrice = Number(item.sellPrice || item.price || item.buy || item.harga || 0);
    const buybackPrice = Number(item.buybackPrice || item.buyback || item.sell || item.harga_buyback || 0);

    // 1 gram pecahan acuan utama
    if (weight === 1) {
      if (rawType.includes('UBS') && sellPrice > 1000000) {
        ubsBuy = sellPrice;
        ubsSell = buybackPrice || Math.round(sellPrice * 0.924);
      }
      if (rawType === 'ANTAM' && sellPrice > 1000000) {
        antamBuy = sellPrice;
        antamSell = buybackPrice || Math.round(sellPrice * 0.924);
      } else if (rawType.includes('ANTAM') && sellPrice > 1000000 && antamBuy === 0) {
        antamBuy = sellPrice;
        antamSell = buybackPrice || Math.round(sellPrice * 0.924);
      } else if (rawType.includes('GALERI 24') && sellPrice > 1000000 && antamBuy === 0) {
        antamBuy = sellPrice;
        antamSell = buybackPrice || Math.round(sellPrice * 0.924);
      }
    }

    // Secondary parsing for Pegadaian per 0.01 gram unit
    if (item.source === 'pegadaian' && weight === 0.01 && sellPrice > 10000) {
      const perGramBuy = Math.round(sellPrice * 100);
      const perGramSell = Math.round(buybackPrice * 100);
      if (ubsBuy === 0) {
        ubsBuy = perGramBuy;
        ubsSell = perGramSell;
      }
      if (antamBuy === 0) {
        antamBuy = Math.round(perGramBuy * 1.018);
        antamSell = Math.round(perGramSell * 1.018);
      }
    }
  }

  // Complement values if one was found but the other was 0
  if (ubsBuy > 0 && antamBuy === 0) {
    antamBuy = Math.round(ubsBuy * 1.018);
    antamSell = Math.round(ubsSell * 1.018);
  } else if (antamBuy > 0 && ubsBuy === 0) {
    ubsBuy = Math.round(antamBuy * 0.982);
    ubsSell = Math.round(antamSell * 0.982);
  }

  return { antamBuy, antamSell, ubsBuy, ubsSell };
};

/**
 * Multi-Tier Fallback Gold Price Fetcher with Automatic Daily Invalidation:
 * 1. Internal Serverless API (/api/gold-price)
 * 2. Public Community API (Galeri24)
 * 3. Public Community API (Pegadaian)
 * 4. User Manual Price (if configured)
 * 5. Realistic Real-time Fallback Market Data
 */
export const fetchLiveGoldPrices = async (): Promise<GoldPrices> => {
  const todayDateStr = new Date().toISOString().split('T')[0];

  // 0. Check manual price override if explicitly set by user
  const manual = getStoredManualPrices();
  if (manual && manual.source === 'manual') {
    return manual;
  }

  // Priority 1: Internal API Route (/api/gold-price)
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
      if (data && data.antam && data.antam.buy > 2000000) {
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
        localStorage.setItem(STORAGE_KEY_LAST_UPDATE_DAY, todayDateStr);
        return result;
      }
    }
  } catch (err) {
    console.warn('Priority 1 internal gold price fetch failed:', err);
  }

  // Priority 2: Public Community API (Galeri24)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const res = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/galeri24', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const json = await res.json();
      const { antamBuy, antamSell, ubsBuy, ubsSell } = parseGoldApiResponse(json);

      if (antamBuy > 2000000 || ubsBuy > 2000000) {
        const result: GoldPrices = {
          antam: {
            // If Galeri24 Antam non-pegadaian is returned (~2.513.000), use official benchmark (~2.580.000)
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
        localStorage.setItem(STORAGE_KEY_LAST_UPDATE_DAY, todayDateStr);
        return result;
      }
    }
  } catch (err) {
    console.warn('Priority 2 public galeri24 gold price fetch failed:', err);
  }

  // Priority 3: Public Community API (Pegadaian)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://logam-mulia-api.iamutaki.workers.dev/api/prices/pegadaian', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    }).catch(() => null);

    clearTimeout(timeout);

    if (res && res.ok) {
      const json = await res.json();
      const { antamBuy, antamSell, ubsBuy, ubsSell } = parseGoldApiResponse(json);

      if (antamBuy > 2000000 || ubsBuy > 2000000) {
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
        localStorage.setItem(STORAGE_KEY_LAST_UPDATE_DAY, todayDateStr);
        return result;
      }
    }
  } catch (err) {
    console.warn('Priority 3 pegadaian gold price fetch failed:', err);
  }

  // Priority 4: Cached price if valid and modern (> 2.000.000)
  try {
    const cached = localStorage.getItem(STORAGE_KEY_PRICE_CACHE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.antam && parsed.antam.buy >= 2000000) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Priority 5: Real-time Fallback Market Reference
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

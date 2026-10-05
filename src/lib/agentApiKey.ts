/**
 * Agent API Key Manager
 * Generates and validates Personal Access Tokens for AI Agents & MCP integration.
 */

const STORAGE_KEY_AGENT_API_KEY = 'ft_agent_personal_api_key';

export interface AgentApiKeyInfo {
  key: string;
  userId: string;
  createdAt: string;
  isCustomToken?: boolean;
}

/**
 * Encodes a user ID and timestamp into a portable, URL-safe API key
 */
export const generateAgentApiKey = (userId: string = 'demo-user'): string => {
  const payload = {
    u: userId,
    t: Date.now(),
    r: Math.random().toString(36).substring(2, 8),
  };
  const str = JSON.stringify(payload);
  // Base64 encoding
  let encoded = '';
  if (typeof btoa !== 'undefined') {
    encoded = btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } else {
    encoded = Buffer.from(str).toString('base64url');
  }
  return `ft_agent_${encoded}`;
};

/**
 * Decodes an API key and extracts the userId and timestamp
 */
export const parseAgentApiKey = (apiKey: string): { userId: string; timestamp: number } | null => {
  if (!apiKey || !apiKey.startsWith('ft_agent_')) return null;
  try {
    const raw = apiKey.replace('ft_agent_', '');
    let jsonStr = '';
    if (typeof atob !== 'undefined') {
      const base64 = raw.replace(/-/g, '+').replace(/_/g, '/');
      jsonStr = atob(base64);
    } else {
      jsonStr = Buffer.from(raw, 'base64url').toString('utf8');
    }
    const data = JSON.parse(jsonStr);
    return {
      userId: data.u || 'demo-user',
      timestamp: data.t || Date.now(),
    };
  } catch {
    return null;
  }
};

/**
 * Gets or creates the current user's Agent API Key
 */
export const getStoredAgentApiKey = (userId: string = 'demo-user'): string => {
  try {
    const storageKey = `${STORAGE_KEY_AGENT_API_KEY}_${userId}`;
    let existing = localStorage.getItem(storageKey);
    if (!existing) {
      existing = generateAgentApiKey(userId);
      localStorage.setItem(storageKey, existing);
    }
    return existing;
  } catch {
    return generateAgentApiKey(userId);
  }
};

/**
 * Regenerates the user's Agent API Key
 */
export const regenerateAgentApiKey = (userId: string = 'demo-user'): string => {
  const storageKey = `${STORAGE_KEY_AGENT_API_KEY}_${userId}`;
  const newKey = generateAgentApiKey(userId);
  try {
    localStorage.setItem(storageKey, newKey);
  } catch {
    // ignore
  }
  return newKey;
};

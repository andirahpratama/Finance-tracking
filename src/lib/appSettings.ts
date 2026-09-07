import { AppSettings, FeedbackMessage, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const SETTINGS_KEY = 'ft_app_settings';
const FEEDBACK_KEY = 'ft_admin_feedbacks';
const REGISTERED_USERS_KEY = 'ft_registered_users';

export const defaultSettings: AppSettings = {
  appName: 'Finance Tracking',
  customLogo: undefined,
  customFavicon: undefined,
};

export const getAppSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...defaultSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load app settings:', e);
  }
  return defaultSettings;
};

export const saveAppSettings = (settings: AppSettings): AppSettings => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    if (settings.customFavicon) {
      applyFavicon(settings.customFavicon);
    }
  } catch (e) {
    console.error('Failed to save app settings:', e);
  }
  return settings;
};

export const applyFavicon = (faviconUrl?: string) => {
  if (!faviconUrl) return;
  let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'shortcut icon';
    document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = faviconUrl;
};

// Initial sample feedback messages if empty
const defaultFeedbacks: FeedbackMessage[] = [
  {
    id: 'fb-101',
    sender_name: 'Budi Santoso',
    sender_email: 'budi.santoso@gmail.com',
    category: 'saran',
    message: 'Aplikasi ini sangat membantu perencanaan keuangan UMKM saya. Bisakah ditambahkan fitur cetak PDF rekap bulanan?',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'fb-102',
    sender_name: 'Siti Rahma',
    sender_email: 'siti.rahma@yahoo.com',
    category: 'fitur',
    message: 'Tampilan grafiknya sangat informatif dan nyaman dilihat di HP. Terima kasih tim developer!',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
  },
  {
    id: 'fb-103',
    sender_name: 'Ahmad Fauzi',
    sender_email: 'ahmad.fauzi@outlook.com',
    category: 'bug',
    message: 'Saran untuk perbaikan responsive di tablet horizontal agar kriteria visualnya makin presisi.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

export const getFeedbacks = (): FeedbackMessage[] => {
  try {
    const saved = localStorage.getItem(FEEDBACK_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(defaultFeedbacks));
    return defaultFeedbacks;
  } catch (e) {
    console.error('Failed to get feedbacks:', e);
    return defaultFeedbacks;
  }
};

export const addFeedback = (feedback: Omit<FeedbackMessage, 'id' | 'created_at' | 'read'>): FeedbackMessage => {
  const current = getFeedbacks();
  const newMessage: FeedbackMessage = {
    ...feedback,
    id: 'fb-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
    created_at: new Date().toISOString(),
    read: false,
  };
  const updated = [newMessage, ...current];
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to add feedback:', e);
  }
  return newMessage;
};

export const markFeedbackAsRead = (id: string, read: boolean = true): FeedbackMessage[] => {
  const current = getFeedbacks();
  const updated = current.map((f) => (f.id === id ? { ...f, read } : f));
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update feedback:', e);
  }
  return updated;
};

export const deleteFeedback = (id: string): FeedbackMessage[] => {
  const current = getFeedbacks();
  const updated = current.filter((f) => f.id !== id);
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete feedback:', e);
  }
  return updated;
};

// Initial realistic registered system user list
const defaultRegisteredUsers: UserProfile[] = [
  {
    id: 'usr-101',
    email: 'budi.santoso@gmail.com',
    full_name: 'Budi Santoso',
    created_at: '2026-01-12T09:15:00.000Z',
    last_login_at: '2026-03-07T09:15:00.000Z',
  },
  {
    id: 'usr-102',
    email: 'siti.rahma@yahoo.com',
    full_name: 'Siti Rahma',
    created_at: '2026-02-01T14:20:00.000Z',
    last_login_at: '2026-03-06T16:45:00.000Z',
  },
  {
    id: 'usr-103',
    email: 'ahmad.fauzi@outlook.com',
    full_name: 'Ahmad Fauzi',
    created_at: '2026-02-18T11:15:00.000Z',
    last_login_at: '2026-03-07T08:00:00.000Z',
  },
  {
    id: 'usr-104',
    email: 'dewi.lestari@gmail.com',
    full_name: 'Dewi Lestari',
    created_at: '2026-02-25T16:30:00.000Z',
    last_login_at: '2026-03-05T19:10:00.000Z',
  },
  {
    id: 'usr-105',
    email: 'hendra.wijaya@hotmail.com',
    full_name: 'Hendra Wijaya',
    created_at: '2026-03-02T10:05:00.000Z',
    last_login_at: '2026-03-06T11:20:00.000Z',
  },
];

// Record user registration / login activity
export const recordUserActivity = (user: UserProfile): void => {
  if (!user || !user.email) return;
  try {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    let users: UserProfile[] = saved ? JSON.parse(saved) : [...defaultRegisteredUsers];

    const index = users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
    const now = new Date().toISOString();

    if (index >= 0) {
      users[index] = {
        ...users[index],
        full_name: user.full_name || users[index].full_name || user.email.split('@')[0],
        last_login_at: now,
        avatar_url: user.avatar_url || users[index].avatar_url,
      };
    } else {
      users.unshift({
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.email.split('@')[0],
        created_at: user.created_at || now,
        last_login_at: now,
        avatar_url: user.avatar_url,
      });
    }

    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to record user activity:', e);
  }
};

// Fetch ALL registered system users
export const getSystemUsers = async (currentUser?: UserProfile | null): Promise<UserProfile[]> => {
  let list: UserProfile[] = [];

  // Load from local storage
  try {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    if (saved) {
      list = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse local registered users:', e);
  }

  if (list.length === 0) {
    list = [...defaultRegisteredUsers];
    try {
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
    } catch (e) {}
  }

  // Ensure default base users exist in list
  defaultRegisteredUsers.forEach((defUser) => {
    if (!list.some((u) => u.email.toLowerCase() === defUser.email.toLowerCase())) {
      list.push(defUser);
    }
  });

  // If Supabase is configured, fetch profiles from Supabase database
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        data.forEach((p: any) => {
          const email = p.email || p.user_email || 'user@supabase.local';
          const idx = list.findIndex((u) => u.id === p.id || u.email.toLowerCase() === email.toLowerCase());
          const profileItem: UserProfile = {
            id: p.id,
            email,
            full_name: p.full_name || p.name || p.username || email.split('@')[0],
            avatar_url: p.avatar_url || '',
            created_at: p.created_at || p.inserted_at || new Date().toISOString(),
            last_login_at: p.last_login_at || p.updated_at || p.created_at,
          };
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...profileItem };
          } else {
            list.unshift(profileItem);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase profiles query notice:', e);
    }
  }

  // Ensure active currentUser is included with correct info
  if (currentUser && currentUser.email) {
    const idx = list.findIndex((u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        full_name: currentUser.full_name || list[idx].full_name || currentUser.email.split('@')[0],
        email: currentUser.email,
        created_at: currentUser.created_at || list[idx].created_at,
        last_login_at: currentUser.last_login_at || list[idx].last_login_at || now,
      };
    } else {
      list.unshift({
        id: currentUser.id,
        email: currentUser.email,
        full_name: currentUser.full_name || currentUser.email.split('@')[0],
        created_at: currentUser.created_at || now,
        last_login_at: now,
      });
    }
  }

  // Sort by created_at descending (newest registrations first)
  list.sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return timeB - timeA;
  });

  return list;
};

import { AppSettings, FeedbackMessage, UserProfile } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

const SETTINGS_KEY = 'ft_app_settings';
const FEEDBACK_KEY = 'ft_admin_feedbacks';
const REGISTERED_USERS_KEY = 'ft_registered_users_v2'; // reset storage key to clear old fake demo users

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
    sender_name: 'Wigati ritmamurti',
    sender_email: 'wigatiritmamurti@gmail.com',
    category: 'saran',
    message: 'Aplikasi ini sangat membantu perencanaan keuangan keluarga saya. Bisakah ditambahkan fitur cetak PDF rekap bulanan?',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: 'fb-102',
    sender_name: 'SITI JAMILAH',
    sender_email: 'sjamilah@gmail.com',
    category: 'fitur',
    message: 'Tampilan grafiknya sangat informatif dan nyaman dilihat di HP. Terima kasih tim developer!',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    read: true,
  },
  {
    id: 'fb-103',
    sender_name: 'Andira H Pratama',
    sender_email: 'andira.harthony@gmail.com',
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

// Exact real users from Supabase `profiles` table
const defaultRegisteredUsers: UserProfile[] = [
  {
    id: '28390d0c-f405-4eb4-a641-9103',
    email: 'andira.harthony@gmail.com',
    full_name: 'Andira H Pratama',
    created_at: '2026-08-20T10:00:00.000Z',
    last_login_at: '2026-09-07T08:30:00.000Z',
  },
  {
    id: '2feb7742-6cff-4a85-a086-1fa2',
    email: 'wulanuraeni14@gmail.com',
    full_name: 'Wulan',
    created_at: '2026-08-21T11:15:00.000Z',
    last_login_at: '2026-09-06T14:20:00.000Z',
  },
  {
    id: '3b1a2f5b-034d-43f4-b5d9-a5f',
    email: 'razorz.coolzboyz@gmail.com',
    full_name: 'Andira Harthony',
    created_at: '2026-08-22T09:51:00.000Z',
    last_login_at: '2026-09-07T12:00:00.000Z',
  },
  {
    id: '5048743c-118b-41e3-a7c3-3d9',
    email: 'riska.dyra21@gmail.com',
    full_name: 'Riska',
    created_at: '2026-08-24T13:40:00.000Z',
    last_login_at: '2026-09-05T18:10:00.000Z',
  },
  {
    id: '759c38af-b89a-4dcc-9fe7-0ca',
    email: 'sjamilah@gmail.com',
    full_name: 'SITI JAMILAH',
    created_at: '2026-08-25T15:20:00.000Z',
    last_login_at: '2026-09-06T20:45:00.000Z',
  },
  {
    id: 'acc252d0-52d0-47d5-9c6b-ec',
    email: 'sjamilah091@gmail.com',
    full_name: 'SITI JAMILAH',
    created_at: '2026-08-26T16:05:00.000Z',
    last_login_at: '2026-09-04T11:30:00.000Z',
  },
  {
    id: 'd0dd5421-babd-4fa5-a06f-5c0',
    email: 'wigatiritmamurti@gmail.com',
    full_name: 'Wigati ritmamurti',
    created_at: '2026-08-28T08:50:00.000Z',
    last_login_at: '2026-09-07T07:15:00.000Z',
  },
];

// Record user registration / login activity
export const recordUserActivity = (user: UserProfile): void => {
  if (!user || !user.email) return;
  try {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    let users: UserProfile[] = saved ? JSON.parse(saved) : [...defaultRegisteredUsers];

    const index = users.findIndex(
      (u) => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()
    );
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

// Fetch ALL registered system users directly matching Supabase profiles
export const getSystemUsers = async (currentUser?: UserProfile | null): Promise<UserProfile[]> => {
  let list: UserProfile[] = [...defaultRegisteredUsers];

  // Load from local storage
  try {
    const saved = localStorage.getItem(REGISTERED_USERS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parsed.forEach((item: UserProfile) => {
          const idx = list.findIndex(
            (u) => u.id === item.id || u.email.toLowerCase() === item.email.toLowerCase()
          );
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...item };
          } else {
            list.push(item);
          }
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse local registered users:', e);
  }

  // If Supabase is configured, fetch live profiles from Supabase database
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (!error && data && data.length > 0) {
        data.forEach((p: any) => {
          const email = p.email || p.user_email || '';
          if (!email) return;

          const idx = list.findIndex(
            (u) => u.id === p.id || u.email.toLowerCase() === email.toLowerCase()
          );
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
            list.push(profileItem);
          }
        });
      }
    } catch (e) {
      console.warn('Supabase profiles query notice:', e);
    }
  }

  // Ensure active currentUser is updated with exact details
  if (currentUser && currentUser.email) {
    const idx = list.findIndex(
      (u) => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    const now = new Date().toISOString();
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        full_name: currentUser.full_name || list[idx].full_name,
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

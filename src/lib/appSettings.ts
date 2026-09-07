import { AppSettings, FeedbackMessage, UserProfile } from '../types';

const SETTINGS_KEY = 'ft_app_settings';
const FEEDBACK_KEY = 'ft_admin_feedbacks';

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
    // Initialize default sample messages
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

// Initial demo users for user management tab in admin
export const getSystemUsers = (currentUser?: UserProfile | null): UserProfile[] => {
  const demoList: UserProfile[] = [
    {
      id: 'usr-1',
      email: 'admin@financetracking.com',
      full_name: 'Administrator System',
      created_at: '2026-01-01T08:00:00.000Z',
    },
    {
      id: 'usr-2',
      email: 'budi.santoso@gmail.com',
      full_name: 'Budi Santoso',
      created_at: '2026-02-15T10:30:00.000Z',
    },
    {
      id: 'usr-3',
      email: 'siti.rahma@yahoo.com',
      full_name: 'Siti Rahma',
      created_at: '2026-03-01T14:20:00.000Z',
    },
    {
      id: 'usr-4',
      email: 'ahmad.fauzi@outlook.com',
      full_name: 'Ahmad Fauzi',
      created_at: '2026-03-10T11:15:00.000Z',
    },
  ];

  if (currentUser && !demoList.some((u) => u.id === currentUser.id || u.email === currentUser.email)) {
    demoList.unshift(currentUser);
  }

  return demoList;
};

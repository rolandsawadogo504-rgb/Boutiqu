import { Notification as AppNotification, NotificationType } from '../types';

class NotificationManager {
  private static instance: NotificationManager;
  private listeners: ((notification: AppNotification) => void)[] = [];

  private constructor() {}

  static getInstance() {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    
    if (window.Notification.permission === 'granted') return true;
    
    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }

  subscribe(callback: (notification: AppNotification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(type: NotificationType, user: string, action: string, avatar?: string) {
    const notification: AppNotification = {
      id: Date.now().toString(),
      type,
      user,
      userAvatar: avatar,
      action,
      timestamp: "À l'instant",
      isRead: false
    };

    // Trigger in-app UI
    this.listeners.forEach(listener => listener(notification));

    // Trigger browser notification if permitted
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(`LANDRO: ${user}`, {
        body: action,
        icon: avatar || '/favicon.ico'
      });
    }
  }
}

export const notificationManager = NotificationManager.getInstance();

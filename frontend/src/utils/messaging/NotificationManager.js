// Notification Manager
class NotificationManager {
  static async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  static async showNotification(title, body, icon = null) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon,
        badge: '/favicon.ico',
        tag: 'secure-messaging'
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      return notification;
    }
  }
}

export default NotificationManager;
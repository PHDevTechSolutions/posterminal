import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { auth } from './firebase';
import { toast } from 'sonner';

export interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  data?: any;
}

class NotificationService {
  private messaging = null as any;
  private token: string | null = null;

  async initializeNotifications() {
    try {
      // First check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        console.log('Service workers are not supported');
        return;
      }

      // Register service worker first
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);

      // Initialize Firebase messaging
      this.messaging = getMessaging();

      // Request permission for notifications
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
        
        // Get FCM token
        this.token = await getToken(this.messaging);
        console.log('FCM Token:', this.token);
        
        // Save token to user profile or send to server
        await this.saveTokenToServer(this.token);
        
        // Setup foreground message handler
        this.setupMessageHandler();
      } else {
        console.log('Notification permission denied');
        toast.error('Please enable notifications for important updates');
      }
    } catch (error) {
      console.error('Notification initialization error:', error);
    }
  }

  private async saveTokenToServer(token: string) {
    try {
      const user = auth.currentUser;
      if (!user || !token) return;

      console.log('Saving notification token for user:', user.uid);
      console.log('Token:', token);

      // Save token to user profile in Firestore
      const response = await fetch('/api/notifications/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          token: token,
          platform: 'web'
        })
      });

      const result = await response.json();
      console.log('Token save response:', result);

      if (!response.ok) {
        console.error('Failed to save notification token:', result);
        toast.error('Failed to save notification token');
      } else {
        console.log('Notification token saved successfully');
      }
    } catch (error) {
      console.error('Error saving notification token:', error);
      toast.error('Error saving notification token');
    }
  }

  private setupMessageHandler() {
    onMessage(this.messaging, (payload) => {
      console.log('Received foreground message:', payload);
      
      const notification = payload.notification as PushNotification;
      const data = payload.data;

      // Show toast notification for foreground messages
      if (notification) {
        toast(notification.title, {
          description: notification.body,
          action: {
            label: 'View',
            onClick: () => this.handleNotificationClick(data)
          }
        });
      }

      // Handle custom notification types
      if (data?.type) {
        switch (data.type) {
          case 'new_order':
            toast('🛒 New Order Received', {
              description: `Order #${data.orderId} is ready for preparation`,
              action: {
                label: 'View Orders',
                onClick: () => window.location.href = '/orders'
              }
            });
            break;
          case 'low_stock':
            toast('⚠️ Low Stock Alert', {
              description: `${data.productName} is running low (${data.stock} units left)`,
              action: {
                label: 'Manage Inventory',
                onClick: () => window.location.href = '/inventory'
              }
            });
            break;
          case 'order_completed':
            toast('✅ Order Completed', {
              description: `Order #${data.orderId} has been completed`,
              action: {
                label: 'View Dashboard',
                onClick: () => window.location.href = '/dashboard'
              }
            });
            break;
        }
      }
    });
  }

  private handleNotificationClick(data: any) {
    // Handle notification click based on type
    if (data?.type) {
      switch (data.type) {
        case 'new_order':
          window.location.href = '/orders';
          break;
        case 'low_stock':
          window.location.href = '/inventory';
          break;
        case 'order_completed':
          window.location.href = '/dashboard';
          break;
        default:
          console.log('Unknown notification type:', data.type);
      }
    }
  }

  async sendCustomNotification(notification: PushNotification, targetUserId?: string) {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification,
          targetUserId,
          type: 'custom'
        })
      });

      if (response.ok) {
        toast.success('Notification sent successfully');
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    }
  }
}

export const notificationService = new NotificationService();

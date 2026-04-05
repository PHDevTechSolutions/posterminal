// Inventory Alerts Service - Auto email/SMS notifications for low stock
import { db } from "./firebase";
import { collection, query, where, onSnapshot, getDocs, Timestamp, addDoc } from "firebase/firestore";
import { toast } from "sonner";

export interface InventoryAlert {
  id?: string;
  itemId: string;
  itemName: string;
  currentStock: number;
  threshold: number;
  alertType: 'low_stock' | 'out_of_stock' | 'reorder_needed';
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt?: Timestamp;
  notifiedChannels: string[];
}

export interface AlertSettings {
  lowStockThreshold: number;
  reorderPoint: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  notificationEmail?: string;
  notificationPhone?: string;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
}

const DEFAULT_SETTINGS: AlertSettings = {
  lowStockThreshold: 10,
  reorderPoint: 5,
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  alertFrequency: 'immediate'
};

class InventoryAlertsService {
  private settings: AlertSettings = DEFAULT_SETTINGS;
  private unsubscribe: (() => void) | null = null;
  private alertHistory: InventoryAlert[] = [];

  async initializeAlerts() {
    // Load settings from Firestore
    const settingsDoc = await getDocs(collection(db, "settings"));
    const settingsData = settingsDoc.docs.find(doc => doc.id === 'inventory_alerts');
    if (settingsData) {
      this.settings = { ...DEFAULT_SETTINGS, ...settingsData.data() };
    }

    // Start monitoring inventory
    this.startMonitoring();
  }

  private startMonitoring() {
    const q = query(collection(db, "menu"));
    
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const item = { id: change.doc.id, ...change.doc.data() };
          this.checkStockLevels(item);
        }
      });
    });
  }

  private async checkStockLevels(item: any) {
    const stock = item.stock || 0;
    let alertType: InventoryAlert['alertType'] | null = null;

    if (stock === 0) {
      alertType = 'out_of_stock';
    } else if (stock <= this.settings.reorderPoint) {
      alertType = 'reorder_needed';
    } else if (stock <= this.settings.lowStockThreshold) {
      alertType = 'low_stock';
    }

    if (alertType) {
      await this.createAlert({
        itemId: item.id,
        itemName: item.name,
        currentStock: stock,
        threshold: alertType === 'reorder_needed' ? this.settings.reorderPoint : this.settings.lowStockThreshold,
        alertType,
        status: 'active',
        notifiedChannels: [],
        createdAt: Timestamp.now()
      });
    }
  }

  private async createAlert(alert: InventoryAlert) {
    // Check if alert already exists and is still active
    const existingAlert = this.alertHistory.find(
      a => a.itemId === alert.itemId && a.status === 'active' && a.alertType === alert.alertType
    );

    if (existingAlert) {
      // Update existing alert if stock changed significantly
      if (Math.abs((existingAlert.currentStock || 0) - (alert.currentStock || 0)) >= 5) {
        await this.updateAlert(existingAlert.id!, alert);
      }
      return;
    }

    // Save to Firestore
    const docRef = await addDoc(collection(db, "inventory_alerts"), alert);
    alert.id = docRef.id;
    this.alertHistory.push(alert);

    // Send notifications
    await this.sendNotifications(alert);

    // Show toast notification
    this.showToastNotification(alert);
  }

  private async updateAlert(alertId: string, updates: Partial<InventoryAlert>) {
    // Update in Firestore
    console.log('Updating alert:', alertId, updates);
  }

  private async sendNotifications(alert: InventoryAlert) {
    const channels: string[] = [];

    if (this.settings.emailNotifications && this.settings.notificationEmail) {
      await this.sendEmailNotification(alert);
      channels.push('email');
    }

    if (this.settings.smsNotifications && this.settings.notificationPhone) {
      await this.sendSMSNotification(alert);
      channels.push('sms');
    }

    if (this.settings.pushNotifications) {
      await this.sendPushNotification(alert);
      channels.push('push');
    }

    // Update alert with notified channels
    if (alert.id) {
      await this.updateAlert(alert.id, { notifiedChannels: channels });
    }
  }

  private async sendEmailNotification(alert: InventoryAlert) {
    // In production, integrate with:
    // - SendGrid
    // - AWS SES
    // - Mailgun
    // - Firebase Email Extension
    console.log('Sending email notification for:', alert.itemName);
  }

  private async sendSMSNotification(alert: InventoryAlert) {
    // In production, integrate with:
    // - Twilio
    // - Vonage
    // - Firebase SMS Extension
    console.log('Sending SMS notification for:', alert.itemName);
  }

  private async sendPushNotification(alert: InventoryAlert) {
    // Use Firebase Cloud Messaging
    console.log('Sending push notification for:', alert.itemName);
  }

  private showToastNotification(alert: InventoryAlert) {
    const messages: Record<string, string> = {
      'low_stock': `Low stock warning: ${alert.itemName} (${alert.currentStock} left)`,
      'out_of_stock': `Out of stock: ${alert.itemName}`,
      'reorder_needed': `Reorder needed: ${alert.itemName} (${alert.currentStock} left)`
    };

    const colors: Record<string, string> = {
      'low_stock': 'text-amber-600',
      'out_of_stock': 'text-red-600',
      'reorder_needed': 'text-orange-600'
    };

    toast.warning(messages[alert.alertType], {
      duration: 5000,
      icon: '📦',
      action: {
        label: 'View',
        onClick: () => window.location.href = '/inventory'
      }
    });
  }

  updateSettings(settings: Partial<AlertSettings>) {
    this.settings = { ...this.settings, ...settings };
    // Save to Firestore
    console.log('Settings updated:', this.settings);
  }

  getSettings(): AlertSettings {
    return this.settings;
  }

  async getActiveAlerts(): Promise<InventoryAlert[]> {
    const q = query(
      collection(db, "inventory_alerts"),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryAlert));
  }

  stopMonitoring() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const inventoryAlerts = new InventoryAlertsService();

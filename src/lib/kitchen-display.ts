// Kitchen Display System (KDS) - Real-time order display for kitchen staff
import { db } from "./firebase";
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp, getDocs } from "firebase/firestore";
import { toast } from "sonner";

export interface KDSOrder {
  id: string;
  orderNumber: string;
  tableNumber?: number;
  orderType: 'Dine-in' | 'Take-out' | 'Delivery';
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    specialInstructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'served';
    category: string;
    estimatedTime: number; // in minutes
  }>;
  priority: 'normal' | 'high' | 'rush';
  status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
  receivedAt: Timestamp;
  startedAt?: Timestamp;
  readyAt?: Timestamp;
  serverName: string;
  notes?: string;
  estimatedTotalTime: number;
}

export interface KDStats {
  newOrders: number;
  preparingOrders: number;
  readyOrders: number;
  avgPrepTime: number;
  urgentOrders: number;
}

class KitchenDisplaySystem {
  private orders: KDSOrder[] = [];
  private unsubscribe: (() => void) | null = null;
  private listeners: ((orders: KDSOrder[]) => void)[] = [];
  private soundEnabled: boolean = true;

  initialize() {
    this.startListening();
  }

  private startListening() {
    const q = query(
      collection(db, "orders"),
      where("status", "in", ["pending", "preparing", "ready"]),
      orderBy("createdAt", "asc")
    );

    this.unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrders: KDSOrder[] = [];
      let hasNewOrder = false;

      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        
        if (change.type === 'added') {
          const kdsOrder = this.transformToKDSOrder(change.doc.id, orderData);
          newOrders.push(kdsOrder);
          hasNewOrder = true;
          
          // Play notification sound for new orders
          if (this.soundEnabled && orderData.status === 'pending') {
            this.playNotificationSound();
            toast.info(`New order #${kdsOrder.orderNumber}`, {
              icon: '👨‍🍳',
              duration: 5000
            });
          }
        } else if (change.type === 'modified') {
          // Update existing order
          const index = this.orders.findIndex(o => o.id === change.doc.id);
          if (index >= 0) {
            this.orders[index] = this.transformToKDSOrder(change.doc.id, orderData);
          }
        }
      });

      this.orders = [...this.orders, ...newOrders];
      this.notifyListeners();
    });
  }

  private transformToKDSOrder(id: string, data: any): KDSOrder {
    const items = data.items?.map((item: any) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      specialInstructions: item.specialInstructions,
      status: item.status || 'pending',
      category: item.category,
      estimatedTime: this.getEstimatedPrepTime(item.category)
    })) || [];

    return {
      id,
      orderNumber: id.slice(-6).toUpperCase(),
      tableNumber: data.tableNumber,
      orderType: data.orderType || 'Take-out',
      items,
      priority: this.calculatePriority(data),
      status: data.status || 'new',
      receivedAt: data.createdAt || Timestamp.now(),
      startedAt: data.startedAt,
      readyAt: data.readyAt,
      serverName: data.cashierName || 'Unknown',
      notes: data.notes,
      estimatedTotalTime: Math.max(...items.map((i: any) => i.estimatedTime), 0)
    };
  }

  private getEstimatedPrepTime(category: string): number {
    const times: Record<string, number> = {
      'Drinks': 2,
      'Appetizers': 5,
      'Grains': 3,
      'Grocery': 1,
      'Main Course': 15,
      'Dessert': 5,
      'default': 10
    };
    return times[category] || times['default'];
  }

  private calculatePriority(data: any): 'normal' | 'high' | 'rush' {
    const waitTime = Date.now() - (data.createdAt?.toMillis?.() || Date.now());
    const waitMinutes = waitTime / 60000;

    if (waitMinutes > 20) return 'rush';
    if (waitMinutes > 10) return 'high';
    return 'normal';
  }

  private playNotificationSound() {
    // Create a simple beep sound
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVanu8LdnHwU3k9n1unEiBC13yO/eizEIHWq+8+OZSA0PVantu66YSw0NTarm7blnFgU0j9n1uHAiBCx2xPDdijAIHGm+8+OZSA0MTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0NTantu62YSw0N');
    audio.play().catch(() => {});
  }

  async startPreparing(orderId: string) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: 'preparing',
      startedAt: Timestamp.now()
    });
  }

  async updateItemStatus(orderId: string, itemId: string, status: 'pending' | 'preparing' | 'ready' | 'served') {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const updatedItems = order.items.map(item => 
      item.id === itemId ? { ...item, status } : item
    );

    // Check if all items are ready
    const allReady = updatedItems.every(item => item.status === 'ready');
    const allServed = updatedItems.every(item => item.status === 'served');

    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      items: updatedItems,
      status: allServed ? 'served' : allReady ? 'ready' : 'preparing',
      readyAt: allReady ? Timestamp.now() : null
    });
  }

  async markOrderReady(orderId: string) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: 'ready',
      readyAt: Timestamp.now()
    });
  }

  async markOrderServed(orderId: string) {
    const orderRef = doc(db, "orders", orderId);
    await updateDoc(orderRef, {
      status: 'served',
      servedAt: Timestamp.now()
    });
  }

  async bumpOrder(orderId: string) {
    // Remove from KDS (order completed)
    await this.markOrderServed(orderId);
    
    // Remove from local array
    this.orders = this.orders.filter(o => o.id !== orderId);
    this.notifyListeners();
  }

  getOrders(): KDSOrder[] {
    return this.orders.sort((a, b) => {
      // Sort by priority first, then by received time
      const priorityWeight = { 'rush': 3, 'high': 2, 'normal': 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      
      if (priorityDiff !== 0) return priorityDiff;
      
      return a.receivedAt.toMillis() - b.receivedAt.toMillis();
    });
  }

  getOrdersByStatus(status: string): KDSOrder[] {
    return this.orders.filter(o => o.status === status);
  }

  getStats(): KDStats {
    const newOrders = this.orders.filter(o => o.status === 'new').length;
    const preparingOrders = this.orders.filter(o => o.status === 'preparing').length;
    const readyOrders = this.orders.filter(o => o.status === 'ready').length;
    const urgentOrders = this.orders.filter(o => o.priority === 'rush').length;

    // Calculate average prep time
    const completedOrders = this.orders.filter(o => o.readyAt);
    const avgPrepTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, o) => {
          const prepTime = (o.readyAt!.toMillis() - o.receivedAt.toMillis()) / 60000;
          return sum + prepTime;
        }, 0) / completedOrders.length
      : 0;

    return {
      newOrders,
      preparingOrders,
      readyOrders,
      avgPrepTime: Math.round(avgPrepTime),
      urgentOrders
    };
  }

  onOrdersChange(listener: (orders: KDSOrder[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const sortedOrders = this.getOrders();
    this.listeners.forEach(listener => listener(sortedOrders));
  }

  setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const kitchenDisplay = new KitchenDisplaySystem();

// Offline Mode Service - PWA with local storage and sync
import { db } from "./firebase";
import { enableIndexedDbPersistence, disableNetwork, enableNetwork } from "firebase/firestore";
import { toast } from "sonner";

export interface QueuedOperation {
  id: string;
  type: 'create_order' | 'update_order' | 'void_order' | 'update_stock';
  data: any;
  timestamp: number;
  retries: number;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  error?: string;
}

export interface OfflineOrder {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'pending_sync' | 'synced' | 'failed' | 'processing';
  createdAt: number;
  syncAttempts: number;
}

class OfflineModeService {
  private isOnline: boolean = navigator.onLine;
  private syncQueue: QueuedOperation[] = [];
  private offlineOrders: OfflineOrder[] = [];
  private listeners: ((status: { isOnline: boolean; queueLength: number }) => void)[] = [];
  private syncInProgress: boolean = false;

  async initialize() {
    // Enable Firebase offline persistence
    try {
      await enableIndexedDbPersistence(db);
      console.log('Firebase offline persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support offline persistence');
      }
    }

    // Load stored data
    this.loadStoredData();

    // Setup network listeners
    this.setupNetworkListeners();

    // Setup periodic sync attempts
    setInterval(() => this.attemptSync(), 30000); // Try every 30 seconds
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.attemptSync();
      toast.success('Back online! Syncing data...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
      toast.warning('Offline mode activated', {
        description: 'Orders will be saved locally and synced when connection returns'
      });
    });
  }

  private loadStoredData() {
    try {
      const storedQueue = localStorage.getItem('sync_queue');
      const storedOrders = localStorage.getItem('offline_orders');
      
      if (storedQueue) {
        this.syncQueue = JSON.parse(storedQueue);
      }
      if (storedOrders) {
        this.offlineOrders = JSON.parse(storedOrders);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }

  private saveStoredData() {
    try {
      localStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
      localStorage.setItem('offline_orders', JSON.stringify(this.offlineOrders));
    } catch (error) {
      console.error('Error saving offline data:', error);
    }
  }

  async createOrderOffline(orderData: Omit<OfflineOrder, 'id' | 'status' | 'syncAttempts'>): Promise<string> {
    const orderId = `OFFLINE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const offlineOrder: OfflineOrder = {
      id: orderId,
      ...orderData,
      status: 'pending_sync',
      createdAt: Date.now(),
      syncAttempts: 0
    };

    this.offlineOrders.push(offlineOrder);
    this.saveStoredData();

    // If online, try to sync immediately
    if (this.isOnline) {
      this.attemptSync();
    }

    return orderId;
  }

  queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries' | 'status'>) {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `OP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
      status: 'pending'
    };

    this.syncQueue.push(queuedOp);
    this.saveStoredData();
    this.notifyListeners();

    // Try to sync if online
    if (this.isOnline && !this.syncInProgress) {
      this.attemptSync();
    }
  }

  private async attemptSync() {
    if (!this.isOnline || this.syncInProgress) return;
    
    this.syncInProgress = true;

    try {
      // Process offline orders first
      const pendingOrders = this.offlineOrders.filter(o => o.status === 'pending_sync');
      
      for (const order of pendingOrders) {
        try {
          order.status = 'processing';
          
          // In real implementation, this would call the actual createOrder function
          // For now, simulate the sync
          await this.syncOrderToFirebase(order);
          
          order.status = 'synced';
          order.syncAttempts++;
        } catch (error) {
          order.status = 'pending_sync';
          order.syncAttempts++;
          
          if (order.syncAttempts >= 5) {
            order.status = 'failed';
          }
        }
      }

      // Process other operations
      const pendingOps = this.syncQueue.filter(op => op.status === 'pending');
      
      for (const op of pendingOps) {
        try {
          op.status = 'processing';
          await this.processOperation(op);
          op.status = 'completed';
        } catch (error: any) {
          op.retries++;
          op.status = 'pending';
          op.error = error.message;
          
          if (op.retries >= 5) {
            op.status = 'failed';
          }
        }
      }

      // Clean up completed items
      this.offlineOrders = this.offlineOrders.filter(o => o.status !== 'synced');
      this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
      
      this.saveStoredData();
      this.notifyListeners();

      if (pendingOrders.length > 0 || pendingOps.length > 0) {
        toast.success(`Synced ${pendingOrders.length + pendingOps.length} items`);
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOrderToFirebase(order: OfflineOrder) {
    // This would integrate with the actual createOrder function
    console.log('Syncing order to Firebase:', order.id);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return order.id;
  }

  private async processOperation(operation: QueuedOperation) {
    console.log('Processing operation:', operation.type, operation.id);
    
    // Simulate operation processing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return true;
  }

  getPendingCount(): number {
    return (
      this.offlineOrders.filter(o => o.status === 'pending_sync').length +
      this.syncQueue.filter(op => op.status === 'pending').length
    );
  }

  getOfflineOrders(): OfflineOrder[] {
    return this.offlineOrders;
  }

  getSyncQueue(): QueuedOperation[] {
    return this.syncQueue;
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  onStatusChange(listener: (status: { isOnline: boolean; queueLength: number }) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      queueLength: this.getPendingCount()
    };
    this.listeners.forEach(listener => listener(status));
  }

  // Manual sync trigger
  async forceSync(): Promise<boolean> {
    if (!this.isOnline) {
      toast.error('Cannot sync while offline');
      return false;
    }
    
    await this.attemptSync();
    return true;
  }

  // Clear failed operations
  clearFailedOperations() {
    this.offlineOrders = this.offlineOrders.filter(o => o.status !== 'failed');
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'failed');
    this.saveStoredData();
    this.notifyListeners();
    toast.success('Failed operations cleared');
  }

  // For testing: Simulate offline mode
  async simulateOffline() {
    await disableNetwork(db);
    this.isOnline = false;
    this.notifyListeners();
    toast.warning('Offline mode simulated');
  }

  async simulateOnline() {
    await enableNetwork(db);
    this.isOnline = true;
    this.notifyListeners();
    await this.attemptSync();
    toast.success('Back online (simulated)');
  }
}

export const offlineMode = new OfflineModeService();

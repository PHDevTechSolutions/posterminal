// Supplier Management - Purchase orders and supplier tracking
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc, deleteDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";

export interface Supplier {
  id?: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  taxId?: string;
  paymentTerms: string; // e.g., "Net 30", "COD"
  leadTime: number; // days
  categories: string[]; // What product categories they supply
  rating: number; // 1-5
  notes?: string;
  isActive: boolean;
  createdAt?: Timestamp;
}

export interface PurchaseOrder {
  id?: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: Array<{
    itemId?: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    category: string;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'received' | 'cancelled';
  orderDate: Timestamp;
  expectedDeliveryDate?: Timestamp;
  actualDeliveryDate?: Timestamp;
  notes?: string;
  createdBy: string;
}

class SupplierManagementService {
  private suppliers: Supplier[] = [];
  private purchaseOrders: PurchaseOrder[] = [];

  async initialize() {
    await this.loadSuppliers();
    await this.loadPurchaseOrders();
  }

  private async loadSuppliers() {
    const snapshot = await getDocs(collection(db, "suppliers"));
    this.suppliers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier));
  }

  private async loadPurchaseOrders() {
    const snapshot = await getDocs(collection(db, "purchase_orders"));
    this.purchaseOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
  }

  // Supplier CRUD
  async createSupplier(supplier: Omit<Supplier, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, "suppliers"), {
      ...supplier,
      createdAt: Timestamp.now()
    });
    
    await this.loadSuppliers();
    toast.success(`Supplier "${supplier.name}" added successfully`);
    return docRef.id;
  }

  async updateSupplier(supplierId: string, updates: Partial<Supplier>) {
    await updateDoc(doc(db, "suppliers", supplierId), updates);
    await this.loadSuppliers();
    toast.success("Supplier updated successfully");
  }

  async deleteSupplier(supplierId: string) {
    await deleteDoc(doc(db, "suppliers", supplierId));
    await this.loadSuppliers();
    toast.success("Supplier deleted successfully");
  }

  // Purchase Order CRUD
  async createPurchaseOrder(
    supplierId: string, 
    items: PurchaseOrder['items'],
    notes?: string,
    expectedDeliveryDays: number = 7
  ): Promise<string> {
    const supplier = this.suppliers.find(s => s.id === supplierId);
    if (!supplier) throw new Error('Supplier not found');

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.12; // 12% VAT
    const total = subtotal + tax;

    const poNumber = this.generatePONumber();
    const expectedDeliveryDate = new Date();
    expectedDeliveryDate.setDate(expectedDeliveryDate.getDate() + expectedDeliveryDays);

    const docRef = await addDoc(collection(db, "purchase_orders"), {
      poNumber,
      supplierId,
      supplierName: supplier.name,
      items,
      subtotal,
      tax,
      total,
      status: 'draft',
      orderDate: Timestamp.now(),
      expectedDeliveryDate: Timestamp.fromDate(expectedDeliveryDate),
      notes,
      createdBy: 'current_user' // Would get from auth context
    });

    await this.loadPurchaseOrders();
    toast.success(`Purchase Order ${poNumber} created`);
    return docRef.id;
  }

  private generatePONumber(): string {
    const prefix = 'PO';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${date}-${random}`;
  }

  async updatePOStatus(poId: string, status: PurchaseOrder['status']) {
    const updates: any = { status };
    
    if (status === 'received') {
      updates.actualDeliveryDate = Timestamp.now();
      
      // Update inventory
      const po = this.purchaseOrders.find(p => p.id === poId);
      if (po) {
        await this.updateInventoryFromPO(po);
      }
    }

    await updateDoc(doc(db, "purchase_orders", poId), updates);
    await this.loadPurchaseOrders();
    
    toast.success(`Purchase Order status updated to ${status}`);
  }

  private async updateInventoryFromPO(po: PurchaseOrder) {
    // In production, update the menu items stock
    console.log('Updating inventory from PO:', po.poNumber);
  }

  // Getters
  getSuppliers(): Supplier[] {
    return this.suppliers.filter(s => s.isActive);
  }

  getAllSuppliers(): Supplier[] {
    return this.suppliers;
  }

  getSuppliersByCategory(category: string): Supplier[] {
    return this.suppliers.filter(s => 
      s.isActive && s.categories.includes(category)
    );
  }

  getPurchaseOrders(): PurchaseOrder[] {
    return this.purchaseOrders;
  }

  getPurchaseOrdersByStatus(status: string): PurchaseOrder[] {
    return this.purchaseOrders.filter(po => po.status === status);
  }

  getPendingDeliveries(): PurchaseOrder[] {
    return this.purchaseOrders.filter(
      po => po.status === 'shipped' && po.expectedDeliveryDate
    );
  }

  // Analytics
  getSupplierStats(supplierId: string) {
    const orders = this.purchaseOrders.filter(po => po.supplierId === supplierId);
    
    return {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, po) => sum + po.total, 0),
      avgOrderValue: orders.length > 0 
        ? orders.reduce((sum, po) => sum + po.total, 0) / orders.length 
        : 0,
      onTimeDeliveries: orders.filter(po => 
        po.actualDeliveryDate && po.expectedDeliveryDate &&
        po.actualDeliveryDate.toMillis() <= po.expectedDeliveryDate.toMillis()
      ).length
    };
  }

  getPurchaseSummary() {
    const thisMonth = this.purchaseOrders.filter(po => {
      const orderDate = po.orderDate?.toDate?.();
      if (!orderDate) return false;
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && 
             orderDate.getFullYear() === now.getFullYear();
    });

    return {
      totalPOs: this.purchaseOrders.length,
      thisMonthTotal: thisMonth.reduce((sum, po) => sum + po.total, 0),
      pendingOrders: this.purchaseOrders.filter(po => 
        po.status === 'sent' || po.status === 'confirmed'
      ).length,
      incomingDeliveries: this.purchaseOrders.filter(po => 
        po.status === 'shipped'
      ).length
    };
  }
}

export const supplierManagement = new SupplierManagementService();

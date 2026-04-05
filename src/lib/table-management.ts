// Table Management System - Dine-in table assignment and tracking
import { db } from "./firebase";
import { collection, addDoc, getDocs, query, where, onSnapshot, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";

export interface Table {
  id?: string;
  number: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrderId?: string;
  currentGuests?: number;
  reservationName?: string;
  reservationTime?: Timestamp;
  section?: string; // e.g., 'indoor', 'outdoor', 'vip'
  qrCode?: string; // For customer self-ordering
}

export interface TableOrder {
  id?: string;
  tableId: string;
  tableNumber: number;
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    status: 'pending' | 'preparing' | 'served';
  }>;
  guestCount: number;
  serverName: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  totalAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

class TableManagementService {
  private tables: Table[] = [];
  private unsubscribe: (() => void) | null = null;

  async initializeTables() {
    // Load initial tables or create default layout
    const snapshot = await getDocs(collection(db, "tables"));
    this.tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));

    if (this.tables.length === 0) {
      // Create default table layout
      await this.createDefaultTables();
    }

    // Start real-time listener
    this.startListening();
  }

  private async createDefaultTables() {
    const defaultTables: Omit<Table, 'id'>[] = [
      { number: 1, name: 'Table 1', capacity: 2, status: 'available', section: 'indoor' },
      { number: 2, name: 'Table 2', capacity: 2, status: 'available', section: 'indoor' },
      { number: 3, name: 'Table 3', capacity: 4, status: 'available', section: 'indoor' },
      { number: 4, name: 'Table 4', capacity: 4, status: 'available', section: 'indoor' },
      { number: 5, name: 'Table 5', capacity: 6, status: 'available', section: 'indoor' },
      { number: 6, name: 'Table 6', capacity: 6, status: 'available', section: 'indoor' },
      { number: 7, name: 'Outdoor 1', capacity: 4, status: 'available', section: 'outdoor' },
      { number: 8, name: 'Outdoor 2', capacity: 4, status: 'available', section: 'outdoor' },
      { number: 9, name: 'VIP 1', capacity: 8, status: 'available', section: 'vip' },
      { number: 10, name: 'VIP 2', capacity: 10, status: 'available', section: 'vip' },
    ];

    for (const table of defaultTables) {
      await addDoc(collection(db, "tables"), table);
    }
  }

  private startListening() {
    const q = query(collection(db, "tables"));
    this.unsubscribe = onSnapshot(q, (snapshot) => {
      this.tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
    });
  }

  async occupyTable(tableId: string, orderId: string, guestCount: number, serverName: string) {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      status: 'occupied',
      currentOrderId: orderId,
      currentGuests: guestCount
    });

    // Create table order record
    await addDoc(collection(db, "table_orders"), {
      tableId,
      tableNumber: this.tables.find(t => t.id === tableId)?.number,
      orderId,
      guestCount,
      serverName,
      startTime: Timestamp.now(),
      status: 'active',
      totalAmount: 0
    });
  }

  async reserveTable(tableId: string, reservationName: string, reservationTime: Date) {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      status: 'reserved',
      reservationName,
      reservationTime: Timestamp.fromDate(reservationTime)
    });
  }

  async releaseTable(tableId: string) {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      status: 'cleaning',
      currentOrderId: null,
      currentGuests: null
    });

    // Update table order record
    const q = query(
      collection(db, "table_orders"),
      where("tableId", "==", tableId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      updateDoc(doc.ref, {
        status: 'completed',
        endTime: Timestamp.now()
      });
    });

    // After cleaning, mark as available
    setTimeout(async () => {
      await updateDoc(tableRef, { status: 'available' });
    }, 30000); // 30 seconds for cleaning
  }

  async markTableClean(tableId: string) {
    const tableRef = doc(db, "tables", tableId);
    await updateDoc(tableRef, {
      status: 'available',
      reservationName: null,
      reservationTime: null
    });
  }

  getTables(): Table[] {
    return this.tables;
  }

  getAvailableTables(): Table[] {
    return this.tables.filter(t => t.status === 'available');
  }

  getOccupiedTables(): Table[] {
    return this.tables.filter(t => t.status === 'occupied');
  }

  getReservedTables(): Table[] {
    return this.tables.filter(t => t.status === 'reserved');
  }

  getTablesBySection(section: string): Table[] {
    return this.tables.filter(t => t.section === section);
  }

  getTableStats() {
    const total = this.tables.length;
    const available = this.tables.filter(t => t.status === 'available').length;
    const occupied = this.tables.filter(t => t.status === 'occupied').length;
    const reserved = this.tables.filter(t => t.status === 'reserved').length;
    const cleaning = this.tables.filter(t => t.status === 'cleaning').length;

    return {
      total,
      available,
      occupied,
      reserved,
      cleaning,
      occupancyRate: total > 0 ? (occupied / total) * 100 : 0
    };
  }

  // Split bill functionality
  async splitBill(orderId: string, splits: Array<{ items: string[]; amount: number }>) {
    // Create split bill records
    const splitRecords = splits.map((split, index) => ({
      orderId,
      splitNumber: index + 1,
      items: split.items,
      amount: split.amount,
      status: 'pending',
      createdAt: Timestamp.now()
    }));

    for (const record of splitRecords) {
      await addDoc(collection(db, "split_bills"), record);
    }

    return splitRecords;
  }

  // Transfer items between tables
  async transferItems(fromTableId: string, toTableId: string, itemIds: string[]) {
    // Get current orders
    const fromOrder = await this.getActiveTableOrder(fromTableId);
    const toOrder = await this.getActiveTableOrder(toTableId);

    if (!fromOrder || !toOrder) {
      throw new Error('One or both tables do not have active orders');
    }

    // Transfer items logic would go here
    console.log(`Transferring ${itemIds.length} items from Table ${fromTableId} to Table ${toTableId}`);
  }

  private async getActiveTableOrder(tableId: string) {
    const q = query(
      collection(db, "table_orders"),
      where("tableId", "==", tableId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs[0]?.data() as TableOrder | undefined;
  }

  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

export const tableManagement = new TableManagementService();

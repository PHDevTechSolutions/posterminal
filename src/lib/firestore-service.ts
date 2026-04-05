import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  serverTimestamp, 
  setDoc,
  doc,
  runTransaction,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { MenuItem, Order, AuditLog, UserProfile, Category } from "@/types";

const MENU_COLLECTION = "menu";
const CATEGORIES_COLLECTION = "categories";
const ORDERS_COLLECTION = "orders";
const AUDIT_COLLECTION = "audit_trails";
const USERS_COLLECTION = "users";

// --- Category Service ---
export const getCategories = async (): Promise<Category[]> => {
  const q = query(collection(db, CATEGORIES_COLLECTION), orderBy("name", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
};

export const addCategory = async (name: string) => {
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), { name });
  await logAction("ADD_CATEGORY", `Added category: ${name}`);
  return docRef.id;
};

export const deleteCategory = async (id: string, name: string) => {
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  await logAction("DELETE_CATEGORY", `Deleted category: ${name}`);
};

// --- Menu Service ---Management
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const q = query(collection(db, USERS_COLLECTION));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await setDoc(userRef, data, { merge: true });
    await logAction("UPDATE_USER_PROFILE", `Updated profile for user ${uid}`);
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
};

export const createUserProfile = async (profile: UserProfile) => {
  try {
    const userRef = doc(db, USERS_COLLECTION, profile.uid);
    await setDoc(userRef, profile);
    await logAction("CREATE_USER_PROFILE", `Created profile for user ${profile.email}`);
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
};

// Fetch all menu items from Firestore
export const getMenuItems = async (): Promise<MenuItem[]> => {
  try {
    const q = query(collection(db, MENU_COLLECTION));
    const querySnapshot = await getDocs(q);
    const items = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as MenuItem));
    
    return items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    throw error;
  }
};

// Log an action to Audit Trail
export const logAction = async (action: string, details: string) => {
  try {
    const user = auth.currentUser;
    const log: AuditLog = {
      userId: user?.uid || "anonymous",
      userName: user?.displayName || user?.email || "Anonymous",
      action,
      details,
      timestamp: serverTimestamp()
    };
    await addDoc(collection(db, AUDIT_COLLECTION), log);
  } catch (error) {
    console.error("Error logging action:", error);
  }
};

// Create a new order with stock deduction (Transaction)
export const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt'>) => {
  try {
    const orderId = await runTransaction(db, async (transaction) => {
      // 1. ALL READS FIRST
      const itemRefs = orderData.items.map(item => doc(db, MENU_COLLECTION, item.id));
      const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));
      
      const stockUpdates: { ref: any, newStock: number }[] = [];
      
      itemDocs.forEach((itemDoc, index) => {
        const item = orderData.items[index];
        if (!itemDoc.exists()) {
          throw new Error(`Item ${item.name} does not exist!`);
        }
        
        const currentStock = itemDoc.data().stock || 0;
        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Current: ${currentStock}`);
        }
        
        stockUpdates.push({
          ref: itemRefs[index],
          newStock: currentStock - item.quantity
        });
      });

      // 2. ALL WRITES AFTER
      stockUpdates.forEach(update => {
        transaction.update(update.ref, { stock: update.newStock });
      });

      const orderRef = doc(collection(db, ORDERS_COLLECTION));
      const user = auth.currentUser;
      const order = {
        ...orderData,
        createdAt: serverTimestamp(),
        status: 'pending',
        cashierName: user?.displayName || user?.email || "Anonymous"
      };
      
      transaction.set(orderRef, order);
      
      return orderRef.id;
    });

    // Log action outside transaction so it doesn't block the order if it fails
    await logAction("CREATE_ORDER", `Order created with ${orderData.items.length} items. Total: ₱${orderData.total}`);
    return orderId;
  } catch (error) {
    console.error("Error creating order with transaction:", error);
    throw error;
  }
};

// Update menu item (Admin only logic)
export const updateMenuItem = async (id: string, data: Partial<MenuItem>) => {
  try {
    const itemRef = doc(db, MENU_COLLECTION, id);
    await setDoc(itemRef, data, { merge: true });
    await logAction("UPDATE_MENU_ITEM", `Updated item ${id} with data: ${JSON.stringify(data)}`);
  } catch (error) {
    console.error("Error updating menu item:", error);
    throw error;
  }
};

// Add new menu item
export const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, MENU_COLLECTION), item);
    await logAction("ADD_MENU_ITEM", `Added new item: ${item.name}`);
    return docRef.id;
  } catch (error) {
    console.error("Error adding menu item:", error);
    throw error;
  }
};

// Seed helper (Updated with stock)
export const seedMenu = async (items: MenuItem[]) => {
  try {
    const existing = await getMenuItems();
    if (existing.length === 0) {
      console.log("Seeding menu with stocks...");
      for (const item of items) {
        const { id, ...data } = item;
        await addDoc(collection(db, MENU_COLLECTION), {
          ...data,
          cost: data.price * 0.6, // Default cost at 60% of price
          stock: 50 
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error seeding menu:", error);
    throw error;
  }
};

// Real-time listener for Orders (Queuing)
export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(
    collection(db, ORDERS_COLLECTION), 
    where("status", "in", ["pending", "preparing"]),
    orderBy("createdAt", "asc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
    callback(orders);
  });
};

// Void Order (Admin only) - returns stocks
export const voidOrder = async (orderId: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      // 1. ALL READS
      const orderRef = doc(db, ORDERS_COLLECTION, orderId);
      const orderDoc = await transaction.get(orderRef);
      
      if (!orderDoc.exists()) throw new Error("Order not found");
      const orderData = orderDoc.data() as Order;
      if (orderData.status === 'cancelled') throw new Error("Order already cancelled");

      const itemRefs = orderData.items.map(item => doc(db, MENU_COLLECTION, item.id));
      const itemDocs = await Promise.all(itemRefs.map(ref => transaction.get(ref)));

      // 2. ALL WRITES
      itemDocs.forEach((itemDoc, index) => {
        if (itemDoc.exists()) {
          const currentStock = itemDoc.data().stock || 0;
          transaction.update(itemRefs[index], { stock: currentStock + orderData.items[index].quantity });
        }
      });

      transaction.update(orderRef, { status: 'cancelled' });
    });

    await logAction("VOID_ORDER", `Order #${orderId} voided. Stocks returned.`);
  } catch (error) {
    console.error("Error voiding order:", error);
    throw error;
  }
};

// Update Order status (Kitchen/Admin)
export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  try {
    const orderRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, { status });
    await logAction("UPDATE_ORDER_STATUS", `Order ${orderId} status changed to ${status}`);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// Fetch Today's Orders for Dashboard
export const getTodayOrders = async (): Promise<Order[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const q = query(
      collection(db, ORDERS_COLLECTION),
      where("createdAt", ">=", today),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Order));
  } catch (error) {
    console.error("Error fetching today's orders:", error);
    throw error;
  }
};

// Fetch All Audit Trails
export const getAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const q = query(collection(db, AUDIT_COLLECTION), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as AuditLog));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw error;
  }
};

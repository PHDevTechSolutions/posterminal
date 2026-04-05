export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number; // Selling Price
  cost: number;  // Supplier/Purchase Price
  category: string;
  stock: number; 
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id?: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  discount: number;
  discountType?: 'none' | 'regular' | 'senior_pwd' | 'promo';
  promoCode?: string;
  total: number;
  totalCost: number;
  profit: number;
  createdAt: any;
  status: 'pending' | 'preparing' | 'completed' | 'cancelled';
  paymentMethod: 'Cash' | 'GCash' | 'Card';
  orderType: 'Dine-in' | 'Take-out' | 'Delivery';
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  source?: 'pos' | 'online';
}

export interface AuditLog {
  id?: string;
  userId: string;
  userName?: string;
  action: string;
  details: string;
  timestamp: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'super_admin' | 'admin' | 'cashier' | 'kitchen';
  displayName?: string;
  status: 'active' | 'inactive';
}

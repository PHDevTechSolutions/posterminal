"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Minus, 
  Package, 
  ShoppingBag, 
  X,
  Search,
  Trash2,
  CreditCard,
  ArrowLeft,
  Loader2,
  LogOut,
  Store,
  BarChart3,
  Percent,
  Grid3X3,
  ChefHat,
  Truck,
  Bell,
  Clock,
  Settings,
  DollarSign,
  Users,
  FileText,
  ScanLine,
  UserCircle,
  History,
  ClipboardList,
  ShoppingCart,
  TrendingUp,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MenuItem, CartItem } from "@/types";
import { getMenuItems, createOrder, seedMenu } from "@/lib/firestore-service";
import { chatService } from "@/lib/chat-service";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { receiptPrinter } from "@/lib/receipt-printer";
import PaymentModal from "@/components/PaymentModal";

const DUMMY_MENU: MenuItem[] = [
  { id: "1", name: "Sinandomeng Rice (1kg)", price: 55, cost: 48, category: "Grains", stock: 500 },
  { id: "2", name: "Dinorado Rice (1kg)", price: 65, cost: 58, category: "Grains", stock: 300 },
  { id: "3", name: "Instant Noodles", price: 15, cost: 12, category: "Grocery", stock: 100 },
  { id: "4", name: "Canned Sardines", price: 25, cost: 20, category: "Grocery", stock: 80 },
  { id: "5", name: "Bottled Water (500ml)", price: 15, cost: 10, category: "Drinks", stock: 200 },
  { id: "6", name: "Coffee Sachet", price: 12, cost: 9, category: "Drinks", stock: 150 },
  { id: "7", name: "Detergent Bar", price: 10, cost: 7, category: "Household", stock: 120 },
  { id: "8", name: "Bath Soap", price: 35, cost: 28, category: "Household", stock: 60 },
];

const CATEGORIES = ["All", "Grains", "Grocery", "Drinks", "Household"];

export default function POSPage() {
  const { user, profile, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        setLoading(true);
        let items = await getMenuItems();
        if (items.length === 0) {
          await seedMenu(DUMMY_MENU);
          items = await getMenuItems();
        }
        setMenuItems(items);
      } catch (error) {
        toast.error("Failed to load menu items");
      } finally {
        setLoading(false);
      }
    };

    if (user) loadMenu();
  }, [user]);

  // Load notification counts for dashboard badges
  useEffect(() => {
    if (!user) return;
    
    const loadCounts = async () => {
      try {
        // Unread messages
        const msgCount = await chatService.getUnreadCount();
        setUnreadMessages(msgCount);
        
        // Pending orders - query directly from Firestore
        const ordersQuery = query(
          collection(db, "orders"),
          where("status", "==", "pending")
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        setPendingOrders(ordersSnapshot.size);
        
        // Low stock items (items with stock <= 10)
        const lowStock = menuItems.filter(item => item.stock <= 10).length;
        setLowStockCount(lowStock);
      } catch (error) {
        console.error("Error loading counts:", error);
      }
    };
    
    loadCounts();
    
    // Real-time listener for messages
    const unsubscribe = chatService.onConversationsChange((conversations) => {
      const unread = conversations.filter(c => c.unreadCount > 0).length;
      setUnreadMessages(unread);
    });
    
    return () => unsubscribe();
  }, [user, menuItems]);

  const generatePDF = (orderId: string, items: CartItem[], subtotal: number, tax: number, total: number) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SALES RECEIPT", 105, 20, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Order ID: ${orderId}`, 20, 35);
    doc.text(`Date: ${new Date().toLocaleString()}`, 20, 40);
    doc.text(`Cashier: ${profile?.displayName || user?.email}`, 20, 45);
    autoTable(doc, {
      startY: 55,
      head: [['Item', 'Price', 'Qty', 'Total']],
      body: items.map(item => [
        item.name,
        `P${item.price.toFixed(2)}`,
        item.quantity,
        `P${(item.price * item.quantity).toFixed(2)}`
      ]),
      foot: [
        ['', '', 'Subtotal', `P${subtotal.toFixed(2)}`],
        ['', '', 'VAT (12%)', `P${tax.toFixed(2)}`],
        ['', '', 'Total', `P${total.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0] }
    });
    doc.text("Thank you!", 105, doc.internal.pageSize.height - 20, { align: "center" });
    doc.save(`receipt-${orderId}.pdf`);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      toast.error("Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.quantity >= item.stock) {
          toast.error(`Only ${item.stock} items left`);
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    toast.success(`${item.name} added`, { duration: 1000 });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    const itemInMenu = menuItems.find(i => i.id === id);
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        if (itemInMenu && newQty > itemInMenu.stock) {
          toast.error(`Max: ${itemInMenu.stock}`);
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.12;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsPaymentModalOpen(true);
  };

  const processPayment = async (paymentMethod: string) => {
    try {
      setIsCheckingOut(true);
      const orderId = await createOrder({
        items: cart,
        subtotal,
        tax,
        discount: 0,
        discountType: 'none',
        total,
        totalCost: cart.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0),
        profit: total - cart.reduce((acc, item) => acc + ((item.cost || 0) * item.quantity), 0),
        paymentMethod: paymentMethod as any,
        orderType: 'Take-out',
        status: "completed",
        cashierName: profile?.displayName || user?.email || "Anonymous"
      });
      
      setCurrentOrderId(orderId);
      generatePDF(orderId, cart, subtotal, tax, total);
      
      receiptPrinter.printReceipt({
        orderId: orderId.slice(-8).toUpperCase(),
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity
        })),
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod,
        cashierName: profile?.displayName || user?.email || "Anonymous",
        date: new Date().toLocaleString()
      });
      
      setCart([]);
      setIsPaymentModalOpen(false);
      setIsOrderMode(false);
      
      const updatedItems = await getMenuItems();
      setMenuItems(updatedItems);
      
      toast.success("Payment successful!");
    } catch (error: any) {
      toast.error(error.message || "Payment failed.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-black" />
      </div>
    );
  }

  // DASHBOARD MODE - No order yet
  if (!isOrderMode) {
    return (
      <div className="min-h-screen bg-white">
        {/* Minimal Header */}
        <header className="h-16 border-b px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-black rounded-lg flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">POS</span>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.push("/shop")}
            className="text-gray-700"
          >
            Online Shop
          </Button>
        </header>

        {/* Main Dashboard */}
        <main className="max-w-5xl mx-auto px-6 py-12">
          {/* Welcome */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-light text-gray-900 mb-2">
              Welcome, <span className="font-semibold">{profile?.displayName || user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-gray-400">Start a new order or manage your store</p>
          </div>

          {/* New Order Button */}
          <div className="flex justify-center mb-16">
            <Button 
              onClick={() => setIsOrderMode(true)}
              className="h-20 px-12 bg-black hover:bg-gray-800 text-white text-lg font-medium rounded-2xl shadow-2xl shadow-black/20 transition-all hover:scale-105"
            >
              <Plus className="h-6 w-6 mr-3" />
              New Order
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
            <Card className="border-0 shadow-none bg-gray-50">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-light text-gray-900">{menuItems.length}</p>
                <p className="text-sm text-gray-400 mt-1">Products</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-gray-50">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-light text-gray-900">₱0</p>
                <p className="text-sm text-gray-400 mt-1">Today Sales</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-none bg-gray-50">
              <CardContent className="p-6 text-center">
                <p className="text-3xl font-light text-gray-900">0</p>
                <p className="text-sm text-gray-400 mt-1">Orders</p>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="max-w-5xl mx-auto">
            <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4 text-center">Management</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
              {/* Analytics */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/analytics")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Analytics</h3>
                  </CardContent>
                </Card>
              )}

              {/* Promos */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/promos")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Percent className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Promos</h3>
                  </CardContent>
                </Card>
              )}

              {/* Tables */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'cashier') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/tables")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Grid3X3 className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Tables</h3>
                  </CardContent>
                </Card>
              )}

              {/* Kitchen */}
              {(profile?.role === 'kitchen' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/kds")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <ChefHat className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Kitchen</h3>
                  </CardContent>
                </Card>
              )}

              {/* Suppliers */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/suppliers")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Truck className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Suppliers</h3>
                  </CardContent>
                </Card>
              )}

              {/* Alerts */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50 relative"
                  onClick={() => router.push("/inventory-alerts")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                      <Bell className="h-6 w-6 text-gray-700" />
                      {lowStockCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {lowStockCount}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">Alerts</h3>
                  </CardContent>
                </Card>
              )}

              {/* Time Tracking */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                onClick={() => router.push("/time-tracking")}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="h-6 w-6 text-gray-700" />
                  </div>
                  <h3 className="font-medium text-sm">Time Track</h3>
                </CardContent>
              </Card>

              {/* Settings */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/settings/currency")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Settings className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Settings</h3>
                  </CardContent>
                </Card>
              )}

              {/* Orders */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'cashier') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50 relative"
                  onClick={() => router.push("/orders")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                      <ShoppingCart className="h-6 w-6 text-gray-700" />
                      {pendingOrders > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {pendingOrders}
                        </span>
                      )}
                    </div>
                    <h3 className="font-medium text-sm">Orders</h3>
                  </CardContent>
                </Card>
              )}

              {/* Inventory */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/inventory")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Inventory</h3>
                  </CardContent>
                </Card>
              )}

              {/* History */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'cashier') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/history")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <History className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">History</h3>
                  </CardContent>
                </Card>
              )}

              {/* Customers */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/customers")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <UserCircle className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Customers</h3>
                  </CardContent>
                </Card>
              )}

              {/* Barcode */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin' || profile?.role === 'cashier') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/barcode")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <ScanLine className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Barcode</h3>
                  </CardContent>
                </Card>
              )}

              {/* Audit */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/audit")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Audit</h3>
                  </CardContent>
                </Card>
              )}

              {/* Users */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/users")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Users</h3>
                  </CardContent>
                </Card>
              )}

              {/* Expenses */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/expenses")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Expenses</h3>
                  </CardContent>
                </Card>
              )}

              {/* Reports */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/reports")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Reports</h3>
                  </CardContent>
                </Card>
              )}

              {/* Shop Modification */}
              {(profile?.role === 'super_admin' || profile?.role === 'admin') && (
                <Card 
                  className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50"
                  onClick={() => router.push("/shop-modification")}
                >
                  <CardContent className="p-4 text-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Store className="h-6 w-6 text-gray-700" />
                    </div>
                    <h3 className="font-medium text-sm">Shop Config</h3>
                  </CardContent>
                </Card>
              )}

              {/* Messages */}
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow border-0 shadow-none bg-gray-50 relative"
                onClick={() => router.push("/messages")}
              >
                <CardContent className="p-4 text-center">
                  <div className="h-12 w-12 bg-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3 relative">
                    <MessageCircle className="h-6 w-6 text-gray-700" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-sm">Messages</h3>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ORDER MODE - Product selection
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b px-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setIsOrderMode(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">New Order</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search products..."
              className="pl-10 bg-gray-100 border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Button 
          variant="ghost" 
          className="relative"
          onClick={() => cart.length > 0 && setIsPaymentModalOpen(true)}
        >
          <ShoppingBag className="h-5 w-5" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-black text-white text-xs rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Button>
      </header>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Products Section */}
        <main className="flex-1 overflow-auto">
          {/* Categories */}
          <div className="px-4 py-4 flex gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-black" : ""}
              >
                {cat}
              </Button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="px-4 pb-20">
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-300" />
                      </div>
                      <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold">₱{item.price}</span>
                        <Badge variant={item.stock > 10 ? "secondary" : "destructive"} className="text-xs">
                          {item.stock}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Cart Sidebar */}
        {cart.length > 0 && (
          <aside className="w-80 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Order Summary</h2>
              <p className="text-sm text-gray-400">{cart.length} items</p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-gray-400">₱{item.price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VAT (12%)</span>
                <span>₱{tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-xl">₱{total.toFixed(2)}</span>
              </div>
              <Button 
                className="w-full bg-black hover:bg-gray-800 h-12"
                onClick={handleCheckout}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay Now
                  </>
                )}
              </Button>
            </div>
          </aside>
        )}
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        amount={total}
        orderId={currentOrderId || 'NEW'}
        onPaymentSuccess={processPayment}
      />
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Search, 
  Loader2,
  Printer,
  Calendar,
  Receipt,
  Filter,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Order, CartItem } from "@/types";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { voidOrder } from "@/lib/firestore-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export default function HistoryPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [voidingId, setVoidingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(data);
    } catch (error) {
      console.error("Error loading orders:", error);
      toast.error("Failed to load order history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOrders();
  }, [user]);

  const handleVoidOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to VOID this order? Stocks will be returned to inventory.")) return;
    
    try {
      setVoidingId(orderId);
      await voidOrder(orderId);
      toast.success("Order voided successfully");
      loadOrders();
    } catch (error: any) {
      console.error("Void order error:", error);
      toast.error(error.message || "Failed to void order");
    } finally {
      setVoidingId(null);
    }
  };

  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("POS RECEIPT (REPRINT)", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`Order ID: ${order.id}`, 20, 35);
    doc.text(`Date: ${order.createdAt?.toDate().toLocaleString()}`, 20, 40);
    doc.text(`Cashier: ${order.cashierName}`, 20, 45);
    doc.text(`Type: ${order.orderType}`, 20, 50);
    doc.text(`Payment: ${order.paymentMethod}`, 20, 55);
    
    autoTable(doc, {
      startY: 65,
      head: [['Item', 'Price', 'Qty', 'Total']],
      body: order.items.map(item => [
        item.name,
        `P${item.price.toFixed(2)}`,
        item.quantity,
        `P${(item.price * item.quantity).toFixed(2)}`
      ]),
      foot: [
        ['', '', 'Subtotal', `P${order.subtotal.toFixed(2)}`],
        ['', '', 'Tax (12%)', `P${order.tax.toFixed(2)}`],
        ['', '', 'Total', `P${order.total.toFixed(2)}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: 'orange' }
    });
    
    doc.text("Thank you for your purchase!", 105, doc.internal.pageSize.height - 20, { align: "center" });
    doc.save(`receipt-${order.id}.pdf`);
  };

  const filteredOrders = orders.filter(order => 
    order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.cashierName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="font-black text-xl text-gray-900 tracking-tighter">Receipts</h1>
        </div>
        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Receipt className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-6 lg:space-y-8">
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="h-12 w-12 rounded-2xl hover:bg-white hover:shadow-md transition-all">
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tighter flex items-center gap-3">
                <Receipt className="h-10 w-10 text-indigo-600" />
                Transaction History
              </h1>
              <p className="text-gray-500 font-medium">View and manage past sales receipts</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-600">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border p-4 lg:p-8 space-y-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Search by Order ID..." 
              className="pl-12 h-12 lg:h-14 rounded-2xl bg-gray-50 border-none text-lg group focus-within:bg-white transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2 border-gray-50">
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Order ID</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Date & Time</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Type</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Total</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Payment</TableHead>
                  <TableHead className="font-black text-gray-400 uppercase text-[10px] tracking-widest">Status</TableHead>
                  <TableHead className="text-right font-black text-gray-400 uppercase text-[10px] tracking-widest">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="h-10 w-10 animate-spin mx-auto text-indigo-600 opacity-20" />
                    </TableCell>
                  </TableRow>
                ) : filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-gray-400 font-bold">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                      <TableCell className="font-bold text-gray-900 py-6">
                        #{order.id?.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium">
                        {order.createdAt?.toDate().toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-indigo-100 text-indigo-600 font-bold text-[10px] uppercase px-3 py-1">
                          {order.orderType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-indigo-600">
                        ₱{order.total.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-400 font-bold">
                        {order.paymentMethod}
                      </TableCell>
                      <TableCell>
                        {order.status === 'cancelled' ? (
                          <Badge variant="destructive" className="font-black text-[10px] uppercase px-3 py-1">VOIDED</Badge>
                        ) : (
                          <Badge className="bg-emerald-500 hover:bg-emerald-500 font-black text-[10px] uppercase px-3 py-1">COMPLETED</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"
                            title="Reprint Receipt"
                            onClick={() => generatePDF(order)}
                          >
                            <Printer className="h-5 w-5" />
                          </Button>
                          {order.status !== 'cancelled' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl"
                              title="Void Order"
                              onClick={() => handleVoidOrder(order.id!)}
                              disabled={voidingId === order.id}
                            >
                              {voidingId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden space-y-4">
            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 opacity-20" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="py-20 text-center text-gray-400 font-bold">No transactions found.</div>
            ) : (
              filteredOrders.map((order) => (
                <div key={order.id} className={`p-5 rounded-3xl border bg-white shadow-sm flex flex-col gap-4 ${order.status === 'cancelled' ? 'opacity-60 grayscale' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-900 tracking-tight text-lg">#{order.id?.slice(-8).toUpperCase()}</h3>
                        {order.status === 'cancelled' && <Badge variant="destructive" className="text-[8px] font-black uppercase h-5">VOID</Badge>}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{order.createdAt?.toDate().toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl"
                        onClick={() => generatePDF(order)}
                      >
                        <Printer className="h-5 w-5" />
                      </Button>
                      {order.status !== 'cancelled' && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 bg-red-50 text-red-400 rounded-xl"
                          onClick={() => handleVoidOrder(order.id!)}
                          disabled={voidingId === order.id}
                        >
                          {voidingId === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-dashed pt-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                      <span className="font-black text-xl text-indigo-600 tracking-tighter">₱{order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Payment</span>
                      <Badge variant="outline" className="mt-1 border-indigo-100 text-indigo-600 font-black text-[10px] uppercase px-3 py-1">
                        {order.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

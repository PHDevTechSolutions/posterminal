"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  ChefHat,
  Loader2,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Order } from "@/types";
import { subscribeToOrders, updateOrderStatus } from "@/lib/firestore-service";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribe = subscribeToOrders((newOrders) => {
        setOrders(newOrders);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const getTimeElapsed = (timestamp: any) => {
    if (!timestamp) return "Just now";
    const now = new Date().getTime();
    const then = timestamp.toDate().getTime();
    const diff = Math.floor((now - then) / 60000); // in minutes
    return diff === 0 ? "Just now" : `${diff}m ago`;
  };

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
          <h1 className="font-black text-xl text-gray-900 tracking-tighter">Order Queue</h1>
        </div>
        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
          <ChefHat className="h-5 w-5 text-indigo-600" />
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
                <ChefHat className="h-10 w-10 text-indigo-600" />
                Processing Orders
              </h1>
              <p className="text-gray-500 font-medium">Monitor and update active order status</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border shadow-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Live Updates</span>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 opacity-20" />
          </div>
        ) : orders.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center text-gray-300 gap-4">
            <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center border-2 border-dashed">
              <ChefHat className="h-10 w-10 opacity-20" />
            </div>
            <p className="font-black text-xl uppercase tracking-tighter">No active orders</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="border-none shadow-sm rounded-3xl overflow-hidden flex flex-col bg-white">
                <CardHeader className={`${order.status === 'preparing' ? 'bg-indigo-600 text-white' : 'bg-amber-500 text-white'} p-5 transition-colors`}>
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Order ID</span>
                      <CardTitle className="text-xl font-black tracking-tighter">#{order.id?.slice(-6).toUpperCase()}</CardTitle>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 border-none text-white font-black text-[10px] uppercase px-3 py-1">
                      {order.orderType}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Wait Time</span>
                      <span className="text-sm font-bold">{getTimeElapsed(order.createdAt)}</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded-lg">
                      {order.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 flex-1">
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start group">
                        <div className="flex gap-3">
                          <div className="h-6 w-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-black">
                            {item.quantity}
                          </div>
                          <span className="font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="p-6 pt-0 gap-3">
                  {order.status === 'pending' ? (
                    <Button 
                      className="flex-1 h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 font-black text-xs uppercase tracking-widest shadow-lg shadow-amber-100"
                      onClick={() => handleStatusUpdate(order.id!, 'preparing')}
                    >
                      START PREPARING
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100"
                      onClick={() => handleStatusUpdate(order.id!, 'completed')}
                    >
                      MARK AS READY
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

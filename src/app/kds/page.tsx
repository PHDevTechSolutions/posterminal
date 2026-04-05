"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  ChefHat, 
  Clock, 
  Flame, 
  CheckCircle, 
  Volume2, 
  VolumeX,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { kitchenDisplay, KDSOrder } from "@/lib/kitchen-display";

export default function KitchenDisplayPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'kitchen' && profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      toast.error("Unauthorized access");
      router.push("/");
      return;
    }

    kitchenDisplay.initialize();
    kitchenDisplay.setSoundEnabled(soundEnabled);

    const unsubscribe = kitchenDisplay.onOrdersChange((newOrders) => {
      setOrders(newOrders);
      setStats(kitchenDisplay.getStats());
    });

    return () => {
      unsubscribe();
      kitchenDisplay.stopListening();
    };
  }, [soundEnabled, profile, router]);

  const handleStartPreparing = async (orderId: string) => {
    await kitchenDisplay.startPreparing(orderId);
    toast.success("Order preparation started");
  };

  const handleMarkReady = async (orderId: string) => {
    await kitchenDisplay.markOrderReady(orderId);
    toast.success("Order marked as ready");
  };

  const handleBump = async (orderId: string) => {
    await kitchenDisplay.bumpOrder(orderId);
    toast.success("Order completed");
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'rush': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getCardColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-yellow-50 border-yellow-200';
      case 'preparing': return 'bg-blue-50 border-blue-200';
      case 'ready': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} className="text-white">
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-orange-500" />
            <div>
              <h1 className="text-2xl font-bold">Kitchen Display System</h1>
              <div className="flex gap-4 text-sm text-gray-400">
                <span>New: {stats?.newOrders || 0}</span>
                <span>Preparing: {stats?.preparingOrders || 0}</span>
                <span>Ready: {stats?.readyOrders || 0}</span>
                <span>Urgent: {stats?.urgentOrders || 0}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-white"
          >
            {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.length === 0 ? (
          <div className="col-span-full h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl">No orders in queue</p>
              <p className="text-sm">Waiting for new orders...</p>
            </div>
          </div>
        ) : (
          orders.map((order) => (
            <Card 
              key={order.id} 
              className={`${getCardColor(order.status)} border-2`}
            >
              <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority === 'rush' && <Flame className="h-3 w-3 mr-1" />}
                      {order.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {Math.floor((Date.now() - order.receivedAt.toMillis()) / 60000)}m
                  </span>
                </div>

                {/* Table/Type */}
                <div className="mb-3">
                  <p className="text-lg font-semibold text-gray-900">
                    {order.orderType}
                    {order.tableNumber && ` - Table ${order.tableNumber}`}
                  </p>
                  <p className="text-sm text-gray-500">Server: {order.serverName}</p>
                </div>

                {/* Items */}
                <div className="space-y-2 mb-4">
                  {order.items.map((item, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-2 rounded ${
                        item.status === 'ready' ? 'bg-green-100' : 
                        item.status === 'preparing' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{item.quantity}x</span>
                        <span className="text-gray-700">{item.name}</span>
                      </div>
                      {item.status === 'ready' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'new' && (
                    <Button 
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      onClick={() => handleStartPreparing(order.id)}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Start
                    </Button>
                  )}
                  {order.status === 'preparing' && (
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleMarkReady(order.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Ready
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button 
                      className="flex-1 bg-gray-600 hover:bg-gray-700"
                      onClick={() => handleBump(order.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Done
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Bell, AlertTriangle, Package, Mail, Smartphone, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { inventoryAlerts, InventoryAlert, AlertSettings } from "@/lib/inventory-alerts";

export default function InventoryAlertsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>(inventoryAlerts.getSettings());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (profile?.role === 'super_admin' || profile?.role === 'admin')) {
      loadAlerts();
      inventoryAlerts.initializeAlerts();
    }
  }, [user, profile]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const activeAlerts = await inventoryAlerts.getActiveAlerts();
      setAlerts(activeAlerts);
    } catch (error) {
      console.error("Error loading alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = () => {
    inventoryAlerts.updateSettings(settings);
    toast.success("Alert settings updated");
  };

  const acknowledgeAlert = async (alertId: string) => {
    // Update alert status
    toast.success("Alert acknowledged");
    loadAlerts();
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock': return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'reorder_needed': return <Package className="h-5 w-5 text-orange-600" />;
      default: return <Bell className="h-5 w-5 text-amber-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'out_of_stock': return 'bg-red-50 border-red-200';
      case 'reorder_needed': return 'bg-orange-50 border-orange-200';
      default: return 'bg-amber-50 border-amber-200';
    }
  };

  if (profile?.role !== 'super_admin' && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Unauthorized access</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="h-16 border-b px-6 flex items-center justify-between sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-semibold">Alerts</span>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="text-red-500">{alerts.filter(a => a.alertType === 'out_of_stock').length} Out of Stock</span>
          <span className="text-gray-400">{alerts.filter(a => a.alertType === 'low_stock').length} Low Stock</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Settings Card */}
        <Card className="border-0 shadow-none bg-gray-50 mb-6">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Settings</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <Label className="text-gray-400 text-xs uppercase">Low Stock Threshold</Label>
                <Input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({...settings, lowStockThreshold: Number(e.target.value)})}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs uppercase">Reorder Point</Label>
                <Input
                  type="number"
                  value={settings.reorderPoint}
                  onChange={(e) => setSettings({...settings, reorderPoint: Number(e.target.value)})}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm">Email Notifications</span>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-200">
                <span className="text-sm">SMS Notifications</span>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, smsNotifications: checked})}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm">Push Notifications</span>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, pushNotifications: checked})}
                />
              </div>
            </div>

            <Button onClick={handleUpdateSettings} className="w-full bg-black hover:bg-gray-800">
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Active Alerts */}
        <Card className="border-0 shadow-none bg-gray-50">
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
              Active Alerts ({alerts.length})
            </h3>
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No active alerts</p>
                <p className="text-sm">All inventory levels are normal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.alertType)}
                      <div>
                        <h3 className="font-medium">{alert.itemName}</h3>
                        <p className="text-sm text-gray-400">
                          Stock: {alert.currentStock} | Threshold: {alert.threshold}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        alert.alertType === 'out_of_stock' ? 'bg-red-100 text-red-700' :
                        alert.alertType === 'reorder_needed' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alert.alertType.replace('_', ' ')}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => acknowledgeAlert(alert.id!)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

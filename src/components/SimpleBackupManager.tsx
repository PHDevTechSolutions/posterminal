"use client";

import { useState } from "react";
import { 
  Download, 
  Calendar, 
  Clock, 
  Database,
  FileJson,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

export default function SimpleBackupManager() {
  const [loading, setLoading] = useState(false);
  const [lastBackup, setLastBackup] = useState<any>(null);

  const exportToJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val
      ).join(",")
    );
    
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const createBackup = async (type: 'daily' | 'weekly' | 'monthly') => {
    try {
      setLoading(true);
      console.log(`Starting ${type} backup...`);

      // Calculate date range
      const endDate = new Date();
      let startDate = new Date();
      
      switch (type) {
        case 'daily':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      console.log('Date range:', { startDate, endDate });

      // Get orders from Firestore directly
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", startDate),
        where("createdAt", "<=", endDate),
        orderBy("createdAt", "desc")
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${orders.length} orders`);

      // Get all menu items
      const menuSnapshot = await getDocs(collection(db, "menu"));
      const menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${menuItems.length} menu items`);

      // Get all users
      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log(`Found ${users.length} users`);

      // Create backup data
      const backupData = {
        metadata: {
          type,
          generatedAt: new Date().toISOString(),
          dateRange: {
            start: startDate.toISOString(),
            end: endDate.toISOString()
          },
          summary: {
            totalOrders: orders.length,
            totalMenuItems: menuItems.length,
            totalUsers: users.length
          }
        },
        orders,
        menuItems,
        users
      };

      // Export as JSON
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `pos-backup-${type}-${timestamp}.json`;
      exportToJSON(backupData, filename);

      // Also export orders as CSV for easy viewing
      if (orders.length > 0) {
        const csvFilename = `pos-orders-${type}-${timestamp}.csv`;
        exportToCSV(orders, csvFilename);
      }

      setLastBackup(backupData.metadata);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} backup created and downloaded!`);
      console.log('Backup completed successfully');

    } catch (error: any) {
      console.error('Backup error:', error);
      toast.error(`Backup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const exportAllData = async () => {
    try {
      setLoading(true);
      console.log('Starting full data export...');

      // Get all data without date filter
      const ordersSnapshot = await getDocs(collection(db, "orders"));
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const menuSnapshot = await getDocs(collection(db, "menu"));
      const menuItems = menuSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const usersSnapshot = await getDocs(collection(db, "users"));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Create full backup
      const fullBackup = {
        metadata: {
          type: 'full',
          generatedAt: new Date().toISOString(),
          summary: {
            totalOrders: orders.length,
            totalMenuItems: menuItems.length,
            totalUsers: users.length,
            totalCategories: categories.length
          }
        },
        orders,
        menuItems,
        users,
        categories
      };

      const timestamp = new Date().toISOString().split('T')[0];
      exportToJSON(fullBackup, `pos-full-backup-${timestamp}.json`);

      toast.success('Full backup created and downloaded!');
      console.log('Full backup completed');

    } catch (error: any) {
      console.error('Full backup error:', error);
      toast.error(`Full backup failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-black tracking-tighter flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-600" />
          Data Backup & Export
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {/* Quick Backup Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <Button
            variant="outline"
            className="h-16 flex-col gap-1 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('daily')}
            disabled={loading}
          >
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-gray-600 text-xs">Daily</span>
            <span className="text-[10px] text-gray-400">Today only</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col gap-1 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('weekly')}
            disabled={loading}
          >
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-gray-600 text-xs">Weekly</span>
            <span className="text-[10px] text-gray-400">Last 7 days</span>
          </Button>

          <Button
            variant="outline"
            className="h-16 flex-col gap-1 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            onClick={() => createBackup('monthly')}
            disabled={loading}
          >
            <Download className="h-5 w-5 text-gray-400" />
            <span className="font-bold text-gray-600 text-xs">Monthly</span>
            <span className="text-[10px] text-gray-400">Last 30 days</span>
          </Button>
        </div>

        {/* Full Export */}
        <div className="border-t border-gray-100 pt-4">
          <Button
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 rounded-xl gap-2 font-bold"
            onClick={exportAllData}
            disabled={loading}
          >
            <FileJson className="h-5 w-5" />
            Export All Data (JSON)
          </Button>
        </div>

        {/* Last Backup Info */}
        {lastBackup && (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-sm">Last Backup</h4>
                <p className="text-xs text-gray-500">
                  {new Date(lastBackup.generatedAt).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  Type: <Badge variant="secondary" className="ml-1">{lastBackup.type}</Badge>
                </p>
                <p className="text-xs text-gray-500">
                  Orders: {lastBackup.summary.totalOrders} | Items: {lastBackup.summary.totalMenuItems}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700">
                ✓ Ready
              </Badge>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="font-black">Creating backup...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

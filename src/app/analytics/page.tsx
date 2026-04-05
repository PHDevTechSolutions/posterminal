"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package,
  DollarSign,
  Calendar,
  Download,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dataAnalytics } from "@/lib/data-analytics";

// Simple bar chart component - minimalist
const SimpleBarChart = ({ data, maxValue }: { data: number[], maxValue: number }) => (
  <div className="flex items-end gap-2 h-32 px-4">
    {data.map((value, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-2">
        <div 
          className="w-full bg-black rounded-sm"
          style={{ height: `${maxValue > 0 ? (value / maxValue) * 100 : 0}%`, minHeight: value > 0 ? '2px' : '0' }}
        />
        <span className="text-xs text-gray-400 font-mono">{i + 1}</span>
      </div>
    ))}
  </div>
);

export default function DataAnalyticsPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user, period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const report = await dataAnalytics.generateDashboardReport(period);
      setAnalytics(report);
    } catch (error) {
      console.error("Error loading analytics:", error);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (!analytics) return;
    dataAnalytics.exportToCSV(analytics.sales.salesTrend, `sales-${period}`);
    toast.success("Data exported");
  };

  if (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin')) {
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
          <span className="font-semibold">Analytics</span>
        </div>
        <Button variant="ghost" size="sm" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Period Selector */}
        <div className="flex gap-1 mb-8 p-1 bg-gray-100 rounded-lg w-fit">
          {(['day', 'week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                period === p ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Cards - Minimal */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Revenue</span>
                  </div>
                  <p className="text-3xl font-light text-black">
                    ₱{analytics.sales.totalRevenue?.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Profit</span>
                  </div>
                  <p className="text-3xl font-light text-black">
                    ₱{analytics.sales.totalProfit?.toLocaleString() || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Package className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Orders</span>
                  </div>
                  <p className="text-3xl font-light text-black">
                    {analytics.sales.totalOrders || 0}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 text-gray-400 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="text-xs uppercase tracking-wider">Customers</span>
                  </div>
                  <p className="text-3xl font-light text-black">
                    {analytics.customers.totalCustomers || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sales Trend - Minimal */}
            <Card className="border-0 shadow-none bg-gray-50">
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Sales Trend</h3>
                <SimpleBarChart 
                  data={analytics.sales.salesTrend?.map((t: any) => t.revenue) || []}
                  maxValue={Math.max(...(analytics.sales.salesTrend?.map((t: any) => t.revenue) || [0]))}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Products */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Top Products</h3>
                  <div className="space-y-4">
                    {analytics.sales.topSellingProducts?.slice(0, 5).map((product: any, index: number) => (
                      <div key={index} className="flex items-center gap-4">
                        <span className="text-sm font-mono text-gray-400 w-6">{index + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.quantity} sold</p>
                        </div>
                        <p className="font-semibold text-sm">₱{product.revenue?.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Status */}
              <Card className="border-0 shadow-none bg-gray-50">
                <CardContent className="p-6">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">Inventory</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-gray-600">Total Products</span>
                      <span className="font-semibold">{analytics.inventory.totalProducts}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-sm text-amber-600">Low Stock</span>
                      <span className="font-semibold text-amber-600">{analytics.inventory.lowStockCount}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-red-600">Out of Stock</span>
                      <span className="font-semibold text-red-600">{analytics.inventory.outOfStockCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

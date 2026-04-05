"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Loader2,
  DollarSign,
  Users,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

// Simple chart components using CSS
const BarChart = ({ data, maxValue }: { data: number[], maxValue: number }) => (
  <div className="flex items-end gap-2 h-32">
    {data.map((value, i) => (
      <div key={i} className="flex-1 flex flex-col items-center gap-1">
        <div 
          className="w-full bg-indigo-500 rounded-t-md transition-all duration-500"
          style={{ height: `${(value / maxValue) * 100}%` }}
        />
        <span className="text-xs text-gray-500">{i + 1}</span>
      </div>
    ))}
  </div>
);

const PieChartDisplay = ({ 
  data 
}: { 
  data: { label: string; value: number; color: string }[] 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
          {data.map((item, i) => {
            const angle = (item.value / total) * 360;
            const x1 = 16 + 16 * Math.cos((currentAngle * Math.PI) / 180);
            const y1 = 16 + 16 * Math.sin((currentAngle * Math.PI) / 180);
            const x2 = 16 + 16 * Math.cos(((currentAngle + angle) * Math.PI) / 180);
            const y2 = 16 + 16 * Math.sin(((currentAngle + angle) * Math.PI) / 180);
            const largeArc = angle > 180 ? 1 : 0;
            
            const path = `M 16 16 L ${x1} ${y1} A 16 16 0 ${largeArc} 1 ${x2} ${y2} Z`;
            currentAngle += angle;
            
            return <path key={i} d={path} fill={item.color} />;
          })}
        </svg>
      </div>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600">{item.label}</span>
            <span className="font-semibold ml-auto">{((item.value / total) * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (profile?.role !== 'super_admin' && profile?.role !== 'admin'))) {
      toast.error("Unauthorized access");
      router.push("/");
    }
  }, [user, profile, authLoading, router]);

  const generateReport = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Fetch orders
      const ordersQuery = query(
        collection(db, "orders"),
        where("createdAt", ">=", Timestamp.fromDate(startDate)),
        where("createdAt", "<=", Timestamp.fromDate(endDate)),
        orderBy("createdAt", "desc")
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const totalSales = orders.reduce((sum, order: any) => sum + (order.total || 0), 0);
      const totalProfit = orders.reduce((sum, order: any) => sum + (order.profit || 0), 0);
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Sales by category
      const categorySales: Record<string, number> = {};
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          categorySales[item.category] = (categorySales[item.category] || 0) + (item.price * item.quantity);
        });
      });

      // Sales by hour (for today)
      const hourlySales = new Array(24).fill(0);
      orders.forEach((order: any) => {
        const hour = order.createdAt?.toDate?.().getHours() || 0;
        hourlySales[hour] += order.total || 0;
      });

      // Payment methods
      const paymentMethods: Record<string, number> = {};
      orders.forEach((order: any) => {
        paymentMethods[order.paymentMethod] = (paymentMethods[order.paymentMethod] || 0) + 1;
      });

      // Top products
      const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
      orders.forEach((order: any) => {
        order.items?.forEach((item: any) => {
          if (!productSales[item.id]) {
            productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.id].quantity += item.quantity;
          productSales[item.id].revenue += item.price * item.quantity;
        });
      });

      const topProducts = Object.values(productSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setReportData({
        totalSales,
        totalProfit,
        totalOrders,
        avgOrderValue,
        categorySales,
        hourlySales,
        paymentMethods,
        topProducts,
        startDate,
        endDate
      });

    } catch (error: any) {
      console.error("Report generation error:", error);
      toast.error("Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) generateReport();
  }, [user, dateRange]);

  const exportReport = () => {
    const reportText = `
SALES REPORT - ${dateRange.toUpperCase()}
Generated: ${new Date().toLocaleString()}

SUMMARY:
- Total Sales: ₱${reportData?.totalSales?.toLocaleString()}
- Total Profit: ₱${reportData?.totalProfit?.toLocaleString()}
- Total Orders: ${reportData?.totalOrders}
- Average Order: ₱${reportData?.avgOrderValue?.toFixed(2)}

TOP PRODUCTS:
${reportData?.topProducts?.map((p: any, i: number) => 
  `${i + 1}. ${p.name} - ${p.quantity} sold (₱${p.revenue.toLocaleString()})`
).join('\n')}

CATEGORY BREAKDOWN:
${Object.entries(reportData?.categorySales || {}).map(([cat, amount]) => 
  `- ${cat}: ₱${(amount as number).toLocaleString()}`
).join('\n')}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateRange}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Report exported successfully");
  };

  if (authLoading || !user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  const categoryColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-indigo-600" />
                Advanced Reports
              </h1>
              <p className="text-gray-500">Detailed analytics and insights</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex bg-white rounded-lg p-1 border">
              {(['today', 'week', 'month', 'year'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    dateRange === range 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
          </div>
        ) : reportData ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-indigo-50 border-indigo-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-indigo-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-indigo-700">
                    ₱{reportData.totalSales.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Profit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-700">
                    ₱{reportData.totalProfit.toLocaleString()}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-700">
                    {reportData.totalOrders}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Avg Order
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    ₱{reportData.avgOrderValue.toFixed(0)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales by Hour */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Hourly Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart 
                    data={reportData.hourlySales} 
                    maxValue={Math.max(...reportData.hourlySales, 1)} 
                  />
                  <p className="text-xs text-gray-400 mt-2 text-center">Hours of day (0-23)</p>
                </CardContent>
              </Card>

              {/* Sales by Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    Sales by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PieChartDisplay 
                    data={Object.entries(reportData.categorySales).map(([label, value], i) => ({
                      label,
                      value: value as number,
                      color: categoryColors[i % categoryColors.length]
                    }))} 
                  />
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Top Products</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.topProducts.map((product: any, index: number) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <Badge className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">{product.quantity} units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-indigo-600">₱{product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

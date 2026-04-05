// Data Analytics Dashboard - Comprehensive analytics and insights
import { db } from "./firebase";
import { collection, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";

export interface SalesAnalytics {
  totalRevenue: number;
  totalProfit: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingProducts: Array<{ name: string; quantity: number; revenue: number }>;
  salesByHour: number[]; // 24-hour distribution
  salesByDay: Record<string, number>; // Day of week
  salesByCategory: Record<string, number>;
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  customerRetentionRate: number;
  averageCustomerLifetimeValue: number;
  topCustomers: Array<{ name: string; totalSpent: number; visits: number }>;
  customerSatisfaction: number;
}

export interface InventoryAnalytics {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
  stockTurnoverRate: number;
  topCategories: Array<{ category: string; value: number }>;
  slowMovingItems: Array<{ name: string; daysInStock: number }>;
}

export interface EmployeeAnalytics {
  totalEmployees: number;
  totalHoursWorked: number;
  averageHoursPerEmployee: number;
  laborCost: number;
  laborCostPercentage: number; // % of revenue
  topPerformers: Array<{ name: string; sales: number; orders: number }>;
  attendanceRate: number;
}

class DataAnalyticsDashboard {
  async getSalesAnalytics(
    startDate: Date,
    endDate: Date
  ): Promise<SalesAnalytics> {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Fetch orders in date range
    const q = query(
      collection(db, "orders"),
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const orders = snapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Product sales aggregation
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    const categorySales: Record<string, number> = {};
    const hourlySales = new Array(24).fill(0);
    const dailySales: Record<string, number> = {};
    const trendData: Record<string, { revenue: number; orders: number }> = {};

    orders.forEach(order => {
      // Hourly distribution
      const hour = order.createdAt?.toDate?.().getHours() || 0;
      hourlySales[hour] += order.total || 0;

      // Daily distribution
      const day = order.createdAt?.toDate?.().toISOString().split('T')[0];
      if (day) {
        dailySales[day] = (dailySales[day] || 0) + (order.total || 0);
        
        // Trend data
        if (!trendData[day]) {
          trendData[day] = { revenue: 0, orders: 0 };
        }
        trendData[day].revenue += order.total || 0;
        trendData[day].orders += 1;
      }

      // Product sales
      order.items?.forEach((item: any) => {
        if (!productSales[item.id]) {
          productSales[item.id] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.id].quantity += item.quantity;
        productSales[item.id].revenue += (item.price * item.quantity);

        // Category sales
        categorySales[item.category] = (categorySales[item.category] || 0) + (item.price * item.quantity);
      });
    });

    // Top selling products
    const topSellingProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Sales trend
    const salesTrend = Object.entries(trendData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalRevenue,
      totalProfit,
      totalOrders,
      averageOrderValue,
      topSellingProducts,
      salesByHour: hourlySales,
      salesByDay: dailySales,
      salesByCategory: categorySales,
      salesTrend
    };
  }

  async getCustomerAnalytics(startDate: Date, endDate: Date): Promise<CustomerAnalytics> {
    // Fetch customers and orders
    const customersSnapshot = await getDocs(collection(db, "customers"));
    const customers = customersSnapshot.docs.map(doc => doc.data());

    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    const ordersQ = query(
      collection(db, "orders"),
      where("createdAt", ">=", startTimestamp),
      where("createdAt", "<=", endTimestamp)
    );
    const ordersSnapshot = await getDocs(ordersQ);
    const orders = ordersSnapshot.docs.map(doc => doc.data());

    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => {
      const created = c.createdAt?.toDate?.();
      return created && created >= startDate && created <= endDate;
    }).length;

    // Customer spending
    const customerSpending: Record<string, { name: string; totalSpent: number; visits: number }> = {};
    orders.forEach(order => {
      const customerName = order.customerName || 'Walk-in';
      if (!customerSpending[customerName]) {
        customerSpending[customerName] = { name: customerName, totalSpent: 0, visits: 0 };
      }
      customerSpending[customerName].totalSpent += order.total || 0;
      customerSpending[customerName].visits += 1;
    });

    const topCustomers = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const returningCustomers = Object.values(customerSpending).filter(c => c.visits > 1).length;
    const customerRetentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Average Customer Lifetime Value
    const totalSpent = Object.values(customerSpending).reduce((sum, c) => sum + c.totalSpent, 0);
    const averageCustomerLifetimeValue = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    return {
      totalCustomers,
      newCustomers,
      returningCustomers,
      customerRetentionRate,
      averageCustomerLifetimeValue,
      topCustomers,
      customerSatisfaction: 4.5 // Placeholder - would come from reviews
    };
  }

  async getInventoryAnalytics(): Promise<InventoryAnalytics> {
    const menuSnapshot = await getDocs(collection(db, "menu"));
    const products = menuSnapshot.docs.map(doc => ({ 
      id: doc.id, 
      stock: doc.data().stock || 0,
      cost: doc.data().cost || 0,
      category: doc.data().category || '',
      name: doc.data().name || '',
      ...doc.data() 
    }));

    const totalProducts = products.length;
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 10);
    const outOfStockItems = products.filter(p => p.stock === 0);

    // Inventory value
    const inventoryValue = products.reduce((sum, p) => sum + (p.cost || 0) * (p.stock || 0), 0);

    // Category values
    const categoryValues: Record<string, number> = {};
    products.forEach(p => {
      const value = (p.cost || 0) * (p.stock || 0);
      categoryValues[p.category] = (categoryValues[p.category] || 0) + value;
    });

    const topCategories = Object.entries(categoryValues)
      .map(([category, value]) => ({ category, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalProducts,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      inventoryValue,
      stockTurnoverRate: 4.2, // Placeholder - calculated from sales data
      topCategories,
      slowMovingItems: lowStockItems.slice(0, 10).map(p => ({ 
        name: p.name, 
        daysInStock: Math.floor(Math.random() * 90) + 30 // Placeholder
      }))
    };
  }

  async getEmployeeAnalytics(startDate: Date, endDate: Date): Promise<EmployeeAnalytics> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users = usersSnapshot.docs.map(doc => doc.data());

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const timeRecordsQ = query(
      collection(db, "time_records"),
      where("date", ">=", startStr),
      where("date", "<=", endStr)
    );
    const timeSnapshot = await getDocs(timeRecordsQ);
    const timeRecords = timeSnapshot.docs.map(doc => doc.data());

    const totalEmployees = users.length;
    const totalHoursWorked = timeRecords.reduce((sum, r) => sum + (r.totalWorkMinutes || 0), 0) / 60;
    const averageHoursPerEmployee = totalEmployees > 0 ? totalHoursWorked / totalEmployees : 0;

    // Calculate labor cost (assuming average hourly rate of ₱100)
    const avgHourlyRate = 100;
    const laborCost = totalHoursWorked * avgHourlyRate;

    // Get sales for labor cost percentage
    const salesQ = query(
      collection(db, "orders"),
      where("createdAt", ">=", Timestamp.fromDate(startDate)),
      where("createdAt", "<=", Timestamp.fromDate(endDate))
    );
    const salesSnapshot = await getDocs(salesQ);
    const totalRevenue = salesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().total || 0), 0);

    const laborCostPercentage = totalRevenue > 0 ? (laborCost / totalRevenue) * 100 : 0;

    // Top performers by orders served
    const employeeSales: Record<string, { name: string; sales: number; orders: number }> = {};
    salesSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const cashierName = order.cashierName || 'Unknown';
      if (!employeeSales[cashierName]) {
        employeeSales[cashierName] = { name: cashierName, sales: 0, orders: 0 };
      }
      employeeSales[cashierName].sales += order.total || 0;
      employeeSales[cashierName].orders += 1;
    });

    const topPerformers = Object.values(employeeSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Attendance rate
    const expectedWorkDays = 22; // Assuming 22 working days
    const totalExpectedHours = totalEmployees * expectedWorkDays * 8;
    const attendanceRate = totalExpectedHours > 0 ? (totalHoursWorked / totalExpectedHours) * 100 : 0;

    return {
      totalEmployees,
      totalHoursWorked,
      averageHoursPerEmployee,
      laborCost,
      laborCostPercentage,
      topPerformers,
      attendanceRate
    };
  }

  // Generate comprehensive dashboard report
  async generateDashboardReport(period: 'day' | 'week' | 'month' | 'year'): Promise<{
    sales: SalesAnalytics;
    customers: CustomerAnalytics;
    inventory: InventoryAnalytics;
    employees: EmployeeAnalytics;
  }> {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
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

    const [sales, customers, inventory, employees] = await Promise.all([
      this.getSalesAnalytics(startDate, endDate),
      this.getCustomerAnalytics(startDate, endDate),
      this.getInventoryAnalytics(),
      this.getEmployeeAnalytics(startDate, endDate)
    ]);

    return { sales, customers, inventory, employees };
  }

  // Export data
  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h];
          // Escape values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const dataAnalytics = new DataAnalyticsDashboard();

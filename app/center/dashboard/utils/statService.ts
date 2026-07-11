// app/utils/statsService.ts
import {
  ref,
  get,
  query,
  orderByChild,
  startAt,
  endAt,
} from "firebase/database";
import { db } from "@/app/utils/firebaseConfig";

interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  averageSaleValue: number;
  totalCustomers: number;
  itemsSold: number;
  todaySales: number;
  todayRevenue: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  paymentMethodBreakdown: Record<string, { count: number; amount: number }>;
}

interface SaleItem {
  productId?: string;
  id?: string;
  name?: string;
  quantity?: number;
  subtotal?: number;
}

interface Sale {
  soldBy?: string;
  createdAt?: string;
  totalAmount?: number;
  customerPhone?: string;
  customerId?: string;
  items?: SaleItem[];
  paymentMethod?: string;
}

class StatsService {
  static async getSalesStats(
    centerId: string,
    userId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<SaleStats> {
    try {
      const salesRef = ref(db, `doza_centers/${centerId}/sales`);
      let firebaseQuery: ReturnType<typeof ref> | ReturnType<typeof query> =
        salesRef;

      if (dateRange) {
        firebaseQuery = query(
          salesRef,
          orderByChild("createdAt"),
          startAt(dateRange.start.toISOString()),
          endAt(dateRange.end.toISOString())
        );
      }

      const snapshot = await get(firebaseQuery);

      if (!snapshot.exists()) {
        return this.getEmptyStats();
      }

      const salesData = snapshot.val();
      const sales = Object.values(salesData) as Sale[];

      let filteredSales = sales;
      if (userId) {
        filteredSales = sales.filter((sale) => sale.soldBy === userId);
      }

      return this.calculateStats(filteredSales);
    } catch (error) {
      console.error("Error fetching sales stats:", error);
      return this.getEmptyStats();
    }
  }

  private static calculateStats(sales: Sale[]): SaleStats {
    if (sales.length === 0) {
      return this.getEmptyStats();
    }

    const totalRevenue = sales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );

    const today = new Date().toISOString().split("T")[0];
    const todaySales = sales.filter((s) => s.createdAt?.startsWith(today));
    const todayRevenue = todaySales.reduce(
      (sum, sale) => sum + (sale.totalAmount || 0),
      0
    );

    const totalItemsSold = sales.reduce((sum, sale) => {
      if (!sale.items) return sum;
      return (
        sum +
        sale.items.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0)
      );
    }, 0);

    const uniqueCustomers = new Set(
      sales.map((s) => s.customerPhone || s.customerId).filter(Boolean)
    ).size;

    const productSales: Record<
      string,
      { name: string; quantity: number; revenue: number }
    > = {};

    sales.forEach((sale) => {
      if (!sale.items) return;

      sale.items.forEach((item) => {
        const productId = item.productId || item.id;
        if (!productId) return;

        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.name || "Unknown Product",
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue += item.subtotal || 0;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const paymentMethods: Record<string, { count: number; amount: number }> =
      {};

    sales.forEach((sale) => {
      const method = sale.paymentMethod || "CASH";
      if (!paymentMethods[method]) {
        paymentMethods[method] = { count: 0, amount: 0 };
      }
      paymentMethods[method].count += 1;
      paymentMethods[method].amount += sale.totalAmount || 0;
    });

    return {
      totalSales: sales.length,
      totalRevenue,
      averageSaleValue: totalRevenue / sales.length,
      totalCustomers: uniqueCustomers,
      itemsSold: totalItemsSold,
      todaySales: todaySales.length,
      todayRevenue,
      topProducts,
      paymentMethodBreakdown: paymentMethods,
    };
  }

  static async getDailyStats(centerId: string, days: number = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const salesRef = query(
        ref(db, `doza_centers/${centerId}/sales`),
        orderByChild("createdAt"),
        startAt(startDate.toISOString()),
        endAt(endDate.toISOString())
      );

      const snapshot = await get(salesRef);

      if (!snapshot.exists()) {
        return [];
      }

      const salesData = snapshot.val();
      const sales = Object.values(salesData) as Sale[];

      const dailyStats: Record<string, { sales: number; revenue: number }> = {};

      sales.forEach((sale) => {
        if (!sale.createdAt) return;

        const date = sale.createdAt.split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = { sales: 0, revenue: 0 };
        }

        dailyStats[date].sales += 1;
        dailyStats[date].revenue += sale.totalAmount || 0;
      });

      const result = Object.entries(dailyStats)
        .map(([date, stats]) => ({
          date,
          ...stats,
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      return result;
    } catch (error) {
      console.error("Error fetching daily stats:", error);
      return [];
    }
  }

  static async getProductStats(centerId: string, productId: string) {
    try {
      const salesRef = ref(db, `doza_centers/${centerId}/sales`);
      const snapshot = await get(salesRef);

      if (!snapshot.exists()) {
        return { totalSold: 0, totalRevenue: 0, salesCount: 0 };
      }

      const salesData = snapshot.val();
      const sales = Object.values(salesData) as Sale[];

      let totalSold = 0;
      let totalRevenue = 0;
      let salesCount = 0;

      sales.forEach((sale) => {
        if (!sale.items) return;

        sale.items.forEach((item) => {
          if (item.productId === productId || item.id === productId) {
            totalSold += item.quantity || 0;
            totalRevenue += item.subtotal || 0;
            salesCount += 1;
          }
        });
      });

      return { totalSold, totalRevenue, salesCount };
    } catch (error) {
      console.error("Error fetching product stats:", error);
      return { totalSold: 0, totalRevenue: 0, salesCount: 0 };
    }
  }

  private static getEmptyStats(): SaleStats {
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageSaleValue: 0,
      totalCustomers: 0,
      itemsSold: 0,
      todaySales: 0,
      todayRevenue: 0,
      topProducts: [],
      paymentMethodBreakdown: {},
    };
  }
}

export default StatsService;

import { useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingBag,
  Bot,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DashboardStats {
  totalOrders: number;
  totalMachines: number;
  totalItems: number;
  totalAdmins: number;
  recentOrders: number;
  activeMachines: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  weeklyOrders: { name: string; orders: number; revenue: number }[];
  ordersByStatus: { name: string; value: number; color: string }[];
  yesterdayRevenue: number;
  lastWeekOrders: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL;
      if (!baseUrl) throw new Error("Server URL not set");

      const [ordersRes, machinesRes, itemsRes, adminsRes] = await Promise.all([
        axios.get(`${baseUrl}/order/admin/all`, {
          params: { limit: 1000 }, // Fetch up to 1000 orders for dashboard stats
          headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` },
        }),
        axios.get(`${baseUrl}/admin/machines`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` },
        }),
        axios.get(`${baseUrl}/getAllItems`),
        axios.get(`${baseUrl}/admin/admins`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("Token")}` },
        }),
      ]);

      const orders = ordersRes.data?.result?.orders || [];
      const totalOrdersCount = ordersRes.data?.result?.totalOrders || 0;
      const machines = machinesRes.data?.data?.machines || [];
      const items = itemsRes.data?.data?.items || itemsRes.data?.items || [];
      const admins = adminsRes.data?.data?.admins || [];

      console.log("Dashboard Debug - Total orders from API:", totalOrdersCount);
      console.log("Dashboard Debug - Orders in current page:", orders.length);
      console.log("Dashboard Debug - Sample order:", orders[0]);

      // Calculate date ranges
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Filter orders by date ranges
      const todayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        return orderDate >= today;
      });

      const yesterdayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        return orderDate >= yesterday && orderDate < today;
      });

      const lastWeekOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt || order.orderDate);
        return orderDate >= weekAgo;
      });

      console.log("Dashboard Debug - Today's orders:", todayOrders.length);
      console.log("Dashboard Debug - Last week orders:", lastWeekOrders.length);

      // Calculate revenues (use 'amount' field, fallback to 'totalAmount')
      const todayRevenue = todayOrders.reduce((sum: number, order: any) => {
        return sum + (order.amount || order.totalAmount || 0);
      }, 0);

      const yesterdayRevenue = yesterdayOrders.reduce((sum: number, order: any) => {
        return sum + (order.amount || order.totalAmount || 0);
      }, 0);

      console.log("Dashboard Debug - Today's revenue:", todayRevenue);

      // Calculate active machines
      const activeMachines = machines.filter(
        (machine: any) => machine.mstatus === "CONNECTED"
      ).length;

      // Calculate order statuses (use 'ostatus' field, fallback to 'orderStatus')
      const pendingOrders = orders.filter((order: any) => {
        const status = (order.ostatus || order.orderStatus || "").toUpperCase();
        return ["PENDING", "PAID", "PREPARING"].includes(status);
      }).length;

      const completedOrders = orders.filter((order: any) => {
        const status = (order.ostatus || order.orderStatus || "").toUpperCase();
        return status === "COMPLETED";
      }).length;

      const cancelledOrders = orders.filter((order: any) => {
        const status = (order.ostatus || order.orderStatus || "").toUpperCase();
        return status === "CANCELLED" || status === "CANCELED";
      }).length;

      console.log("Dashboard Debug - Order statuses:", {
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders
      });

      // Generate weekly order data (last 7 days)
      const weeklyData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const dayOrders = orders.filter((order: any) => {
          const orderDate = new Date(order.createdAt || order.orderDate);
          return orderDate >= date && orderDate < nextDate;
        });

        const dayRevenue = dayOrders.reduce((sum: number, order: any) => {
          return sum + (order.amount || order.totalAmount || 0);
        }, 0);

        weeklyData.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          orders: dayOrders.length,
          revenue: dayRevenue,
        });
      }

      console.log("Dashboard Debug - Weekly data:", weeklyData);

      // Order status distribution
      const orderStatusData = [
        { name: "Completed", value: completedOrders, color: "#10b981" },
        { name: "Pending", value: pendingOrders, color: "#f59e0b" },
        { name: "Cancelled", value: cancelledOrders, color: "#ef4444" },
      ];

      setStats({
        totalOrders: totalOrdersCount, // Use total count from API instead of array length
        totalMachines: machines.length,
        totalItems: items.length,
        totalAdmins: admins.length,
        recentOrders: todayOrders.length,
        activeMachines,
        todayRevenue,
        yesterdayRevenue,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        weeklyOrders: weeklyData,
        ordersByStatus: orderStatusData,
        lastWeekOrders: lastWeekOrders.length,
      });
    } catch (e: any) {
      console.error("Failed to fetch dashboard stats:", e);
    } finally {
      setLoading(false);
    }
  }

  // Calculate percentage changes
  const revenueChange = stats?.yesterdayRevenue && stats.yesterdayRevenue > 0
    ? ((stats.todayRevenue - stats.yesterdayRevenue) / stats.yesterdayRevenue * 100).toFixed(1)
    : "0";

  const revenueChangePositive = stats ? stats.todayRevenue >= stats.yesterdayRevenue : true;

  const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    loading
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: any;
    trend?: "up" | "down";
    trendValue?: string;
    loading?: boolean;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <>
            <div className="text-3xl font-bold">{value}</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              {trend && trendValue && (
                <div className={`flex items-center gap-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                  {trend === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{trendValue}%</span>
                </div>
              )}
              <span>{subtitle}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Head>
        <title>Dashboard - GolBot Admin</title>
        <meta name="description" content="GolBot Admin Dashboard" />
      </Head>

      <AppLayout>
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here&apos;s what&apos;s happening with your vending machines today.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              subtitle={`${stats?.recentOrders || 0} today`}
              icon={ShoppingBag}
              loading={loading}
            />
            <StatCard
              title="Active Machines"
              value={`${stats?.activeMachines || 0}/${stats?.totalMachines || 0}`}
              subtitle="machines online"
              icon={Bot}
              loading={loading}
            />
            <StatCard
              title="Today's Revenue"
              value={`₹${stats?.todayRevenue?.toLocaleString('en-IN') || 0}`}
              subtitle="vs yesterday"
              icon={Activity}
              trend={revenueChangePositive ? "up" : "down"}
              trendValue={revenueChange}
              loading={loading}
            />
            <StatCard
              title="Menu Items"
              value={stats?.totalItems || 0}
              subtitle="in catalog"
              icon={Package}
              loading={loading}
            />
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Order Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Order Trends</CardTitle>
                <CardDescription>
                  Last 7 days order volume ({stats?.lastWeekOrders || 0} orders)
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : stats?.weeklyOrders && stats.weeklyOrders.some(d => d.orders > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.weeklyOrders}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === "revenue") return [`₹${value.toLocaleString('en-IN')}`, "Revenue"];
                          return [value, "Orders"];
                        }}
                      />
                      <Bar dataKey="orders" fill="#FF5722" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No order data available</p>
                      <p className="text-sm">Orders will appear here once placed</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
                <CardDescription>Current order distribution</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {loading ? (
                  <Skeleton className="h-[300px]" />
                ) : stats?.ordersByStatus && stats.ordersByStatus.some(s => s.value > 0) ? (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={stats.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent, value }) =>
                            value > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : ""
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {stats.ordersByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                      <p>No order status data</p>
                      <p className="text-sm">Status distribution will appear here</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.pendingOrders || 0}</div>
                    {stats?.pendingOrders && stats.pendingOrders > 0 ? (
                      <Badge variant="warning" className="mt-2">
                        Requires attention
                      </Badge>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-2">
                        All caught up!
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.completedOrders || 0}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Successfully delivered
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                <XCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stats?.cancelledOrders || 0}</div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats?.cancelledOrders && stats.cancelledOrders > 0
                        ? "Failed or cancelled"
                        : "No cancellations"}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
}

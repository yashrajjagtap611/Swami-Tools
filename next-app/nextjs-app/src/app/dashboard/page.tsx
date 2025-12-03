'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, removeToken } from '@/lib/auth';
import BottomNavigation from '@/components/BottomNavigation';
import { LayoutDashboard, BarChart3, Users, Settings, FileText, Menu, X, Search, Bell, User } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stats = [
    { name: 'Total Users', value: '2,543', change: '+12.5%', changeType: 'positive' },
    { name: 'Active Sessions', value: '1,234', change: '+8.2%', changeType: 'positive' },
    { name: 'Revenue', value: '$45,231', change: '+23.1%', changeType: 'positive' },
    { name: 'Conversion Rate', value: '3.24%', change: '-2.4%', changeType: 'negative' },
  ];

  const recentActivities = [
    { id: 1, action: 'New user registration', user: 'John Doe', time: '2 minutes ago' },
    { id: 2, action: 'Payment received', user: 'Jane Smith', time: '15 minutes ago' },
    { id: 3, action: 'Product updated', user: 'Mike Johnson', time: '1 hour ago' },
    { id: 4, action: 'Support ticket closed', user: 'Sarah Williams', time: '2 hours ago' },
    { id: 5, action: 'New order placed', user: 'Tom Brown', time: '3 hours ago' },
  ];

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, current: true },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: false },
    { name: 'Users', href: '/dashboard/users', icon: Users, current: false },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: false },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText, current: false },
  ];

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      setIsLoading(false);
    };
    loadUser();
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-zinc-900 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-zinc-200 px-4 dark:border-zinc-800 sm:h-16 sm:px-6">
            <h1 className="text-lg font-bold text-black dark:text-zinc-50 sm:text-xl">Dashboard</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0 sm:h-10 sm:w-10">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 truncate sm:text-sm">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-2 w-full rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 sm:mt-3 sm:py-2 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:h-16 sm:px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          
          <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
            <div className="relative flex-1 max-w-xs">
              <div className="hidden sm:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 pl-10 pr-4 py-2 text-sm focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-400 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
                />
              </div>
            </div>
            <button className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 sm:p-2" aria-label="Notifications">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </header>

        {/* Main dashboard content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          {/* Welcome section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">Welcome back!</h2>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm">
              Here's what's happening with your account today.
            </p>
          </div>

          {/* Stats grid */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:mb-6 sm:grid-cols-2 sm:gap-4 lg:mb-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.name}
                className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5 lg:p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 sm:text-sm truncate">{stat.name}</p>
                    <p className="mt-1.5 text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:mt-2 sm:text-2xl">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-3 sm:mt-4">
                  <span
                    className={`text-xs font-medium sm:text-sm ${
                      stat.changeType === 'positive'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">vs last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="lg:col-span-2 rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg">Recent Activity</h3>
              </div>
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 sm:px-6 sm:py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-50 sm:text-sm truncate">{activity.action}</p>
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm truncate">
                          {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 sm:text-lg">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2 sm:p-6 sm:space-y-3">
                <button className="w-full rounded-lg bg-black px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 sm:px-4 sm:py-2.5 sm:text-sm">
                  Create New User
                </button>
                <button className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 sm:px-4 sm:py-2.5 sm:text-sm">
                  Generate Report
                </button>
                <button className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 sm:px-4 sm:py-2.5 sm:text-sm">
                  Export Data
                </button>
                <button className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-700 sm:px-4 sm:py-2.5 sm:text-sm">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <BottomNavigation />
    </div>
  );
}


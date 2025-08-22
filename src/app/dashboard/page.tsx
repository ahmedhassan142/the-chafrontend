"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/context/authContext';
import { useProfile } from '@/app/context/profileContext';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { 
  FiUsers, 
  FiMessageSquare, 
  FiUserCheck, 
  FiActivity,
  FiTrendingUp,
  FiClock,
  FiBarChart2,
  FiArrowLeft
} from 'react-icons/fi';
import { motion } from 'framer-motion';

interface DashboardStats {
  totalUsers: number;
  totalMessages: number;
  onlineUsers: number;
  activeConversations: number;
  messagesToday: number;
  avgResponseTime: number;
}

interface RecentActivity {
  _id: string;
  text: string;
  sender: string;
  recipient: string;
  createdAt: string;
  user?: {
    firstName: string;
    lastName: string;
    avatarLink?: string;
  };
}

const Dashboard = () => {
  const { token } = useAuth();
  const { userDetails } = useProfile();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalMessages: 0,
    onlineUsers: 0,
    activeConversations: 0,
    messagesToday: 0,
    avgResponseTime: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const router=useRouter()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"}/api/user/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"}/api/user/dashboard/activity`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsResponse.data);
      setRecentActivity(activityResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ElementType;
    color?: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700 hover:border-${color}-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-${color}-500/10`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from yesterday
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
          <Icon size={24} />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5,ease: "easeOut" }}
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-800/50 backdrop-blur-lg rounded-lg border border-gray-700 text-white hover:bg-gray-700/70 transition-all duration-300"
      >
        <FiArrowLeft />
        
      </motion.button>
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-3xl font-bold text-white ml-14 ">Dashboard Overview</h1>
            <p className="ml-14 text-gray-400">
              {time.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} • {time.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Welcome back,</p>
            <h2 className="text-xl font-semibold text-white">
              {userDetails?.firstName} {userDetails?.lastName}
            </h2>
          </div>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={FiUsers}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={FiMessageSquare}
          color="purple"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Online Users"
          value={stats.onlineUsers}
          icon={FiUserCheck}
          color="green"
        />
        <StatCard
          title="Active Conversations"
          value={stats.activeConversations}
          icon={FiActivity}
          color="yellow"
        />
        <StatCard
          title="Messages Today"
          value={stats.messagesToday}
          icon={FiTrendingUp}
          color="pink"
        />
        <StatCard
          title="Avg Response Time"
          value={`${stats.avgResponseTime}s`}
          icon={FiClock}
          color="orange"
          trend={{ value: 5, isPositive: false }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2,ease: "easeOut" }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <FiBarChart2 className="text-purple-400" size={20} />
          </div>
          
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1,ease: "easeOut" }}
                className="flex items-center p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{activity.text}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="ml-4 text-right">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </motion.div>
            ))}
            
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <FiMessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3,ease: "easeOut" }}
          className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
        >
          <h2 className="text-xl font-semibold text-white mb-6">System Status</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white">WebSocket Server</span>
              </div>
              <span className="text-green-400 text-sm">Online</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white">Database</span>
              </div>
              <span className="text-green-400 text-sm">Connected</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white">Message Queue</span>
              </div>
              <span className="text-green-400 text-sm">Active</span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                <span className="text-white">API Services</span>
              </div>
              <span className="text-green-400 text-sm">Operational</span>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-400 mb-1">99.9%</div>
                <div className="text-gray-400 text-sm">Uptime</div>
              </div>
              <div className="bg-gray-700/30 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-400 mb-1">42ms</div>
                <div className="text-gray-400 text-sm">Avg Latency</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 ,ease: "easeOut"}}
        className="mt-8 bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700"
      >
        <h2 className="text-xl font-semibold text-white mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
            New Chat
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
            Invite Users
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
            Export Data
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105">
            Settings
          </button>
        </div>
      </motion.div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-purple-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-900 rounded-full opacity-10 mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
    </div>
  );
};

export default Dashboard;
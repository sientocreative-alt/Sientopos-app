import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import {
    Users,
    Building2,
    CreditCard,
    ShieldAlert,
    Clock,
    TrendingUp
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, loading }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            {loading ? (
                <div className="h-8 w-16 bg-gray-100 animate-pulse rounded"></div>
            ) : (
                <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
            )}
        </div>
        <div className={`p-4 rounded-xl ${color}`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        activeSubscriptions: 0,
        trialAccounts: 0,
        suspendedAccounts: 0,
        expiringTrials: 0,
        expiringSubscriptions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select('status, subscription_plan, trial_end_date, subscription_end_date');

            if (error) throw error;

            const now = new Date();
            const twoDaysLater = new Date();
            twoDaysLater.setDate(now.getDate() + 2);

            const newStats = {
                totalBusinesses: data.length,
                activeSubscriptions: data.filter(b => b.status === 'active' && b.subscription_plan !== 'trial').length,
                trialAccounts: data.filter(b => b.status === 'trial').length,
                suspendedAccounts: data.filter(b => b.status === 'suspended').length,
                expiringTrials: data.filter(b => {
                    if (b.status !== 'trial' || !b.trial_end_date) return false;
                    const end = new Date(b.trial_end_date);
                    return end >= now && end <= twoDaysLater;
                }).length,
                expiringSubscriptions: data.filter(b => {
                    if (b.status === 'trial' || !b.subscription_end_date) return false;
                    const end = new Date(b.subscription_end_date);
                    return end >= now && end <= twoDaysLater;
                }).length
            };

            setStats(newStats);
        } catch (err) {
            console.error('Error fetching admin stats:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Genel Bakış</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Toplam İşletme"
                    value={stats.totalBusinesses}
                    icon={Building2}
                    color="bg-blue-500"
                    loading={loading}
                />
                <StatCard
                    title="Aktif Abonelik"
                    value={stats.activeSubscriptions}
                    icon={CreditCard}
                    color="bg-green-500"
                    loading={loading}
                />
                <StatCard
                    title="Deneme Hesabı"
                    value={stats.trialAccounts}
                    icon={Clock}
                    color="bg-orange-500"
                    loading={loading}
                />
                <StatCard
                    title="Askıya Alınan"
                    value={stats.suspendedAccounts}
                    icon={ShieldAlert}
                    color="bg-red-500"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <ShieldAlert size={20} className="text-orange-500" />
                        Süresi Dolmak Üzere Olan Deneme Hesapları (2 Gün)
                    </h3>
                    <div className="text-4xl font-black text-orange-500">{stats.expiringTrials}</div>
                    <p className="text-sm text-gray-500 mt-2">İşletme</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <CreditCard size={20} className="text-red-500" />
                        Yenileme Bekleyen Abonelikler (2 Gün)
                    </h3>
                    <div className="text-4xl font-black text-red-500">{stats.expiringSubscriptions}</div>
                    <p className="text-sm text-gray-500 mt-2">İşletme</p>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;

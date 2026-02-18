import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Wallet,
    Search,
    Filter,
    ChevronRight,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    FileText,
    PieChart,
    Building2,
    DollarSign,
    Clock,
    CheckCircle2,
    Briefcase
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

const ResellerCommissions = () => {
    const [commissions, setCommissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('summary'); // summary, pending, paid, invoices, reports
    const [payouts, setPayouts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        total: 0,
        available: 0,
        paid: 0,
        thisMonth: 0
    });

    useEffect(() => {
        if (user) fetchCommissions();
    }, [user]);

    const fetchCommissions = async () => {
        try {
            setLoading(true);
            const [commissionsRes, payoutsRes] = await Promise.all([
                supabase
                    .from('reseller_commissions')
                    .select('*, businesses (name)')
                    .eq('reseller_id', user.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('reseller_payout_requests')
                    .select('*')
                    .eq('reseller_id', user.id)
                    .order('created_at', { ascending: false })
            ]);

            if (commissionsRes.error) throw commissionsRes.error;
            if (payoutsRes.error) throw payoutsRes.error;

            setCommissions(commissionsRes.data || []);

            // Calculate Stats with Ledger Logic
            const allCommissions = commissionsRes.data || [];
            const allPayouts = payoutsRes.data || [];

            const totalEarnings = allCommissions
                .filter(c => c.status !== 'cancelled')
                .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);

            const totalWithdrawals = allPayouts
                .filter(p => ['pending', 'approved', 'completed'].includes(p.status))
                .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            // "Actually Paid" now includes approved requests as they are considered "done" for the reseller's view
            const actuallyPaid = allPayouts
                .filter(p => ['completed', 'approved'].includes(p.status))
                .reduce((sum, p) => sum + parseFloat(p.amount), 0);

            // Available = Earnings - All Valid Requests/Payouts
            const availableBalance = totalEarnings - totalWithdrawals;

            setStats({
                total: totalEarnings,
                available: availableBalance,
                paid: actuallyPaid,
                thisMonth: allCommissions
                    .filter(c => {
                        const date = new Date(c.created_at);
                        return date >= startOfMonth(new Date()) && date <= endOfMonth(new Date());
                    })
                    .reduce((sum, c) => sum + parseFloat(c.commission_amount), 0)
            });

            // Set payouts state for the "Paid" tab
            setPayouts(allPayouts.filter(p => ['completed', 'approved'].includes(p.status)));

        } catch (error) {
            console.error('Error fetching commissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'summary', label: 'Özet', icon: PieChart },
        { id: 'pending', label: 'Bekleyen', icon: Clock },
        { id: 'paid', label: 'Ödenen', icon: CheckCircle2 },
        { id: 'invoices', label: 'Faturalar', icon: FileText },
        { id: 'reports', label: 'Raporlar', icon: Briefcase }
    ];

    const getFilteredCommissions = () => {
        return commissions.filter(c => {
            const matchesSearch = c.businesses?.name?.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            switch (activeTab) {
                case 'pending': return c.status === 'pending';
                // Note: 'paid' tab logic is handled separately using 'payouts' state
                default: return true;
            }
        });
    };

    const filteredCommissions = getFilteredCommissions();

    // Helper for Reports Tab
    const getMonthlyReport = () => {
        const report = {};
        commissions.forEach(c => {
            const month = format(new Date(c.created_at), 'MMMM yyyy', { locale: tr });
            if (!report[month]) report[month] = { earnings: 0, count: 0 };
            report[month].earnings += parseFloat(c.commission_amount);
            report[month].count += 1;
        });
        // Sort by date descending (approximate by reversing keys if inserted in order, but better to just map and sort)
        return Object.entries(report)
            .map(([month, data]) => ({ month, ...data }))
            .sort((a, b) => {
                // Simple sort logic or just rely on insertion order if data is sorted
                return 0; // Keeping it simple for now as source data is time-sorted
            });
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Wallet size={20} className="text-indigo-600" />
                        KOMİSYON YÖNETİMİ
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        İşletme aboneliklerinden kazandığınız hak edişlerin takibi
                    </p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px]">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 font-black uppercase tracking-widest mb-1 opacity-60">Toplam Kazanç</div>
                    <div className="text-lg font-black text-slate-900">{stats.total.toLocaleString('tr-TR')} ₺</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 font-black uppercase tracking-widest mb-1 opacity-60">Kullanılabilir Bakiye</div>
                    <div className="text-lg font-black text-amber-600">{stats.available.toLocaleString('tr-TR')} ₺</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 font-black uppercase tracking-widest mb-1 opacity-60">Yapılan Ödeme</div>
                    <div className="text-lg font-black text-emerald-600">{stats.paid.toLocaleString('tr-TR')} ₺</div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-slate-400 font-black uppercase tracking-widest mb-1 opacity-60">Bu Ayki Hak Ediş</div>
                    <div className="text-lg font-black text-indigo-600">{stats.thisMonth.toLocaleString('tr-TR')} ₺</div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {(activeTab === 'summary' || activeTab === 'pending') && (
                <div className="space-y-6">
                    {/* Toolbar */}
                    <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-2">
                        <div className="flex-1 relative group text-[10px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                            <input
                                type="text"
                                placeholder="İşletme ara..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-[10px]">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100/50 font-black text-slate-400 uppercase tracking-widest">
                                    <th className="px-4 py-3 opacity-60">İşletme</th>
                                    <th className="px-4 py-3 opacity-60">Abn. Bedeli</th>
                                    <th className="px-4 py-3 opacity-60">Oran</th>
                                    <th className="px-4 py-3 opacity-60">Komisyon</th>
                                    <th className="px-4 py-3 opacity-60 text-right">Tarih</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    [1, 2, 3].map(i => (
                                        <tr key={i} className="animate-pulse h-12">
                                            <td colSpan="5" className="px-4 py-3 bg-slate-50/20"></td>
                                        </tr>
                                    ))
                                ) : filteredCommissions.length > 0 ? (
                                    filteredCommissions.map((c) => (
                                        <tr key={c.id} className="hover:bg-slate-50/80 transition-all cursor-default group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all text-[10px] font-black">
                                                        {c.businesses?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 uppercase tracking-tight">{c.businesses?.name}</div>
                                                        <div className={`text-[8px] font-black uppercase tracking-widest mt-0.5 text-emerald-600`}>
                                                            BAŞARILI
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-bold text-slate-600">
                                                {parseFloat(c.base_amount).toLocaleString('tr-TR')} ₺
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-bold font-mono">
                                                    %{c.commission_rate}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-black text-indigo-600 text-xs">
                                                +{parseFloat(c.commission_amount).toLocaleString('tr-TR')} ₺
                                            </td>
                                            <td className="px-4 py-3 text-right text-slate-400 font-bold whitespace-nowrap">
                                                {format(new Date(c.created_at), 'd MMM yyyy', { locale: tr })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                                            Kayıtlı veri bulunamadı
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'paid' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-[10px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-4 py-3 opacity-60">Tutar</th>
                                <th className="px-4 py-3 opacity-60">Durum</th>
                                <th className="px-4 py-3 opacity-60 text-right">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payouts.length > 0 ? (
                                payouts.map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-4 py-3 font-black text-indigo-600 text-xs">
                                            {parseFloat(p.amount).toLocaleString('tr-TR')} ₺
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest border border-emerald-100/50">
                                                ÖDENDİ / ONAYLANDI
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400 font-bold">
                                            {format(new Date(p.created_at), 'd MMM yyyy, HH:mm', { locale: tr })}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                                        Henüz yapılmış ödeme bulunmuyor
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {getMonthlyReport().map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-xs font-black text-slate-900 uppercase tracking-tight">{item.month}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1">{item.count} İşlem</div>
                            </div>
                            <div className="text-lg font-black text-indigo-600">
                                {item.earnings.toLocaleString('tr-TR')} ₺
                            </div>
                        </div>
                    ))}
                </div>
            )}


            {activeTab === 'invoices' && (
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-[10px]">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-4 py-3 opacity-60">Tutar</th>
                                <th className="px-4 py-3 opacity-60">Durum</th>
                                <th className="px-4 py-3 opacity-60 text-right">Tarih</th>
                                <th className="px-4 py-3 opacity-60 text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payouts.filter(p => p.receipt_url).length > 0 ? (
                                payouts.filter(p => p.receipt_url).map(p => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-all">
                                        <td className="px-4 py-3 font-black text-indigo-600 text-xs">
                                            {parseFloat(p.amount).toLocaleString('tr-TR')} ₺
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest border border-emerald-100/50">
                                                DEKONT YÜKLENDİ
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400 font-bold">
                                            {format(new Date(p.created_at), 'd MMM yyyy', { locale: tr })}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <a
                                                href={p.receipt_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors font-bold text-[9px] uppercase tracking-wide border border-indigo-100"
                                            >
                                                <FileText size={12} />
                                                GÖRÜNTÜLE
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-12 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                                        Henüz yüklenmiş bir fatura/dekont bulunmuyor
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ResellerCommissions;

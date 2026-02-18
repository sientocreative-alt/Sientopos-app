import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    CreditCard,
    Search,
    Filter,
    ChevronRight,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    TrendingUp,
    AlertTriangle,
    Building2,
    ArrowUpCircle
} from 'lucide-react';
import { format, addDays, isBefore, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';

const ResellerSubscriptions = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active'); // active, expiring, cancelled, upgrades
    const [searchTerm, setSearchTerm] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) fetchBusinesses();
    }, [user]);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    *,
                    pos_settings (contact_email)
                `)
                .eq('reseller_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBusinesses(data || []);
        } catch (error) {
            console.error('Error fetching businesses:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredData = () => {
        const today = new Date();
        const next10Days = addDays(today, 10);

        return businesses.filter(b => {
            const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            const subscriptionEndDate = b.subscription_end_date ? new Date(b.subscription_end_date) : null;
            const trialEndDate = b.trial_end_date ? new Date(b.trial_end_date) : null;

            switch (activeTab) {
                case 'active':
                    return b.status === 'active';
                case 'expiring':
                    if (b.status !== 'active' || !subscriptionEndDate) return false;
                    return isBefore(subscriptionEndDate, next10Days) && isAfter(subscriptionEndDate, today);
                case 'cancelled':
                    return b.status === 'suspended';
                case 'upgrades':
                    return b.status === 'trial';
                default:
                    return true;
            }
        });
    };

    const tabs = [
        { id: 'active', label: 'Aktif', icon: CheckCircle2, color: 'emerald' },
        { id: 'expiring', label: 'Bitişi Yaklaşan', icon: Clock, color: 'amber' },
        { id: 'cancelled', label: 'İptaller / Pasif', icon: AlertTriangle, color: 'rose' },
        { id: 'upgrades', label: 'Yükseltmeler (Demo)', icon: TrendingUp, color: 'indigo' }
    ];

    const filteredBusinesses = getFilteredData();

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-600" />
                        ABONELİK YÖNETİMİ
                    </h1>
                    <p className="text-slate-400 font-bold mt-0.5 uppercase text-[9px] tracking-widest opacity-70 italic">
                        Müşterilerinizin lisans durumlarını ve ödeme döngülerini takip edin
                    </p>
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
                                    ? `bg-${tab.color}-50 text-${tab.color}-700 shadow-sm border border-${tab.color}-100`
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                }`}
                        >
                            <Icon size={14} className={isActive ? `text-${tab.color}-600` : ''} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                            <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isActive ? `bg-${tab.color}-100` : 'bg-slate-100'
                                }`}>
                                {businesses.filter(b => {
                                    const today = new Date();
                                    const next10Days = addDays(today, 10);
                                    const subEnd = b.subscription_end_date ? new Date(b.subscription_end_date) : null;
                                    if (tab.id === 'active') return b.status === 'active';
                                    if (tab.id === 'expiring') return b.status === 'active' && subEnd && isBefore(subEnd, next10Days) && isAfter(subEnd, today);
                                    if (tab.id === 'cancelled') return b.status === 'suspended';
                                    if (tab.id === 'upgrades') return b.status === 'trial';
                                    return false;
                                }).length}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Toolbar */}
            <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder="İşletme ara..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all font-bold text-[10px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden text-[10px]">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50 font-black text-slate-400 uppercase tracking-widest">
                            <th className="px-4 py-3 opacity-60">İşletme</th>
                            <th className="px-4 py-3 opacity-60">Plan</th>
                            <th className="px-4 py-3 opacity-60">Bitiş Tarihi</th>
                            <th className="px-4 py-3 opacity-60">Durum</th>
                            <th className="px-4 py-3 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse h-12">
                                    <td colSpan="5" className="px-4 py-3 bg-slate-50/20"></td>
                                </tr>
                            ))
                        ) : filteredBusinesses.length > 0 ? (
                            filteredBusinesses.map((business) => {
                                const subEnd = business.subscription_end_date ? new Date(business.subscription_end_date) :
                                    (business.trial_end_date ? new Date(business.trial_end_date) : null);

                                return (
                                    <tr
                                        key={business.id}
                                        onClick={() => navigate(`/isletmeler/${business.id}`)}
                                        className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                                                    <Building2 size={14} />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-900 uppercase">{business.name}</div>
                                                    <div className="text-[8px] text-slate-400 font-bold italic">{business.pos_settings?.[0]?.contact_email || 'E-posta yok'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-600">
                                            {business.subscription_plan === 'trial' ? (
                                                <span className="text-amber-600 uppercase">Ücretsiz Demo</span>
                                            ) : (
                                                <span className="text-indigo-600 uppercase">{business.subscription_plan} Paket</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-black text-slate-700">
                                            {subEnd ? format(subEnd, 'd MMMM yyyy', { locale: tr }) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 rounded-full font-black uppercase text-[8px] tracking-widest ${business.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                    business.status === 'trial' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                        'bg-rose-50 text-rose-700 border border-rose-100'
                                                }`}>
                                                {business.status === 'active' ? 'Aktif' : business.status === 'trial' ? 'Demo' : 'Pasif'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="w-6 h-6 rounded-md bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-auto">
                                                <ChevronRight size={12} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-10 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-60">
                                    Bu kategoriye uygun kayıt bulunamadı
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResellerSubscriptions;

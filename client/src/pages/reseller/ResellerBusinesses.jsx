import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Plus,
    Search,
    Store,
    ChevronRight,
    Filter,
    Calendar,
    AlertCircle,
    CheckCircle2,
    Clock,
    LayoutGrid,
    List,
    Building2,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const ResellerBusinesses = () => {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        fetchBusinesses();
    }, [user]);

    const fetchBusinesses = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select(`
                    *,
                    pos_settings (contact_email, contact_phone)
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

    const getStatusStyles = (status) => {
        switch (status) {
            case 'active':
                return {
                    bg: 'bg-emerald-50',
                    text: 'text-emerald-700',
                    border: 'border-emerald-100',
                    icon: CheckCircle2,
                    label: 'Aktif İşletme'
                };
            case 'suspended':
                return {
                    bg: 'bg-rose-50',
                    text: 'text-rose-700',
                    border: 'border-rose-100',
                    icon: AlertCircle,
                    label: 'Askıda / Pasif'
                };
            case 'trial':
                return {
                    bg: 'bg-amber-50',
                    text: 'text-amber-700',
                    border: 'border-amber-100',
                    icon: Clock,
                    label: 'Deneme Süresi'
                };
            default:
                return {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-100',
                    icon: Clock,
                    label: 'Bilinmiyor'
                };
        }
    };

    const filteredBusinesses = businesses.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Building2 size={24} className="text-indigo-600" />
                        İŞLETME YÖNETİMİ
                    </h1>
                    <p className="text-slate-400 font-bold mt-1 uppercase text-[10px] tracking-widest opacity-70 italic">Sisteminizde kayıtlı olan tüm ticari işletmelerin listesi</p>
                </div>
                <button
                    onClick={() => navigate('/isletmeler/yeni')}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-indigo-600 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-slate-200 uppercase text-xs tracking-widest active:scale-95"
                >
                    <Plus size={16} />
                    Yeni İşletme Kaydı
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                        {businesses.length}
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-60">Toplam Portföy</div>
                        <div className="text-base font-black text-slate-800">Kayıtlı İşletme</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-sm">
                        {businesses.filter(b => b.status === 'active').length}
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-60">Aktif Hizmet</div>
                        <div className="text-base font-black text-slate-800">Aktif Lisans</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-sm">
                        {businesses.filter(b => b.status === 'trial').length}
                    </div>
                    <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-60">Demo Süreci</div>
                        <div className="text-base font-black text-slate-800">Deneme Hesabı</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-3 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="İşletme ünvanı veya yetkili adı ile arama yapın..."
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600/20 transition-all font-bold text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="md:w-56 relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-12 pr-10 py-3 text-slate-900 focus:outline-none font-black text-[10px] uppercase tracking-widest appearance-none cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Tüm Durumlar</option>
                        <option value="active">AKTİF</option>
                        <option value="trial">DENEME</option>
                        <option value="suspended">ASKIDA</option>
                    </select>
                </div>
            </div>

            {/* List / Table */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50">
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">İşletme Detayları</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60 hidden lg:table-cell">Abonelik / Plan</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60 hidden md:table-cell">Kayıt Tarihi</th>
                            <th className="px-6 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Durum</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan="5" className="px-8 py-6 h-20 bg-slate-50/20"></td>
                                </tr>
                            ))
                        ) : filteredBusinesses.length > 0 ? (
                            filteredBusinesses.map((business) => {
                                const style = getStatusStyles(business.status);
                                const StatusIcon = style.icon;
                                const contact = Array.isArray(business.pos_settings) ? business.pos_settings[0] : business.pos_settings;

                                return (
                                    <tr
                                        key={business.id}
                                        onClick={() => navigate(`/isletmeler/${business.id}`)}
                                        className="hover:bg-slate-50/80 transition-all cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-white group-hover:shadow-md transition-all">
                                                    <Store size={18} />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight uppercase">{business.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold mt-0.5 italic">{contact?.contact_email || 'E-posta belirtilmemiş'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm opacity-80">
                                                {business.subscription_plan || 'Standart Deneme'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex flex-col">
                                                <div className="text-xs font-black text-slate-700">{business.created_at ? format(new Date(business.created_at), 'd MMMM yyyy', { locale: tr }) : '-'}</div>
                                                <div className="text-[8px] text-slate-400 font-bold uppercase tracking-wider opacity-60">Sistem Kaydı</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${style.bg} ${style.border} ${style.text} text-[9px] font-black uppercase tracking-widest`}>
                                                <StatusIcon size={10} />
                                                {style.label}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all ml-auto">
                                                <ChevronRight size={16} />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-8 py-20 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-6">
                                        <Store size={40} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Kayıt Bulunamadı</h3>
                                    <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2 text-sm">
                                        {searchTerm ? 'Arama kriterlerinize uygun sonuç bulunamadı. Lütfen filtreleri kontrol edin.' : 'Henüz sisteme kayıtlı bir işletmeniz bulunmamaktadır.'}
                                    </p>
                                    <button
                                        onClick={() => navigate('/isletmeler/yeni')}
                                        className="mt-8 text-indigo-600 font-black uppercase text-xs tracking-[0.2em] border-b-2 border-indigo-200 hover:border-indigo-600 pb-1"
                                    >
                                        İlk İşletmenizi Tanımlayın
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResellerBusinesses;

import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    Store,
    CreditCard,
    Wallet,
    TrendingUp,
    ChevronRight,
    Activity,
    Building2,
    Calendar,
    ArrowUpRight,
    History,
    Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, colorClass, trend }) => (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all group overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-14 h-14 ${colorClass} opacity-[0.03] rounded-full -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700`}></div>
        <div className="flex items-start justify-between relative z-10">
            <div className={`w-7 h-7 rounded-lg ${colorClass.replace('bg-', 'bg-opacity-10 ')} flex items-center justify-center ${colorClass.replace('bg-', 'text-')}`}>
                <Icon size={14} />
            </div>
            {trend && (
                <div className="flex items-center gap-1 text-emerald-600 font-black text-[6px] bg-emerald-50 px-1 py-0.5 rounded-md border border-emerald-100 uppercase tracking-tighter">
                    <TrendingUp size={8} /> {trend}
                </div>
            )}
        </div>
        <div className="mt-2 relative z-10">
            <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 opacity-60">{title}</p>
            <div className="text-sm font-black text-slate-900 mt-0.5 tracking-tight">{value}</div>
        </div>
    </div>
);

const ResellerDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalBusinesses: 0,
        activeSubs: 0,
        totalCommission: 0,
        pendingPayment: 0
    });
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { count: businessCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('reseller_id', user.id);

            const { count: activeCount } = await supabase
                .from('businesses')
                .select('*', { count: 'exact', head: true })
                .eq('reseller_id', user.id)
                .eq('status', 'active');

            const { data: commissions } = await supabase
                .from('reseller_commissions')
                .select('commission_amount')
                .eq('reseller_id', user.id);

            const { data: payouts } = await supabase
                .from('reseller_payout_requests')
                .select('amount, status')
                .eq('reseller_id', user.id);

            const totalComm = commissions?.reduce((sum, item) => sum + (parseFloat(item.commission_amount) || 0), 0) || 0;
            const pendingAmount = payouts?.filter(p => p.status === 'pending').reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

            setStats({
                totalBusinesses: businessCount || 0,
                activeSubs: activeCount || 0,
                totalCommission: totalComm,
                pendingPayment: pendingAmount
            });

            const { data: logs } = await supabase
                .from('business_logs')
                .select(`
                    id,
                    action,
                    created_at,
                    businesses (name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentActivities(logs || []);

        } catch (error) {
            console.error('Dashboard Data Error:', error);
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">


            {/* Stats Grid - Definitively White Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard
                    title="Toplam Kayıt"
                    value={loading ? '-' : stats.totalBusinesses}
                    icon={Store}
                    colorClass="bg-indigo-600"
                    trend="+2 Bu Ay"
                />
                <StatCard
                    title="Aktif Lisans"
                    value={loading ? '-' : stats.activeSubs}
                    icon={Activity}
                    colorClass="bg-emerald-600"
                    trend="%100 Aktif"
                />
                <StatCard
                    title="Komisyon (TL)"
                    value={loading ? '-' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalCommission)}
                    icon={Wallet}
                    colorClass="bg-blue-600"
                />
                <StatCard
                    title="Ödeme Talebi"
                    value={loading ? '-' : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.pendingPayment)}
                    icon={CreditCard}
                    colorClass="bg-rose-600"
                />
            </div>

            {/* Main Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Recent Activities Section - Definitively White Background */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm h-full group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100/80">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100 group-hover:bg-white group-hover:scale-110 transition-all">
                                    <History size={12} />
                                </div>
                                <h3 className="text-xs font-black text-slate-900 tracking-tight uppercase">AKTARIM / İŞLEM GEÇMİŞİ</h3>
                            </div>
                            <button className="text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800 transition-colors flex items-center gap-2 group/btn border-b border-transparent hover:border-indigo-200 pb-1">
                                TÜM GEÇMİŞ <ArrowUpRight size={16} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </button>
                        </div>

                        {recentActivities.length > 0 ? (
                            <div className="space-y-6">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center gap-8 p-6 bg-slate-50/30 hover:bg-white hover:shadow-lg border border-transparent hover:border-slate-100 rounded-[2rem] transition-all cursor-pointer group/item">
                                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover/item:text-indigo-600 group-hover/item:border-indigo-100 shadow-sm transition-all">
                                            <Building2 size={22} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center bg-transparent group-hover/item:bg-transparent">
                                                <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">{activity.businesses?.name || 'BELİRSİZ İŞLETME'}</h4>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{format(new Date(activity.created_at), 'd MMM HH:mm', { locale: tr })}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1.5 opacity-60">
                                                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activity.action}</span>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">SİSTEM KAYDI OLUŞTURULDU</p>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover/item:bg-indigo-600 group-hover/item:text-white transition-all shadow-sm">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-28 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 border-dashed">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 mb-6 shadow-sm">
                                    <Activity size={48} />
                                </div>
                                <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] italic">Henüz Bir Hareket Kaydedilmedi</h4>
                                <p className="text-xs text-slate-300 font-bold mt-2 uppercase">İşletme eklediğinizde veya ödemeler yapıldığında burada listelenir.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: CTA & Insights */}
                <div className="space-y-10">
                    {/* Call to Action - Dark but Vibrant accent */}
                    <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-100 border border-slate-800">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[40px] -mr-16 -mt-16 group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black tracking-tighter mb-4 leading-tight uppercase">YENİ BİR<br />İŞLETME KAYDI<br />İLE BAŞLAYIN</h3>
                            <p className="text-slate-500 text-[10px] font-bold mb-6 italic leading-relaxed opacity-60">
                                Yeni bir işletme ekleyerek portföyünüzü<br />hızlıca genişletmeye başlayın.
                            </p>
                            <button
                                onClick={() => navigate('/isletmeler/yeni')}
                                className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-2xl shadow-black/20 group/btn active:scale-95"
                            >
                                <Plus size={16} className="group-hover/btn:rotate-90 transition-transform duration-500" /> ŞİMDİ TANIMLA
                            </button>
                        </div>
                    </div>

                    {/* Sistem Güncelleme moved here */}
                    <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-slate-200 group">
                        <div className="text-right flex-1">
                            <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">Sistem Güncelleme</div>
                            <div className="text-[10px] font-black text-slate-800 uppercase italic leading-none mt-1">{format(new Date(), 'd MMMM yyyy', { locale: tr })}</div>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-indigo-600 border border-indigo-50 shadow-inner group-hover:scale-110 transition-transform">
                            <Calendar size={14} />
                        </div>
                    </div>

                    {/* Quick Insight - Light */}
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm space-y-2 group">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 group-hover:scale-110 transition-all">
                                <TrendingUp size={20} />
                            </div>
                            <h4 className="text-base font-black text-slate-900 uppercase tracking-tight underline decoration-emerald-200 underline-offset-8">GELİŞİM İPUCU</h4>
                        </div>
                        <p className="text-xs text-slate-500 font-bold leading-relaxed italic opacity-80 border-l-4 border-emerald-100 pl-6 py-2">
                            Abonelik süresi bitmeye yakın işletmeleri önceden takip ederek hatırlatmada bulunmanız, "Müşteri Kayıp Oranınızı" (Churn Rate) en düşük seviyede tutmanızı sağlar.
                        </p>
                        <div className="pt-6 border-t border-slate-50">
                            <button className="text-[11px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors flex items-center justify-between w-full group/btn2">
                                REHBERİ GÖRÜNTÜLE <ChevronRight size={18} className="group-hover/btn2:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResellerDashboard;

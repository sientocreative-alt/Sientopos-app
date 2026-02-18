import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import {
    ArrowLeft,
    Store,
    Shield,
    Calendar,
    Activity,
    History,
    Save,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    Mail,
    FileText,
    Info,
    Building2,
    ChevronRight,
    Search,
    CreditCard
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const SectionHeader = ({ title, desc }) => (
    <div className="mb-6 border-b border-slate-100 pb-4">
        <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">{title}</h3>
        {desc && <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-widest opacity-60 italic">{desc}</p>}
    </div>
);

const ResellerBusinessDetail = () => {
    const { id, tab: activeTabParam } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [business, setBusiness] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(activeTabParam || 'genel');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchBusinessData();
        fetchLogs();
    }, [id]);

    const fetchBusinessData = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('id', id)
                .eq('reseller_id', currentUser.id)
                .single();

            if (error) throw error;
            setBusiness(data);
        } catch (error) {
            console.error('Error fetching business:', error);
            toast.error('İşletme bilgileri yüklenemedi.');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('business_logs')
                .select('*')
                .eq('business_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        }
    };

    const handleUpdate = async (updates, actionType, actionDetails) => {
        setSaving(true);
        try {
            const { error: updateError } = await supabase
                .from('businesses')
                .update(updates)
                .eq('id', id);

            if (updateError) throw updateError;

            await supabase.from('business_logs').insert([{
                business_id: id,
                actor_id: currentUser.id,
                action: actionType,
                details: actionDetails
            }]);

            toast.success('İşlem başarıyla tamamlandı!');
            fetchBusinessData();
            fetchLogs();
        } catch (error) {
            toast.error('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
    );

    if (!business) return (
        <div className="text-center py-20 space-y-6">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Store size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">İşletme Bulunamadı</h2>
            <button
                onClick={() => navigate('/isletmeler')}
                className="text-indigo-600 font-black uppercase text-xs tracking-widest border-b-2 border-indigo-200 hover:border-indigo-600 pb-1"
            >
                Portföye Geri Dön
            </button>
        </div>
    );

    const tabs = [
        { id: 'genel', label: 'GENEL BİLGİLER', icon: Store },
        { id: 'paket', label: 'PAKET YÖNETİMİ', icon: Shield },
        { id: 'abonelik', label: 'ABONELİK TAKİBİ', icon: Calendar },
        { id: 'durum', label: 'HESAP DURUMU', icon: Activity },
        { id: 'loglar', label: 'İŞLEM GEÇMİŞİ', icon: History },
    ];



    return (
        <div className="max-w-5xl mx-auto pb-10">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/isletmeler')}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase">
                                {business.name}
                            </h1>
                            <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border
                                ${business.status === 'active' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                {business.status === 'active' ? 'AKTİF LİSANS' : business.status === 'trial' ? 'DENEME SÜRECİ' : 'PASİF'}
                            </div>
                        </div>
                        <p className="text-slate-400 text-[8px] font-bold mt-0.5 font-mono tracking-widest uppercase opacity-60">ID: {business.id}</p>
                    </div>
                </div>

                <div className="flex bg-white p-1 border border-slate-200 rounded-xl shadow-sm overflow-x-auto custom-scrollbar no-scrollbar">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    navigate(`/isletmeler/${id}/${tab.id}`, { replace: true });
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-[9px] tracking-widest transition-all whitespace-nowrap
                                    ${isActive
                                        ? 'bg-slate-900 text-white shadow-lg shadow-slate-200'
                                        : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                <Icon size={12} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Container */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
                {activeTab === 'genel' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="İşletme Temel Bilgileri" desc="İşletmenin sistem üzerindeki ana tanımlamaları" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Ticari Tanım (İşletme Adı)</label>
                                <div className="flex gap-4">
                                    <input
                                        readOnly
                                        type="text"
                                        className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-slate-900 font-bold text-sm focus:outline-none opacity-70"
                                        value={business.name}
                                    />
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-[2rem] p-8 flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                    <Info size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Yetki Kısıtlaması Hakkında</h4>
                                    <p className="text-slate-500 text-xs font-bold leading-relaxed italic">Güvenlik gereği, işletmenin detaylı vergi ve fatura bilgileri sadece merkez yönetici veya işletme sahibinin kendi paneli üzerinden güncellenebilir. Bayi olarak sadece isim ve durum güncellemeleri yapabilirsiniz.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'paket' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="Aktif Paket ve Abonelik Modeli" desc="İşletmenin sahip olduğu lisans tipi ve özellik kısıtları" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 'trial', label: 'Deneme Paketi', desc: '14 Günlük Ücretsiz Kullanım', icon: Clock, color: 'amber' },
                                { id: 'monthly', label: 'Standart Aylık', desc: 'Sınırsız İşlem / Aylık Ödeme', icon: CreditCard, color: 'indigo' },
                                { id: 'yearly', label: 'Kurumsal Yıllık', desc: 'Tam Özellik / Yıllık Avantaj', icon: Shield, color: 'emerald' }
                            ].map((p) => (
                                <div
                                    key={p.id}
                                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center
                                        ${business.subscription_plan === p.id
                                            ? `bg-${p.color}-50/30 border-${p.color}-500 shadow-xl shadow-${p.color}-100`
                                            : 'bg-slate-50 border-slate-100'}`}
                                >
                                    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 
                                        ${business.subscription_plan === p.id ? `text-${p.color}-600` : 'text-slate-400'}`}>
                                        <p.icon size={28} />
                                    </div>
                                    <h4 className={`text-lg font-black uppercase tracking-tight ${business.subscription_plan === p.id ? 'text-slate-900' : 'text-slate-400'}`}>{p.label}</h4>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2 italic">{p.desc}</p>

                                    {business.subscription_plan === p.id && (
                                        <div className={`absolute top-6 right-6 text-${p.color}-500 bg-white rounded-full p-1 shadow-sm`}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'abonelik' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="Lisans Süresi ve Geçerlilik" desc="Abonelik tarihçesi ve lisans uzatma işlemleri" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-slate-50 rounded-[2rem] p-10 border border-slate-100 space-y-8">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                        <Calendar size={20} />
                                    </div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Mevcut Durum Çizelgesi</h4>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-slate-200 border-dashed">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İlk Kayıt Tarihi</span>
                                        <span className="text-sm font-black text-slate-800">{format(new Date(business.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}</span>
                                    </div>
                                    <div className="flex justify-between items-center pb-2">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lisans Bitiş Tarihi</span>
                                        <span className={`text-lg font-black px-4 py-1 rounded-xl shadow-sm border ${new Date(business.subscription_end_date || business.trial_end_date) < new Date() ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                            {business.subscription_end_date ? format(new Date(business.subscription_end_date), 'd MMMM yyyy', { locale: tr }) : business.trial_end_date ? format(new Date(business.trial_end_date), 'd MMMM yyyy', { locale: tr }) : 'BELİRTİLMEDİ'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-[2rem] p-8 flex items-start gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
                                    <Info size={24} />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Lisans Yönetimi Kısıtlaması</h4>
                                    <p className="text-slate-500 text-xs font-bold leading-relaxed italic">İşletme lisans süresi uzatma ve paket değişikliği işlemleri sadece "Sistem Yöneticisi" tarafından gerçekleştirilebilir. Bayi paneli üzerinden sadece mevcut durumu takip edebilirsiniz.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'durum' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="Hesap Erişim Kontrolü" desc="İşletmenin sisteme giriş ve işlem yapma yetkileri" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { id: 'active', label: 'Tam Erişim (AKTİF)', color: 'emerald', desc: 'Tüm modüller ve POS operasyonları kesintisiz devam eder.' },
                                { id: 'suspended', label: 'Erişim Kısıtlı (ASKIDA)', color: 'rose', desc: 'Panel girişi engellenir, veriler dondurulur ancak silinmez.' },
                                { id: 'trial', label: 'Demo Süreci (DENEME)', color: 'amber', desc: 'Kısıtlı lisans süresi kapsamında test kullanımı sunulur.' }
                            ].map((s) => (
                                <div
                                    key={s.id}
                                    className={`relative p-10 rounded-[2.5rem] border-2 transition-all flex flex-col h-full
                                        ${business.status === s.id
                                            ? `bg-${s.color}-50/40 border-${s.color}-500 shadow-xl shadow-${s.color}-100`
                                            : 'bg-slate-50 border-slate-100'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full mb-6 ${business.status === s.id ? `bg-${s.color}-500 animate-pulse` : 'bg-slate-200'}`} />
                                    <h4 className={`text-lg font-black uppercase tracking-tight ${business.status === s.id ? 'text-slate-900' : 'text-slate-400'}`}>{s.label}</h4>
                                    <p className="text-slate-400 text-xs font-bold mt-4 leading-relaxed italic">{s.desc}</p>

                                    {business.status === s.id && (
                                        <div className={`absolute top-8 right-8 text-${s.color}-500 bg-white rounded-full p-1 shadow-sm`}>
                                            <CheckCircle2 size={24} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'loglar' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <SectionHeader title="İşlem ve Müdahale Geçmişi" desc="Bu işletme üzerinde yapılan tüm kritik işlemlerin dökümü" />
                        <div className="space-y-4">
                            {logs.length > 0 ? (
                                <div className="border border-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-100">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-white hover:bg-slate-50/50 transition-all group">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shadow-sm shrink-0 group-hover:bg-white transition-all">
                                                <History size={20} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                    <span className="text-xs font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{log.action}</span>
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(log.created_at), 'd MMMM yyyy HH:mm', { locale: tr })}</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2 overflow-x-auto">
                                                    {JSON.stringify(log.details)}
                                                </div>
                                            </div>
                                            <div className="hidden md:flex flex-col items-end">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SİSTEM KAYDI</div>
                                                <div className="text-xs font-bold text-slate-600">ID: {log.id.substring(0, 8)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto text-slate-200 mb-6 border border-slate-100">
                                        <History size={40} />
                                    </div>
                                    <h5 className="text-sm font-black text-slate-400 uppercase tracking-widest">İŞLEM GEÇMİŞİ BULUNAMADI</h5>
                                    <p className="text-xs text-slate-300 font-bold mt-2 uppercase tracking-tight">Bu işletme üzerinde henüz bir müdahale kaydı bulunmuyor.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResellerBusinessDetail;

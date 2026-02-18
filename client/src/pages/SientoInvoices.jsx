import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    CreditCard,
    Download,
    Eye,
    Plus,
    ChevronRight,
    ArrowLeft,
    Trash2,
    Gift,
    ShieldCheck,
    Lock,
    Zap,
    Check,
    X,
    Star,
    Smartphone,
    Server,
    Globe,
    Users,
    Clock,
    Headphones,
    Package,
    Layout,
    Cloud,
    MessageSquare,
    PieChart,
    TrendingUp,
    Settings,
    BarChart,
    Database,
    Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const ICON_OPTIONS = [
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Shield', icon: ShieldCheck },
    { name: 'Zap', icon: Zap },
    { name: 'Star', icon: Star },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'Server', icon: Server },
    { name: 'Globe', icon: Globe },
    { name: 'Users', icon: Users },
    { name: 'Check', icon: Check },
    { name: 'Clock', icon: Clock },
    { name: 'Headphones', icon: Headphones },
    { name: 'Package', icon: Package },
    { name: 'Layout', icon: Layout },
    { name: 'Cloud', icon: Cloud },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'PieChart', icon: PieChart },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Settings', icon: Settings },
    { name: 'Lock', icon: Lock },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Gift', icon: Gift },
    { name: 'BarChart', icon: BarChart },
    { name: 'Database', icon: Database },
    { name: 'Mail', icon: Mail }
];

const SientoInvoices = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Determine view based on URL
    const isPlansView = location.pathname.endsWith('/paketler');
    const [view, setView] = useState(isPlansView ? 'plans' : 'list'); // 'list', 'plans', 'cards', 'addCard'
    const [editingCard, setEditingCard] = useState(null);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState([]);
    const [previewBilling, setPreviewBilling] = useState('monthly');

    // Sync view with URL
    useEffect(() => {
        if (location.pathname.endsWith('/paketler')) {
            setView('plans');
        } else if (view === 'plans') {
            setView('list');
        }
    }, [location.pathname]);

    // Mock Data State for Invoices
    const [invoices] = useState([]);

    const [cards, setCards] = useState([]);

    const [form, setForm] = useState({
        holder: '',
        number: '',
        expMonth: '01',
        expYear: '2026',
        ccv: ''
    });

    useEffect(() => {
        fetchCards();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .order('created_at', { ascending: true });
            if (error) throw error;
            setPlans(data || []);
        } catch (error) {
            console.error('Fetch plans error:', error);
        }
    };

    const fetchCards = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (business) {
                const { data, error } = await supabase
                    .from('saved_cards')
                    .select('*')
                    .eq('business_id', business.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    console.warn('saved_cards table might not exist yet:', error);
                    return;
                }
                setCards(data || []);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();

        if (!form.holder || !form.number || !form.ccv) {
            toast.error('Lütfen tüm alanları doldurun');
            return;
        }

        setLoading(true);
        try {
            const { data: business } = await supabase
                .from('businesses')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!business) throw new Error('İşletme bulunamadı');

            const cardData = {
                business_id: business.id,
                holder_name: form.holder,
                last_4: form.number.replace(/\D/g, '').slice(-4),
                expiry_month: form.expMonth,
                expiry_year: form.expYear,
                bank_name: 'Sistem Bankası'
            };

            if (editingCard) {
                const { error } = await supabase
                    .from('saved_cards')
                    .update(cardData)
                    .eq('id', editingCard.id);
                if (error) throw error;
                toast.success('Kart başarıyla güncellendi');
            } else {
                const { error } = await supabase
                    .from('saved_cards')
                    .insert([cardData]);
                if (error) throw error;
                toast.success('Kart başarıyla kaydedildi');
            }

            setForm({ holder: '', number: '', expMonth: '01', expYear: '2026', ccv: '' });
            setEditingCard(null);
            setView('cards');
            fetchCards();
        } catch (error) {
            console.error('Error saving card:', error);
            toast.error('Kart kaydedilirken bir hata oluştu. Veritabanı tablosu mevcut olmayabilir.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm('Bu kartı silmek istediğinize emin misiniz?')) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('saved_cards')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Kart silindi');
            fetchCards();
        } catch (error) {
            console.error('Error deleting card:', error);
            toast.error('Kart silinirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCard = (card) => {
        setEditingCard(card);
        setForm({
            holder: card.holder_name,
            number: '**** **** **** ' + card.last_4,
            expMonth: card.expiry_month,
            expYear: card.expiry_year,
            ccv: '***'
        });
        setView('addCard');
    };

    const years = Array.from({ length: 10 }, (_, i) => 2026 + i);
    const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));

    const getIcon = (iconName) => {
        const option = ICON_OPTIONS.find(o => o.name === iconName);
        return option ? <option.icon size={16} /> : <Check size={16} />;
    };

    const PreviewCard = ({ data }) => {
        const isMonthly = previewBilling === 'monthly';
        const currentPrice = isMonthly ? data.price_monthly : data.price_yearly;
        const discountPeriod = data.discount_period || 'monthly';

        return (
            <div className="bg-[#f8fafc] text-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 w-full max-w-[340px] mx-auto animate-in fade-in zoom-in duration-500 relative overflow-hidden flex flex-col justify-between h-full">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                <div className="flex justify-between items-start mb-6 relative text-left">
                    <div className="space-y-0.5">
                        <h3 className="text-2xl font-black tracking-tight text-gray-900">{data.name || 'Örnek Paket'}</h3>
                        <p className="text-gray-500 text-[10px] font-medium leading-tight">{data.description || 'İşletmeniz için en iyi özellikler.'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <button
                        type="button"
                        onClick={() => setPreviewBilling('monthly')}
                        className={`text-left rounded-2xl p-4 transition-all duration-300 relative overflow-hidden border-2 flex flex-col justify-between h-full ${isMonthly
                            ? 'bg-white border-orange-500 shadow-xl shadow-orange-500/10'
                            : 'bg-white border-transparent hover:border-gray-200 opacity-60'
                            }`}
                    >
                        {discountPeriod === 'monthly' && (
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">İNDİRİM!</div>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-wider ${isMonthly ? 'text-slate-700' : 'text-slate-400'}`}>Aylık</span>
                        <div className={`text-xl font-black mt-0.5 ${isMonthly ? 'text-orange-600' : 'text-gray-300'}`}>₺{data.price_monthly || '0'}</div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPreviewBilling('yearly')}
                        className={`text-left rounded-2xl p-4 transition-all duration-300 relative overflow-hidden border-2 flex flex-col justify-between h-full ${!isMonthly
                            ? 'bg-white border-orange-500 shadow-xl shadow-orange-500/10'
                            : 'bg-white border-transparent hover:border-gray-200 opacity-60'
                            }`}
                    >
                        {discountPeriod === 'yearly' && (
                            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">İNDİRİM!</div>
                        )}
                        <span className={`text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${!isMonthly ? 'text-slate-700' : 'text-slate-400'}`}>
                            Yıllık
                        </span>
                        <div className={`text-xl font-black mt-0.5 ${!isMonthly ? 'text-orange-600' : 'text-gray-300'}`}>₺{data.price_yearly || '0'}</div>
                    </button>
                </div>

                <div className="space-y-3 mb-6 text-left">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-black ml-1 text-left">PLAN ÖZELLİKLERİ</h4>
                    <div className="space-y-2">
                        {data.features?.map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5">
                                <div className="w-4 h-4 bg-orange-100 rounded-md flex items-center justify-center shrink-0">
                                    <Check size={10} className="text-orange-600 stroke-[4px]" />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 line-clamp-1">{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-xl p-4 mb-4 flex justify-between items-center border border-gray-100 shadow-inner">
                    <div className="space-y-0 text-left">
                        <span className="text-[9px] font-black text-black uppercase tracking-widest leading-none">Toplam Tutar</span>
                        <p className="text-[7px] text-black font-bold opacity-60 leading-none">{isMonthly ? 'Aylık ödeme' : 'Yıllık ödeme'}</p>
                    </div>
                    <div className="text-2xl font-black text-orange-600 tracking-tighter">₺{currentPrice || '0'}</div>
                </div>

                <button type="button" className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-xs transition-all transform hover:translate-y-[-2px] active:scale-[0.98] shadow-2xl shadow-orange-600/30 flex items-center justify-center gap-2">
                    <Zap size={14} className="fill-white" />
                    BU PLANLA DEVAM ET
                </button>
            </div>
        );
    };

    const renderPlansView = () => (
        <div className="animate-in fade-in slide-in-from-bottom-12 duration-700 pb-10 w-full flex justify-center">
            <div className="flex flex-wrap justify-center gap-6 items-start w-full max-w-5xl">
                {plans.map((plan) => (
                    <PreviewCard key={plan.id} data={plan} />
                ))}
            </div>
        </div>
    );

    const renderListView = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Promo Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-blue-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-700" />
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                        <Gift size={32} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Abonelik Paketlerimiz!</h2>
                        <p className="text-white/80 text-sm font-medium">Yıllık paketlerimiz ve avantajlı fiyatlarını inceleyebilirsiniz.</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/isletme/siento-faturalari/paketler')}
                    className="bg-white text-blue-700 px-8 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2 group relative z-10"
                >
                    Paket Listesi
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-sm md:text-base">
                <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-lg font-bold text-gray-800">Sistem Üzerinden Oluşturulan Faturalar</h3>
                    <button
                        onClick={() => setView('cards')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                        Kayıtlı Kartları Yönet
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-black uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                                <th className="px-8 py-4">Son Ödeme Tarihi</th>
                                <th className="px-8 py-4">Fatura Tutarı</th>
                                <th className="px-8 py-4 text-center">Ödendi mi?</th>
                                <th className="px-8 py-4">Fatura Numarası</th>
                                <th className="px-8 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                            {invoices.length > 0 ? (
                                invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 text-blue-600">{inv.date}</td>
                                        <td className="px-8 py-5 font-bold">{inv.amount}</td>
                                        <td className="px-8 py-5">
                                            <div className="flex justify-center">
                                                <span className="bg-blue-400 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight">
                                                    {inv.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-blue-400 font-mono tracking-tighter">{inv.id}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 text-gray-400">
                                                <button
                                                    onClick={() => simulateInvoiceAction('view', inv.id)}
                                                    className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                                                    title="Görüntüle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => simulateInvoiceAction('download', inv.id)}
                                                    className="p-2 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                                                    title="İndir"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-gray-400 italic">
                                        Henüz oluşturulmuş bir fatura bulunmamaktadır.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderCardsView = () => (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">Kayıtlı Kartlar</h2>
                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setView('list')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all"
                    >
                        Faturalara Dön
                    </button>
                    <button
                        onClick={() => {
                            setEditingCard(null);
                            setForm({ holder: '', number: '', expMonth: '01', expYear: '2026', ccv: '' });
                            setView('addCard');
                        }}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Kart Ekle
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[200px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-black uppercase text-[10px] font-black tracking-widest border-b border-gray-100">
                                <th className="px-8 py-4">Kart Sahibi</th>
                                <th className="px-8 py-4">Banka</th>
                                <th className="px-8 py-4">Kartın Son 4 Hanesi</th>
                                <th className="px-8 py-4">Geçerlilik Tarihi</th>
                                <th className="px-8 py-4 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm font-medium text-gray-700">
                            {cards.length > 0 ? (
                                cards.map((card) => (
                                    <tr key={card.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-8 py-5 font-bold">{card.holder_name}</td>
                                        <td className="px-8 py-5 text-black">{card.bank_name}</td>
                                        <td className="px-8 py-5 font-mono text-black">**** **** **** {card.last_4}</td>
                                        <td className="px-8 py-5 text-black">{card.expiry_month}/{card.expiry_year}</td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditCard(card)}
                                                    className="p-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-gray-300"
                                                    title="Görüntüle"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCard(card.id)}
                                                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors text-gray-300"
                                                    title="Sil"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : !loading && (
                                <tr>
                                    <td colSpan="5" className="px-8 py-12 text-center text-black italic">
                                        Kayıtlı kart bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderAddCardView = () => (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setView('cards')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <ArrowLeft size={20} className="text-gray-400" />
                </button>
                <h2 className="text-xl font-bold text-gray-800">{editingCard ? 'Kartı Düzenle' : 'Yeni Kart Ekle'}</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-3xl">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <form onSubmit={handleAddCard} className="space-y-6 max-w-4xl">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">KART SAHİBİNİN ADI VE SOYADI</label>
                        <input
                            type="text"
                            required
                            disabled={loading}
                            className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-600 outline-none rounded-2xl font-medium transition-all disabled:opacity-50"
                            placeholder="Ad Soyad"
                            value={form.holder}
                            onChange={(e) => setForm(f => ({ ...f, holder: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">KREDİ KARTI NUMARASI</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                disabled={loading}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-600 outline-none rounded-2xl font-medium transition-all disabled:opacity-50"
                                placeholder="0000 0000 0000 0000"
                                value={form.number}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                                    setForm(f => ({ ...f, number: val }));
                                }}
                            />
                            <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">GEÇERLİLİK TARİHİ AY</label>
                            <select
                                disabled={loading}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-600 outline-none rounded-2xl font-bold transition-all appearance-none disabled:opacity-50"
                                value={form.expMonth}
                                onChange={(e) => setForm(f => ({ ...f, expMonth: e.target.value }))}
                            >
                                {months.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">GEÇERLİLİK TARİHİ YIL</label>
                            <select
                                disabled={loading}
                                className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-600 outline-none rounded-2xl font-bold transition-all appearance-none disabled:opacity-50"
                                value={form.expYear}
                                onChange={(e) => setForm(f => ({ ...f, expYear: e.target.value }))}
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black uppercase tracking-widest ml-1">CCV</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    disabled={loading}
                                    className="w-full px-6 py-4 bg-gray-50 border border-transparent focus:border-blue-600 outline-none rounded-2xl font-medium transition-all disabled:opacity-50"
                                    placeholder="***"
                                    value={form.ccv}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                        setForm(f => ({ ...f, ccv: val }));
                                    }}
                                />
                                <Lock className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col items-center md:items-end gap-4 border-t border-gray-50 mt-10">
                        <div className="flex items-center gap-3 text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
                            <ShieldCheck size={20} />
                            <span className="text-xs font-bold">256-bit SSL şifreleme ile bilgileriniz güvende</span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'İŞLENİYOR...' : (editingCard ? 'KART BİLGİLERİNİ GÜNCELLE' : 'KARTI KAYDET')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
            <div className={view === 'plans' ? 'mb-2' : 'mb-8'}>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-2">
                    <span>Pano</span>
                    <ChevronRight size={12} />
                    <span className="text-gray-900">SientoPOS Faturaları</span>
                </div>
                <div className="flex items-center gap-4">
                    {view === 'plans' && (
                        <button
                            onClick={() => navigate('/isletme/siento-faturalari')}
                            className="p-2 hover:bg-white rounded-2xl shadow-sm border border-gray-100 transition-all text-gray-400 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                        </button>
                    )}
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">SientoPOS Faturaları</h1>
                </div>
            </div>

            {view === 'list' && renderListView()}
            {view === 'plans' && renderPlansView()}
            {view === 'cards' && renderCardsView()}
            {view === 'addCard' && renderAddCardView()}
        </div>
    );
};

export default SientoInvoices;

import { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, Package, Trash2, Plus, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SientoFaturalari() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('packages');
    const [cards, setCards] = useState([]);
    const [plans, setPlans] = useState([]);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [iyzicoFormContent, setIyzicoFormContent] = useState('');
    const [showIyzicoModal, setShowIyzicoModal] = useState(false);

    useEffect(() => {
        if (user?.business_id) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const status = params.get('status');
        if (status === 'success') {
            alert('Ödeme başarılı! Aboneliğiniz aktif edildi.');
            // Clear URL
            window.history.replaceState({}, document.title, window.location.pathname);
            fetchData();
        } else if (status === 'fail') {
            alert('Ödeme başarısız: ' + (params.get('reason') || 'Bilinmeyen hata'));
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);

        // Use separate try-catch blocks to prevent one failure from blocking others
        try {
            const plansRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/plans`);
            setPlans(plansRes.data.data || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
        }

        try {
            if (user?.business_id) {
                const subRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/subscription/${user.business_id}`);
                setSubscription(subRes.data.subscription);
            }
        } catch (error) {
            console.error('Error fetching subscription:', error);
        }

        try {
            if (user?.business_id) {
                const cardsRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/card/list`, { businessId: user.business_id });
                setCards(cardsRes.data.cards || []);
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
        }

        setLoading(false);
    };

    const [showIframe, setShowIframe] = useState(false);

    const openPaytrIframe = (data) => {
        setShowIframe(true);
        // Small timeout to allow iframe to render
        setTimeout(() => {
            const form = document.createElement('form');
            form.action = 'https://www.paytr.com/odeme';
            form.method = 'POST';
            form.target = 'paytr_iframe'; // Target the iframe

            Object.keys(data).forEach(key => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = data[key];
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
        }, 100);
    };

    const closeIframe = () => {
        setShowIframe(false);
        fetchData(); // Refresh data in case payment was successful
    };

    const handleAddCard = async () => {
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/create`, {
                amount: '1.00',
                businessId: user.business_id,
                email: user.email,
                ip: '127.0.0.1',
                store_card: 1
            });

            if (res.data.status === 'success') {
                openPaytrIframe(res.data.data);
            }
        } catch (error) {
            console.error(error);
            alert('Kart ekleme başlatılamadı.' + (error.response?.data?.message || ''));
        }
    };

    const handleDeleteCard = async (ctoken) => {
        if (!confirm('Kartı silmek istediğinize emin misiniz?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/card/${ctoken}`, {
                data: { businessId: user.business_id }
            });
            fetchData();
        } catch (error) {
            alert('Kart silinemedi');
        }
    };

    const handleSubscribe = async (planId, period, price) => {
        if (!confirm(`${period === 'monthly' ? 'Aylık' : 'Yıllık'} pakete (${price}₺) abone olmak istiyor musunuz?`)) return;

        console.log('DEBUG - Calling URL:', `${import.meta.env.VITE_API_URL}/api/payment/iyzico/init`);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payment/iyzico/init`, {
                amount: price,
                businessId: user.business_id,
                planId,
                period
            });

            if (res.data.status === 'success') {
                setIyzicoFormContent(res.data.checkoutFormContent);
                setShowIyzicoModal(true);
            } else {
                alert('Ödeme başlatılamadı: ' + (res.data.message || 'Hata'));
            }
        } catch (error) {
            console.error('DEBUG - Subscription Error:', error);
            const backendMsg = error.response?.data?.message;
            if (backendMsg) {
                alert('Ödeme Sistemi Hatası: ' + backendMsg);
            } else {
                alert('Ödeme sistemi şu an kullanılamıyor: ' + (error.message || 'Bilinmeyen hata'));
            }
        }
    };

    // Script execution helper for Iyzico
    useEffect(() => {
        if (showIyzicoModal && iyzicoFormContent) {
            const container = document.getElementById('iyzipay-checkout-form-container');
            if (container) {
                container.innerHTML = iyzicoFormContent;
                const scripts = container.getElementsByTagName('script');
                for (let i = 0; i < scripts.length; i++) {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    if (scripts[i].src) {
                        script.src = scripts[i].src;
                    } else {
                        script.innerHTML = scripts[i].innerHTML;
                    }
                    document.body.appendChild(script);
                }
            }
        }
    }, [showIyzicoModal, iyzicoFormContent]);

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Siento Faturaları & Abonelik</h1>

            {/* Symmetrical Layout Container */}
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                    {/* Left Side: Current Subscription (5/12 columns) */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex-grow flex flex-col justify-between border border-white/5">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
                                <Package size={300} />
                            </div>

                            <div className="relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-8">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></div>
                                    <span className="text-[10px] font-black tracking-widest uppercase opacity-80">Hesap Özeti</span>
                                </div>

                                <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Mevcut<br />Planınız</h2>

                                {subscription ? (
                                    <div className="mt-8 space-y-8">
                                        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm shadow-inner group transition-all">
                                            <div className="text-5xl font-black mb-1 capitalize tracking-tighter text-blue-100 italic group-hover:text-white transition-colors">
                                                {subscription.plan_type === 'monthly' ? 'Aylık' : 'Yıllık'}
                                            </div>
                                            <p className="text-xs font-black text-blue-300 uppercase tracking-[0.2em] opacity-60 italic">PROFESYONEL PAKET</p>
                                        </div>

                                        <div className="flex items-center justify-between px-2">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest opacity-50">Yenileme Tarihi</p>
                                                <p className="text-xl font-black tracking-tight">{new Date(subscription.end_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl text-[10px] font-black tracking-[0.2em] border shadow-2xl ${subscription.status === 'active' ? 'bg-green-500/20 border-green-500/50 text-green-300' : 'bg-rose-500/20 border-rose-500/50 text-rose-300'}`}>
                                                {subscription.status === 'active' ? 'TAMAMEN AKTİF' : 'ÖDEME GEREKLİ'}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-8 space-y-6">
                                        <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10">
                                            <p className="text-xl font-bold text-blue-100 leading-tight">Henüz bir aktif planınız bulunmuyor.</p>
                                        </div>
                                        <p className="text-sm font-medium text-blue-200/60 leading-relaxed px-4">
                                            SientoPOS Premium özellikleri ile işletmenize değer katmak için hemen bir paket seçin.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/30 flex items-center justify-center text-blue-200 border border-blue-400/20 shadow-lg">
                                            <CreditCard size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em]">GÜVENLİK</p>
                                            <p className="text-xs font-bold text-blue-100">PCI-DSS Uyumlu</p>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-blue-200/20 uppercase tracking-[0.3em] italic">SientoPOS v3.0</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Available Plans (7/12 columns) */}
                    <div className="lg:col-span-7 flex flex-col gap-6">
                        {plans.map((plan) => (
                            <div key={plan.id} className="group bg-white border border-gray-100 rounded-[2.5rem] p-4 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 relative flex flex-col md:flex-row flex-grow border-b-4 border-b-transparent hover:border-b-blue-600">
                                {/* Plan Details */}
                                <div className="flex-grow p-8 flex flex-col justify-between">
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-5 mb-8">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-blue-200 group-hover:rotate-6">
                                                <Package size={32} strokeWidth={2.5} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-1">{plan.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Kurumsal Çözüm</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8">
                                            {plan.features && plan.features.slice(0, 4).map((feature, idx) => (
                                                <div key={idx} className="flex items-center text-xs font-black text-gray-600 gap-3 group/item">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-400 group-hover/item:scale-150 transition-transform"></div>
                                                    <span className="group-hover/item:text-gray-950 transition-colors uppercase tracking-tight">{feature}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest italic opacity-50 group-hover:opacity-100 transition-opacity">
                                        <Check size={12} strokeWidth={4} className="text-emerald-500" />
                                        Limitsiz Ürün ve Kategori
                                    </div>
                                </div>

                                {/* Action Buttons Panel */}
                                <div className="md:w-72 bg-gray-50/50 rounded-[2rem] p-8 flex flex-col justify-center gap-4 border border-gray-100/50">
                                    <button
                                        onClick={() => handleSubscribe(plan.id, 'monthly', plan.monthly_price)}
                                        className="w-full flex flex-col items-center justify-center py-5 px-4 bg-white border border-gray-100 rounded-2xl transition-all duration-300 hover:border-blue-400 hover:bg-blue-50/10 hover:shadow-xl group/btn"
                                    >
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover/btn:text-blue-500 transition-colors">AYLIK ÖDEME</span>
                                        <span className="text-2xl font-black text-gray-900 tracking-tight group-hover/btn:text-blue-900">{parseFloat(plan.monthly_price).toLocaleString('tr-TR')} ₺</span>
                                    </button>

                                    <button
                                        onClick={() => handleSubscribe(plan.id, 'yearly', plan.yearly_price)}
                                        className="w-full flex flex-col items-center justify-center py-6 px-4 bg-gray-950 text-white rounded-2xl transition-all duration-500 hover:bg-blue-700 hover:shadow-2xl hover:shadow-blue-600/40 relative isolate overflow-hidden group/yr"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover/yr:opacity-100 transition-opacity"></div>

                                        {plan.yearly_campaign_active && (
                                            <div className="absolute top-0 right-0 bg-yellow-400 text-gray-950 font-black px-3 py-1 text-[9px] rounded-bl-xl z-20 shadow-lg border-l border-b border-white/20 uppercase tracking-tighter">
                                                En İyi Fiyat
                                            </div>
                                        )}

                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1 group-hover/yr:text-white/80 transition-colors z-10">YILLIK AVANTAJ</span>
                                        <span className="text-3xl font-black tracking-tighter z-10">{parseFloat(plan.yearly_price).toLocaleString('tr-TR')} ₺</span>

                                        {plan.yearly_campaign_active && (
                                            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-2 px-2 py-0.5 bg-yellow-400/10 rounded-full z-10 animate-pulse">
                                                +3 AY ÜCRETSİZ!
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Iyzico Modal */}
            {showIyzicoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative overflow-hidden">
                        <div className="flex justify-between items-center p-8 border-b border-gray-100">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Güvenli Ödeme</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Iyzico Altyapısı ile Korunmaktadır</p>
                            </div>
                            <button
                                onClick={() => setShowIyzicoModal(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90"
                            >
                                <Plus className="rotate-45" size={24} />
                            </button>
                        </div>
                        <div className="flex-grow p-8 overflow-y-auto custom-scrollbar min-h-[400px]">
                            <div id="iyzipay-checkout-form-container">
                                {/* Iyzico form will be injected here */}
                                <div id="iyzipay-checkout-form" className="responsive"></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

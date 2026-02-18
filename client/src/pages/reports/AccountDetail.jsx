import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Receipt,
    Calendar,
    Clock,
    User,
    CreditCard,
    Wallet,
    Trash2,
    RefreshCw
} from 'lucide-react';

const AccountDetail = () => {
    const { paymentId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [payment, setPayment] = useState(null);
    const [items, setItems] = useState([]);

    const fetchAccountDetail = async () => {
        if (!user?.business_id || !paymentId) return;
        setLoading(true);
        try {
            // 1. Fetch Payment Details
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .select('*')
                .eq('id', paymentId)
                .single();

            if (paymentError) throw paymentError;
            setPayment(paymentData);

            // 2. Fetch Order Items linked to this payment
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('payment_id', paymentId);

            if (itemsError) throw itemsError;
            setItems(itemsData || []);

        } catch (err) {
            console.error('Error fetching account detail:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && paymentId) fetchAccountDetail();
    }, [user, paymentId]);

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
    };

    const formatDateTime = (isoString) => {
        if (!isoString) return { date: '-', time: '-' };
        const d = new Date(isoString);
        return {
            date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' }),
            time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
                <RefreshCw className="text-[#5D5FEF] animate-spin mb-4" size={40} />
                <span className="text-gray-500 font-bold">Detaylar Yükleniyor...</span>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] text-center p-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
                    <Receipt className="mx-auto text-gray-300 mb-4" size={48} />
                    <h2 className="text-xl font-black text-gray-800 mb-2">Hesap Bulunamadı</h2>
                    <p className="text-gray-400 mb-6">Aradığınız hesap detayı bulunamadı veya silinmiş olabilir.</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="bg-[#5D5FEF] text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-[#4B4DDF] transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            </div>
        );
    }

    const { date: payDate, time: payTime } = formatDateTime(payment.created_at);

    return (
        <div className="p-6 bg-[#F8FAFC] min-h-screen font-sans text-left">
            <div className="max-w-[1200px] mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#5D5FEF] transition-all"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black text-gray-800 tracking-tight uppercase">
                            HESAP DETAY
                        </h1>
                        <span className="text-sm font-bold text-gray-400">Pano • Faturalar • Hesaplar • Hesap Detay</span>
                    </div>
                </div>

                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Items Section Header */}
                    <div className="p-8 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-lg font-black text-gray-800 bg-gray-50 px-4 py-2 rounded-lg inline-block uppercase tracking-wide">
                            HESAP DETAY – Referans: {paymentId.slice(0, 8)}
                        </h2>
                    </div>

                    {/* Items List */}
                    <div className="p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">AD</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">TUTAR</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">TARİH</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">SAAT</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">EKLEYEN PERSONEL</th>
                                        {/* <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">SİLEN PERSONEL</th> */}
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="py-8 text-center text-gray-400 font-bold text-sm">
                                                Bu ödemeye ait ürün kaydı bulunamadı.
                                            </td>
                                        </tr>
                                    ) : (
                                        (() => {
                                            const products = items.filter(i => !i.metadata?.is_discount);
                                            const discounts = items.filter(i => i.metadata?.is_discount);
                                            const totalDiscount = discounts.reduce((sum, d) => sum + (parseFloat(d.price) || 0), 0);
                                            const totalProductsGross = products.reduce((sum, p) => {
                                                const price = parseFloat(p.price) || 0;
                                                const modsTotal = p.modifiers?.reduce((mSum, m) => mSum + (parseFloat(m.price) || 0), 0) || 0;
                                                return sum + (price + modsTotal) * p.quantity;
                                            }, 0);

                                            let displayItems = products;
                                            if (totalDiscount !== 0 && totalProductsGross > 0) {
                                                const factor = (totalProductsGross + totalDiscount) / totalProductsGross;
                                                displayItems = products.map(p => {
                                                    const price = parseFloat(p.price) || 0;
                                                    const modsTotal = p.modifiers?.reduce((mSum, m) => mSum + (parseFloat(m.price) || 0), 0) || 0;
                                                    return {
                                                        ...p,
                                                        price: (price + modsTotal) * factor / p.quantity,
                                                        modifiers: []
                                                    };
                                                });
                                            }

                                            return displayItems.map((item) => {
                                                const { date, time } = formatDateTime(item.created_at);
                                                const itemPrice = parseFloat(item.price) * item.quantity;

                                                return (
                                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="py-5 pl-2">
                                                            <span className="text-sm font-black text-gray-700 uppercase">
                                                                {item.quantity}x {item.name}
                                                            </span>
                                                            {item.modifiers && item.modifiers.length > 0 && (
                                                                <div className="text-xs text-gray-400 mt-1 pl-4">
                                                                    {item.modifiers.map(m => m.name).join(', ')}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="py-5 text-right">
                                                            <span className="text-sm font-black text-gray-800">{formatCurrency(itemPrice)}</span>
                                                        </td>
                                                        <td className="py-5 text-center">
                                                            <span className="text-sm font-bold text-gray-500">{date}</span>
                                                        </td>
                                                        <td className="py-5 text-center">
                                                            <span className="text-sm font-bold text-gray-500 font-mono">{time}</span>
                                                        </td>
                                                        <td className="py-5 text-center">
                                                            <span className="text-sm font-bold text-gray-700">{item.staff_name || '-'}</span>
                                                        </td>
                                                        <td className="py-5 text-center text-gray-300">
                                                            <Trash2 size={16} className="mx-auto" />
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        })()
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Payment Detail Section */}
                <div className="bg-[#E0F2FE]/30 rounded-[24px] overflow-hidden border border-[#E0F2FE]">
                    <div className="p-8">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-[#E0F2FE]">
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest pl-2">ÖDEME TÜRÜ</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">TUTAR</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">TARİH</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">SAAT</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">EKLEYEN PERSONEL</th>
                                        <th className="py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="group">
                                        <td className="py-5 pl-2">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide
                                                ${payment.payment_method === 'Nakit'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {payment.payment_method === 'Nakit' ? <Wallet size={14} /> : <CreditCard size={14} />}
                                                {payment.payment_method}
                                            </div>
                                        </td>
                                        <td className="py-5 text-right">
                                            <span className="text-lg font-black text-gray-800">{formatCurrency(payment.amount)}</span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-sm font-bold text-gray-600">{payDate}</span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-sm font-bold text-gray-600 font-mono">{payTime}</span>
                                        </td>
                                        <td className="py-5 text-center">
                                            <span className="text-sm font-bold text-gray-800">{payment.staff_name || '-'}</span>
                                        </td>
                                        <td className="py-5 text-center text-gray-400 hover:text-red-500 transition-colors cursor-pointer">
                                            <Trash2 size={18} className="mx-auto" />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AccountDetail;

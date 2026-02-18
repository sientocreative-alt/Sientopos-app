import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft,
    Plus,
    Trash2,
    X,
    Calendar,
    Clock,
    User,
    CreditCard,
    DollarSign,
    Receipt
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const PaymentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [payment, setPayment] = useState(null);
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && id) {
            fetchPaymentDetails();
        }
    }, [user, id]);

    const fetchPaymentDetails = async () => {
        try {
            setLoading(true);

            // 1. Fetch Payment Main Info
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .select('*')
                .eq('id', id)
                .single();

            if (paymentError) throw paymentError;
            setPayment(paymentData);

            // 2. Fetch Order Items linked to this payment
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('payment_id', id)
                .is('is_deleted', false);

            if (itemsError) throw itemsError;
            setOrderItems(itemsData || []);

        } catch (error) {
            console.error('Error fetching payment details:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' });
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                <p className="font-bold uppercase tracking-widest text-xs">Yükleniyor...</p>
            </div>
        );
    }

    if (!payment) {
        return <div className="p-8 text-center text-red-500 font-bold">Ödeme kaydı bulunamadı.</div>;
    }

    return (
        <div className="p-6 bg-gray-50/50 min-h-screen">
            {/* Header / Breadcrumb */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <ChevronLeft size={24} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Hesap Detay</h1>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-wider">
                            <span>Pano</span>
                            <span>•</span>
                            <span>Faturalar</span>
                            <span>•</span>
                            <span>Hesaplar</span>
                            <span>•</span>
                            <span className="text-gray-500">Hesap Detay</span>
                        </div>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg font-bold hover:bg-blue-200 transition-all text-sm shadow-sm active:scale-95">
                    <Plus size={18} />
                    <span>Ödeme Ekle</span>
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8">
                    {/* Title */}
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight flex items-center gap-3">
                            HESAP DETAY – Adisyon: {id.substring(0, 4).toUpperCase()}
                        </h2>
                    </div>

                    {/* Items Table */}
                    <div className="mb-12">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[11px] font-black text-gray-300 uppercase tracking-widest border-b border-gray-50">
                                    <th className="pb-4">AD</th>
                                    <th className="pb-4">TUTAR</th>
                                    <th className="pb-4">TARİH</th>
                                    <th className="pb-4 text-center">SAAT</th>
                                    <th className="pb-4">EKLEYEN PERSONEL</th>
                                    <th className="pb-4">SİLEN PERSONEL</th>
                                    <th className="pb-4 text-center">İŞLEMLER</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orderItems.map((item, idx) => (
                                    <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-4 font-black text-gray-700 text-[13px]">
                                            {item.quantity}x {item.product_name || item.name}
                                            {item.modifiers?.length > 0 && (
                                                <div className="text-[10px] text-gray-400 font-bold mt-1">
                                                    + {item.modifiers.map(m => m.name).join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-4 font-black text-gray-800 text-[13px]">
                                            {parseFloat(item.price * item.quantity).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="py-4 text-[13px] font-bold text-gray-500">
                                            {formatDate(item.created_at)}
                                        </td>
                                        <td className="py-4 text-center text-[13px] font-black text-gray-700">
                                            {formatTime(item.created_at)}
                                        </td>
                                        <td className="py-4 font-black text-gray-700 text-[13px]">
                                            {item.staff_name || 'Mehmet Bilgiç'}
                                        </td>
                                        <td className="py-4 text-[13px] font-bold text-gray-400">
                                            {/* Placeholder for deleted check */}
                                        </td>
                                        <td className="py-4 text-center">
                                            <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                                <X size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Info Table (Bottom part) */}
                    <div className="overflow-hidden rounded-xl border border-blue-50 bg-blue-50/30">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-blue-50">
                                <tr className="text-[11px] font-black text-gray-300 uppercase tracking-widest">
                                    <th className="py-4 px-6">ÖDEME TÜRÜ</th>
                                    <th className="py-4 px-6">TUTAR</th>
                                    <th className="py-4 px-6 text-center">TARİH</th>
                                    <th className="py-4 px-6 text-center">SAAT</th>
                                    <th className="py-4 px-6 text-right">EKLEYEN PERSONEL</th>
                                    <th className="py-4 px-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="text-indigo-600">
                                    <td className="py-4 px-6 font-black text-[13px]">
                                        {payment.payment_method}
                                    </td>
                                    <td className="py-4 px-6 font-black text-[13px]">
                                        {parseFloat(payment.amount).toFixed(2).replace('.', ',')} ₺
                                    </td>
                                    <td className="py-4 px-6 text-center font-bold text-[13px]">
                                        {formatDate(payment.created_at)}
                                    </td>
                                    <td className="py-4 px-6 text-center font-black text-[13px]">
                                        {formatTime(payment.created_at)}
                                    </td>
                                    <td className="py-4 px-6 text-right font-black text-[13px]">
                                        {payment.staff_name}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetail;

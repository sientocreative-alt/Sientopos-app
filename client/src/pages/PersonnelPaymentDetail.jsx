import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    FileText,
    CreditCard,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const PersonnelPaymentDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.business_id && id) {
            fetchTransaction();
        }
    }, [user?.business_id, id]);

    const fetchTransaction = async () => {
        try {
            const { data, error } = await supabase
                .from('staff_transactions')
                .select(`
                    *,
                    staff (first_name, last_name, phone, email)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            setTransaction(data);
        } catch (error) {
            console.error('Error fetching transaction:', error);
            toast.error('Kayıt bulunamadı');
            navigate('/isletme/maas-bilgileri');
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (val) => {
        return parseFloat(val || 0).toFixed(2).replace('.', ',') + ' ₺';
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#F8FAFC]">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!transaction) return null;

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/isletme/maas-bilgileri"
                            className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <ArrowLeft size={20} className="text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                                Personel Ödemeleri
                            </h1>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                <span>Pano</span>
                                <span>•</span>
                                <span>Personel Ödemeleri</span>
                                <span>•</span>
                                <span className="text-blue-600">Detay</span>
                            </div>
                        </div>
                    </div>

                    <Link
                        to={`/isletme/maas-bilgileri/duzenle/${id}`}
                        className="px-5 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
                    >
                        <Edit size={18} />
                        Personel Ödemesi Düzenle
                    </Link>
                </div>

                {/* Detail Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-8 border-b border-gray-100 pb-4">
                        Personel Ödeme Bilgisi
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Personel
                            </span>
                            <div className="text-base font-bold text-gray-800">
                                {transaction.staff?.first_name} {transaction.staff?.last_name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                                {transaction.staff?.phone || '-'}
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Ödeme Şekli
                            </span>
                            <div className="text-base font-bold text-gray-800">
                                {transaction.payment_method}
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Tutar
                            </span>
                            <div className="text-xl font-black text-gray-800">
                                {formatCurrency(transaction.amount)}
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Banka
                            </span>
                            <div className="text-base font-bold text-gray-800">
                                Belirtilmemiş
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                İşlem Türü
                            </span>
                            <div className="text-base font-bold text-gray-800">
                                {transaction.category}
                            </div>
                            <div className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded ${transaction.transaction_type === 'Ödeme' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
                                }`}>
                                {transaction.transaction_type}
                            </div>
                        </div>

                        <div>
                            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                Oluşturulma Tarihi
                            </span>
                            <div className="text-base font-bold text-gray-800">
                                {format(new Date(transaction.transaction_date), 'd MMMM yyyy')}
                            </div>
                        </div>

                        {transaction.description && (
                            <div className="col-span-1 md:col-span-2">
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Açıklama
                                </span>
                                <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    {transaction.description}
                                </div>
                            </div>
                        )}

                        {transaction.file_url && (
                            <div className="col-span-1 md:col-span-2">
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                    Belge
                                </span>
                                <a
                                    href={transaction.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                                >
                                    <FileText size={16} />
                                    Belgeyi Görüntüle
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonnelPaymentDetail;

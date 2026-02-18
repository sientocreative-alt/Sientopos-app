import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2,
    Upload,
    Calendar,
    FileText,
    X
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

const NewPersonnelPayment = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const isEditMode = !!id;
    const transactionTypeParam = searchParams.get('type'); // 'odeme' or 'borc'

    const [isLoading, setIsLoading] = useState(false);
    const [staffList, setStaffList] = useState([]);

    const [formData, setFormData] = useState({
        staff_id: '',
        transaction_type: transactionTypeParam === 'borc' ? 'Borç' : 'Ödeme',
        category: '', // Maaş, Avans, vs.
        amount: '',
        payment_method: '',
        description: '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        file_url: ''
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchStaff();
        }
    }, [user?.business_id]);

    useEffect(() => {
        if (user?.business_id && id) {
            fetchTransaction();
        }
    }, [user?.business_id, id]);

    const fetchTransaction = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('staff_transactions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    staff_id: data.staff_id,
                    transaction_type: data.transaction_type,
                    category: data.category,
                    amount: data.amount,
                    payment_method: data.payment_method,
                    description: data.description || '',
                    transaction_date: data.transaction_date,
                    file_url: data.file_url || ''
                });
            }
        } catch (error) {
            console.error('Error fetching transaction:', error);
            toast.error('Kayıt yüklenirken hata oluştu');
            navigate('/isletme/maas-bilgileri');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Update transaction type if URL param changes
        if (transactionTypeParam) {
            setFormData(prev => ({
                ...prev,
                transaction_type: transactionTypeParam === 'borc' ? 'Borç' : 'Ödeme'
            }));
        }
    }, [transactionTypeParam]);

    const fetchStaff = async () => {
        const { data } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('business_id', user.business_id);

        if (data) setStaffList(data);
    };

    const handleSave = async () => {
        if (!formData.staff_id || !formData.amount || !formData.category) {
            toast.error('Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            setIsLoading(true);

            let error;

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('staff_transactions')
                    .update({
                        staff_id: formData.staff_id,
                        transaction_type: formData.transaction_type,
                        category: formData.category,
                        amount: parseFloat(formData.amount),
                        payment_method: formData.payment_method,
                        description: formData.description,
                        transaction_date: formData.transaction_date,
                        file_url: formData.file_url,
                        updated_at: new Date()
                    })
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('staff_transactions')
                    .insert([{
                        business_id: user.business_id,
                        staff_id: formData.staff_id,
                        transaction_type: formData.transaction_type,
                        category: formData.category,
                        amount: parseFloat(formData.amount),
                        payment_method: formData.payment_method,
                        description: formData.description,
                        transaction_date: formData.transaction_date,
                        file_url: formData.file_url
                    }]);
                error = insertError;
            }

            if (error) throw error;

            toast.success('İşlem başarıyla kaydedildi');
            navigate('/isletme/maas-bilgileri');
        } catch (error) {
            console.error('Error saving transaction:', error);
            toast.error('Kaydetme işlemi başarısız');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/isletme/maas-bilgileri"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEditMode ? 'Personel Ödemesi Düzenle' : (formData.transaction_type === 'Ödeme' ? 'Yeni Personel Ödemesi' : 'Yeni Personel Alacağı')}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Personel Ödemeleri</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEditMode ? 'Düzenle' : 'Yeni Ekle'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                        {isEditMode ? 'Personel Ödemesi Düzenle' : 'Personel Ödemesi Ekle'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Staff Selection */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Personel
                            </label>
                            <select
                                value={formData.staff_id}
                                onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">Seçilmedi</option>
                                {staffList.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.first_name} {staff.last_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Type (Category) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Ödeme Tipi
                            </label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">-</option>
                                <option value="Maaş">Maaş</option>
                                <option value="Avans">Avans</option>
                                <option value="Prim">Prim</option>
                                <option value="Yemek">Yemek</option>
                                <option value="Yol">Yol</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>

                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Tutar
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Ödeme Şekli
                            </label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">-</option>
                                <option value="Nakit">Nakit</option>
                                <option value="Havale/EFT">Havale/EFT</option>
                            </select>
                        </div>

                        {/* Description */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Açıklama
                            </label>
                            <textarea
                                rows="3"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Date */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Tarih
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="date"
                                    value={formData.transaction_date}
                                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        {/* File Upload (Document) - Placeholder for now as file upload logic needs storage setup */}
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Belge
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Dosya Linki (İsteğe Bağlı)"
                                    value={formData.file_url}
                                    onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                                <button type="button" className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-all whitespace-nowrap">
                                    Browse
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Link
                            to="/isletme/maas-bilgileri"
                            className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                        >
                            İptal
                        </Link>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isEditMode ? 'Güncelle' : 'Personel Ödemesi Ekle'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NewPersonnelPayment;

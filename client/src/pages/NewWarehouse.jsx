import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const NewWarehouse = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        is_sales_warehouse: false
    });

    useEffect(() => {
        if (user?.business_id && id) {
            fetchWarehouse();
        }
    }, [user?.business_id, id]);

    const fetchWarehouse = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    is_sales_warehouse: data.is_sales_warehouse
                });
            }
        } catch (error) {
            console.error('Error fetching warehouse:', error);
            toast.error('Depo bilgileri yüklenirken hata oluştu');
            navigate('/isletme/depolar');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Lütfen depo adını giriniz');
            return;
        }

        try {
            setIsLoading(true);
            let error;

            const warehouseData = {
                business_id: user.business_id,
                name: formData.name,
                is_sales_warehouse: formData.is_sales_warehouse,
                updated_at: new Date()
            };

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('warehouses')
                    .update(warehouseData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('warehouses')
                    .insert([warehouseData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditMode ? 'Depo güncellendi' : 'Depo oluşturuldu');
            navigate('/isletme/depolar');
        } catch (error) {
            console.error('Error saving warehouse:', error);
            toast.error('Kaydetme işlemi başarısız');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link
                        to="/isletme/depolar"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEditMode ? 'Depo Düzenle' : 'Yeni Depo'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Stok</span>
                            <span>•</span>
                            <span>Depolar</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEditMode ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                        {isEditMode ? 'Depo Düzenle' : 'Depo Ekle'}
                    </h2>

                    <div className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Depo Adı
                            </label>
                            <input
                                type="text"
                                placeholder="Örn: Ana Depo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Is Sales Warehouse Toggle */}
                        <div className="flex items-center gap-3">
                            <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                <input
                                    type="checkbox"
                                    name="toggle"
                                    id="toggle"
                                    checked={formData.is_sales_warehouse}
                                    onChange={(e) => setFormData({ ...formData, is_sales_warehouse: e.target.checked })}
                                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out check-toggle"
                                    style={{
                                        transform: formData.is_sales_warehouse ? 'translateX(100%)' : 'translateX(0)',
                                        borderColor: formData.is_sales_warehouse ? '#3B82F6' : '#E5E7EB'
                                    }}
                                />
                                <label
                                    htmlFor="toggle"
                                    className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${formData.is_sales_warehouse ? 'bg-blue-500' : 'bg-gray-300'
                                        }`}
                                ></label>
                            </div>
                            <label htmlFor="toggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                Satış Deposu
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Link
                            to="/isletme/depolar"
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
                            {isEditMode ? 'Depo Güncelle' : 'Depo Ekle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewWarehouse;

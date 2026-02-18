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

const NewStockCategory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        if (user?.business_id && id) {
            fetchCategory();
        }
    }, [user?.business_id, id]);

    const fetchCategory = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setName(data.name);
            }
        } catch (error) {
            console.error('Error fetching stock category:', error);
            toast.error('Kategori bilgileri yüklenirken hata oluştu');
            navigate('/isletme/stoklu-urun-kategorileri');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('Lütfen kategori adını giriniz');
            return;
        }

        try {
            setIsLoading(true);
            let error;

            const categoryData = {
                business_id: user.business_id,
                name: name,
                updated_at: new Date()
            };

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('stock_categories')
                    .update(categoryData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('stock_categories')
                    .insert([categoryData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditMode ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
            navigate('/isletme/stoklu-urun-kategorileri');
        } catch (error) {
            console.error('Error saving stock category:', error);
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
                        to="/isletme/stoklu-urun-kategorileri"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEditMode ? 'Kategori Düzenle' : 'Yeni Stok Kategorisi'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Stok</span>
                            <span>•</span>
                            <span>Stoklu Ürün Kategorileri</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEditMode ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                        {isEditMode ? 'Kategori Düzenle' : 'Stok Kategorisi Ekle'}
                    </h2>

                    <div className="space-y-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Kategori Adı
                            </label>
                            <input
                                type="text"
                                placeholder="Örn: Sütler"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Link
                            to="/isletme/stoklu-urun-kategorileri"
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
                            {isEditMode ? 'Kategori Güncelle' : 'Kategori Ekle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewStockCategory;

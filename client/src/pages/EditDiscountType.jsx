import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Trash2 } from 'lucide-react';

const EditDiscountType = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        type: 'Yüzdelik İndirim',
        amount: ''
    });

    useEffect(() => {
        const fetchDiscount = async () => {
            try {
                setFetching(true);
                const { data, error } = await supabase
                    .from('discount_types')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        name: data.name,
                        type: data.type,
                        amount: data.amount
                    });
                }
            } catch (error) {
                console.error('Error fetching discount type:', error);
                alert('İndirim türü bulunamadı.');
                navigate('/isletme/indirim-turleri');
            } finally {
                setFetching(false);
            }
        };

        if (user && id) fetchDiscount();
    }, [user, id]);

    const handleSave = async () => {
        if (!formData.name || !formData.amount) {
            alert('Lütfen zorunlu alanları doldurunuz.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('discount_types')
                .update({
                    name: formData.name,
                    type: formData.type,
                    amount: parseFloat(formData.amount)
                })
                .eq('id', id);

            if (error) throw error;
            navigate('/isletme/indirim-turleri');
        } catch (error) {
            console.error('Error updating discount type:', error);
            alert('Güncelleme başarısız: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Bu indirim türünü silmek istediğinize emin misiniz?')) return;
        try {
            setLoading(true);
            const { error } = await supabase
                .from('discount_types')
                .update({ is_deleted: true })
                .eq('id', id);

            if (error) throw error;
            navigate('/isletme/indirim-turleri');
        } catch (error) {
            console.error('Error deleting discount type:', error);
            alert('Silme başarısız: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-6 text-center text-gray-500">Yükleniyor...</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="font-bold text-gray-900 text-lg">Düzenle</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>Stok</span>
                    <span>•</span>
                    <span>İndirim Türleri</span>
                    <span>•</span>
                    <span>Düzenle</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto relative">
                <button
                    onClick={handleDelete}
                    className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Sil"
                >
                    <Trash2 size={24} />
                </button>

                <h1 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50">İndirim Türü Düzenle</h1>

                <div className="flex gap-6 mb-2">
                    <div className="flex-1 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Adı</label>
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="İndirim Adı"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="flex-1 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Türü</label>
                        <div className="relative">
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option>Yüzdelik İndirim</option>
                                <option>Tutar İndirimi</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
                        </div>
                    </div>
                </div>

                <div className="w-1/2 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">İndirim Miktarı</label>
                    <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="İndirim Miktarı"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-50">
                    <button
                        onClick={() => navigate('/isletme/indirim-turleri')}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Yükleniyor...' : 'Güncelle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditDiscountType;

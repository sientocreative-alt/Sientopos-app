import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';

const EditPaymentMethod = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        show_change_calculator: false,
        open_cash_drawer: false,
        print_receipt: false,
        pos_type: 'Nakit'
    });

    const POS_TYPES = ['Nakit', 'Kredi Kartı', 'Mobil Ödeme', 'Multinet', 'Sodexo'];

    useEffect(() => {
        if (user && id) {
            fetchPaymentMethod();
        }
    }, [user, id]);

    const fetchPaymentMethod = async () => {
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    show_change_calculator: data.show_change_calculator,
                    open_cash_drawer: data.open_cash_drawer,
                    print_receipt: data.print_receipt,
                    pos_type: data.pos_type || 'Nakit'
                });
            }
        } catch (error) {
            console.error('Error fetching method:', error);
            alert('Ödeme yöntemi yüklenemedi.');
            navigate('/isletme/odeme-yontemleri');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name) {
            alert('Lütfen ödeme yöntemi adını giriniz.');
            return;
        }

        try {
            setSaving(true);
            const { error } = await supabase
                .from('payment_methods')
                .update({
                    name: formData.name,
                    show_change_calculator: formData.show_change_calculator,
                    open_cash_drawer: formData.open_cash_drawer,
                    print_receipt: formData.print_receipt,
                    pos_type: formData.pos_type
                })
                .eq('id', id);

            if (error) throw error;
            navigate('/isletme/odeme-yontemleri');
        } catch (error) {
            alert('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/isletme/odeme-yontemleri')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Düzenle</h1>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Ödeme Yöntemleri</span>
                    <span>•</span>
                    <span>Düzenle</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <h2 className="font-bold text-lg text-gray-800 mb-6 border-b border-gray-100 pb-4">
                    Ödeme Yöntemi Düzenle
                </h2>

                <div className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <span className="text-red-500 mr-1">*</span>
                            Ödeme Yöntemi
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                            placeholder="Ödeme Yöntemini Seçiniz"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Toggles */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.show_change_calculator ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                {formData.show_change_calculator && <span className="text-white text-xs">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.show_change_calculator}
                                onChange={(e) => setFormData({ ...formData, show_change_calculator: e.target.checked })}
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">Para Üstü Hesaplayıcı Göster</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.open_cash_drawer ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                {formData.open_cash_drawer && <span className="text-white text-xs">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.open_cash_drawer}
                                onChange={(e) => setFormData({ ...formData, open_cash_drawer: e.target.checked })}
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">Ödemeden sonra para çekmecesini aç</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.print_receipt ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                                {formData.print_receipt && <span className="text-white text-xs">✓</span>}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.print_receipt}
                                onChange={(e) => setFormData({ ...formData, print_receipt: e.target.checked })}
                            />
                            <span className="text-gray-700 group-hover:text-gray-900">Pos Çıktısı Alınacak Mı?</span>
                        </label>
                    </div>

                    {/* POS Type */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Pos Ödeme Tipi</label>
                        <select
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 appearance-none"
                            value={formData.pos_type}
                            onChange={(e) => setFormData({ ...formData, pos_type: e.target.value })}
                        >
                            {POS_TYPES.map((type) => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions */}
                    <div className="border-t border-gray-100 pt-6 flex justify-end gap-3">
                        <button
                            onClick={() => navigate('/isletme/odeme-yontemleri')}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                        >
                            İptal
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
                        >
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditPaymentMethod;

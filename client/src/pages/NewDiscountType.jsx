import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown } from 'lucide-react';

const NewDiscountType = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: 'Yüzdelik İndirim',
        amount: ''
    });

    const handleSave = async () => {
        if (!formData.name || !formData.amount) {
            alert('Lütfen zorunlu alanları (* İndirim Adı, * İndirim Miktarı) doldurunuz.');
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('discount_types')
                .insert([{
                    business_id: user.business_id,
                    name: formData.name,
                    type: formData.type,
                    amount: parseFloat(formData.amount)
                }]);

            if (error) throw error;
            navigate('/isletme/indirim-turleri');
        } catch (error) {
            console.error('Error creating discount type:', error);
            alert('Hata oluşturuldu: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const SelectInput = ({ label, value, onChange, options = [] }) => (
        <div className="mb-6 flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="relative">
                <select
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-700"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                >
                    {options.map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18} />
            </div>
        </div>
    );

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                    <span className="font-bold text-gray-900 text-lg">Yeni</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>Stok</span>
                    <span>•</span>
                    <span>İndirim Türleri</span>
                    <span>•</span>
                    <span>Yeni</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
                <h1 className="text-xl font-bold text-gray-800 mb-8 pb-4 border-b border-gray-50">İndirim Türü Ekle</h1>

                <div className="flex gap-6 mb-2">
                    {/* Discount Name */}
                    <div className="flex-1 mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <span className="text-red-500 mr-1">*</span>İndirim Adı
                        </label>
                        <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                            placeholder="İndirim Adı"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {/* Discount Type */}
                    <SelectInput
                        label="İndirim Türü"
                        value={formData.type}
                        onChange={val => setFormData({ ...formData, type: val })}
                        options={['Yüzdelik İndirim', 'Tutar İndirimi']}
                    />
                </div>

                {/* Discount Amount */}
                <div className="w-1/2 mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="text-red-500 mr-1">*</span>İndirim Miktarı
                    </label>
                    <input
                        type="number"
                        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                        placeholder="İndirim Miktarı"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                    />
                </div>

                {/* Footer Buttons */}
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
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {loading ? 'Yükleniyor...' : 'İndirim Türü Ekle'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default NewDiscountType;

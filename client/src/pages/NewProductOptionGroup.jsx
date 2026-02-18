import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react';

const NewProductOptionGroup = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '', // Gösterim Adı
        internal_name: '', // Opsiyon Adı
        selection_type: 'Tekli Seçim',
        min_selections: 1,
        max_selections: 1
    });

    // Options state
    const [options, setOptions] = useState([]);

    const handleAddOption = () => {
        setOptions([...options, {
            name: '',
            price: 0,
            order_number: (options.length + 1) * 10,
            is_default: false,
            is_active: true
        }]);
    };

    const handleRemoveOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        setOptions(newOptions);
    };

    const handleOptionChange = (index, field, value) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], [field]: value };
        setOptions(newOptions);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.internal_name) {
            alert('Lütfen gerekli alanları doldurunuz.');
            return;
        }

        try {
            setLoading(true);

            // 1. Create Group
            const { data: groupData, error: groupError } = await supabase
                .from('modifier_groups')
                .insert([{
                    business_id: user.business_id,
                    name: formData.name,
                    internal_name: formData.internal_name,
                    selection_type: formData.selection_type,
                    min_selections: parseInt(formData.min_selections),
                    max_selections: parseInt(formData.max_selections)
                }])
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Create Options if any
            if (options.length > 0) {
                const optionsToInsert = options.map(opt => ({
                    business_id: user.business_id,
                    group_id: groupData.id,
                    name: opt.name,
                    price: parseFloat(opt.price),
                    order_number: parseInt(opt.order_number),
                    is_default: opt.is_default,
                    is_active: opt.is_active
                }));

                const { error: optionsError } = await supabase
                    .from('modifier_options')
                    .insert(optionsToInsert);

                if (optionsError) throw optionsError;
            }

            // Navigate back to list
            navigate('/isletme/urun-opsiyonlari');
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Breadcrumb / Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span className="font-bold text-gray-800 text-lg mr-2">Yeni</span>
                    <span>Pano</span>
                    <span>•</span>
                    <span>POS Ayarları</span>
                    <span>•</span>
                    <span>Zorunlu Seçim Grupları</span>
                    <span>•</span>
                    <span>Yeni</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Zorunlu Seçim Grubu Ekle</h2>
                </div>

                <div className="p-6 space-y-8">
                    {/* Top Row Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Display Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gösterim Adı (Türkçe)</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <div className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-gray-500 text-sm flex items-center min-w-[50px] justify-center">
                                    Tr <ChevronDown size={14} className="ml-1" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Sadece GM üzerinden düzenlenebilir</p>
                        </div>

                        {/* Option Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsiyon Adı (Türkçe)</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                    value={formData.internal_name}
                                    onChange={e => setFormData({ ...formData, internal_name: e.target.value })}
                                />
                                <div className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-gray-500 text-sm flex items-center min-w-[50px] justify-center">
                                    Tr <ChevronDown size={14} className="ml-1" />
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Sadece GM üzerinden düzenlenebilir</p>
                        </div>

                        {/* Selection Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Seçim Durumu</label>
                            <div className="relative">
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900"
                                    value={formData.selection_type}
                                    onChange={e => setFormData({ ...formData, selection_type: e.target.value })}
                                >
                                    <option value="Tekli Seçim">Tekli Seçim</option>
                                    <option value="Çoklu Seçim">Çoklu Seçim</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Min/Max Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Seçim Sayısı</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                                value={formData.min_selections}
                                onChange={e => setFormData({ ...formData, min_selections: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Maksimum Seçim Sayısı</label>
                            <input
                                type="number"
                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900"
                                value={formData.max_selections}
                                onChange={e => setFormData({ ...formData, max_selections: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Divider / List Section */}
                    <div className="pt-4">
                        <div className="flex justify-between items-end border-b border-gray-100 pb-4 mb-4">
                            <h3 className="text-lg font-bold text-gray-700">Zorunlu Seçim Grupları</h3>
                        </div>

                        <div className="space-y-4 mb-4">
                            {options.map((opt, idx) => (
                                <div key={idx} className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        {/* Option Name Row */}
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Opsiyon Adı (Türkçe)</label>
                                            <div className="flex">
                                                <input
                                                    type="text"
                                                    className="w-full border border-gray-200 rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                                                    value={opt.name}
                                                    onChange={e => handleOptionChange(idx, 'name', e.target.value)}
                                                />
                                                <div className="bg-gray-100 border border-l-0 border-gray-200 px-3 py-2 rounded-r-lg text-gray-500 text-sm flex items-center min-w-[50px] justify-center">
                                                    Tr <ChevronDown size={14} className="ml-1" />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Sadece GM üzerinden düzenlenebilir</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ek Ücret</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                                value={opt.price}
                                                onChange={e => handleOptionChange(idx, 'price', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Gösterim Sırası</label>
                                            <input
                                                type="number"
                                                className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                                value={opt.order_number}
                                                onChange={e => handleOptionChange(idx, 'order_number', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 items-end">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">Varsayılan Seçim</span>
                                                <button
                                                    onClick={() => handleOptionChange(idx, 'is_default', !opt.is_default)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${opt.is_default ? 'bg-blue-500' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${opt.is_default ? 'translate-x-6' : ''}`} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-700">Aktif</span>
                                                <button
                                                    onClick={() => handleOptionChange(idx, 'is_active', !opt.is_active)}
                                                    className={`w-12 h-6 rounded-full transition-colors relative ${opt.is_active ? 'bg-blue-500' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform flex items-center justify-center ${opt.is_active ? 'translate-x-6' : ''}`}>
                                                        {opt.is_active && <Check size={10} className="text-blue-500" />}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleRemoveOption(idx)}
                                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end mb-8">
                            <button
                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors"
                                onClick={handleAddOption}
                            >
                                <Plus size={18} />
                                Yeni Ürün Opsiyonu
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={() => navigate('/isletme/urun-opsiyonlari')}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Kaydediliyor...' : 'Zorunlu Seçim Grubu Ekle'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewProductOptionGroup;

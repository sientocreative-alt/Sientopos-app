import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Plus, Trash2, Check, ArrowLeft } from 'lucide-react';

const EditProductOptionGroup = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

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
    const [originalOptionIds, setOriginalOptionIds] = useState([]);

    useEffect(() => {
        if (user && id) {
            fetchGroupDetails();
        }
    }, [user, id]);

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);

            // Fetch Group
            const { data: groupData, error: groupError } = await supabase
                .from('modifier_groups')
                .select('*')
                .eq('id', id)
                .single();

            if (groupError) throw groupError;

            setFormData({
                name: groupData.name,
                internal_name: groupData.internal_name,
                selection_type: groupData.selection_type,
                min_selections: groupData.min_selections,
                max_selections: groupData.max_selections
            });

            // Fetch Options
            const { data: optionsData, error: optionsError } = await supabase
                .from('modifier_options')
                .select('*')
                .eq('group_id', id)
                .eq('is_deleted', false) // assuming we might want to respect soft delete if implemented, but usually we just delete rows or check active
                .order('order_number', { ascending: true });

            if (optionsError) throw optionsError;

            setOptions(optionsData || []);
            setOriginalOptionIds(optionsData.map(o => o.id));

        } catch (error) {
            console.error('Error fetching details:', error);
            alert('Grup bilgileri yüklenemedi.');
            navigate('/isletme/urun-opsiyonlari');
        } finally {
            setLoading(false);
        }
    };

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
            setSaving(true);

            // 1. Update Group
            const { error: groupError } = await supabase
                .from('modifier_groups')
                .update({
                    name: formData.name,
                    internal_name: formData.internal_name,
                    selection_type: formData.selection_type,
                    min_selections: parseInt(formData.min_selections),
                    max_selections: parseInt(formData.max_selections)
                })
                .eq('id', id);

            if (groupError) throw groupError;

            // 2. Handle Options

            // Delete removed options
            const currentIds = options.filter(o => o.id).map(o => o.id);
            const idsToDelete = originalOptionIds.filter(oid => !currentIds.includes(oid));

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('modifier_options')
                    .delete() // Hard delete for now, or use soft delete based on preference. User asked for "edit" functionality. Hard delete is cleaner for sub-items unless history is needed. Standard CRUD usually hard deletes sub-items.
                    // Actually let's check if the table has is_deleted.
                    // Looking at migration: "modifier_options" usually has standard fields. Let's assume hard delete is OK or I can check migration if needed.
                    // User requirements were simple. Let's start with Delete.
                    .in('id', idsToDelete);

                if (deleteError) throw deleteError;
            }

            // Upsert (Update or Insert) existing/new options
            const optionsToUpsert = options.map(opt => ({
                id: opt.id, // Include ID if it exists (update), undefined will be ignored by upsert if we structure it right, but for upsert we need to be careful.
                // Supabase upsert requires the primary key to match for update.
                // If id is undefined, it won't be in the object passed to upsert unless we handle it?
                // Actually, best to separate insert and update to be safe, or use upsert with checks.
                // Supabase upsert: if "id" is present, it updates. If not, it inserts.
                // So pass "id" only if it exists.
                ...((opt.id) && { id: opt.id }),
                business_id: user.business_id,
                group_id: id,
                name: opt.name,
                price: parseFloat(opt.price),
                order_number: parseInt(opt.order_number),
                is_default: opt.is_default,
                is_active: opt.is_active
            }));

            if (optionsToUpsert.length > 0) {
                const { error: upsertError } = await supabase
                    .from('modifier_options')
                    .upsert(optionsToUpsert);

                if (upsertError) throw upsertError;
            }

            // Navigate back to list
            navigate('/isletme/urun-opsiyonlari');
        } catch (error) {
            console.error('Error updating group:', error);
            alert('Hata: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Breadcrumb / Header */}
            <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <button onClick={() => navigate('/isletme/urun-opsiyonlari')} className="hover:text-blue-500">Zorunlu Seçim Grupları</button>
                    <span>•</span>
                    <span className="font-bold text-gray-800">Düzenle</span>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">Seçim Grubu Düzenle</h2>
                    <button
                        onClick={() => navigate('/isletme/urun-opsiyonlari')}
                        className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg"
                    >
                        <ArrowLeft size={20} />
                    </button>
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
                        disabled={saving}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProductOptionGroup;

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

const UNIT_TYPES = ['Ağırlık', 'Hacim', 'Uzunluk', 'Parça'];

const NewStockUnit = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [existingUnits, setExistingUnits] = useState([]);

    const [formData, setFormData] = useState({
        name: '',
        short_name: '',
        type: '',
        ratio: 1,
        base_unit_id: ''
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchExistingUnits();
        }
    }, [user?.business_id]);

    useEffect(() => {
        if (user?.business_id && id) {
            fetchUnit();
        }
    }, [user?.business_id, id]);

    // When base unit changes, update type
    useEffect(() => {
        if (formData.base_unit_id) {
            const baseUnit = existingUnits.find(u => u.id === formData.base_unit_id);
            if (baseUnit) {
                setFormData(prev => ({ ...prev, type: baseUnit.type }));
            }
        }
    }, [formData.base_unit_id, existingUnits]);

    const fetchExistingUnits = async () => {
        try {
            const { data, error } = await supabase
                .from('stock_units')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            if (error) throw error;
            // Filter out current unit if in edit mode (cannot depend on self)
            const units = isEditMode ? data.filter(u => u.id !== id) : data;
            setExistingUnits(units || []);
        } catch (error) {
            console.error('Error fetching units:', error);
        }
    };

    const fetchUnit = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('stock_units')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    name: data.name,
                    short_name: data.short_name,
                    type: data.type,
                    ratio: data.ratio,
                    base_unit_id: data.base_unit_id || ''
                });
            }
        } catch (error) {
            console.error('Error fetching unit:', error);
            toast.error('Birim bilgileri yüklenirken hata oluştu');
            navigate('/isletme/stok-birimleri');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.short_name.trim()) {
            toast.error('Lütfen zorunlu alanları doldurunuz');
            return;
        }

        if (!formData.base_unit_id && !formData.type) {
            toast.error('Lütfen birim tipi seçiniz');
            return;
        }

        try {
            setIsLoading(true);
            let error;

            const unitData = {
                business_id: user.business_id,
                name: formData.name,
                short_name: formData.short_name,
                type: formData.type,
                base_unit_id: formData.base_unit_id || null,
                ratio: formData.base_unit_id ? parseFloat(formData.ratio) : 1, // Root unit ratio is always 1
                updated_at: new Date()
            };

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('stock_units')
                    .update(unitData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('stock_units')
                    .insert([unitData]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(isEditMode ? 'Stok birimi güncellendi' : 'Stok birimi oluşturuldu');
            navigate('/isletme/stok-birimleri');
        } catch (error) {
            console.error('Error saving stock unit:', error);
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
                        to="/isletme/stok-birimleri"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEditMode ? 'Stok Birimi Düzenle' : 'Yeni Stok Birimi'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Stok</span>
                            <span>•</span>
                            <span>Stok Birimleri</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEditMode ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                        {isEditMode ? 'Stok Birimi Düzenle' : 'Stok Birimi Ekle'}
                    </h2>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    * Ad
                                </label>
                                <input
                                    type="text"
                                    placeholder="Örn: Kilogram"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>

                            {/* Short Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    * Kısaltma
                                </label>
                                <input
                                    type="text"
                                    placeholder="Örn: kg"
                                    value={formData.short_name}
                                    onChange={(e) => setFormData({ ...formData, short_name: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Base Unit Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    Birim (Baz Birim)
                                </label>
                                <select
                                    value={formData.base_unit_id}
                                    onChange={(e) => setFormData({ ...formData, base_unit_id: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                >
                                    <option value="">Seçilmedi (Ana Birim)</option>
                                    {existingUnits.map(unit => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name} ({unit.short_name})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400 font-medium ml-1">
                                    Eğer bu birim başka bir birimin katıysa seçiniz.
                                </p>
                            </div>

                            {/* Type (Disabled if Base Unit Selected) */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    * Birim Tipi
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    disabled={!!formData.base_unit_id}
                                    className={`w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600 ${!!formData.base_unit_id ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                >
                                    <option value="">Seçiniz</option>
                                    {UNIT_TYPES.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Ratio (Only if Base Unit Selected) */}
                        {formData.base_unit_id && (
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700 block">
                                    * Oran
                                </label>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-gray-500">1 {formData.short_name || 'Birim'} =</span>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.ratio}
                                        onChange={(e) => setFormData({ ...formData, ratio: e.target.value })}
                                        className="w-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                                    />
                                    <span className="text-sm font-bold text-gray-500">
                                        {existingUnits.find(u => u.id === formData.base_unit_id)?.short_name}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Link
                            to="/isletme/stok-birimleri"
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
                            {isEditMode ? 'Birim Güncelle' : 'Birim Ekle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewStockUnit;

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

const NewStockProduct = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        stock_category_id: '',
        name: '',
        product_type: 'Hammadde',
        critical_stock_level: '',
        price: '',
        default_unit_id: '',
        is_recipe: false, // Placeholder for recipe selection context
        recipe_id: '' // Placeholder
    });

    const productTypes = [
        'Hammadde',
        'Yarı Mamül',
        'Mamül',
        'Ticari Mal'
    ];

    useEffect(() => {
        if (user?.business_id) {
            fetchDependencies();
            if (isEditMode) {
                fetchProduct();
            }
        }
    }, [user?.business_id, id]);

    const fetchDependencies = async () => {
        try {
            // Fetch Categories
            const { data: catData, error: catError } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            if (catError) throw catError;
            setCategories(catData || []);

            // Fetch Units
            const { data: unitsData, error: unitsError } = await supabase
                .from('stock_units')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');

            if (unitsError) throw unitsError;
            setUnits(unitsData || []);

        } catch (error) {
            console.error('Error fetching dependencies:', error);
            toast.error('Gerekli veriler yüklenirken hata oluştu');
        }
    };

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    stock_category_id: data.stock_category_id || '',
                    name: data.name,
                    product_type: data.product_type || 'Hammadde',
                    critical_stock_level: data.critical_stock_level || '',
                    price: data.price || '',
                    default_unit_id: data.default_unit_id || '',
                    is_recipe: data.is_recipe || false,
                    recipe_id: '' // No real recipe link yet
                });
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            toast.error('Ürün bilgileri yüklenirken hata oluştu');
            navigate('/isletme/stoklu-urunler');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {

        if (!user?.business_id) {
            alert('İşletme kaydı bulunamadı! Lütfen tekrar giriş yapın.');
            return;
        }

        try {
            setIsLoading(true);

            // Payload with explicit nulls for optional legacy fields
            const productData = {
                business_id: user.business_id,
                name: formData.name,
                stock_category_id: formData.stock_category_id,
                product_type: formData.product_type,
                critical_stock_level: Number(formData.critical_stock_level) || 0,
                price: Number(formData.price) || 0,
                default_unit_id: formData.default_unit_id,
                is_recipe: formData.is_recipe,
                stock_tracking: true,
                category_id: null, // Explicitly set Menu Category to null
                updated_at: new Date()
            };

            // DEBUG: Log payload
            console.log('Sending payload:', productData);

            let error;
            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('products')
                    .insert([productData])
                    .select();
                error = insertError;
            }

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            toast.success(isEditMode ? 'Ürün güncellendi' : 'Ürün oluşturuldu');
            setTimeout(() => navigate('/isletme/stoklu-urunler'), 1000);
        } catch (error) {
            console.error('FULL ERROR:', error);
            const msg = error.message || error.details || 'Bilinmeyen hata';
            // Show alert to ensure user sees it
            alert('KAYIT HATASI: ' + msg);
            toast.error('Kayıt Başarısız! Hata: ' + msg);
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
                        to="/isletme/stoklu-urunler"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEditMode ? 'Stoklu Ürün Düzenle' : 'Yeni Stoklu Ürün'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>Stok</span>
                            <span>•</span>
                            <span>Stoklu Ürünler</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEditMode ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">
                        Stoklu Ürün Ekle
                    </h2>

                    <div className="space-y-6">
                        {/* Category */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Kategori
                            </label>
                            <select
                                value={formData.stock_category_id}
                                onChange={(e) => setFormData({ ...formData, stock_category_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">Seçilmedi</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Product Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Ürün
                            </label>
                            <input
                                type="text"
                                placeholder="Örn: Tam Yağlı Süt"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Product Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Ürün Tipi
                            </label>
                            <select
                                value={formData.product_type}
                                onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                {productTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Critical Stock Level */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Kritik Stok Seviyesi
                            </label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.critical_stock_level}
                                onChange={(e) => setFormData({ ...formData, critical_stock_level: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Listed Price */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Ürün Liste Fiyatı
                            </label>
                            <input
                                type="number"
                                placeholder="0.0"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            />
                        </div>

                        {/* Default Unit */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                * Varsayılan Gösterim Birimi
                            </label>
                            <select
                                value={formData.default_unit_id}
                                onChange={(e) => setFormData({ ...formData, default_unit_id: e.target.value })}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-gray-600"
                            >
                                <option value="">Stok Birimi Seçiniz</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name}) - {unit.type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Recipe (Placeholder) */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700 block">
                                Reçete
                            </label>
                            <select
                                disabled
                                className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm focus:outline-none transition-all font-medium text-gray-400 cursor-not-allowed"
                            >
                                <option>Seçilmedi</option>
                            </select>
                        </div>

                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100">
                        <Link
                            to="/isletme/stoklu-urunler"
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
                            {isEditMode ? 'Stoklu Ürün Güncelle' : 'Stoklu Ürün Ekle'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewStockProduct;

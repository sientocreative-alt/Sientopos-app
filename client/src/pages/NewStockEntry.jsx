import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    Loader2,
    ChevronDown,
    Search
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const NewStockEntry = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);

    // Dependencies
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [units, setUnits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);

    // Form State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [formData, setFormData] = useState({
        product_id: '',
        brand: '',
        warehouse_id: '',
        supplier_id: '',
        invoice_no: '',
        amount: '',
        unit_id: '',
        buy_price: '',
        description: ''
    });

    useEffect(() => {
        const init = async () => {
            if (!user?.business_id) return;

            try {
                setLoading(true);
                // First load dependencies
                await fetchDependencies();

                // Then load entry if editing
                if (isEdit && id) {
                    await fetchEntry();
                }
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [isEdit, id, user?.business_id]);

    const fetchEntry = async () => {
        try {
            const { data, error } = await supabase
                .from('stock_entries')
                .select('*, product:product_id(stock_category_id)')
                .eq('id', id)
                .is('is_deleted', false)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    product_id: data.product_id || '',
                    brand: data.brand || '',
                    warehouse_id: data.warehouse_id || '',
                    supplier_id: data.supplier_id || '',
                    invoice_no: data.invoice_no || '',
                    amount: data.amount?.toString() || '',
                    unit_id: data.unit_id || '',
                    buy_price: data.buy_price?.toString() || '',
                    description: data.description || ''
                });

                if (data.product?.stock_category_id) {
                    setSelectedCategory(data.product.stock_category_id);
                }
            }
        } catch (error) {
            console.error('Error fetching entry:', error);
            toast.error('Kayıt bilgileri yüklenemedi');
            navigate('/isletme/stok-girisi');
        }
    };

    const fetchDependencies = async () => {
        try {
            // Categories
            const { data: catData } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            setCategories(catData || []);

            // Products
            const { data: prodData } = await supabase
                .from('products')
                .select('id, name, stock_category_id, default_unit_id')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            setAllProducts(prodData || []);

            // Units
            const { data: unitsData } = await supabase
                .from('stock_units')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            setUnits(unitsData || []);

            // Warehouses
            const { data: whData } = await supabase
                .from('warehouses')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            setWarehouses(whData || []);

            // Set default warehouse if available AND NOT EDITING
            if (!isEdit && whData?.length > 0) {
                setFormData(prev => ({ ...prev, warehouse_id: whData[0].id }));
            }

            // Suppliers
            const { data: supData } = await supabase
                .from('suppliers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('company_name');
            setSuppliers(supData || []);

        } catch (error) {
            console.error('Error fetching dependencies:', error);
            throw error;
        }
    };

    const handleSave = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        // window.alert('İşlem başlatıldı. Veriler kontrol ediliyor...');

        if (!formData.product_id || !formData.amount.toString().trim() || !formData.unit_id) {
            const msg = 'Hata: Ürün, Miktar ve Birim alanları boş bırakılamaz!';
            // window.alert(msg);
            toast.error(msg);
            return;
        }

        const toastId = toast.loading(isEdit ? 'Veritabanı güncelleniyor...' : 'Kaydediliyor...');

        try {
            setLoading(true);

            const cleanNumber = (val) => {
                if (val === null || val === undefined || val === '') return 0;
                const s = val.toString().replace(',', '.').trim();
                const f = parseFloat(s);
                return isNaN(f) ? 0 : f;
            };

            const entryData = {
                product_id: formData.product_id,
                amount: cleanNumber(formData.amount),
                unit_id: formData.unit_id,
                warehouse_id: formData.warehouse_id || null,
                supplier_id: formData.supplier_id || null,
                brand: formData.brand || '',
                invoice_no: formData.invoice_no || '',
                buy_price: cleanNumber(formData.buy_price),
                description: formData.description || '',
            };

            if (isEdit) {
                const { error: updateError } = await supabase
                    .from('stock_entries')
                    .update(entryData)
                    .eq('id', id);

                if (updateError) {
                    // window.alert('Veritabanı Hatası: ' + updateError.message);
                    throw updateError;
                }
            } else {
                const { error: insertError } = await supabase
                    .from('stock_entries')
                    .insert([{
                        ...entryData,
                        business_id: user.business_id,
                        created_by: user.id
                    }]);

                if (insertError) {
                    // window.alert('Veritabanı Hatası (Ekleme): ' + insertError.message);
                    throw insertError;
                }
            }

            toast.success(isEdit ? 'Stok girişi güncellendi' : 'Stok girişi başarıyla kaydedildi', { id: toastId });
            // window.alert('İşlem Başarılı! Listeye yönlendiriliyorsunuz.');

            setTimeout(() => {
                navigate('/isletme/stok-girisi');
            }, 800);
        } catch (error) {
            console.error('Error saving stock entry:', error);
            const errorMsg = error.message || 'Bilinmeyen bir hata oluştu';
            toast.error('Hata: ' + errorMsg, { id: toastId });
            window.alert('HATA OLUŞTU: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = selectedCategory
        ? allProducts.filter(p => p.stock_category_id === selectedCategory)
        : allProducts;

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <Link
                        to="/isletme/stok-girisi"
                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                            {isEdit ? 'Stok Girişini Düzenle' : 'Yeni Stok Girişi Ekle'}
                        </h1>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                            <span>{isEdit ? 'Düzenle' : 'Yeni'}</span>
                            <span>•</span>
                            <span>Pano</span>
                            <span>•</span>
                            <span>Stok</span>
                            <span>•</span>
                            <span>Stok Girişi</span>
                            <span>•</span>
                            <span className="text-blue-600">{isEdit ? 'Düzenle' : 'Yeni'}</span>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 p-10">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Hierarchical Selection Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Kategori Seçiniz
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setFormData({ ...formData, product_id: '', unit_id: '' });
                                    }}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    * Ürün
                                </label>
                                <select
                                    value={formData.product_id}
                                    onChange={(e) => {
                                        const prod = allProducts.find(p => p.id === e.target.value);
                                        setFormData({
                                            ...formData,
                                            product_id: e.target.value,
                                            unit_id: prod?.default_unit_id || ''
                                        });
                                    }}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Seçilmedi</option>
                                    {filteredProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Marka
                                </label>
                                <input
                                    type="text"
                                    placeholder="Marka giriniz"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Depo
                                </label>
                                <select
                                    value={formData.warehouse_id}
                                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Seçilmedi</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Tedarikçi
                                </label>
                                <select
                                    value={formData.supplier_id}
                                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Seçilmedi</option>
                                    {suppliers.map(sup => (
                                        <option key={sup.id} value={sup.id}>{sup.company_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Fatura No
                                </label>
                                <input
                                    type="text"
                                    placeholder="Fatura numarasını giriniz"
                                    value={formData.invoice_no}
                                    onChange={(e) => setFormData({ ...formData, invoice_no: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Measurement Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    * Miktar
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    * Birim
                                </label>
                                <select
                                    value={formData.unit_id}
                                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                >
                                    <option value="">Seçilmedi</option>
                                    {units.map(unit => (
                                        <option key={unit.id} value={unit.id}>{unit.name} ({unit.short_name})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                    Birim Fiyat (Alış)
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    placeholder="0.00"
                                    value={formData.buy_price}
                                    onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                                    className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest px-1">
                                Açıklama
                            </label>
                            <textarea
                                rows="3"
                                placeholder="Opsiyonel açıklama giriniz..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-gray-50 border border-transparent rounded-[20px] px-6 py-4 text-gray-800 font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none"
                            ></textarea>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 pt-8">
                            <Link
                                to="/isletme/stok-girisi"
                                className="px-10 py-5 bg-gray-100 text-gray-500 rounded-[24px] font-black uppercase text-[13px] tracking-widest hover:bg-gray-200 transition-all"
                            >
                                İptal
                            </Link>
                            <button
                                type="submit"
                                onClick={handleSave}
                                disabled={loading}
                                className="flex items-center gap-2 px-10 py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase text-[13px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                {isEdit ? 'GÜNCELLE' : 'Stok Girişi Ekle'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default NewStockEntry;

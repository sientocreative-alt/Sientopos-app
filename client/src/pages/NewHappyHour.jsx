import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const DAYS = [
    { key: 'monday', label: 'Pazartesi' },
    { key: 'tuesday', label: 'Salı' },
    { key: 'wednesday', label: 'Çarşamba' },
    { key: 'thursday', label: 'Perşembe' },
    { key: 'friday', label: 'Cuma' },
    { key: 'saturday', label: 'Cumartesi' },
    { key: 'sunday', label: 'Pazar' }
];

const NewHappyHour = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Data sources
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    // Selection state
    const [selectedCategory, setSelectedCategory] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        start_date: '',
        end_date: '',
        discount_type: 'percentage', // 'percentage' or 'amount'
        discount_amount: 0,
        target_id: '',
        branch_name: 'Merkez',
        days_config: DAYS.reduce((acc, day) => ({
            ...acc,
            [day.key]: { active: false, start: '', end: '' }
        }), {})
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchResources();
        }
    }, [user]);

    const fetchResources = async () => {
        // Fetch Categories
        const { data: cats } = await supabase
            .from('categories')
            .select('*')
            .eq('business_id', user.business_id)
            .order('name', { ascending: true });

        // Fetch Products
        const { data: prods } = await supabase
            .from('products')
            .select('*')
            .eq('business_id', user.business_id)
            .order('name', { ascending: true });

        // Filter for Active Categories (Remove archived ones)
        const activeCats = cats ? cats.filter(c => c.is_deleted !== true) : [];
        setCategories(activeCats);

        // Filter for Active Products (Remove archived ones OR those in archived categories)
        const activeProds = prods ? prods.filter(p => {
            // 1. Product itself must not be deleted
            const isProductActive = p.is_deleted !== true;
            // 2. Product's category must be active (present in activeCats)
            const isCategoryActive = activeCats.some(c => c.id === p.category_id);

            return isProductActive && isCategoryActive;
        }) : [];

        setProducts(activeProds);
    };

    const handleDayChange = (dayKey, field, value) => {
        setFormData(prev => ({
            ...prev,
            days_config: {
                ...prev.days_config,
                [dayKey]: {
                    ...prev.days_config[dayKey],
                    [field]: value
                }
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Prepare payload
            const payload = {
                business_id: user.business_id,
                title: formData.title,
                start_date: formData.start_date,
                end_date: formData.end_date,
                discount_type: formData.discount_type,
                discount_amount: formData.discount_amount,
                target_type: formData.target_id ? 'product' : 'category',
                target_ids: formData.target_id ? [formData.target_id] : (selectedCategory ? [selectedCategory] : []),
                days_config: formData.days_config,
                branch_name: formData.branch_name
            };

            const { error } = await supabase
                .from('happy_hours')
                .insert([payload]);

            if (error) throw error;

            alert('Happy Hour başarıyla oluşturuldu!');
            navigate('/isletme/happy-hour');
        } catch (error) {
            console.error('Error creating happy hour:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter products for the second dropdown based on selected category
    const filteredProducts = products.filter(p =>
        selectedCategory ? p.category_id == selectedCategory : false
    );

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Happy Hour Ekle</h1>
                <div className="text-xs text-gray-400 mt-1">
                    Pano • Mobil Uygulama • Happy Hour • Ekle
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-5xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Başlık</label>
                        <input
                            type="text"
                            required
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Başlama Tarihi</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Bitiş Tarihi</label>
                            <input
                                type="date"
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">İndirim Türü</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white appearance-none"
                                value={formData.discount_type}
                                onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                            >
                                <option value="percentage">Yüzde İndirimi (%)</option>
                                <option value="amount">Tutar İndirimi (₺)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">İndirim Miktarı</label>
                            <input
                                type="number"
                                required
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white"
                                value={formData.discount_amount}
                                onChange={e => setFormData({ ...formData, discount_amount: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Targets - REFACTORED */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Kategori Seçin</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white appearance-none"
                                value={selectedCategory}
                                onChange={e => {
                                    setSelectedCategory(e.target.value);
                                    setFormData({ ...formData, target_id: '' }); // Reset product when category changes
                                }}
                            >
                                <option value="">Bir kategori seçin...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Ürün Seçin</label>
                            <select
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition bg-gray-50/50 focus:bg-white appearance-none"
                                value={formData.target_id}
                                onChange={e => setFormData({ ...formData, target_id: e.target.value })}
                                disabled={!selectedCategory}
                            >
                                <option value="">
                                    {!selectedCategory ? 'Önce Kategori Seçiniz' : 'Bir ürün seçin...'}
                                </option>
                                {filteredProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Schedule Grid */}
                    <div className="pt-4">
                        <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 mb-4 px-2">
                            <div className="col-span-2">Gün</div>
                            <div className="col-span-2 text-center">Aktif</div>
                            <div className="col-span-4">Happy Hour Başlangıç Saati</div>
                            <div className="col-span-4">Happy Hour Bitiş Saati</div>
                        </div>

                        <div className="space-y-3">
                            {DAYS.map((day) => {
                                const dayConfig = formData.days_config[day.key];
                                return (
                                    <div key={day.key} className="grid grid-cols-12 gap-4 items-center p-2 hover:bg-gray-50 rounded-lg transition">
                                        <div className="col-span-2 text-sm font-semibold text-gray-700">
                                            {day.label}
                                        </div>
                                        <div className="col-span-2 flex justify-center">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={dayConfig.active}
                                                    onChange={e => handleDayChange(day.key, 'active', e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="time"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={!dayConfig.active}
                                                value={dayConfig.start}
                                                onChange={e => handleDayChange(day.key, 'start', e.target.value)}
                                                placeholder="Başlangıç Saati"
                                            />
                                        </div>
                                        <div className="col-span-4">
                                            <input
                                                type="time"
                                                className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-gray-600 disabled:bg-gray-100 disabled:text-gray-400"
                                                disabled={!dayConfig.active}
                                                value={dayConfig.end}
                                                onChange={e => handleDayChange(day.key, 'end', e.target.value)}
                                                placeholder="Bitiş Saati"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/isletme/happy-hour')}
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
                        >
                            İptal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50"
                        >
                            {loading ? 'Ekleniyor...' : 'Happy Hour Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewHappyHour;

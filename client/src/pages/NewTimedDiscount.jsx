import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Search, Check, ChevronRight, X, ChevronLeft } from 'lucide-react';

const NewTimedDiscount = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetchingResources, setFetchingResources] = useState(true);

    // Data sources
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        discount_type: 'percentage', // 'percentage' or 'amount'
        discount_amount: 0,
        target_type: 'product', // 'category' or 'product'
        branch_name: 'Merkez'
    });

    useEffect(() => {
        if (user?.business_id) {
            fetchResources();
        }
    }, [user]);

    const fetchResources = async () => {
        setFetchingResources(true);
        try {
            // Fetch Categories
            const { data: cats } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                .order('sort_order', { ascending: true });

            // Fetch Products
            const { data: prods } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', user.business_id)
                .order('sort_order', { ascending: true });

            const activeCats = cats ? cats.filter(c => !c.is_deleted) : [];
            setCategories(activeCats);

            const activeProds = prods ? prods.filter(p => !p.is_deleted) : [];
            setProducts(activeProds);
        } catch (error) {
            console.error('Error fetching resources:', error);
        } finally {
            setFetchingResources(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleCategory = (catId) => {
        const catProducts = products.filter(p => p.category_id === catId).map(p => p.id);
        const allSelected = catProducts.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !catProducts.includes(id)));
        } else {
            setSelectedIds(prev => [...new Set([...prev, ...catProducts])]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedIds.length === 0) {
            alert('Lütfen en az bir ürün veya kategori seçin.');
            return;
        }
        setLoading(true);

        try {
            const payload = {
                business_id: user.business_id,
                title: formData.title,
                start_date: formData.start_date,
                end_date: formData.end_date,
                discount_type: formData.discount_type,
                discount_amount: formData.discount_amount,
                target_type: formData.target_type,
                target_ids: selectedIds,
                branch_name: formData.branch_name,
                is_active: true
            };

            const { error } = await supabase
                .from('timed_discounts')
                .insert([payload]);

            if (error) throw error;

            alert('Süreli indirim başarıyla oluşturuldu!');
            navigate('/isletme/sureli-indirimler');
        } catch (error) {
            console.error('Error creating discount:', error);
            alert('Hata: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter(c =>
        formData.target_type === 'category' ? c.name.toLowerCase().includes(searchTerm.toLowerCase()) : true
    );

    const groupedProducts = categories.map(cat => ({
        ...cat,
        items: products.filter(p => p.category_id === cat.id && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    })).filter(g => g.items.length > 0);

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/isletme/sureli-indirimler')} className="p-2 hover:bg-gray-200 rounded-lg transition text-gray-400">
                    <ChevronLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Yeni Süreli İndirim</h1>
                    <div className="text-xs text-gray-400 mt-1">
                        Pano • Süreli İndirimler • Yeni
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form Side */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">İndirim Bilgileri</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Kampanya Başlığı</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Örn: Hafta Sonu Fırsatı"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Başlangıç</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        value={formData.start_date}
                                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Bitiş</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        value={formData.end_date}
                                        onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Tür</label>
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition bg-white"
                                        value={formData.discount_type}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                    >
                                        <option value="percentage">Yüzde (%)</option>
                                        <option value="amount">Tutar (₺)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Miktar</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                                        value={formData.discount_amount}
                                        onChange={e => setFormData({ ...formData, discount_amount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 ml-1">Hedef Kitle</label>
                                <div className="flex bg-gray-50 p-1 rounded-xl gap-1">
                                    <button
                                        type="button"
                                        onClick={() => { setFormData({ ...formData, target_type: 'product' }); setSelectedIds([]); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.target_type === 'product' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        ÜRÜNLER
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setFormData({ ...formData, target_type: 'category' }); setSelectedIds([]); }}
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${formData.target_type === 'category' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        KATEGORİLER
                                    </button>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex flex-col gap-3">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Seçilen:</span>
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{selectedIds.length} Öğe</span>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading || selectedIds.length === 0}
                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                                >
                                    {loading ? 'Oluşturuluyor...' : 'İNDİRİMİ BAŞLAT'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Selection Side */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full min-h-[600px] overflow-hidden">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-50 bg-white sticky top-0 z-10">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder={formData.target_type === 'product' ? "Ürünlerde ara..." : "Kategorilerde ara..."}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                                />
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
                            {fetchingResources ? (
                                <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">Yükleniyor...</div>
                            ) : formData.target_type === 'category' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {filteredCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => toggleSelection(cat.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedIds.includes(cat.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                                        >
                                            <span className={`text-sm font-bold ${selectedIds.includes(cat.id) ? 'text-blue-700' : 'text-gray-700'}`}>{cat.name}</span>
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${selectedIds.includes(cat.id) ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}>
                                                {selectedIds.includes(cat.id) && <Check size={14} />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {groupedProducts.map(group => (
                                        <div key={group.id} className="space-y-4">
                                            <div className="flex items-center justify-between px-2">
                                                <h3 className="text-xs font-black text-gray-300 uppercase tracking-[0.2em]">{group.name}</h3>
                                                <button
                                                    onClick={() => toggleCategory(group.id)}
                                                    className="text-[10px] font-black text-blue-500 hover:text-blue-600 tracking-tighter uppercase"
                                                >
                                                    {group.items.every(id => selectedIds.includes(id.id)) ? 'TÜMÜNÜ BIRAK' : 'TÜMÜNÜ SEÇ'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {group.items.map(product => (
                                                    <button
                                                        key={product.id}
                                                        onClick={() => toggleSelection(product.id)}
                                                        className={`flex items-center gap-4 p-3 rounded-2xl border transition-all text-left ${selectedIds.includes(product.id) ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm shadow-black/[0.02]'}`}
                                                    >
                                                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                                                            {product.image_url ? (
                                                                <img src={product.image_url} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-300">İMG</div>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold truncate ${selectedIds.includes(product.id) ? 'text-blue-700' : 'text-gray-700'}`}>{product.name}</p>
                                                            <p className="text-[11px] font-bold text-gray-400 mt-0.5">{product.price} ₺</p>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${selectedIds.includes(product.id) ? 'bg-blue-500 text-white scale-110' : 'bg-gray-100'}`}>
                                                            {selectedIds.includes(product.id) && <Check size={14} />}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewTimedDiscount;

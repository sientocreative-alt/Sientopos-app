import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    Plus,
    Search,
    ChevronDown,
    X,
    Check,
    Target,
    Calendar,
    Users,
    Trash2,
    Pencil,
    ArrowRight,
    HelpCircle,
    Building2,
    DollarSign,
    Package,
    Layers,
    CreditCard
} from 'lucide-react';

const Targets = () => {
    const { user } = useAuth();
    const [targets, setTargets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('active'); // active, past, deleted
    const [showModal, setShowModal] = useState(false);
    const [editingTarget, setEditingTarget] = useState(null);

    // Form State
    const [targetType, setTargetType] = useState('product'); // product, category, payment_type
    const [formData, setFormData] = useState({
        target_scope_id: '',
        target_scope_name: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        staff_ids: [],
        steps: [{ min: '', max: '', reward: '', reward_type: 'amount' }] // reward_type: amount or percent
    });

    // Helper Data State
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [staff, setStaff] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);

    useEffect(() => {
        if (user) {
            fetchTargets();
            fetchHelpers();
        }
    }, [user, viewMode]);

    const fetchTargets = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('targets')
                .select('*')
                .eq('business_id', user.business_id);

            if (viewMode === 'active') {
                query = query.eq('is_deleted', false).eq('status', 'active');
            } else if (viewMode === 'past') {
                query = query.eq('is_deleted', false).eq('status', 'completed');
            } else if (viewMode === 'deleted') {
                query = query.eq('is_deleted', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            setTargets(data || []);
        } catch (error) {
            console.error('Error fetching targets:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHelpers = async () => {
        try {
            // Fetch Products with category ID and names
            const { data: prodData } = await supabase
                .from('products')
                .select('id, name, category_id, categories(name)')
                .eq('business_id', user.business_id);
            setProducts(prodData || []);

            // Fetch Categories (Root categories are considered "Bölümler")
            const { data: catData } = await supabase.from('categories').select('id, name, parent_id').eq('business_id', user.business_id);
            setCategories(catData || []);

            // Fetch Staff
            const { data: staffData } = await supabase.from('staff').select('id, first_name, last_name').eq('business_id', user.business_id).eq('is_archived', false);
            setStaff(staffData || []);

            // Payment Methods (Static or from DB)
            const { data: payData } = await supabase.from('payment_methods').select('id, name').eq('business_id', user.business_id);
            setPaymentMethods(payData || []);
        } catch (error) {
            console.error('Error fetching helpers:', error);
        }
    };

    const handleAddStep = () => {
        setFormData({
            ...formData,
            steps: [...formData.steps, { min: '', max: '', reward: '', reward_type: targetType === 'payment_type' ? 'percent' : 'amount' }]
        });
    };

    const handleRemoveStep = (index) => {
        const newSteps = formData.steps.filter((_, i) => i !== index);
        setFormData({ ...formData, steps: newSteps });
    };

    const handleStepChange = (index, field, value) => {
        const newSteps = [...formData.steps];
        newSteps[index][field] = value;
        setFormData({ ...formData, steps: newSteps });
    };

    // Hierarchical Category Options
    const renderCategoryOptions = (parentId = null, depth = 0) => {
        const filtered = categories.filter(c => c.parent_id === parentId);
        return filtered.flatMap(cat => [
            <option key={cat.id} value={cat.id}>
                {depth > 0 ? '— '.repeat(depth) : ''}{cat.name}
            </option>,
            ...renderCategoryOptions(cat.id, depth + 1)
        ]);
    };

    // Grouped Product Options
    const renderProductOptions = () => {
        // Filter out products that don't have a category assigned
        const validProducts = products.filter(p => p.categories?.name);

        const grouped = validProducts.reduce((acc, prod) => {
            const catName = prod.categories.name;
            if (!acc[catName]) acc[catName] = [];
            acc[catName].push(prod);
            return acc;
        }, {});

        return Object.entries(grouped).map(([catName, prods]) => (
            <optgroup key={catName} label={catName}>
                {prods.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.name}
                    </option>
                ))}
            </optgroup>
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                target_type: targetType,
                business_id: user.business_id,
                updated_at: new Date().toISOString()
            };

            // Set visual name based on scope id
            if (targetType === 'product') {
                payload.target_scope_name = products.find(p => p.id === formData.target_scope_id)?.name || '';
            } else if (targetType === 'category') {
                payload.target_scope_name = categories.find(c => c.id === formData.target_scope_id)?.name || '';
            } else if (targetType === 'payment_type') {
                payload.target_scope_name = paymentMethods.find(p => p.id === formData.target_scope_id)?.name || '';
            }

            if (editingTarget) {
                const { error } = await supabase.from('targets').update(payload).eq('id', editingTarget.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('targets').insert([payload]);
                if (error) throw error;
            }

            setShowModal(false);
            setEditingTarget(null);
            fetchTargets();
            alert('Hedef başarıyla kaydedildi.');
        } catch (error) {
            console.error('Submit Error:', error);
            alert('Hata: ' + error.message);
        }
    };

    const handleSoftDelete = async (id) => {
        if (!window.confirm('Bu hedefi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase.from('targets').update({ is_deleted: true }).eq('id', id);
            if (error) throw error;
            fetchTargets();
        } catch (error) {
            alert('Silme hatası: ' + error.message);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Header Area */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-[28px] font-bold text-gray-800 tracking-tight">Hedefler</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                        <span>Pano</span>
                        <span>•</span>
                        <span>Personel Yönetimi</span>
                        <span>•</span>
                        <span className="text-gray-600 font-medium">Hedefler</span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setEditingTarget(null);
                        setFormData({
                            target_scope_id: '',
                            target_scope_name: '',
                            start_date: new Date().toISOString().split('T')[0],
                            end_date: '',
                            staff_ids: [],
                            steps: [{ min: '', max: '', reward: '', reward_type: targetType === 'payment_type' ? 'percent' : 'amount' }]
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-[#E3F2FD] hover:bg-[#BBDEFB] text-[#1976D2] px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                >
                    <Plus size={18} />
                    Hedef Ekle
                </button>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                <div className="flex border-b border-gray-100">
                    {[
                        { id: 'active', label: 'Aktif Hedefler' },
                        { id: 'past', label: 'Geçmiş Hedefler' },
                        { id: 'deleted', label: 'Silinmiş Hedefler' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setViewMode(tab.id)}
                            className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${viewMode === tab.id
                                ? 'text-[#3B82F6] border-[#3B82F6] bg-blue-50/30'
                                : 'text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-8">
                    {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3B82F6]"></div>
                        </div>
                    ) : targets.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="bg-white rounded-3xl border border-gray-100 p-10 flex items-center gap-6 shadow-sm w-full max-w-[400px]">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center">
                                    <Target size={32} className="text-gray-800" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Hedef Ekle</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">Henüz tanımlanmış bir hedef yok.</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {targets.map(target => (
                                <div key={target.id} className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm hover:shadow-md transition-all relative group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl ${target.target_type === 'product' ? 'bg-blue-50 text-blue-600' :
                                            target.target_type === 'category' ? 'bg-purple-50 text-purple-600' :
                                                'bg-orange-50 text-orange-600'
                                            }`}>
                                            {target.target_type === 'product' ? <Package size={28} /> :
                                                target.target_type === 'category' ? <Layers size={28} /> :
                                                    <CreditCard size={28} />}
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setEditingTarget(target);
                                                    setTargetType(target.target_type);
                                                    setFormData({
                                                        target_scope_id: target.target_scope_id,
                                                        start_date: target.start_date,
                                                        end_date: target.end_date || '',
                                                        staff_ids: target.staff_ids || [],
                                                        steps: target.steps
                                                    });
                                                    setShowModal(true);
                                                }}
                                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 rounded-xl"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleSoftDelete(target.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-xl">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="text-[20px] font-bold text-gray-800 mb-1">{target.target_scope_name}</h4>
                                    <p className="text-[11px] text-gray-400 uppercase font-bold tracking-widest mb-6">
                                        {target.target_type === 'product' ? 'Ürün Satış Hedefi' :
                                            target.target_type === 'category' ? 'Bölüm Satış Hedefi' :
                                                'Ödeme Tipi Satış Hedefi'}
                                    </p>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                            <Calendar size={18} className="text-gray-300" />
                                            <span>{new Date(target.start_date).toLocaleDateString('tr-TR')} - {target.end_date ? new Date(target.end_date).toLocaleDateString('tr-TR') : 'Devam Ediyor'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                            <Users size={18} className="text-gray-300" />
                                            <span>{target.staff_ids?.length || 0} Personel</span>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-gray-50">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase mb-3">
                                            <span>İlerleme Şuan</span>
                                            <span>0%</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[0%] transition-all"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
                        <div className="bg-white rounded-[32px] w-full max-w-[1000px] max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                            {/* Modal Header */}
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Hedef Ekle</h2>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8">
                                {/* Target Type Selector */}
                                <div className="flex gap-4 mb-8">
                                    {[
                                        { id: 'product', label: 'Ürün Satış Hedefi', icon: Package },
                                        { id: 'category', label: 'Bölüm Satış Hedefi', icon: Layers },
                                        { id: 'payment_type', label: 'Ödeme Tipi Satış Hedefi', icon: CreditCard }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => {
                                                setTargetType(type.id);
                                                setFormData({
                                                    ...formData,
                                                    steps: formData.steps.map(step => ({ ...step, reward_type: type.id === 'payment_type' ? 'percent' : 'amount' }))
                                                });
                                            }}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-sm transition-all border ${targetType === type.id
                                                ? 'bg-purple-50 border-purple-200 text-purple-600 shadow-sm'
                                                : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <type.icon size={18} />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    {/* Left Side: Basic Info */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 block">
                                                {targetType === 'product' ? 'Hedef Ürün' :
                                                    targetType === 'category' ? 'Hedef Bölüm' :
                                                        'Hedef Ödeme Tipi'}
                                            </label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                                                    value={formData.target_scope_id}
                                                    onChange={e => setFormData({ ...formData, target_scope_id: e.target.value })}
                                                    required
                                                >
                                                    <option value="">
                                                        {targetType === 'product' ? 'Ürün Seçiniz' :
                                                            targetType === 'category' ? 'Bölüm Seçiniz' :
                                                                'Ödeme Tipi Seçiniz'}
                                                    </option>
                                                    {targetType === 'product' && renderProductOptions()}
                                                    {targetType === 'category' && renderCategoryOptions()}
                                                    {targetType === 'payment_type' && paymentMethods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-4 text-gray-400 pointer-events-none" size={16} />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 block">Hedef Tarih Aralığı</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    value={formData.start_date}
                                                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                                    required
                                                />
                                                <input
                                                    type="date"
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                                    placeholder="Bitiş Tarihi"
                                                    value={formData.end_date}
                                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-gray-700 block">Hedef Personel Seçimi</label>
                                            <div className="relative">
                                                <select
                                                    multiple
                                                    className="w-full bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px]"
                                                    value={formData.staff_ids}
                                                    onChange={e => setFormData({ ...formData, staff_ids: Array.from(e.target.selectedOptions, option => option.value) })}
                                                    required
                                                >
                                                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                                </select>
                                                <p className="text-[11px] text-gray-400 font-medium mt-2 leading-relaxed">Çoklu seçim için CTRL / CMD tuşuna basılı tutarak seçin.</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Dynamic Steps */}
                                    <div className="space-y-6">
                                        <h3 className="text-sm font-bold text-gray-700">Hedef Adımları</h3>
                                        <div className="space-y-6">
                                            {formData.steps.map((step, index) => (
                                                <div key={index} className="bg-white rounded-3xl p-8 border border-gray-100 relative group/step shadow-sm">
                                                    <div className="grid grid-cols-3 gap-6">
                                                        <div>
                                                            <label className="text-[11px] font-bold text-gray-700 uppercase mb-3 block">Minimum Satış</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                                    value={step.min}
                                                                    onChange={e => handleStepChange(index, 'min', e.target.value)}
                                                                    required
                                                                />
                                                                <span className="absolute right-4 top-[17px] text-[11px] font-bold text-gray-400">{targetType === 'payment_type' ? 'TL' : 'Adet'}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold text-gray-700 uppercase mb-3 block">Maksimum Satış</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                                    value={step.max}
                                                                    onChange={e => handleStepChange(index, 'max', e.target.value)}
                                                                    required
                                                                />
                                                                <span className="absolute right-4 top-[17px] text-[11px] font-bold text-gray-400">{targetType === 'payment_type' ? 'TL' : 'Adet'}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[11px] font-bold text-gray-700 uppercase mb-3 block flex items-center gap-1.5">
                                                                {targetType === 'payment_type' ? 'Prim Oranı' : 'Prim Tutarı'}
                                                                <HelpCircle size={14} className="text-gray-300" />
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="number"
                                                                    className="w-full bg-gray-50 border border-gray-100 text-gray-700 text-sm rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                                                                    value={step.reward}
                                                                    onChange={e => handleStepChange(index, 'reward', e.target.value)}
                                                                    required
                                                                />
                                                                <span className="absolute right-4 top-[17px] text-[11px] font-bold text-gray-400">{targetType === 'payment_type' ? '%' : 'TL'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveStep(index)}
                                                        className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all text-[11px] font-bold"
                                                    >
                                                        <X size={14} />
                                                        Sil
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddStep}
                                            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-50/50 hover:bg-blue-50 text-[#3B82F6] rounded-2xl font-bold text-sm transition-all border border-blue-100/50 border-dashed"
                                        >
                                            <Plus size={18} />
                                            Yeni Hedef Adımı Ekle
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="mt-12 pt-8 border-t border-gray-100 flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-8 py-3 bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold rounded-xl transition-all"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-8 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                    >
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                    , document.body)}
            </div>
        </div>
    );
};

export default Targets;

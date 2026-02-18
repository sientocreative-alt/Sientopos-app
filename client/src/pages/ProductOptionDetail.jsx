import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, ArrowLeft, Trash2, X } from 'lucide-react';

const ProductOptionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [group, setGroup] = useState(null);
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Recipe Modal State
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState(null);
    const [products, setProducts] = useState([]); // Stock products to choose from
    const [recipeForm, setRecipeForm] = useState({
        product_id: '',
        amount: 1,
        unit: 'Adet',
        applyToAll: false
    });

    const UNIT_OPTIONS = ['Adet', 'Kg', 'Lt', 'Gram', 'Ml', 'Porsiyon'];

    useEffect(() => {
        if (user && id) {
            fetchGroupDetails();
            fetchStockProducts();
        }
    }, [user, id]);

    const fetchStockProducts = async () => {
        const { data } = await supabase
            .from('products')
            .select('id, name')
            .eq('business_id', user.business_id)
            .eq('is_deleted', false);
        setProducts(data || []);
    };

    const fetchGroupDetails = async () => {
        try {
            setLoading(true);
            const { data: groupData, error: groupError } = await supabase
                .from('modifier_groups')
                .select('*')
                .eq('id', id)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            const { data: optionsData, error: optionsError } = await supabase
                .from('modifier_options')
                .select(`
                    *,
                    modifier_recipes (
                        id,
                        amount,
                        unit,
                        products (
                            id,
                            name
                        )
                    )
                `)
                .eq('group_id', id)
                .eq('is_deleted', false)
                .order('order_number', { ascending: true });

            if (optionsError) throw optionsError;
            setOptions(optionsData || []);

        } catch (error) {
            console.error('Error fetching details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenRecipeModal = (optionId) => {
        setSelectedOptionId(optionId);
        setRecipeForm({ product_id: '', amount: 1, unit: 'Adet', applyToAll: false });
        setIsRecipeModalOpen(true);
    };

    const handleAddRecipeItem = async () => {
        if (!recipeForm.product_id) {
            alert('Lütfen bir ürün seçiniz.');
            return;
        }

        try {
            let optionsToUpdate = [selectedOptionId];

            // If Apply to All is selected, collect all option IDs
            if (recipeForm.applyToAll) {
                optionsToUpdate = options.map(opt => opt.id);
            }

            const inserts = optionsToUpdate.map(optId => ({
                business_id: user.business_id,
                option_id: optId,
                product_id: recipeForm.product_id,
                amount: parseFloat(recipeForm.amount),
                unit: recipeForm.unit
            }));

            const { error } = await supabase
                .from('modifier_recipes')
                .insert(inserts);

            if (error) throw error;

            setIsRecipeModalOpen(false);
            fetchGroupDetails();
        } catch (error) {
            alert('Error adding recipe: ' + error.message);
        }
    };

    const handleDeleteRecipeItem = async (recipeId) => {
        if (!confirm('Reçete ürününü silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('modifier_recipes')
                .delete()
                .eq('id', recipeId);
            if (error) throw error;
            fetchGroupDetails();
        } catch (error) {
            console.error('Error deleting recipe:', error);
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;
    if (!group) return <div className="p-6">Grup bulunamadı.</div>;

    return (
        <div className="p-6 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/isletme/urun-opsiyonlari')}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span className="font-bold text-gray-800 text-lg mr-2">{group.name}</span>
                        <span>Pano</span>
                        <span>•</span>
                        <span>POS Ayarları</span>
                        <span>•</span>
                        <span>Zorunlu Seçim Grupları</span>
                        <span>•</span>
                        <span>{group.name}</span>
                    </div>
                </div>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {options.map(option => (
                    <div key={option.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800">{option.name} Reçetesi</h3>
                            <button
                                onClick={() => handleOpenRecipeModal(option.id)}
                                className="bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-lg transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="p-4">
                            {option.modifier_recipes && option.modifier_recipes.length > 0 ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs font-semibold text-gray-500 border-b border-gray-50 pb-2">
                                        <span>Ürün</span>
                                        <span>Miktar</span>
                                    </div>
                                    {option.modifier_recipes.map(recipe => (
                                        <div key={recipe.id} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-700">{recipe.products?.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-600 font-medium">
                                                    {recipe.amount} {recipe.unit}
                                                </span>
                                                <button
                                                    onClick={() => handleDeleteRecipeItem(recipe.id)}
                                                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 text-sm">
                                    Henüz reçete eklenmemiş.
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Recipe Modal */}
            {isRecipeModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[1060] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg shadow-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center gap-2 text-primary font-bold">
                                <span>Reçete Ürünü Ekle</span>
                            </div>
                            <button
                                onClick={() => setIsRecipeModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">

                            {/* Stock Product */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                    <span className="text-gray-400">..</span> Stoklu Ürün
                                </label>
                                <select
                                    className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                    value={recipeForm.product_id}
                                    onChange={e => setRecipeForm({ ...recipeForm, product_id: e.target.value })}
                                >
                                    <option value="">Seçilmedi</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-4">
                                {/* Amount */}
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Stoktan Düşülecek Miktar</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        value={recipeForm.amount}
                                        onChange={e => setRecipeForm({ ...recipeForm, amount: e.target.value })}
                                    />
                                </div>

                                {/* Unit */}
                                <div className="flex-1">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <span className="text-gray-400">..</span> Birim
                                    </label>
                                    <select
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                                        value={recipeForm.unit}
                                        onChange={e => setRecipeForm({ ...recipeForm, unit: e.target.value })}
                                    >
                                        <option value="">Seçilmedi</option>
                                        {UNIT_OPTIONS.map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Apply to All Toggle */}
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm font-semibold text-gray-700">Tüm Opsiyonlara Uygula</span>
                                <button
                                    onClick={() => setRecipeForm({ ...recipeForm, applyToAll: !recipeForm.applyToAll })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${recipeForm.applyToAll ? 'bg-blue-500' : 'bg-gray-200'}`}
                                >
                                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${recipeForm.applyToAll ? 'translate-x-6' : ''}`} />
                                </button>
                            </div>

                        </div>
                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-white">
                            <button
                                onClick={() => setIsRecipeModalOpen(false)}
                                className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleAddRecipeItem}
                                className="px-6 py-2.5 bg-teal-500 text-white rounded-lg font-bold hover:bg-teal-600 transition-colors"
                            >
                                Reçete Ürünü Ekle
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductOptionDetail;

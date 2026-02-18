import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, Plus, X, Trash2, Edit2, ShoppingBag, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ProductDetail = () => {
    const { catId, productId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [product, setProduct] = useState(null);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [modifierRecipes, setModifierRecipes] = useState([]);
    const [isAddOptionModalOpen, setIsAddOptionModalOpen] = useState(false);

    // Ingredients State
    const [ingredients, setIngredients] = useState([]);
    const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
    const [stockCategories, setStockCategories] = useState([]);
    const [allStockProducts, setAllStockProducts] = useState([]);
    const [units, setUnits] = useState([]);

    // Ingredient Modal Form State
    const [selectedIngredientCategory, setSelectedIngredientCategory] = useState('');
    const [newIngredient, setNewIngredient] = useState({
        ingredient_id: '',
        amount: '',
        unit_id: ''
    });

    // Form state for adding/editing a variation (modifier recipe)
    const [recipeForm, setRecipeForm] = useState({
        name: '',
        price_extra: 0,
        is_default: false
    });
    const [editingRecipe, setEditingRecipe] = useState(null);

    useEffect(() => {
        if (user) {
            fetchData();
            fetchIngredients();
        }
    }, [user, productId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Product
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            if (prodError) throw prodError;
            setProduct(prodData);

            // 2. Fetch Category
            const { data: catData, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('id', catId)
                .single();
            if (catError) throw catError;
            setCategory(catData);

            // 3. Fetch Recipes (Linked variations)
            const { data: recipes, error: recError } = await supabase
                .from('modifier_recipes')
                .select(`
                    *,
                    modifier_options (
                        id,
                        name,
                        price,
                        modifier_groups (
                            name
                        )
                    )
                `)
                .eq('product_id', productId);
            if (recError) throw recError;
            setModifierRecipes(recipes || []);

        } catch (error) {
            console.error('Error fetching product data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchIngredients = async () => {
        try {
            const { data, error } = await supabase
                .from('product_recipes')
                .select(`
                    *,
                    ingredient:ingredient_id(name),
                    unit:unit_id(short_name)
                `)
                .eq('product_id', productId)
                .is('is_deleted', false);

            if (error) throw error;
            setIngredients(data || []);
        } catch (error) {
            console.error('Error fetching ingredients:', error);
        }
    };

    const fetchIngredientDependencies = async () => {
        try {
            // Fetch Stock Categories
            const { data: catData, error: catError } = await supabase
                .from('stock_categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('name');
            if (catError) throw catError;
            setStockCategories(catData || []);

            // Fetch All Products (for ingredients)
            const { data: prodData, error: prodError } = await supabase
                .from('products')
                .select('id, name, stock_category_id, default_unit_id')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .neq('id', productId)
                .order('name');
            if (prodError) throw prodError;
            setAllStockProducts(prodData || []);

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
            console.error('Error fetching ingredient dependencies:', error);
        }
    };

    useEffect(() => {
        if (showAddIngredientModal) {
            fetchIngredientDependencies();
        }
    }, [showAddIngredientModal]);

    const handleAddIngredient = async () => {
        console.log('--- ADD INGREDIENT DEBUG ---');
        console.log('newIngredient state:', newIngredient);
        console.log('business_id:', user?.business_id);
        console.log('product_id (from URL):', productId);

        if (!newIngredient.ingredient_id) {
            alert('Lütfen bir stok ürünü seçiniz.');
            return;
        }
        if (newIngredient.amount === '' || newIngredient.amount === null) {
            alert('Lütfen miktar giriniz.');
            return;
        }
        if (!newIngredient.unit_id) {
            alert('Lütfen birim seçiniz.');
            return;
        }

        try {
            const payload = {
                business_id: user.business_id,
                product_id: productId,
                ingredient_id: newIngredient.ingredient_id,
                amount: Number(newIngredient.amount),
                unit_id: newIngredient.unit_id
            };
            console.log('Payload being sent:', payload);

            const { data, error } = await supabase
                .from('product_recipes')
                .insert([payload])
                .select();

            if (error) {
                console.error('Supabase Error:', error);
                throw error;
            }

            console.log('Successfully added:', data);
            toast.success('Ham madde eklendi');
            setShowAddIngredientModal(false);
            setNewIngredient({ ingredient_id: '', amount: '', unit_id: '' });
            setSelectedIngredientCategory('');
            fetchIngredients();
        } catch (error) {
            console.error('FULL CATCH ERROR:', error);
            alert('EKLEME BAŞARISIZ:\n' + (error.message || error.details || JSON.stringify(error)));
        }
    };

    const handleDeleteIngredient = async (id) => {
        if (!confirm('Bu ham maddeyi silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('product_recipes')
                .update({ is_deleted: true })
                .eq('id', id);
            if (error) throw error;
            toast.success('Ham madde silindi');
            fetchIngredients();
        } catch (error) {
            console.error('Error deleting ingredient:', error);
            toast.error('Silme başarısız');
        }
    };

    const handleAddRecipe = async (e) => {
        e.preventDefault();
        try {
            let { data: group } = await supabase
                .from('modifier_groups')
                .select('id')
                .eq('business_id', user.business_id)
                .eq('name', 'Ürün Seçenekleri')
                .eq('is_deleted', false)
                .maybeSingle();

            if (!group) {
                const { data: newGroup, error: groupError } = await supabase
                    .from('modifier_groups')
                    .insert([{
                        business_id: user.business_id,
                        name: 'Ürün Seçenekleri',
                        selection_type: 'single'
                    }])
                    .select()
                    .single();
                if (groupError) throw groupError;
                group = newGroup;
            }

            const { data: option, error: optError } = await supabase
                .from('modifier_options')
                .insert([{
                    business_id: user.business_id,
                    group_id: group.id,
                    name: recipeForm.name,
                    price: parseFloat(recipeForm.price_extra) || 0,
                    is_default: recipeForm.is_default
                }])
                .select()
                .single();
            if (optError) throw optError;

            const { error: recError } = await supabase
                .from('modifier_recipes')
                .insert([{
                    business_id: user.business_id,
                    product_id: productId,
                    option_id: option.id,
                    amount: 1,
                    unit: 'Adet'
                }]);

            if (recError) throw recError;

            setIsAddOptionModalOpen(false);
            setRecipeForm({ name: '', price_extra: 0, is_default: false });
            fetchData();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleEditClick = (recipe) => {
        setEditingRecipe(recipe);
        setRecipeForm({
            name: recipe.modifier_options?.name || '',
            price_extra: recipe.modifier_options?.price || 0,
            is_default: recipe.modifier_options?.is_default || false
        });
        setIsAddOptionModalOpen(true);
    };

    const handleUpdateRecipe = async (e) => {
        e.preventDefault();
        try {
            const { error: optError } = await supabase
                .from('modifier_options')
                .update({
                    name: recipeForm.name,
                    price: parseFloat(recipeForm.price_extra) || 0,
                    is_default: recipeForm.is_default
                })
                .eq('id', editingRecipe.modifier_options.id);

            if (optError) throw optError;

            setIsAddOptionModalOpen(false);
            setRecipeForm({ name: '', price_extra: 0, is_default: false });
            setEditingRecipe(null);
            fetchData();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const handleDeleteRecipe = async (id) => {
        if (!confirm('Bu seçeneği silmek istediğinize emin misiniz?')) return;
        try {
            const { error } = await supabase
                .from('modifier_recipes')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Hata: ' + error.message);
        }
    };

    const filteredStockProducts = selectedIngredientCategory
        ? allStockProducts.filter(p => p.stock_category_id === selectedIngredientCategory)
        : allStockProducts;

    if (loading) return <div className="p-10 flex justify-center items-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>;

    if (!product) return <div className="p-10 text-center font-bold text-gray-400">Ürün bulunamadı.</div>;

    return (
        <div className="p-8 min-h-screen bg-[#F8FAFC]">
            {/* Header / Breadcrumbs */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight">{product.name}</h1>
                    <div className="flex items-center gap-2 text-[11px] font-black text-gray-400 mt-1 uppercase">
                        <Link to="/isletme" className="hover:text-blue-600 transition-colors">Pano</Link>
                        <span>•</span>
                        <Link to="/isletme/menü-yonetimi" className="hover:text-blue-600 transition-colors">Menü Yönetimi</Link>
                        <span>•</span>
                        <Link to={`/isletme/kategoriler/${catId}`} className="hover:text-blue-600 transition-colors">{category?.name}</Link>
                        <span>•</span>
                        <span className="text-gray-500">{product.name}</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button className="bg-white border border-gray-200 text-gray-600 px-8 py-3 rounded-2xl text-sm font-black hover:bg-gray-50 transition-all shadow-sm">
                        Ürün Düzenle
                    </button>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Panel 1: Info (Price/Cost) */}
                <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                    <h2 className="text-sm font-black text-gray-800 mb-10 uppercase tracking-wide">{product.name}</h2>

                    <div className="w-full space-y-4">
                        <div className="flex justify-between items-center bg-gray-50/50 p-6 rounded-[24px] border border-gray-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                                    <ShoppingBag size={24} />
                                </div>
                                <span className="font-bold text-gray-700 text-sm">Satış Fiyatı</span>
                            </div>
                            <span className="text-base font-black text-indigo-600 bg-indigo-50 px-5 py-2 rounded-2xl">
                                {parseFloat(product.price).toFixed(2).replace('.', ',')} ₺
                            </span>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50/50 p-6 rounded-[24px] border border-gray-100/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                                    <Trash2 size={24} />
                                </div>
                                <span className="font-bold text-gray-700 text-sm">Maliyet</span>
                            </div>
                            <span className="text-base font-black text-red-600 bg-red-50 px-5 py-2 rounded-2xl">
                                0,00 ₺
                            </span>
                        </div>
                    </div>
                </div>

                {/* Panel 2: Ham Maddeler */}
                <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Ham Maddeler</h2>
                            <p className="text-[11px] font-bold text-gray-400 mt-1">(Satışta stoktan düşecek ürünler)</p>
                        </div>
                        <button
                            onClick={() => setShowAddIngredientModal(true)}
                            className="w-14 h-14 bg-[#14B8A6] text-white rounded-2xl flex items-center justify-center hover:bg-[#0D9488] transition-all shadow-lg shadow-teal-100"
                        >
                            <Plus size={28} />
                        </button>
                    </div>

                    <div className="border-t border-gray-50 pt-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 font-black uppercase text-[11px] border-b border-gray-100">
                                    <th className="text-left pb-6">Ürün</th>
                                    <th className="text-center pb-6">Miktar</th>
                                    <th className="text-right pb-6"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ingredients.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="py-20 text-center text-gray-300 font-black tracking-tight uppercase text-xs">Herhangi bir ham madde eklenmemiş</td>
                                    </tr>
                                ) : (
                                    ingredients.map(ing => (
                                        <tr key={ing.id} className="group border-b border-gray-50 last:border-0">
                                            <td className="py-5 font-black text-gray-800 uppercase">{ing.ingredient?.name}</td>
                                            <td className="py-5 text-center font-black text-gray-600">
                                                {Number(ing.amount)} {ing.unit?.short_name}
                                            </td>
                                            <td className="py-5 text-right">
                                                <button
                                                    onClick={() => handleDeleteIngredient(ing.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel 3: Opsiyonlar */}
                <div className="bg-white rounded-[32px] p-10 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h2 className="text-sm font-black text-gray-800 uppercase tracking-wide">Opsiyonlar</h2>
                            <p className="text-[11px] font-bold text-gray-400 mt-1">Ürün Opsiyonları</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingRecipe(null);
                                setRecipeForm({ name: '', price_extra: 0, is_default: false });
                                setIsAddOptionModalOpen(true);
                            }}
                            className="w-14 h-14 bg-[#14B8A6] text-white rounded-2xl flex items-center justify-center hover:bg-[#0D9488] transition-all shadow-lg shadow-teal-100"
                        >
                            <Plus size={28} />
                        </button>
                    </div>

                    <div className="border-t border-gray-50 pt-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 font-black uppercase text-[11px] border-b border-gray-100">
                                    <th className="text-left pb-6">Malzeme</th>
                                    <th className="text-center pb-6">Stok Miktarı</th>
                                    <th className="text-right pb-6">Ek fiyat</th>
                                    <th className="text-right pb-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {modifierRecipes.map((recipe) => (
                                    <tr key={recipe.id} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-5">
                                            <div className="font-black text-gray-800 text-[14px] uppercase">{recipe.modifier_options?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{recipe.modifier_options?.modifier_groups?.name}</div>
                                        </td>
                                        <td className="py-5 text-center font-black text-gray-600">0,0</td>
                                        <td className="py-5 text-right font-black text-teal-600 text-[15px]">
                                            +{parseFloat(recipe.modifier_options?.price || 0).toFixed(2).replace('.', ',')} ₺
                                        </td>
                                        <td className="py-5 text-right">
                                            <div className="flex items-center gap-2 justify-end">
                                                <button
                                                    onClick={() => handleEditClick(recipe)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {modifierRecipes.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="py-20 text-center text-gray-300 font-black tracking-tight uppercase text-xs">Herhangi bir opsiyon eklenmemiş</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Variaton Modal */}
            {isAddOptionModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">
                                {editingRecipe ? 'Ürün İçeriği Düzenle' : 'Ürün İçeriği Ekle'}
                            </h3>
                            <button
                                onClick={() => setIsAddOptionModalOpen(false)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all border border-transparent hover:border-red-100"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={editingRecipe ? handleUpdateRecipe : handleAddRecipe} className="p-12">
                            <div className="mb-10">
                                <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Malzeme</label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Varyasyon Giriniz"
                                        value={recipeForm.name}
                                        onChange={(e) => setRecipeForm({ ...recipeForm, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all appearance-none"
                                    />
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                                        <Plus size={20} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-10 mb-10">
                                <div>
                                    <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Ek fiyat</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={recipeForm.price_extra}
                                            onChange={(e) => setRecipeForm({ ...recipeForm, price_extra: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all"
                                        />
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 font-black text-gray-300">₺</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pt-8">
                                    <button
                                        type="button"
                                        onClick={() => setRecipeForm(prev => ({ ...prev, is_default: !prev.is_default }))}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border-2 ${recipeForm.is_default ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-200 text-transparent'}`}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <label className="text-[14px] font-black text-gray-700 uppercase tracking-tight cursor-pointer" onClick={() => setRecipeForm(prev => ({ ...prev, is_default: !prev.is_default }))}>
                                        Varsayılan
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddOptionModalOpen(false);
                                        setEditingRecipe(null);
                                        setRecipeForm({ name: '', price_extra: 0, is_default: false });
                                    }}
                                    className="px-12 py-5 bg-red-500 text-white rounded-[20px] font-black uppercase tracking-widest text-[13px] hover:bg-red-600 transition-all shadow-xl shadow-red-100"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    className="px-12 py-5 bg-[#14B8A6] text-white rounded-[20px] font-black uppercase tracking-widest text-[13px] hover:bg-[#0D9488] transition-all shadow-xl shadow-teal-100"
                                >
                                    {editingRecipe ? 'Güncelle' : 'Kaydet'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Ingredient Modal */}
            {showAddIngredientModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-10 py-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Ham Madde Ekle</h3>
                            <button
                                onClick={() => setShowAddIngredientModal(false)}
                                className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all border border-transparent hover:border-red-100"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-12 space-y-10">
                            {/* Category Selection */}
                            <div>
                                <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Kategori (Filtrele)</label>
                                <select
                                    value={selectedIngredientCategory}
                                    onChange={(e) => {
                                        setSelectedIngredientCategory(e.target.value);
                                        setNewIngredient({ ...newIngredient, ingredient_id: '' });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Tüm Kategoriler</option>
                                    {stockCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Product Selection */}
                            <div>
                                <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Stoklu Ürün</label>
                                <select
                                    value={newIngredient.ingredient_id}
                                    onChange={(e) => {
                                        const selected = allStockProducts.find(p => p.id === e.target.value);
                                        setNewIngredient({
                                            ...newIngredient,
                                            ingredient_id: e.target.value,
                                            unit_id: selected?.default_unit_id || ''
                                        });
                                    }}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">Ürün Seçiniz</option>
                                    {filteredStockProducts.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-10">
                                {/* Amount */}
                                <div>
                                    <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Miktar</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        value={newIngredient.amount}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, amount: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all"
                                    />
                                </div>
                                {/* Unit */}
                                <div>
                                    <label className="block text-[13px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Birim</label>
                                    <select
                                        value={newIngredient.unit_id}
                                        onChange={(e) => setNewIngredient({ ...newIngredient, unit_id: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-[20px] px-8 py-5 text-gray-800 font-black focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Seçiniz</option>
                                        {units.map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-12">
                                <button
                                    type="button"
                                    onClick={() => setShowAddIngredientModal(false)}
                                    className="px-12 py-5 bg-red-500 text-white rounded-[20px] font-black uppercase tracking-widest text-[13px] hover:bg-red-600 transition-all shadow-xl shadow-red-100"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleAddIngredient}
                                    className="px-12 py-5 bg-[#14B8A6] text-white rounded-[20px] font-black uppercase tracking-widest text-[13px] hover:bg-[#0D9488] transition-all shadow-xl shadow-teal-100"
                                >
                                    Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;

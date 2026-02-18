import { useState, useEffect } from 'react';
import { Plus, ChevronDown, Settings, Eye, Trash2, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import EditMenuModal from '../components/modals/EditMenuModal';
import QRCode from 'qrcode';

const QRMenu = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [menus, setMenus] = useState([]);
    const [stats, setStats] = useState({ products: 0, categories: 0 });
    const [loading, setLoading] = useState(true);
    const [editingMenu, setEditingMenu] = useState(null);

    const openEditModal = (menu) => setEditingMenu(menu);
    const closeEditModal = () => setEditingMenu(null);

    const downloadQR = async (menu) => {
        try {
            const targetUrl = `https://sientopos.com/qr/home/${menu.id}`;
            const canvas = document.createElement('canvas');
            await QRCode.toCanvas(canvas, targetUrl, {
                width: 1024,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });

            const pngUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${menu.name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        } catch (err) {
            console.error('QR code generation failed:', err);
            alert('QR kod oluşturulurken bir hata oluştu.');
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch counts
        const productsReq = supabase
            .from('products')
            .select('id', { count: 'exact' })
            .eq('business_id', user.business_id)
            .eq('is_deleted', false);

        const categoriesReq = supabase
            .from('categories')
            .select('id', { count: 'exact' })
            .eq('business_id', user.business_id)
            .eq('is_deleted', false);

        const menusReq = supabase
            .from('qr_menus')
            .select('*')
            .eq('business_id', user.business_id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false });

        const [prodRes, catRes, menusRes] = await Promise.all([productsReq, categoriesReq, menusReq]);

        setStats({
            products: prodRes.count || 0,
            categories: catRes.count || 0
        });

        // If no menus exist, create a default one locally or prompt? 
        // User said "prepare with my real ones", likely wants to see one created if none.
        // I'll auto-create a "Genel Menü" if list is empty to be helpful, or just show empty state and let them add.
        // The screenshot implies "Yeni Menü" exists. I'll stick to showing what's in DB, but if empty, I might create one default.
        // Let's just setMenus first.
        if (menusRes.data && menusRes.data.length === 0) {
            // Option: Auto-create a default menu
            await createDefaultMenu();
        } else {
            setMenus(menusRes.data || []);
        }

        setLoading(false);
    };

    const createDefaultMenu = async () => {
        const { data, error } = await supabase
            .from('qr_menus')
            .insert([{
                business_id: user.business_id,
                name: 'Yeni Menü',
                is_active: true
            }])
            .select();

        if (data) setMenus(data);
    };

    const toggleStatus = async (id, currentStatus) => {
        const { error } = await supabase
            .from('qr_menus')
            .update({ is_active: !currentStatus })
            .eq('id', id);

        if (!error) {
            setMenus(menus.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
        }
    };

    const deleteMenu = async (id) => {
        if (!confirm('Bu menüyü silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('qr_menus')
            .update({ is_deleted: true })
            .eq('id', id);

        if (!error) {
            setMenus(menus.filter(m => m.id !== id));
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">QR Menü Yönetimi</h1>
                    <div className="text-xs text-blue-500 mt-1">Pano • QR Menü Yönetimi</div>
                </div>
                <div className="flex gap-3">
                    {/* Header Buttons if needed */}
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[500px]">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="font-semibold text-lg">Menüler</h2>
                    <div className="flex items-center gap-3">
                        {menus.length > 0 && (
                            <button
                                onClick={() => downloadQR(menus.find(m => m.is_active) || menus[0])}
                                className="bg-blue-500 text-white p-2.5 rounded-xl hover:bg-blue-600 transition-all active:scale-95 shadow-sm"
                                title="QR Kod İndir"
                            >
                                <Download size={20} />
                            </button>
                        )}
                        <button onClick={createDefaultMenu} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 transition-colors">
                            <Plus size={16} /> Yeni Menü Ekle
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {menus.map(menu => (
                        <div key={menu.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-lg text-gray-800">{menu.name}</h3>
                                    {menu.is_active && (
                                        <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded font-medium">Aktif</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Actions */}
                                    <button onClick={() => navigate(`/isletme/qr/menu/${menu.id}`)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 rounded-lg">
                                        <ChevronDown size={18} />
                                    </button>
                                    <button
                                        onClick={() => openEditModal(menu)}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-lg"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <button
                                        onClick={() => window.open(`/qr/home/${menu.id}`, '_blank')}
                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 rounded-lg"
                                        title="Menüyü Göster"
                                    >
                                        <Eye size={18} />
                                    </button>
                                    <button
                                        onClick={() => downloadQR(menu)}
                                        className="p-2 text-gray-400 hover:text-blue-500 transition-colors bg-gray-50 rounded-lg"
                                        title="QR Kod İndir"
                                    >
                                        <Download size={18} />
                                    </button>
                                    <button onClick={() => deleteMenu(menu.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-lg">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        {/* Using a simple list icon substitute */}
                                        <span className="w-4 h-4 flex items-center justify-center">📄</span>
                                        <span className="font-medium">{stats.products} Aktif Ürün</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                                        <span className="w-4 h-4 flex items-center justify-center">☰</span>
                                        <span className="font-medium">{stats.categories} Aktif Kategori</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs mt-2">
                                        <span className="w-4 h-4 flex items-center justify-center">🕒</span>
                                        <span>Son Güncellenme {new Date(menu.updated_at).toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>

                                {/* Toggle Switch */}
                                <div className="relative inline-flex items-center cursor-pointer" onClick={() => toggleStatus(menu.id, menu.is_active)}>
                                    <div className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${menu.is_active ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                    <div className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out transform ${menu.is_active ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {menus.length === 0 && !loading && (
                        <div className="text-center py-12 text-gray-500">
                            Henüz menü oluşturulmamış. Yeni bir menü ekleyin.
                        </div>
                    )}
                </div>
            </div>
            {editingMenu && (
                <EditMenuModal
                    menu={editingMenu}
                    onClose={closeEditModal}
                    onUpdate={fetchData}
                />
            )}
        </div>
    );
};

export default QRMenu;

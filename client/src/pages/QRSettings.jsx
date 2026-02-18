import { useState, useEffect } from 'react';
import { Plus, X, Upload, Copy, Save, Search, Download } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const QRSettings = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('location'); // location, social, tables
    const [loading, setLoading] = useState(false);
    const [settingsId, setSettingsId] = useState(null);

    // Settings State
    const [formData, setFormData] = useState({
        place_name: '', slug: '', is_ordering_enabled: false, show_optional_products: false,
        is_name_required: false, use_location: false, allow_waiter_call: false,
        address: '', latitude: '', longitude: '', ordering_distance: '',
        wifi_name: '', wifi_password: '',
        city: '', country: '', district: '', neighborhood: '', zip_code: '',
        website: '', tax_office: '', tax_number: '', timezone: '', google_place_id: '',
        social_instagram: '', social_twitter: '', social_youtube: '',
        social_facebook: '', social_tiktok: '', social_google: ''
    });

    // Tables State
    const [tables, setTables] = useState([]);
    const [areas, setAreas] = useState([]);
    const [isTableModalOpen, setIsTableModalOpen] = useState(false);

    // New Table Modal State
    const [tableNamingType, setTableNamingType] = useState('auto'); // auto, custom
    const [tablePrefix, setTablePrefix] = useState('Masa');
    const [tableCount, setTableCount] = useState(5);
    const [tableStart, setTableStart] = useState(1);

    useEffect(() => {
        if (user) {
            fetchSettings();
        }
    }, [user]);

    useEffect(() => {
        if (user && activeTab === 'tables') {
            fetchTables();
        }
    }, [user, activeTab]);

    const fetchSettings = async () => {
        setLoading(true);

        // 1. Fetch QR Settings
        const { data: qrData, error } = await supabase
            .from('qr_settings')
            .select('*')
            .eq('business_id', user.business_id)
            .single();

        // 2. Fetch Business Settings (pos_settings) for defaults
        const { data: posData } = await supabase
            .from('pos_settings')
            .select('business_display_name, city, district, country')
            .eq('business_id', user.business_id)
            .maybeSingle();

        if (qrData) {
            // If QR settings exist, use them, but fill empty fields from POS settings
            setFormData({
                ...qrData,
                place_name: qrData.place_name || posData?.business_display_name || '',
                city: qrData.city || posData?.city || '',
                district: qrData.district || posData?.district || '',
                country: qrData.country || posData?.country || 'Türkiye', // Default to Turkey if both empty
            });
            setSettingsId(qrData.id);
        } else if (!qrData && !error) {
            // If no QR settings yet, initialize with POS settings
            if (posData) {
                setFormData(prev => ({
                    ...prev,
                    place_name: posData.business_display_name || '',
                    city: posData.city || '',
                    district: posData.district || '',
                    country: posData.country || 'Türkiye'
                }));
            }
        }
        setLoading(false);
    };

    const fetchTables = async () => {
        // Fetch Areas
        const { data: areasData } = await supabase
            .from('seating_areas')
            .select('*')
            .eq('business_id', user.business_id)
            .is('is_deleted', false)
            .order('sort_order', { ascending: true });
        setAreas(areasData || []);

        // Fetch Tables
        const { data: tablesData } = await supabase
            .from('tables')
            .select('*')
            .eq('business_id', user.business_id)
            .is('is_deleted', false) // Filter deleted tables
            .order('name', { ascending: true });
        setTables(tablesData || []);
    };

    const handleSaveSettings = async () => {
        // Sanitize data -> Convert empty strings to null for numeric fields
        const cleanedData = {
            ...formData,
            latitude: formData.latitude === '' ? null : formData.latitude,
            longitude: formData.longitude === '' ? null : formData.longitude,
            ordering_distance: formData.ordering_distance === '' ? null : formData.ordering_distance,
        };

        let error;
        if (settingsId) {
            const result = await supabase
                .from('qr_settings')
                .update({ ...cleanedData, updated_at: new Date() })
                .eq('id', settingsId);
            error = result.error;
        } else {
            const result = await supabase
                .from('qr_settings')
                .insert([{ ...cleanedData, business_id: user.business_id }]);
            error = result.error;
            if (result.data) setSettingsId(result.data[0].id);
        }

        if (error) alert('Hata oluştu: ' + error.message);
        else alert('Ayarlar kaydedildi.');
    };

    // Edit/Delete State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState(null);
    const [newTableName, setNewTableName] = useState('');

    const handleDeleteTable = async (id) => {
        if (!confirm('Bu masayı silmek istediğinize emin misiniz?')) return;

        const { error } = await supabase
            .from('tables')
            .update({ is_deleted: true })
            .eq('id', id);

        if (error) alert('Hata: ' + error.message);
        else fetchTables();
    };

    const openEditModal = (table) => {
        setEditingTable(table);
        setNewTableName(table.name);
        setIsEditModalOpen(true);
    };

    const handleUpdateTable = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('tables')
            .update({ name: newTableName })
            .eq('id', editingTable.id);

        if (error) alert('Hata: ' + error.message);
        else {
            setIsEditModalOpen(false);
            fetchTables();
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddTables = async () => {
        // Generate table names
        const newTables = [];
        for (let i = 0; i < tableCount; i++) {
            const num = parseInt(tableStart) + i;
            newTables.push({
                business_id: user.business_id,
                name: `${tablePrefix} ${num}`
            });
        }

        const { error } = await supabase.from('tables').insert(newTables);
        if (error) alert('Hata: ' + error.message);
        else {
            setIsTableModalOpen(false);
            fetchTables();
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">Mekan Ayarları</h1>
                <div className="text-xs text-gray-400 mt-1">Pano • Mekan Ayarları</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
                {/* Tabs */}
                <div className="flex items-center gap-6 px-6 border-b border-gray-100 overflow-x-auto">
                    {['location', 'social', 'tables'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap capitalize
                                ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab === 'location' && 'Konum Ayarları'}
                            {tab === 'social' && 'Sosyal Hesaplar'}
                            {tab === 'tables' && 'Masalar'}
                        </button>
                    ))}
                </div>

                <div className="p-8 flex-1">
                    {/* LOCATION SETTINGS */}
                    {activeTab === 'location' && (
                        <div className="space-y-6 max-w-4xl">
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Mekan Adı</label>
                                    <input name="place_name" value={formData.place_name || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Qr Menu Adresi (Adres barında gözükecek linktir)</label>
                                    <div className="flex">
                                        <input name="slug" value={formData.slug || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-l p-2 text-sm" />
                                        <button className="bg-gray-200 px-3 rounded-r text-gray-600 text-sm hover:bg-gray-300">Adresi Kopyala</button>
                                    </div>
                                </div>


                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Wifi Adı</label>
                                        <input name="wifi_name" value={formData.wifi_name || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Wifi Parolası</label>
                                        <input name="wifi_password" value={formData.wifi_password || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Şehir</label>
                                        <input name="city" value={formData.city || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">İlçe</label>
                                        <input name="district" value={formData.district || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Ülke</label>
                                        <input name="country" value={formData.country || ''} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={handleSaveSettings} className="bg-green-500 text-white px-6 py-2 rounded shadow hover:bg-green-600">Kaydet</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SOCIAL SETTINGS */}
                    {activeTab === 'social' && (
                        <div className="space-y-6 max-w-4xl">
                            {[
                                { label: 'Instagram', name: 'social_instagram' },
                                { label: 'Twitter', name: 'social_twitter' },
                                { label: 'Youtube', name: 'social_youtube' },
                                { label: 'Facebook', name: 'social_facebook' },
                                { label: 'Tiktok', name: 'social_tiktok' },
                                { label: 'Google Değerlendir', name: 'social_google', placeholder: 'Google Yorum Linki' },
                            ].map(item => (
                                <div key={item.name}>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">{item.label}</label>
                                    <input name={item.name} value={formData[item.name] || ''} onChange={handleChange} placeholder={item.placeholder || `${item.label} Kullanıcı Adınız`} className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-sm" />
                                </div>
                            ))}
                            <div className="flex justify-end">
                                <button onClick={handleSaveSettings} className="bg-green-500 text-white px-6 py-2 rounded shadow hover:bg-green-600">Kaydet</button>
                            </div>
                        </div>
                    )}

                    {/* TABLES SETTINGS */}
                    {activeTab === 'tables' && (
                        <div>
                            <div className="flex justify-end items-center mb-6">
                                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-gray-300">
                                    <Download size={16} /> Tüm Karekodları İndir
                                </button>
                            </div>

                            <div className="space-y-8">
                                {areas.map(area => {
                                    const areaTables = tables.filter(t => t.seating_area_id === area.id);
                                    if (areaTables.length === 0) return null;

                                    return (
                                        <div key={area.id} className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden">
                                            <div className="bg-gray-100/50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <h3 className="font-bold text-gray-700">{area.name}</h3>
                                                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">{areaTables.length} Masa</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                                                {areaTables.map(table => (
                                                    <div key={table.id} className="bg-white border border-gray-100 rounded-lg p-4 flex justify-between items-center shadow-sm hover:shadow-md transition-all">
                                                        <span className="font-bold text-gray-700">{table.name}</span>
                                                        <div className="flex gap-2">
                                                            {/* Only show Edit/Delete if you want full management here. 
                                                                User said "Show what is written there", suggesting read-only reflection.
                                                                But "QR Settings" usually implies management.
                                                                I'll keep specific actions minimal or just show QR download.
                                                            */}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Tables without area */}
                                {tables.filter(t => !t.seating_area_id).length > 0 && (
                                    <div className="bg-gray-50/50 rounded-xl border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-100/50 px-6 py-3 border-b border-gray-200">
                                            <h3 className="font-bold text-gray-700">Diğer Masalar (Alansız)</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                                            {tables.filter(t => !t.seating_area_id).map(table => (
                                                <div key={table.id} className="bg-white border border-gray-100 rounded-lg p-4 flex justify-between items-center shadow-sm">
                                                    <span className="font-bold text-gray-700">{table.name}</span>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleDeleteTable(table.id)} className="text-red-500 text-xs hover:underline">Sil</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for New Table */}
            {isTableModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Yeni Ekle</h3>
                            <button onClick={() => setIsTableModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <div className="p-6">
                            <h4 className="font-semibold mb-4">Yeni masa oluşturmak ister misiniz?</h4>
                            <div className="flex gap-4 mb-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="naming" checked={tableNamingType === 'auto'} onChange={() => setTableNamingType('auto')} className="text-blue-500" />
                                    <span>Otomatik Masa İsimleri</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="naming" checked={tableNamingType === 'custom'} onChange={() => setTableNamingType('custom')} className="text-blue-500" />
                                    <span>Özel Masa İsimleri</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Ön Ad:</label>
                                    <input type="text" value={tablePrefix} onChange={e => setTablePrefix(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Masa Adedi:</label>
                                    <input type="number" value={tableCount} onChange={e => setTableCount(e.target.value)} className="w-full border rounded p-2" />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm text-gray-600 mb-1">Başlangıç:</label>
                                    <input type="number" value={tableStart} onChange={e => setTableStart(e.target.value)} className="w-full border rounded p-2 w-1/2" />
                                </div>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-semibold mb-2">Oluşturulacak Masalar</label>
                                <div className="bg-green-50 p-3 rounded text-green-700 text-sm">
                                    {tablePrefix} {tableStart} ... {tablePrefix} {parseInt(tableStart) + parseInt(tableCount) - 1}
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end gap-2">
                                <button onClick={() => setIsTableModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">İptal</button>
                                <button onClick={handleAddTables} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Oluştur</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Edit Table */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold">Masa Düzenle</h3>
                            <button onClick={() => setIsEditModalOpen(false)}><X size={20} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleUpdateTable} className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-semibold mb-2">Masa Adı</label>
                                <input
                                    type="text"
                                    value={newTableName}
                                    onChange={e => setNewTableName(e.target.value)}
                                    className="w-full border rounded p-2 text-sm focus:border-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded text-sm">İptal</button>
                                <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Kaydet</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QRSettings;

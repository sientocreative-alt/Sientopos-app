import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { Clock, Check, RefreshCw, AlertCircle, ArrowLeft, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const KitchenDisplay = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // New State for Passive Mode
    const [isKdsActive, setIsKdsActive] = useState(true);
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // MAIN DATA FETCHING & SUBSCRIPTION
    useEffect(() => {
        if (!user?.business_id) return;

        fetchSettings();
        fetchPrinters();
        fetchOrders();

        // 1. Order Subscription
        const orderSubscription = supabase
            .channel('kitchen_display_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
                fetchOrders();
            })
            .subscribe();

        // 2. Settings Subscription (for Passive Mode)
        const settingsSubscription = supabase
            .channel('kitchen_display_settings')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'pos_settings',
                filter: `business_id=eq.${user.business_id}`
            }, () => {
                fetchSettings();
            })
            .subscribe();

        // 3. Auto-Refresh Interval (Backup)
        const refreshInterval = setInterval(fetchOrders, 30000);

        return () => {
            supabase.removeChannel(orderSubscription);
            supabase.removeChannel(settingsSubscription);
            clearInterval(refreshInterval);
        };
    }, [user?.business_id]);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('pos_settings')
                .select('system_flags')
                .eq('business_id', user.business_id)
                .single();

            if (error) console.error('Error fetching settings:', error);

            if (data?.system_flags) {
                const isActive = data.system_flags.kitchen_display_active !== false;
                setIsKdsActive(isActive);
            } else {
                // Default to true if no settings found to avoid locking out
                setIsKdsActive(true);
            }
            setSettingsLoading(false);
        } catch (err) {
            console.error('Error in fetchSettings:', err);
            setSettingsLoading(false);
        }
    };

    const fetchOrders = async () => {
        try {
            // Fetch unserved orders
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    *,
                    tables (name, seating_areas (name))
                `)
                .eq('business_id', user.business_id)
                .neq('status', 'cancelled')
                .neq('status', 'served')
                .order('created_at', { ascending: true });

            if (error) throw error;

            groupOrdersByTable(data || []);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching orders:', err);
            setLoading(false);
        }
    };

    const [printers, setPrinters] = useState([]);

    const fetchPrinters = async () => {
        try {
            const { data, error } = await supabase
                .from('printers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);
            setPrinters(data || []);
        } catch (err) {
            console.error('Error fetching printers:', err);
        }
    };

    const groupOrdersByTable = (items) => {
        const groups = {};
        items.forEach(item => {
            // FILTER LOGIC: KDS ONLY SHOWS ITEMS THAT ARE NOT COMPLETED/SERVED
            if (item.status === 'served' || item.status === 'completed') return;

            // 0. EXCLUSIVE ROUTING CHECK
            // Only show items that were explicitly sent to KDS when it was active
            if (!item.metadata?.is_kds_item) return;

            // If item has a physical printer_id, it means it was printed (KDS deactivated at that time)
            if (item.printer_id) return;

            // 1. Resolve effective printer ID (from metadata since printer_id is null)
            const effectivePrinterId = item.metadata?.target_printer_id;
            const assignedPrinter = effectivePrinterId ? printers.find(p => p.id === effectivePrinterId) : null;

            const tableId = item.table_id;
            if (!groups[tableId]) {
                groups[tableId] = {
                    tableId,
                    tableName: item.tables?.name || 'Bilinmeyen Masa',
                    areaName: item.tables?.seating_areas?.name || '',
                    items: [],
                    firstOrderTime: item.created_at
                };
            }
            groups[tableId].items.push(item);
        });

        // Convert to array and sort by time
        const sortedOrders = Object.values(groups).sort((a, b) =>
            new Date(a.firstOrderTime) - new Date(b.firstOrderTime)
        );
        setOrders(sortedOrders);
    };

    const handleUpdateStatus = async (itemId, newStatus) => {
        try {
            const { error } = await supabase
                .from('order_items')
                .update({ status: newStatus })
                .eq('id', itemId);

            if (error) throw error;
            toast.success('Durum güncellendi');
            fetchOrders();
        } catch (err) {
            toast.error('Güncelleme hatası');
        }
    };

    const handleCompleteTable = async (items) => {
        try {
            const updates = items.map(item =>
                supabase.from('order_items').update({ status: 'served' }).eq('id', item.id)
            );
            await Promise.all(updates);
            toast.success('Masa tamamlandı');
            fetchOrders();
        } catch (err) {
            toast.error('Hata oluştu');
        }
    };

    // --- RENDER LOGIC ---

    if (loading || settingsLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-gray-50">
                <RefreshCw className="animate-spin text-gray-400" size={32} />
            </div>
        );
    }

    // PASSIVE MODE SCREEN
    if (isKdsActive === false) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8fafc] p-6">
                <div className="bg-white p-12 rounded-[40px] shadow-2xl text-center max-w-xl border border-gray-100 animate-in fade-in zoom-in duration-500">
                    <div className="w-28 h-28 bg-[#5D5FEF]/10 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Monitor size={56} className="text-[#5D5FEF]" />
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-6 tracking-tight">
                        SientoPOS Mutfak Ekranı
                    </h1>

                    <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl mb-10">
                        <p className="text-blue-900 font-bold text-xl leading-relaxed">
                            Pos ayarları &gt; Mutfak Ekranı Aktifleştir
                        </p>
                        <p className="text-blue-700/60 text-sm mt-2 font-medium">
                            Mutfak ekranını kullanmak için yukarıdaki yolu izleyerek ayarı aktif ediniz.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/pos')}
                            className="px-10 py-5 bg-[#5D5FEF] text-white rounded-2xl font-black text-lg hover:bg-[#4B4DDF] hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mx-auto w-full"
                        >
                            <ArrowLeft size={24} />
                            POS Ekranına Dön
                        </button>
                    </div>

                    <p className="mt-12 text-[10px] text-gray-300 font-black uppercase tracking-[0.2em]">
                        System Status: Passive Mode Restricted
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/pos')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-black text-gray-800">Mutfak Ekranı</h1>
                    <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-black rounded-lg uppercase tracking-wider flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Canlı
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-sm font-bold text-gray-500">Bekleyen Sipariş</div>
                        <div className="text-2xl font-black text-[#5D5FEF]">{orders.length} Masa</div>
                    </div>
                </div>
            </div>

            {/* Orders Grid */}
            <div className="p-6 flex-1 overflow-y-auto">
                {orders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 mt-20">
                        <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Check size={48} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold">Bekleyen Sipariş Yok</h2>
                        <p className="text-sm opacity-60">Tüm siparişler tamamlandı</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map((tableOrder) => (
                            <div key={tableOrder.tableId} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                                {/* Table Header */}
                                <div className="bg-[#1a1a1a] text-white p-4 flex justify-between items-start">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 mb-1">{tableOrder.areaName}</div>
                                        <div className="text-xl font-black">Masa {tableOrder.tableName}</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className="flex items-center gap-1 text-sm font-bold text-orange-400">
                                            <Clock size={14} />
                                            <span>
                                                {Math.floor((new Date() - new Date(tableOrder.firstOrderTime)) / 60000)} dk
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-gray-500 mt-1">
                                            {new Date(tableOrder.firstOrderTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Items List */}
                                <div className="p-4 space-y-3 flex-1">
                                    {tableOrder.items.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className={`p-3 rounded-xl border-l-4 transition-all ${item.status === 'sent'
                                                ? 'bg-red-50 border-red-500'
                                                : 'bg-green-50 border-green-500 opacity-60'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-black text-lg text-gray-800">
                                                            {item.quantity}x
                                                        </span>
                                                        <span className="font-bold text-gray-700 text-[15px]">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                    {item.modifiers && item.modifiers.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {item.modifiers.map((mod, i) => (
                                                                <span key={i} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-500 font-bold uppercase">
                                                                    {mod.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {item.note && (
                                                        <div className="mt-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-1.5 rounded-lg border border-yellow-100 font-bold flex items-start gap-1">
                                                            <AlertCircle size={12} className="mt-0.5 shrink-0" />
                                                            {item.note}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleUpdateStatus(item.id, item.status === 'sent' ? 'preparing' : 'sent')}
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${item.status === 'sent'
                                                        ? 'bg-white border border-gray-200 text-gray-300 hover:border-green-500 hover:text-green-500'
                                                        : 'bg-green-500 text-white shadow-lg shadow-green-200'
                                                        }`}
                                                >
                                                    <Check size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Actions */}
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <button
                                        onClick={() => handleCompleteTable(tableOrder.items)}
                                        className="w-full py-3 bg-[#5D5FEF] text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-[#4B4DDF] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={18} />
                                        Masayı Tamamla
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KitchenDisplay;

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    MonitorDot,
    LayoutGrid,
    Target,
    Smartphone,
    Bell,
    Globe,
    ChevronDown,
    ChevronUp,
    Wifi,
    CreditCard,
    ShieldCheck,
    Lock,
    X,
    Clock,
    Phone,
    Search,
    ArrowLeft,
    Minus,
    Plus,
    Trash2,
    Printer,
    MoreVertical,
    History,
    ShoppingBag,
    StickyNote,
    RefreshCw,
    FileText,
    Calculator,
    Move,
    GitMerge,
    Users,
    ArrowUpRight,
    DollarSign,
    CornerDownLeft,
    Percent,
    CheckSquare,
    ChevronRight,
    SearchCode,
    NotebookPen,
    Archive,
    Settings,
    Undo2,
    TrendingUp,
    BarChart3,
    Check
} from 'lucide-react';
import * as QRCode from 'qrcode.react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const POS = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [pin, setPin] = useState('');
    const [currentStaff, setCurrentStaff] = useState(null);
    const [view, setView] = useState('login'); // login, tables, tasks, shifts, delivery
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Statistics Data
    const [statsTimeRange, setStatsTimeRange] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [statsData, setStatsData] = useState({
        dailyTotal: 0,
        weeklyTotal: 0,
        monthlyTotal: 0,
        chartData: []
    });

    // Seating & Tables Data
    const [seatingAreas, setSeatingAreas] = useState([]);
    const [tables, setTables] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);

    // Tasks Data
    const [tasks, setTasks] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [qrToken, setQrToken] = useState(Date.now().toString());
    const [qrProgress, setQrProgress] = useState(100);

    // Menu & Order Data
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeSubCategory, setActiveSubCategory] = useState(null);
    const [cart, setCart] = useState([]);
    const [isTopMenuOpen, setIsTopMenuOpen] = useState(false);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const [isHeaderActionMenuOpen, setIsHeaderActionMenuOpen] = useState(false);
    const [activeSidebarTab, setActiveSidebarTab] = useState('sepet'); // 'gecmis' or 'sepet'
    const [posSettings, setPosSettings] = useState(null);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [activeNoteInput, setActiveNoteInput] = useState('');
    const [activeNoteItemIndex, setActiveNoteItemIndex] = useState(null);
    const [tableNote, setTableNote] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false);

    // Variations State
    const [modifierGroups, setModifierGroups] = useState([]);
    const [modifierOptions, setModifierOptions] = useState([]);
    const [modifierRecipes, setModifierRecipes] = useState([]);
    const [isVariationModalOpen, setIsVariationModalOpen] = useState(false);
    const [variationProduct, setVariationProduct] = useState(null);
    const [selectedModifiers, setSelectedModifiers] = useState([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isCartSent, setIsCartSent] = useState(true);
    const [isMovingMode, setIsMovingMode] = useState(false);
    const [isMergingMode, setIsMergingMode] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState([]);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountTypes, setDiscountTypes] = useState([]);
    const [customDiscountValue, setCustomDiscountValue] = useState('');
    const [customDiscountType, setCustomDiscountType] = useState('percentage'); // 'percentage' or 'amount'
    const [paymentInputAmount, setPaymentInputAmount] = useState('');
    const [tablePayments, setTablePayments] = useState([]);
    const [happyHours, setHappyHours] = useState([]);
    const [timedDiscounts, setTimedDiscounts] = useState([]);

    // Customization Modal States
    const [variationQuantity, setVariationQuantity] = useState(1);
    const [variationNote, setVariationNote] = useState('');
    const [isUppercase, setIsUppercase] = useState(false);
    const [isShiftActive, setIsShiftActive] = useState(false);

    // Waiter Call States
    const [waiterCalls, setWaiterCalls] = useState([]);
    const [isWaiterCallsModalOpen, setIsWaiterCallsModalOpen] = useState(false);
    const [waiterCallEnabled, setWaiterCallEnabled] = useState(false);

    // Ref to access latest settings in subscription callback
    const posSettingsRef = useRef(posSettings);
    useEffect(() => {
        posSettingsRef.current = posSettings;
    }, [posSettings]);


    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatDuration = (startTime) => {
        if (!startTime) return '-';
        const start = new Date(startTime);
        const now = currentTime;
        const diffInSeconds = Math.floor((now - start) / 1000);

        if (diffInSeconds < 0) return '0 sn';

        const days = Math.floor(diffInSeconds / 86400);
        const hours = Math.floor((diffInSeconds % 86400) / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);
        const seconds = diffInSeconds % 60;

        let result = '';
        if (days > 0) result += `${days} g `;
        if (hours > 0) result += `${hours} s `;
        if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} dk `;
        if (seconds > 0 || (days === 0 && hours === 0 && minutes === 0)) result += `${seconds} sn`;
        return result.trim();
    };

    const formatTime = (timeString) => {
        if (!timeString) return '-';
        return new Date(timeString).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDigitalDuration = (startTime) => {
        if (!startTime) return '00:00';
        const start = new Date(startTime);
        const now = currentTime;
        const diffInSeconds = Math.max(0, Math.floor((now - start) / 1000));

        const hours = Math.floor(diffInSeconds / 3600);
        const minutes = Math.floor((diffInSeconds % 3600) / 60);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const toggleItemSelection = (index) => {
        const newCart = [...cart];
        newCart[index].selected = !newCart[index].selected;
        setCart(newCart);
    };

    const getProductPriceInfo = (product) => {
        let discount = null;
        let discountLabel = '';
        const now = new Date();

        // 1. Check Timed Discounts (Higher priority)
        const td = timedDiscounts.find(t => {
            const isTarget = t.target_ids?.includes(product.id) ||
                (t.target_type === 'category' && t.target_ids?.includes(product.category_id));
            if (!isTarget) return false;

            const start = t.start_date ? new Date(t.start_date) : null;
            const end = t.end_date ? new Date(t.end_date) : null;
            if (start) start.setHours(0, 0, 0, 0);
            if (end) end.setHours(23, 59, 59, 999);

            return (!start || now >= start) && (!end || now <= end);
        });

        if (td) {
            discount = td;
            discountLabel = 'SÜRELİ İNDİRİM';
        } else {
            // 2. Check Happy Hour
            const hh = happyHours.find(h => {
                const isTarget = h.target_ids?.includes(product.id) ||
                    (h.target_type === 'category' && h.target_ids?.includes(product.category_id));
                if (!isTarget) return false;

                const start = h.start_date ? new Date(h.start_date) : null;
                const end = h.end_date ? new Date(h.end_date) : null;
                if (start) start.setHours(0, 0, 0, 0);
                if (end) end.setHours(23, 59, 59, 999);

                const isDateInRange = (!start || now >= start) && (!end || now <= end);
                if (!isDateInRange) return false;

                // Check daily schedule
                const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const today = days[now.getDay()];
                const config = h.days_config?.[today];

                if (config?.active) {
                    const [startH, startM] = config.start.split(':').map(Number);
                    const [endH, endM] = config.end.split(':').map(Number);
                    const startTotal = startH * 60 + startM;
                    const endTotal = endH * 60 + endM;
                    const nowTotal = now.getHours() * 60 + now.getMinutes();

                    return nowTotal >= startTotal && nowTotal <= endTotal;
                }
                return false;
            });

            if (hh) {
                discount = hh;
                discountLabel = 'HAPPY HOUR';
            }
        }

        if (discount) {
            let discountedPrice = parseFloat(product.price);
            if (discount.discount_type === 'percentage') {
                discountedPrice = discountedPrice * (1 - (discount.discount_amount / 100));
            } else {
                discountedPrice = discountedPrice - discount.discount_amount;
            }
            return {
                originalPrice: parseFloat(product.price),
                discountedPrice: Math.max(0, discountedPrice),
                hasDiscount: true,
                discountLabel: discountLabel
            };
        }
        return { originalPrice: parseFloat(product.price), hasDiscount: false };
    };


    const addDirectlyToCart = (product) => {
        // Check if product has variations
        const productRecipes = modifierRecipes.filter(r => r.product_id === product.id);
        const priceInfo = getProductPriceInfo(product);

        if (productRecipes.length > 0) {
            // Product has variations, open customizer instead
            openProductCustomizer(product);
        } else {
            // No variations, add directly to cart
            setCart([...cart, {
                ...product,
                price: priceInfo.hasDiscount ? priceInfo.discountedPrice : product.price,
                quantity: 1,
                selected: false,
                note: '',
                addedAt: new Date().toISOString(),
                metadata: priceInfo.hasDiscount ? { discount_label: priceInfo.discountLabel, original_price: priceInfo.originalPrice } : {}
            }]);
            setIsCartSent(false);
        }
    };

    const handleRemoveUnsentFromCart = () => {
        const unsentSelected = cart.filter(item => item.selected && !item.database_id);

        if (unsentSelected.length === 0) {
            alert('Lütfen silmek için önce gönderilmemiş bir ürün seçin.');
            return;
        }

        if (confirm(`${unsentSelected.length} ürünü sepetten silmek istediğinize emin misiniz?`)) {
            const newCart = cart.filter(item => !(item.selected && !item.database_id));
            setCart(newCart);
            // If all unsent items are gone, we can potentially set isCartSent to true if no other unsent items exist
            const remainingUnsent = newCart.some(item => !item.database_id);
            if (!remainingUnsent) {
                setIsCartSent(true);
            }
        }
    };

    const openProductCustomizer = (product) => {
        // Find recipes for this product
        const productRecipes = modifierRecipes.filter(r => r.product_id === product.id);

        const groupIds = [...new Set(productRecipes.map(r => {
            const opt = modifierOptions.find(o => o.id === r.option_id);
            return opt?.group_id;
        }))].filter(id => id);

        const relevantGroups = modifierGroups
            .filter(g => groupIds.includes(g.id))
            .map(g => ({
                ...g,
                options: modifierOptions.filter(o =>
                    o.group_id === g.id &&
                    productRecipes.some(r => r.option_id === o.id)
                )
            }));

        setVariationProduct(product);
        setVariationQuantity(1);
        setVariationNote('');

        // Pre-select defaults if any
        const defaults = [];
        relevantGroups.forEach(group => {
            group.options.forEach(opt => {
                if (opt.is_default) defaults.push(opt);
            });
        });
        setSelectedModifiers(defaults);
        setIsVariationModalOpen(true);
    };

    const confirmVariations = () => {
        // Validate min selections
        const productRecipes = modifierRecipes.filter(r => r.product_id === variationProduct.id);
        const groupIds = [...new Set(productRecipes.map(r => {
            const opt = modifierOptions.find(o => o.id === r.option_id);
            return opt?.group_id;
        }))].filter(id => id);

        const relevantGroups = modifierGroups.filter(g => groupIds.includes(g.id));

        for (const group of relevantGroups) {
            const selectionsInGroup = selectedModifiers.filter(m => m.group_id === group.id).length;
            if (selectionsInGroup < (group.min_selections || 0)) {
                alert(`Lütfen ${group.name} için en az ${group.min_selections} seçim yapın.`);
                return;
            }
        }

        // Add to cart with full customization - create separate items for each quantity
        const priceInfo = getProductPriceInfo(variationProduct);
        const newItems = Array.from({ length: variationQuantity }, () => ({
            ...variationProduct,
            price: priceInfo.hasDiscount ? priceInfo.discountedPrice : variationProduct.price,
            quantity: 1,  // Each item has quantity 1 for individual payment
            selected: false,
            note: variationNote,
            addedAt: new Date().toISOString(),
            selectedModifiers: [...selectedModifiers],
            metadata: priceInfo.hasDiscount ? { discount_label: priceInfo.discountLabel, original_price: priceInfo.originalPrice } : {}
        }));

        setCart([...cart, ...newItems]);

        setIsVariationModalOpen(false);
        setVariationProduct(null);
        setSelectedModifiers([]);
        setVariationQuantity(1);
        setVariationNote('');
        setIsCartSent(false);
    };

    const handleOpenNoteModal = (itemIndex = null) => {
        if (itemIndex !== null) {
            setActiveNoteItemIndex(itemIndex);
            setActiveNoteInput(cart[itemIndex].note || '');
        } else {
            const selectedItemIndex = cart.findIndex(item => item.selected);
            if (selectedItemIndex > -1) {
                setActiveNoteItemIndex(selectedItemIndex);
                setActiveNoteInput(cart[selectedItemIndex].note || '');
            } else {
                setActiveNoteItemIndex(null);
                setActiveNoteInput(tableNote);
            }
        }
        setIsNoteModalOpen(true);
    };

    const [noteModalContext, setNoteModalContext] = useState('note'); // 'note', 'action'
    const [pendingAction, setPendingAction] = useState(null); // { type, items }

    const handleApplyActionToSelected = (actionType) => {
        const selectedItems = cart.filter(i => i.selected);
        if (selectedItems.length === 0) {
            alert('Lütfen işlem yapılacak ürünleri seçin.');
            return;
        }

        let isMandatory = false;
        let promptText = '';

        if (actionType === 'gift') {
            isMandatory = true;
            promptText = 'Neden ikram edildiği hakkında not giriniz.';
        } else if (actionType === 'waste') {
            isMandatory = true;
            promptText = 'Neden atığa ayrıldığı hakkında not giriniz.';
        } else if (actionType === 'cancel') {
            isMandatory = true;
            promptText = 'Neden iptal edildiği hakkında not giriniz.';
        }

        if (isMandatory) {
            setPendingAction({ type: actionType, items: selectedItems });
            setNoteModalContext('action');
            setActiveNoteInput('');
            setIsNoteModalOpen(true);
        } else {
            executeAction(actionType, selectedItems);
        }
        setIsActionMenuOpen(false);
    };

    const handleTrashClick = () => {
        const selectedItems = cart.filter(i => i.selected);
        if (selectedItems.length === 0) {
            alert('Lütfen silmek istediğiniz ürünleri seçin.');
            return;
        }

        setPendingAction({ type: 'cancel', items: selectedItems });
        setNoteModalContext('action');
        setActiveNoteInput('');
        setIsNoteModalOpen(true);
    };

    const executeAction = async (actionType, items, reason = '') => {
        try {
            if (actionType === 'cancel' || actionType === 'gift' || actionType === 'waste') {
                const dbItems = items.filter(i => i.database_id);
                const localItems = items.filter(i => !i.database_id);

                if (dbItems.length > 0) {
                    // Use syncProcessedItems for proper row splitting
                    await syncProcessedItems(dbItems, actionType, null, null, reason);

                    // Deduct price from table total if it's not a generic cancel (already sent items)
                    // We only deduct if it's gift, waste or a confirmed cancel
                    const itemsTotal = dbItems.reduce((acc, i) => {
                        const modsTotal = i.selectedModifiers?.reduce((sum, m) => sum + parseFloat(m.price || 0), 0) || 0;
                        return acc + (parseFloat(i.price) + modsTotal) * i.quantity;
                    }, 0);

                    const newTableTotal = Math.max(0, parseFloat(selectedTable.current_total || 0) - itemsTotal);
                    const { error: tableError } = await supabase
                        .from('tables')
                        .update({ current_total: newTableTotal })
                        .eq('id', selectedTable.id);

                    if (tableError) throw tableError;

                    // Update local selectedTable state
                    setSelectedTable(prev => ({ ...prev, current_total: newTableTotal }));
                    setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, current_total: newTableTotal } : t));

                    // Refresh table orders
                    await fetchTableOrders(selectedTable.id, selectedTable.opened_at);
                    // Auto-collapse groups after action
                    setExpandedGroups([]);
                }

                if (localItems.length > 0) {
                    // If it's a cancel of unsent items, just remove them
                    if (actionType === 'cancel') {
                        setCart(prev => prev.filter(i => !localItems.some(li => li === i)));
                    } else {
                        // Mark local items as gift/waste
                        setCart(prev => prev.map(i => {
                            const isMatch = localItems.some(li => li === i);
                            return isMatch ? { ...i, status: actionType, note: reason, selected: false } : i;
                        }));
                    }
                    setIsCartSent(false);
                }
            } else if (actionType === 'discount') {
                // Existing discount logic placeholder
                setIsCartSent(false);
            }
        } catch (err) {
            console.error('Error executing action:', err);
            alert('İ°şlem sırasında bir hata oluştu.');
        }
    };

    const handleSaveNote = () => {
        if (noteModalContext === 'action') {
            if (!activeNoteInput.trim()) {
                alert('Lütfen bir neden belirtin.');
                return;
            }
            executeAction(pendingAction.type, pendingAction.items, activeNoteInput);
            setPendingAction(null);
            setNoteModalContext('note');
        } else {
            if (activeNoteItemIndex !== null) {
                const newCart = cart.map((item, idx) => {
                    if (idx === activeNoteItemIndex) {
                        return { ...item, note: activeNoteInput, selected: false };
                    }
                    return item;
                });
                setCart(newCart);
                setIsCartSent(false);
            } else {
                const selectedItemIndex = cart.findIndex(item => item.selected);
                if (selectedItemIndex > -1) {
                    const newCart = cart.map((item, idx) => {
                        if (idx === selectedItemIndex) {
                            return { ...item, note: activeNoteInput, selected: false };
                        }
                        return item;
                    });
                    setCart(newCart);
                    setIsCartSent(false);
                } else {
                    setTableNote(activeNoteInput);
                }
            }
        }
        setActiveNoteInput('');
        setActiveNoteItemIndex(null);
        setIsNoteModalOpen(false);
    };

    // Printers Data
    const [printers, setPrinters] = useState([]);

    const fetchPrinters = async () => {
        try {
            const { data } = await supabase
                .from('printers')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);
            setPrinters(data || []);
        } catch (err) {
            console.error('Error fetching printers:', err);
        }
    };

    const fetchSettings = async () => {
        try {
            const { data } = await supabase
                .from('pos_settings')
                .select('*')
                .eq('business_id', user.business_id)
                .maybeSingle();

            if (data) {
                setPosSettings(data);
                setWaiterCallEnabled(data.system_flags?.enable_waiter_call || false);
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    const fetchWaiterCalls = async () => {
        if (!user?.business_id) return;

        try {
            const { data, error } = await supabase
                .from('waiter_calls')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setWaiterCalls(data || []);
        } catch (err) {
            console.error('Error fetching waiter calls:', err);
        }
    };

    const handleAcknowledgeCall = async (callId) => {
        try {
            const { error } = await supabase
                .from('waiter_calls')
                .update({
                    status: 'acknowledged',
                    acknowledged_at: new Date().toISOString(),
                    acknowledged_by: currentStaff?.id
                })
                .eq('id', callId);

            if (error) throw error;

            // Remove from local state
            setWaiterCalls(prev => prev.filter(call => call.id !== callId));
        } catch (err) {
            console.error('Error acknowledging call:', err);
        }
    };

    const fetchDiscountTypes = async () => {
        if (!user?.business_id) return;
        try {
            const { data, error } = await supabase
                .from('discount_types')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);
            if (error) throw error;
            setDiscountTypes(data || []);
        } catch (err) {
            console.error('Error fetching discount types:', err);
        }
    };

    const handleApplyDiscount = async (discount) => {
        if (!selectedTable) return;

        let discountAmount = 0;
        let discountName = '';

        const currentTotal = cart.filter(i => !['gift', 'waste', 'paid', 'cancel'].includes(i.status)).reduce((total, item) => total + ((parseFloat(item.price) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.quantity), 0);

        if (discount.type === 'Fixed Amount' || discount.type === 'Sabit Tutar') {
            discountAmount = parseFloat(discount.amount);
            discountName = `İndirim (${discount.name})`;
        } else if (discount.type === 'Percentage' || discount.type === 'Yüzdelik İndirim') {
            discountAmount = (currentTotal * parseFloat(discount.amount)) / 100;
            discountName = `İndirim (%${discount.amount} - ${discount.name})`;
        } else if (discount.type === 'custom_percentage') {
            discountAmount = (currentTotal * parseFloat(discount.amount)) / 100;
            discountName = `İndirim (%${discount.amount})`;
        } else if (discount.type === 'custom_amount') {
            discountAmount = parseFloat(discount.amount);
            discountName = `İndirim (₺${discount.amount})`;
        }

        if (discountAmount <= 0) return;

        setLoading(true);
        try {
            // 1. Insert into order_items as a hidden discount item
            const { error: itemError } = await supabase
                .from('order_items')
                .insert([{
                    business_id: user.business_id,
                    table_id: selectedTable.id,
                    product_id: null,
                    name: discountName,
                    price: -discountAmount, // Negative price
                    quantity: 1,
                    status: 'sent',
                    staff_name: currentStaff ? `${currentStaff.first_name} ${currentStaff.last_name}` : 'Sistem',
                    metadata: { is_discount: true }
                }]);

            if (itemError) throw itemError;

            // 2. Update Table Meta Total immediately
            const newTotal = Math.max(0, parseFloat(selectedTable.current_total || 0) - discountAmount);
            const { error: tableError } = await supabase
                .from('tables')
                .update({
                    current_total: newTotal,
                    is_occupied: true,
                    last_order_at: new Date().toISOString()
                })
                .eq('id', selectedTable.id);

            if (tableError) throw tableError;

            // 3. Update local state
            setSelectedTable(prev => ({ ...prev, current_total: newTotal, is_occupied: true }));
            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, current_total: newTotal, is_occupied: true } : t));

            // 4. Refresh items (this will pull the new hidden item but groupCartItems will filter it)
            await fetchTableOrders(selectedTable.id, selectedTable.opened_at);

            setIsDiscountModalOpen(false);
            setCustomDiscountValue('');
        } catch (err) {
            console.error('Error applying discount:', err);
            alert('İndirim uygulanırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && view !== 'login') {
            fetchSeatingData();
            fetchTasks();
            fetchShifts();
            fetchMenuData();
            fetchPrinters();
            fetchSettings();
            fetchWaiterCalls();
            fetchDiscountTypes();

            // Real-time subscription for waiter calls
            const waiterCallsChannel = supabase
                .channel('waiter_calls_channel')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'waiter_calls',
                    filter: `business_id=eq.${user.business_id}`
                }, (payload) => {
                    if (payload.new.status === 'pending') {
                        setWaiterCalls(prev => [payload.new, ...prev]);

                        // Play notification sound - Reception Bell (Additive Synthesis)
                        // ONLY if sound is enabled in settings (default to true)
                        if (posSettingsRef.current?.system_flags?.enable_waiter_call_sound !== false) {
                            try {
                                const AudioContext = window.AudioContext || window.webkitAudioContext;
                                if (AudioContext) {
                                    const ctx = new AudioContext();
                                    const now = ctx.currentTime;

                                    // Bell parameters
                                    const fundamental = 880; // A5
                                    const ratios = [1, 2, 3, 4.2]; // Frequency ratios for bell harmonics
                                    const gains = [0.5, 0.3, 0.1, 0.05]; // Relative amplitudes
                                    const duration = 2.0; // Decay duration

                                    ratios.forEach((ratio, index) => {
                                        const osc = ctx.createOscillator();
                                        const gain = ctx.createGain();

                                        osc.connect(gain);
                                        gain.connect(ctx.destination);

                                        osc.type = 'sine';
                                        osc.frequency.setValueAtTime(fundamental * ratio, now);

                                        // Envelope: Instant attack, exponential decay
                                        gain.gain.setValueAtTime(0, now);
                                        gain.gain.linearRampToValueAtTime(gains[index], now + 0.01); // Fast attack
                                        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

                                        osc.start(now);
                                        osc.stop(now + duration + 0.1);
                                    });
                                }
                            } catch (e) {
                                console.error('Audio play failed:', e);
                            }
                        }
                    }
                })
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'waiter_calls',
                    filter: `business_id=eq.${user.business_id}`
                }, (payload) => {
                    if (payload.new.status !== 'pending') {
                        setWaiterCalls(prev => prev.filter(call => call.id !== payload.new.id));
                    }
                })
                .subscribe();

            // Real-time subscription for pos_settings (waiter call toggle etc)
            const settingsChannel = supabase
                .channel('pos_settings_channel')
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'pos_settings',
                    filter: `business_id=eq.${user.business_id}`
                }, (payload) => {
                    if (payload.new && payload.new.system_flags) {
                        setPosSettings(payload.new);
                        setWaiterCallEnabled(payload.new.system_flags.enable_waiter_call || false);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(waiterCallsChannel);
                supabase.removeChannel(settingsChannel);
            };
        }
    }, [user, view]);

    // ... (existing helper functions) ...

    const handleSendOrder = async () => {
        const isKdsActive = posSettings?.system_flags?.kitchen_display_active === true;

        // DEBUG ALERTS (STRICTLY REQUIRED BY USER)
        // alert(`KDS DURUMU: ${isKdsActive ? 'AKTİ°F' : 'PASİ°F'}`);

        if (cart.length === 0) return;

        // Only items that aren't already in the DB (newly added)
        const newItems = cart.filter(item => !item.database_id);
        if (newItems.length === 0) {
            alert('Gönderilecek yeni bir ürün bulunmamaktadır.');
            return;
        }

        const cartTotal = newItems.reduce((total, item) => {
            const modifiersTotal = item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0;
            return total + (parseFloat(item.price) + modifiersTotal) * item.quantity;
        }, 0);

        const now = new Date().toISOString();
        const newTotal = (parseFloat(selectedTable.current_total || 0) + cartTotal);

        const tableUpdateData = {
            is_occupied: true,
            last_order_at: now,
            current_total: newTotal
        };

        // Start a new session if table is empty OR if it has no current debt (previous session ended)
        if (!selectedTable.is_occupied || parseFloat(selectedTable.current_total || 0) <= 0) {
            tableUpdateData.opened_at = now;
        }

        try {
            // 1. Update Table Meta
            const { error: tableError } = await supabase
                .from('tables')
                .update(tableUpdateData)
                .eq('id', selectedTable.id);

            if (tableError) throw tableError;

            // Get actual staff name
            const staffFullName = currentStaff?.first_name
                ? `${currentStaff.first_name}${currentStaff.last_name ? ' ' + currentStaff.last_name : ''}`
                : user?.user_metadata?.first_name
                    ? `${user.user_metadata.first_name}${user.user_metadata.last_name ? ' ' + user.user_metadata.last_name : ''}`
                    : 'Personel';

            // 2. Save Order Items to DB
            const itemsToInsert = newItems.map(item => {
                const product = products.find(p => p.id === item.id);
                // Resolve Printer ID (Product -> Category)
                const originalPrinterId = product?.printer_id || categories.find(c => c.id === product?.category_id)?.printer_id || null;

                let finalPrinterId = originalPrinterId;
                let metadata = {};

                // Find assigned printer details
                const assignedPrinter = printers.find(p => p.id === originalPrinterId);
                const printerName = assignedPrinter?.name?.toLowerCase() || '';

                // Determin heuristic: Is this a kitchen item?
                const isKitchenPrinter = printerName.includes('mutfak') ||
                    printerName.includes('kitchen') ||
                    printerName.includes('food') ||
                    printerName.includes('yemek');

                // Debug alert removed

                if (isKitchenPrinter) {
                    // KITCHEN ROUTING RULE:
                    // If KDS is Active -> Send to KDS (suppress print)
                    // If KDS is Inactive -> Print to Kitchen Printer

                    if (isKdsActive) {
                        finalPrinterId = null; // Suppress print
                        metadata.target_printer_id = originalPrinterId; // Store intended printer for KDS to see
                        metadata.is_kds_item = true; // Mark as KDS item for filtering
                    } else {
                        finalPrinterId = originalPrinterId;
                    }
                } else {
                    // NON-KITCHEN ROUTING RULE:
                    finalPrinterId = originalPrinterId;
                }

                return {
                    business_id: user.business_id,
                    table_id: selectedTable.id,
                    product_id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    note: item.note || '',
                    modifiers: item.selectedModifiers || [],
                    status: 'sent',
                    staff_name: staffFullName,
                    printer_id: finalPrinterId,
                    metadata: metadata
                };
            });

            const { data: insertedData, error: itemsError } = await supabase
                .from('order_items')
                .insert(itemsToInsert)
                .select();

            if (itemsError) throw itemsError;

            // Update local state
            setSelectedTable(prev => ({ ...prev, ...tableUpdateData }));
            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, ...tableUpdateData } : t));

            // Reload table items
            await fetchTableOrders(selectedTable.id, selectedTable.opened_at);
            setIsCartSent(true);

            alert('Sipariş Gönderildi');
        } catch (err) {
            console.error('Error sending order:', err);
            alert('Sipariş iletilirken bir hata oluştu.');
        }
    };

    const handlePrintAccountReceipt = async () => {
        if (!selectedTable || cart.length === 0) {
            alert('Yazdırılacak ürün bulunamadı.');
            return;
        }

        try {
            // Find account printer
            const accountPrinter = printers.find(p => p.is_account_printer);

            if (!accountPrinter) {
                alert('Hata: Tanımlı bir hesap yazıcısı bulunamadı. Lütfen "Yazıcılar" bölümünden bir yazıcıyı hesap yazıcısı olarak işaretleyin.');
                return;
            }

            // Helper to convert URL to Base64
            const urlToBase64 = async (url) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    });
                } catch (e) { return null; }
            };

            let logoToSend = posSettings?.logo_url;
            if (logoToSend && posSettings?.system_flags?.print_logo_on_receipt) {
                const base64 = await urlToBase64(logoToSend);
                if (base64) {
                    const pureBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
                    logoToSend = `BASE64IMG:${pureBase64}`;
                }
            }

            // Gather all items (paid and unpaid)
            const payload = {
                items: cart.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: parseFloat(item.price) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0),
                    status: item.status
                })),
                table_name: seatingAreas.find(a => a.id === selectedTable.seating_area_id)?.name + " - Masa " + selectedTable.name,
                personnel: currentStaff?.first_name
                    ? `${currentStaff.first_name}${currentStaff.last_name ? ' ' + currentStaff.last_name : ''}`
                    : user?.user_metadata?.first_name
                        ? `${user.user_metadata.first_name}${user.user_metadata.last_name ? ' ' + user.user_metadata.last_name : ''}`
                        : 'Personel',
                subtotal: cart.filter(i => i.status !== 'gift' && i.status !== 'waste').reduce((total, item) => total + ((parseFloat(item.price) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.quantity), 0),
                business_name: posSettings?.business_display_name || user?.business_name || 'SientoPOS İşletmesi',
                business_address: `${posSettings?.address || ''} ${posSettings?.district || ''} / ${posSettings?.city || ''}`.trim() || 'Merkez Åube - İ°stanbul',
                logo_url: logoToSend,
                print_logo_on_receipt: posSettings?.system_flags?.print_logo_on_receipt === true
            };

            const { error } = await supabase
                .from('print_jobs')
                .insert({
                    business_id: user.business_id,
                    printer_id: accountPrinter.id,
                    job_type: 'account_receipt',
                    payload: payload
                });

            if (error) throw error;
            alert('Hesap fişi yazıcıya gönderildi.');
        } catch (err) {
            console.error('Error printing account receipt:', err);
            alert('Yazdırma işlemi sırasında bir hata oluştu. (Tablo print_jobs mevcut mu?)');
        }
    };

    const handleOpenCashDrawer = async () => {
        try {
            const accountPrinter = printers.find(p => p.is_account_printer);

            if (!accountPrinter) {
                alert('Hata: Tanımlı bir hesap yazıcısı bulunamadı. Lütfen "Yazıcılar" bölümünden bir yazıcıyı hesap yazıcısı olarak işaretleyin.');
                return;
            }

            const { error } = await supabase
                .from('print_jobs')
                .insert({
                    business_id: user.business_id,
                    printer_id: accountPrinter.id,
                    job_type: 'open_drawer',
                    payload: { timestamp: new Date().toISOString() }
                });

            if (error) throw error;
            setIsHeaderActionMenuOpen(false);
            // Non-intrusive feedback
            console.log('Cash drawer open command sent');
        } catch (err) {
            console.error('Error opening cash drawer:', err);
            alert('Çekmece açılırken bir hata oluştu.');
        }
    };

    /**
     * Syncs processed items to the database with proper row splitting.
     * If only some items from a DB row (quantity > 1) are being processed,
     * this will decrement the original row and create a new row for the processed items.
     */
    const syncProcessedItems = async (selectedItems, actionType, paymentData = null, payerFullName = null, reason = '') => {
        // Group selected items by their database_id
        const itemsByDbId = {};
        selectedItems.forEach(item => {
            if (!item.database_id) return;
            if (!itemsByDbId[item.database_id]) {
                itemsByDbId[item.database_id] = [];
            }
            itemsByDbId[item.database_id].push(item);
        });

        // Process each database row
        for (const [dbId, items] of Object.entries(itemsByDbId)) {
            const processedCount = items.length;

            // Get the original DB row to check its quantity
            const { data: originalRow, error: fetchError } = await supabase
                .from('order_items')
                .select('*')
                .eq('id', dbId)
                .single();

            if (fetchError || !originalRow) {
                console.error('Error fetching original row:', fetchError);
                continue;
            }

            const originalQuantity = originalRow.quantity;
            const remainingQuantity = originalQuantity - processedCount;

            if (remainingQuantity > 0) {
                // SPLIT SCENARIO: Decrement original row and create new row for processed items

                // 1. Update original row to reduce quantity
                const { error: updateError } = await supabase
                    .from('order_items')
                    .update({ quantity: remainingQuantity })
                    .eq('id', dbId);

                if (updateError) {
                    console.error('Error updating original row:', updateError);
                    continue;
                }

                // 2. Create new row for processed items
                const newRowData = {
                    ...originalRow,
                    quantity: processedCount,
                    status: actionType === 'payment' ? 'paid' : actionType
                };

                delete newRowData.id;
                delete newRowData.created_at;

                if (actionType === 'payment' && paymentData) {
                    newRowData.payment_type = paymentData.method;
                    newRowData.paid_at = new Date().toISOString();
                    newRowData.paid_by_name = payerFullName;
                    newRowData.payment_id = paymentData.id;
                } else if (reason) {
                    newRowData.note = reason;
                }

                const { error: insertError } = await supabase
                    .from('order_items')
                    .insert([newRowData]);

                if (insertError) {
                    console.error('Error creating processed row:', insertError);
                }
            } else {
                // FULL SCENARIO: All items from this row are being processed
                const updateData = {
                    status: actionType === 'payment' ? 'paid' : actionType
                };

                if (actionType === 'payment' && paymentData) {
                    updateData.payment_type = paymentData.method;
                    updateData.paid_at = new Date().toISOString();
                    updateData.paid_by_name = payerFullName;
                    updateData.payment_id = paymentData.id;
                } else if (reason) {
                    updateData.note = reason;
                }

                const { error: updateError } = await supabase
                    .from('order_items')
                    .update(updateData)
                    .eq('id', dbId);

                if (updateError) {
                    console.error('Error updating full row:', updateError);
                }
            }
        }
    };

    const fetchTablePayments = async (tableId, openedAt) => {
        try {
            let query = supabase
                .from('payments')
                .select('*')
                .eq('table_id', tableId)
                .is('is_deleted', false)
                .order('created_at', { ascending: false });

            // CRITICAL FIX: Only fetch payments for the CURRENT session
            if (openedAt) {
                query = query.gte('created_at', openedAt);
            } else {
                // If table is not open (no openedAt), do not show old payments
                // This ensures "Clean" state as requested
                setTablePayments([]);
                return;
            }

            const { data, error } = await query;

            if (error) throw error;
            setTablePayments(data || []);
        } catch (err) {
            console.error('Error fetching table payments:', err);
        }
    };

    const handleTakePayment = () => {
        if (!selectedTable) {
            alert('Lütfen önce bir masa seçin.');
            return;
        }

        if (cart.length === 0 && selectedTable.current_total === 0) {
            alert('Ödeme alınacak ürün bulunmamaktadır.');
            return;
        }

        // Reset keypad input and fetch history
        setPaymentInputAmount('');
        fetchTablePayments(selectedTable.id, selectedTable.opened_at);
        setIsPaymentModalOpen(true);
    };

    // ... (keep intervening code) ...



    const handleKeypadPress = (val) => {
        setPaymentInputAmount(prev => {
            // If already has a comma and trying to add another, do nothing
            if (val === ',' && prev.includes(',')) return prev;
            // Prevent multiple leading zeros
            if (val === '0' && prev === '0') return prev;
            // If comma is first, add 0 before it
            if (val === ',' && prev === '') return '0,';

            return prev + val;
        });
    };

    const handleKeypadAction = (action) => {
        if (action === 'clear') {
            setPaymentInputAmount('');
        } else if (action === 'delete') {
            setPaymentInputAmount(prev => prev.slice(0, -1));
        } else if (action.startsWith('fraction-')) {
            const fraction = action.split('-')[1];
            if (!selectedTable) return;

            let total = parseFloat(selectedTable.current_total || 0);
            let amount = 0;

            if (fraction === 'n') {
                const count = prompt('Kaç bölü?', '5');
                if (count && !isNaN(count)) {
                    amount = total / parseInt(count);
                }
            } else {
                amount = total / parseInt(fraction);
            }

            if (amount > 0) {
                setPaymentInputAmount(amount.toFixed(2).replace('.', ','));
            }
        }
    };

    const confirmPayment = async (method) => {
        if (!selectedTable) {
            alert('Hata: Masa seçili değil.');
            return;
        }

        const selectedItems = cart.filter(i => i.selected);
        const isPartial = selectedItems.length > 0;
        const keypadAmount = paymentInputAmount ? parseFloat(paymentInputAmount.replace(',', '.')) : 0;

        // Calculate payment amount
        let paymentAmount = 0;
        if (keypadAmount > 0) {
            paymentAmount = keypadAmount;
        } else if (isPartial) {
            paymentAmount = selectedItems.reduce((total, item) => {
                const modifiersTotal = item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0;
                return total + (parseFloat(item.price) + modifiersTotal) * item.quantity;
            }, 0);
        } else {
            paymentAmount = parseFloat(selectedTable.current_total || 0);
        }

        if (paymentAmount <= 0) {
            alert('Hata: Ödeme tutarı 0 veya negatif olamaz.');
            return;
        }

        // Limit payment amount to table total
        const maxAllowed = parseFloat(selectedTable.current_total || 0);
        if (paymentAmount > maxAllowed + 0.01) {
            alert(`Hata: Ödeme tutarı (₺${paymentAmount}) kalan borçtan (₺${maxAllowed}) fazla olamaz.`);
            return;
        }

        try {
            // Get actual staff name for the person taking payment
            const payerFullName = user?.user_metadata?.first_name
                ? `${user.user_metadata.first_name}${user.user_metadata.last_name ? ' ' + user.user_metadata.last_name : ''}`
                : user?.email || 'Sistem';

            // 1. Create a payment record
            const { data: paymentData, error: paymentError } = await supabase
                .from('payments')
                .insert([{
                    business_id: user.business_id,
                    table_id: selectedTable.id,
                    staff_id: null,
                    staff_name: payerFullName,
                    amount: paymentAmount,
                    payment_method: method === 'cash' ? 'Nakit' : (method === 'credit_card' ? 'Kredi Kartı' : (method === 'mobile' ? 'Mobil Ödeme' : (method || 'Diğer'))),
                    source: 'Kullanıcı'
                }])
                .select()
                .single();

            if (paymentError) throw paymentError;

            // 2. Record payment/archive items logic
            if (isPartial) {
                // PARTIAL PAYMENT BY ITEMS
                const selectedDbIds = selectedItems.map(i => i.database_id).filter(id => id);
                if (selectedDbIds.length === 0) {
                    alert('Lütfen önce siparişleri onaylayıp mutfağa gönderin.');
                    setIsPaymentModalOpen(false);
                    return;
                }
                await syncProcessedItems(selectedItems, 'payment', { id: paymentData.id, method }, payerFullName);
            } else if (keypadAmount > 0 && keypadAmount < maxAllowed - 0.01) {
                // PARTIAL PAYMENT BY AMOUNT (Not specific items)
                // We don't mark specific items as paid, just reduce table total.
                // In a more advanced system, we'd distribute this amount among items.
                // For now, we'll leave items as they are but the table total will decrease.
            } else {
                // FULL PAYMENT
                const { error: itemsError } = await supabase
                    .from('order_items')
                    .update({
                        status: 'paid',
                        payment_type: method === 'cash' ? 'Nakit' : (method === 'credit_card' ? 'Kredi Kartı' : (method === 'mobile' ? 'Mobil Ödeme' : (method || 'Diğer'))),
                        paid_at: new Date().toISOString(),
                        paid_by_name: payerFullName,
                        payment_id: paymentData.id
                    })
                    .eq('table_id', selectedTable.id)
                    .is('is_deleted', false)
                    .in('status', ['sent', 'served', 'preparing', 'ready', 'sent_to_kitchen']);

                if (itemsError) throw itemsError;

                // 2b. Archive OTHER items (Cancelled, Waste, Gift)
                const { error: archiveError } = await supabase
                    .from('order_items')
                    .update({ payment_id: paymentData.id })
                    .eq('table_id', selectedTable.id)
                    .is('is_deleted', false)
                    .is('payment_id', null);

                if (archiveError) throw archiveError;
            }

            // 3. Update Table Status
            const currentTotal = parseFloat(selectedTable.current_total || 0);
            const remainingTotal = Math.max(0, currentTotal - paymentAmount);

            // If it's a full payment (no items selected), we close the table regardless of current_total value
            const isFullyPaid = remainingTotal < 0.05;

            const shouldAutoClose = posSettings?.system_flags?.close_table_on_payment !== false;
            const willCloseTable = isFullyPaid && shouldAutoClose;

            const tableUpdate = {
                current_total: isFullyPaid ? 0 : remainingTotal,
                is_occupied: !willCloseTable,
                opened_at: willCloseTable ? null : selectedTable.opened_at,
                last_order_at: willCloseTable ? null : selectedTable.last_order_at
            };

            const { error: tableError } = await supabase
                .from('tables')
                .update(tableUpdate)
                .eq('id', selectedTable.id);

            if (tableError) throw tableError;

            // 4. Finalize Local State
            setSelectedTable(prev => ({ ...prev, ...tableUpdate }));
            setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, ...tableUpdate } : t));

            if (isFullyPaid) {
                setCart([]);
                setIsCartSent(true);
                setIsPaymentModalOpen(false);
                setView('tables');
            } else {
                // For partial payment, refresh the items list to reflect paid ones
                await fetchTableOrders(selectedTable.id, selectedTable.opened_at);
                await fetchTablePayments(selectedTable.id, selectedTable.opened_at);
                setIsPaymentModalOpen(false);
                // Auto-collapse all groups after payment to keep it clean
                setExpandedGroups([]);
            }
        } catch (err) {
            console.error('Error during payment processing:', err);
            alert('Ödeme işlemi sırasında bir hata oluştu.');
        }
    };

    useEffect(() => {
        if (view !== 'login') return;

        const duration = 7000; // 7 seconds
        const interval = 100; // Update every 100ms
        let elapsed = 0;

        const timer = setInterval(() => {
            elapsed += interval;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setQrProgress(remaining);

            if (elapsed >= duration) {
                elapsed = 0;
                setQrToken(Date.now().toString());
            }
        }, interval);

        return () => clearInterval(timer);
    }, [view]);


    const fetchSeatingData = async () => {
        try {
            const { data: areas } = await supabase
                .from('seating_areas')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .order('sort_order', { ascending: true });

            setSeatingAreas(areas || []);
            if (areas?.length > 0 && !selectedAreaId) {
                setSelectedAreaId(areas[0].id);
            }

            const { data: allTables } = await supabase
                .from('tables')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            const sortedTables = (allTables || []).sort((a, b) => {
                const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
                const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
                return aNum - bNum;
            });

            setTables(sortedTables);
        } catch (err) {
            console.error('Error fetching seating data:', err);
        }
    };

    const fetchTasks = async () => {
        try {
            const { data } = await supabase
                .from('tasks')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            setTasks(data || []);
        } catch (err) {
            console.error('Error fetching tasks:', err);
        }
    };

    const handleCompleteTask = async (taskId) => {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', taskId);

            if (error) throw error;
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (err) {
            console.error('Error completing task:', err);
        }
    };

    const fetchShifts = async () => {
        try {
            const now = new Date();
            const shiftedNow = new Date(now.getTime() - (1 * 60 * 60 * 1000));
            const todayStr = shiftedNow.toLocaleDateString('en-CA'); // Day flips at 01:00 AM

            const { data } = await supabase
                .from('staff_shifts')
                .select(`
                    *,
                    staff:staff_id (first_name, last_name)
                `)
                .eq('business_id', user.business_id)
                .eq('date', todayStr)
                .order('start_time', { ascending: true });

            setShifts(data || []);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const fetchMenuData = async () => {
        try {
            const { data: catData } = await supabase
                .from('categories')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .eq('is_active', true)
                .order('sort_order', { ascending: true });

            const { data: prodData } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false)
                .eq('is_active', true)
                .order('id', { ascending: true });

            setCategories(catData || []);
            setProducts(prodData || []);

            // 3. Fetch Variations
            const { data: groups } = await supabase
                .from('modifier_groups')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            const { data: options } = await supabase
                .from('modifier_options')
                .select('*')
                .eq('business_id', user.business_id)
                .is('is_deleted', false);

            const { data: recipes } = await supabase
                .from('modifier_recipes')
                .select('*')
                .eq('business_id', user.business_id);

            setModifierGroups(groups || []);
            setModifierOptions(options || []);
            setModifierRecipes(recipes || []);

            // 4. Fetch Discounts
            const { data: hhData } = await supabase
                .from('happy_hours')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_active', true)
                .is('is_deleted', false);

            const { data: tdData } = await supabase
                .from('timed_discounts')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('is_active', true)
                .is('is_deleted', false);

            setHappyHours(hhData || []);
            setTimedDiscounts(tdData || []);

            if (catData?.length > 0) {
                const rootCats = catData.filter(c => !c.parent_id);
                if (rootCats.length > 0) {
                    const firstRoot = rootCats[0];
                    setActiveCategory(firstRoot);
                    const firstSub = catData.find(c => c.parent_id === firstRoot.id);
                    setActiveSubCategory(firstSub || null);
                }
            }
        } catch (err) {
            console.error('Error fetching menu data:', err);
        }
    };

    const fetchStatistics = async () => {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

            // SOURCE OF TRUTH: FETCH FROM PAYMENTS INSTEAD OF RPC
            console.log('Fetching POS stats via Payments table for:', { businessId: user.business_id, startOfMonth });

            const { data: paymentsData, error } = await supabase
                .from('payments')
                .select('amount, created_at')
                .eq('business_id', user.business_id)
                .gte('created_at', startOfMonth);

            if (error) {
                console.error('Stats fetch error:', error);
                throw error;
            }

            console.log('Payments data fetched for POS stats:', paymentsData?.length);

            if (!paymentsData) return;

            // Calculate Totals
            let daily = 0;
            let weekly = 0;
            let monthly = 0;

            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const dayMap = {};
            for (let i = 1; i <= daysInMonth; i++) {
                dayMap[i] = 0;
            }

            const today = now.toISOString().split('T')[0];
            const startOfWeek = new Date(now);
            const dayNum = startOfWeek.getDay() || 7;
            if (dayNum !== 1) startOfWeek.setDate(startOfWeek.getDate() - (dayNum - 1));
            startOfWeek.setHours(0, 0, 0, 0);

            paymentsData.forEach(p => {
                const pDate = new Date(p.created_at);
                const pDateStr = pDate.toISOString().split('T')[0];
                const dayOfMonth = pDate.getDate();
                const pTotal = parseFloat(p.amount || 0);

                // Monthly Total
                monthly += pTotal;

                // Daily Total
                if (pDateStr === today) {
                    daily += pTotal;
                }

                // Weekly Total
                if (pDate >= startOfWeek) {
                    weekly += pTotal;
                }

                // Chart Data (Daily breakdown)
                if (dayMap[dayOfMonth] !== undefined) {
                    dayMap[dayOfMonth] += pTotal;
                }
            });

            // Format Chart Data
            const chartData = Object.keys(dayMap).map(day => ({
                name: day,
                ciro: dayMap[day]
            }));

            setStatsData({
                dailyTotal: daily,
                weeklyTotal: weekly,
                monthlyTotal: monthly,
                chartData
            });

        } catch (err) {
            console.error('Error fetching statistics:', err);
        }
    };

    // Real-time Menu Updates
    useEffect(() => {
        if (!user || !user.business_id || view === 'login') return;

        console.log('Setting up real-time menu subscriptions...');

        const categorySubscription = supabase
            .channel('realtime:categories')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'categories',
                filter: `business_id=eq.${user.business_id}`
            }, () => {
                console.log('Category change detected, refreshing menu...');
                fetchMenuData();
            })
            .subscribe();

        const productSubscription = supabase
            .channel('realtime:products')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'products',
                filter: `business_id=eq.${user.business_id}`
            }, () => {
                console.log('Product change detected, refreshing menu...');
                fetchMenuData();
            })
            .subscribe();

        const tableSubscription = supabase
            .channel('realtime:tables')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tables',
                filter: `business_id=eq.${user.business_id}`
            }, (payload) => {
                console.log('Table change detected:', payload);
                if (payload.eventType === 'UPDATE') {
                    setTables(prev => {
                        const newTables = prev.map(t => t.id === payload.new.id ? payload.new : t);
                        return [...newTables].sort((a, b) => {
                            const aNum = parseInt(a.name.replace(/\D/g, '')) || 0;
                            const bNum = parseInt(b.name.replace(/\D/g, '')) || 0;
                            return aNum - bNum;
                        });
                    });
                    if (selectedTable?.id === payload.new.id) {
                        setSelectedTable(payload.new);
                    }
                } else {
                    fetchSeatingData();
                }
            })
            .subscribe();

        const seatingAreaSubscription = supabase
            .channel('realtime:seating_areas')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'seating_areas',
                filter: `business_id=eq.${user.business_id}`
            }, () => {
                console.log('Seating area change detected, refreshing...');
                fetchSeatingData();
            })
            .subscribe();

        const settingsSubscription = supabase
            .channel('realtime:pos_settings_pos')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'pos_settings',
                filter: `business_id=eq.${user.business_id}`
            }, () => {
                console.log('Settings updated, refreshing...');
                fetchSettings();
            })
            .subscribe();

        const orderItemSubscription = supabase
            .channel('realtime:order_items')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'order_items',
                filter: `business_id=eq.${user.business_id}`
            }, (payload) => {
                console.log('Order item change detected:', payload);
                if (selectedTable && (payload.new?.table_id === selectedTable.id || payload.old?.table_id === selectedTable.id)) {
                    fetchTableOrders(selectedTable.id);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(categorySubscription);
            supabase.removeChannel(productSubscription);
            supabase.removeChannel(tableSubscription);
            supabase.removeChannel(orderItemSubscription);
            supabase.removeChannel(seatingAreaSubscription);
            supabase.removeChannel(settingsSubscription);
        };
    }, [user, view]);

    const handleCloseTable = async () => {
        if (!selectedTable) return;

        if (!confirm('Masayı kapatmak istediğinize emin misiniz?')) return;

        try {
            const { error } = await supabase
                .from('tables')
                .update({
                    is_occupied: false,
                    opened_at: null,
                    last_order_at: null,
                    current_total: 0
                })
                .eq('id', selectedTable.id);

            if (error) throw error;

            // Update Local State
            setTables(prev => prev.map(t => t.id === selectedTable.id ? {
                ...t,
                is_occupied: false,
                opened_at: null,
                last_order_at: null,
                current_total: 0
            } : t));

            setCart([]);
            setIsCartSent(true);
            setView('tables');
        } catch (err) {
            console.error('Error closing table:', err);
            alert('Masa kapatılırken hata oluştu: ' + err.message);
        }
    };

    const handleSelfServiceClick = async () => {
        try {
            // 1. Check if table exists
            let selfServiceTable = tables.find(t =>
                t.name.toLowerCase() === 'self servis' ||
                t.name.toLowerCase() === 'self service'
            );

            if (selfServiceTable) {
                handleTableClick(selfServiceTable);
                return;
            }

            // 2. If not, check if area exists
            let selfServiceArea = seatingAreas.find(a =>
                a.name.toLowerCase() === 'self servis' ||
                a.name.toLowerCase() === 'self service'
            );

            // 3. Create area if needed
            if (!selfServiceArea) {
                const { data: newArea, error: areaError } = await supabase
                    .from('seating_areas')
                    .insert([{
                        business_id: user.business_id,
                        name: 'Self Servis',
                        sort_order: 999
                    }])
                    .select()
                    .single();

                if (areaError) throw areaError;
                selfServiceArea = newArea;
                setSeatingAreas(prev => [...prev, newArea]);
            }

            // 4. Create table
            const { data: newTable, error: tableError } = await supabase
                .from('tables')
                .insert([{
                    business_id: user.business_id,
                    seating_area_id: selfServiceArea.id,
                    name: 'Self Servis',
                    is_occupied: false
                }])
                .select()
                .single();

            if (tableError) throw tableError;

            // 5. Update state and open
            setTables(prev => [...prev, newTable]);
            handleTableClick(newTable);

        } catch (err) {
            console.error('Error in self service setup:', err);
            alert('Self Servis alanı oluşturulurken bir hata oluştu.');
        }
    };

    const handleMoveTable = async (targetTable) => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            // 1. Update order_items table_id
            const { error: itemsError } = await supabase
                .from('order_items')
                .update({ table_id: targetTable.id })
                .eq('table_id', selectedTable.id)
                .is('payment_id', null)
                .is('is_deleted', false);

            if (itemsError) throw itemsError;

            // 2. Update target table metadata
            const { error: targetError } = await supabase
                .from('tables')
                .update({
                    is_occupied: true,
                    current_total: selectedTable.current_total,
                    opened_at: selectedTable.opened_at,
                    last_order_at: selectedTable.last_order_at
                })
                .eq('id', targetTable.id);

            if (targetError) throw targetError;

            // 3. Reset source table metadata
            const { error: sourceError } = await supabase
                .from('tables')
                .update({
                    is_occupied: false,
                    current_total: 0,
                    opened_at: null,
                    last_order_at: null
                })
                .eq('id', selectedTable.id);

            if (sourceError) throw sourceError;

            // 4. Finalize
            setIsMovingMode(false);

            // Re-fetch seating data to update state
            await fetchSeatingData();

            // Switch to the target table view
            const updatedTargetTable = {
                ...targetTable,
                is_occupied: true,
                current_total: selectedTable.current_total,
                opened_at: selectedTable.opened_at,
                last_order_at: selectedTable.last_order_at
            };

            // Switch view immediately without calling handleTableClick (to Avoid isMovingMode race)
            setCart([]);
            setIsCartSent(true);
            setSelectedTable(updatedTargetTable);
            setView('table-detail');
            fetchTableOrders(updatedTargetTable.id, updatedTargetTable.opened_at);
            alert('Masa Taşındı');
        } catch (err) {
            console.error('Error moving table:', err);
            alert('Masa taşınırken hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMergeTables = async (targetTable) => {
        if (!selectedTable) return;
        setLoading(true);
        try {
            // 1. Transfer items from targetTable to selectedTable
            const { error: itemsError } = await supabase
                .from('order_items')
                .update({ table_id: selectedTable.id })
                .eq('table_id', targetTable.id)
                .is('payment_id', null)
                .is('is_deleted', false);

            if (itemsError) throw itemsError;

            // 2. Update current table metadata
            const newTotal = parseFloat(selectedTable.current_total || 0) + parseFloat(targetTable.current_total || 0);
            const { error: targetMetaError } = await supabase
                .from('tables')
                .update({
                    is_occupied: true,
                    current_total: newTotal
                })
                .eq('id', selectedTable.id);

            if (targetMetaError) throw targetMetaError;

            // 3. Reset source table (the one being merged FROM)
            const { error: sourceError } = await supabase
                .from('tables')
                .update({
                    is_occupied: false,
                    current_total: 0,
                    opened_at: null,
                    last_order_at: null
                })
                .eq('id', targetTable.id);

            if (sourceError) throw sourceError;

            // 4. Finalize
            setIsMergingMode(false);
            await fetchSeatingData();

            // Refresh current view
            const updatedTable = {
                ...selectedTable,
                is_occupied: true,
                current_total: newTotal
            };
            setSelectedTable(updatedTable);
            fetchTableOrders(updatedTable.id, updatedTable.opened_at);

            alert('Masa Birleştirildi');
        } catch (err) {
            console.error('Error merging tables:', err);
            alert('Masa birleştirilirken hata: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTableClick = async (table) => {
        // 1. Moving Mode Logic
        if (isMovingMode) {
            if (table.id === selectedTable?.id) {
                setIsMovingMode(false);
                return;
            }
            if (table.is_occupied) {
                alert('Dolu bir masaya taşıma yapamazsınız.');
                return;
            }
            setIsMovingMode(false);
            handleMoveTable(table);
            return;
        }

        // 2. Merging Mode Logic
        if (isMergingMode) {
            if (table.id === selectedTable?.id) {
                setIsMergingMode(false);
                return;
            }
            if (!table.is_occupied) {
                alert('Boş bir masayı birleştiremezsiniz.');
                return;
            }
            setIsMergingMode(false);
            handleMergeTables(table);
            return;
        }

        // 3. Normal Table Opening Logic
        setSelectedTable(table);
        setActiveSidebarTab('sepet');
        setIsActionMenuOpen(false);

        if (table.is_occupied) {
            // Fetch items and payments for the current session
            fetchTableOrders(table.id, table.opened_at);
            fetchTablePayments(table.id, table.opened_at);
        } else {
            // Clear state for new/empty table
            setCart([]);
            setTablePayments([]);
            setPaymentInputAmount('');
        }
        setView('table-detail');
    };

    // Helper function to group cart items by product, modifiers, and status
    const groupCartItems = (cartItems) => {
        // Filter out items that are marked as hidden discounts in metadata
        const visibleItems = cartItems.filter(i => !i.metadata?.is_discount);

        const activeItems = visibleItems.filter(i => !['paid', 'gift', 'waste', 'cancel'].includes(i.status));
        const processedItems = visibleItems.filter(i => ['paid', 'gift', 'waste', 'cancel'].includes(i.status));

        const groupedActive = [];
        activeItems.forEach((item, index) => {
            // Find the index in the original cartItems for toggleItemSelection
            const originalIndex = cart.indexOf(item);
            const modifiersKey = JSON.stringify(item.selectedModifiers || []);
            const groupKey = `${item.id}-${modifiersKey}`;

            const existingGroup = groupedActive.find(g => g.key === groupKey);
            if (existingGroup) {
                existingGroup.items.push({ ...item, originalIndex });
            } else {
                groupedActive.push({
                    key: groupKey,
                    name: item.name,
                    price: item.price,
                    status: 'active',
                    selectedModifiers: item.selectedModifiers,
                    items: [{ ...item, originalIndex }],
                    isGroup: true
                });
            }
        });

        // Finalize groups: if a group has only 1 item, treat it as a flat item
        const finalActive = [];
        groupedActive.forEach(group => {
            if (group.items.length > 1) {
                finalActive.push(group);
            } else {
                // Push as a flat item with isGroup: false
                finalActive.push({
                    ...group.items[0],
                    isGroup: false
                });
            }
        });

        // Processed items are returned individually
        const flatProcessed = processedItems.map(item => ({
            ...item,
            originalIndex: cart.indexOf(item),
            isGroup: false
        }));

        return [...finalActive, ...flatProcessed];
    };

    // Helper function to toggle group expansion
    const toggleGroupExpansion = (groupKey) => {
        setExpandedGroups(prev =>
            prev.includes(groupKey)
                ? prev.filter(k => k !== groupKey)
                : [...prev, groupKey]
        );
    };


    const fetchTableOrders = async (tableId, openedAt = null) => {
        try {
            const sessionStart = openedAt || selectedTable?.opened_at;

            // If we don't have a session start time, fallback to fetching only active items
            // But usually we should have it.
            let query = supabase
                .from('order_items')
                .select('*')
                .eq('table_id', tableId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });

            if (sessionStart) {
                // SAFE FETCH STRATEGY:
                // Clock skew between Client (opened_at) and Server (created_at) can hide items.
                // 1. Fetch a wider range (last 24 hours) from DB.
                // 2. Filter locally using relevant timestamps.
                const bufferHours = 24;
                const safeStartTime = new Date(new Date(sessionStart).getTime() - bufferHours * 60 * 60 * 1000).toISOString();

                query = query.gte('created_at', safeStartTime);
            } else {
                query = query.is('payment_id', null);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Local Filter for Precision & Skew Handling
            const filteredData = sessionStart ? (data || []).filter(item => {
                // 1. Waste and Cancel items should ALWAYS be hidden
                if (item.status === 'waste' || item.status === 'cancel') return false;

                // 2. Always show active items (no payment_id or explicitly active status)
                if (!item.payment_id || !item.status || ['sent', 'served', 'preparing', 'ready'].includes(item.status)) return true;

                const sess = new Date(sessionStart).getTime();

                // 3. Paid items: ONLY show if they were paid DURING the current session
                if (item.status === 'paid' && item.paid_at) {
                    const paidTime = new Date(item.paid_at).getTime();
                    if (paidTime >= (sess - 1000)) return true;
                }

                // 4. Gift items: Stay visible if they belong to this session
                if (item.status === 'gift') {
                    const addedTime = new Date(item.created_at).getTime();
                    if (addedTime >= (sess - 1000)) return true;
                }

                // Any other case should be hidden
                return false;
            }) : (data || []).filter(item => item.status !== 'waste' && item.status !== 'cancel');

            if (filteredData) {
                const formattedItems = [];
                filteredData.forEach(dbItem => {
                    // Explode items with quantity > 1 into individual items for selection
                    for (let i = 0; i < dbItem.quantity; i++) {
                        formattedItems.push({
                            database_id: dbItem.id, // Same database_id for grouping logic if needed
                            id: dbItem.product_id,
                            name: dbItem.name,
                            price: dbItem.price,
                            quantity: 1, // Individualized
                            note: dbItem.note,
                            selectedModifiers: dbItem.modifiers,
                            selected: false,
                            status: dbItem.status,
                            addedAt: dbItem.created_at,
                            staff_name: dbItem.staff_name,
                            metadata: dbItem.metadata
                        });
                    }
                });
                setCart(formattedItems);
                setIsCartSent(true);
            } else {

                setCart([]);
                setIsCartSent(true);
            }
        } catch (err) {
            console.error('Error fetching table orders:', err);
        }
    };

    const handlePinInput = (num) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
        }
    };





    const handlePinDelete = () => {

        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = async () => {
        if (pin.length !== 4) {
            setError('Lütfen 4 haneli PIN kodunuzu giriniz.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            console.log('Attempting login with:', {
                business_id: user?.business_id,
                pin: pin,
                is_active: true,
                is_archived: false
            });

            const { data, error: staffError } = await supabase
                .from('staff')
                .select('*')
                .eq('business_id', user.business_id)
                .eq('pin_code', pin)
                .eq('is_active', true)
                .eq('is_archived', false)
                .single();

            console.log('Login query result:', { data, staffError });

            if (staffError || !data) {
                setError('Geçersiz PIN kodu.');
                setPin('');
            } else {
                setCurrentStaff(data);
                setView('tables');
            }
        } catch (err) {
            setError('Giriş yapılırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (view === 'login') {
        return (
            <div className="h-screen w-full bg-[#f8fafc] flex flex-col font-sans overflow-hidden fixed inset-0">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-8 py-3 flex justify-between items-center shadow-sm z-20">
                    <div className="flex items-center justify-center">
                        <h1 className="text-[#FF5F00] text-xl font-black italic tracking-tighter">
                            Siento<span className="text-[#FF5F00]/80">POS</span>
                        </h1>
                    </div>
                </div>

                {/* Main Content Area - Full Screen Centering */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 relative">
                    <div className="bg-white rounded-[40px] shadow-2xl p-10 flex gap-16 items-center border border-gray-50 max-w-[900px] w-full justify-center relative z-10">
                        {/* PIN Pad Section */}
                        <div className="w-[320px] flex flex-col space-y-5">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                <input
                                    type="password"
                                    readOnly
                                    value={pin.split('').map(() => '•').join('')}
                                    placeholder="Pin kodunuzu giriniz"
                                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl py-4 px-12 text-center text-xl font-medium tracking-[0.5em] focus:outline-none placeholder:text-gray-300 placeholder:tracking-normal text-gray-900"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                                    <button
                                        key={num}
                                        onClick={() => handlePinInput(num.toString())}
                                        className={`h-14 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-xl font-bold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all shadow-sm ${num === 0 ? 'col-span-2' : ''}`}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={handlePinDelete}
                                    className="h-14 flex items-center justify-center bg-red-50 text-red-400 border border-red-100 rounded-xl text-lg font-bold hover:bg-red-100 active:scale-95 transition-all shadow-sm"
                                >
                                    Sil
                                </button>
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-[#5D5FEF] text-white py-4.5 rounded-2xl text-lg font-bold hover:bg-[#4e50d6] active:scale-[0.98] transition-all shadow-lg shadow-indigo-100 mt-2 disabled:opacity-50"
                            >
                                {loading ? 'Giriş Yapılıyor...' : 'Oturum Aç'}
                            </button>

                            {error && <p className="text-red-500 text-center font-bold text-sm">{error}</p>}
                        </div>

                        {/* QR Section */}
                        <div className="w-[300px] flex flex-col items-center justify-center space-y-6">
                            <div className="p-4 bg-white border border-gray-100 rounded-[40px] shadow-lg overflow-hidden">
                                <QRCode.QRCodeSVG
                                    value={`https://sientopos.com/isletme/mesai-qr?business_id=${user?.business_id}&t=${qrToken}`}
                                    size={220}
                                    level="H"
                                    includeMargin={true}
                                />
                            </div>

                            <div className="w-full space-y-4">
                                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#5D5FEF] transition-all duration-100 ease-linear shadow-[0_0_8px_rgba(93,95,239,0.3)]"
                                        style={{ width: `${qrProgress}%` }}
                                    ></div>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-3 text-[#1a1a1a] font-black text-xl">
                                        <Phone size={22} className="fill-current" />
                                        <span>0 551 494 93 11</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-gray-100 py-3 flex justify-between items-center px-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-20">
                    <div className="flex flex-col">
                        <span className="font-extrabold text-[#1a1a1a] text-[15px] leading-tight">
                            {user?.business_name || 'İşletme Adı'}
                        </span>
                    </div>

                    <div className="hidden lg:flex items-center gap-10 font-bold text-[#475569]">
                        <button className="flex items-center gap-2 hover:text-[#5D5FEF] transition-all group">
                            <div className="p-2 rounded-xl group-hover:bg-[#F0F5FF] transition-all">
                                <LayoutGrid size={22} />
                            </div>
                            <span className="text-[15px]">Masalar</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-[#5D5FEF] transition-all group">
                            <div className="p-2 rounded-xl group-hover:bg-[#F0F5FF] transition-all">
                                <Target size={22} />
                            </div>
                            <span className="text-[15px]">Görevler</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-[#5D5FEF] transition-all group">
                            <div className="p-2 rounded-xl group-hover:bg-[#F0F5FF] transition-all">
                                <Clock size={22} />
                            </div>
                            <span className="text-[15px]">Mesailer</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-[#5D5FEF] transition-all group">
                            <div className="p-2 rounded-xl group-hover:bg-[#F0F5FF] transition-all">
                                <Bell size={22} />
                            </div>
                            <span className="text-[15px]">Paket Servis</span>
                        </button>

                    </div>

                    <div className="flex items-center gap-4 text-gray-400">
                        <span className="text-[11px] font-bold tracking-tight text-gray-400/70">Siento<span className="text-gray-400/50">POS</span> - V: 0.1.12</span>
                        <div className="flex items-center gap-2">
                            <Wifi size={18} className="text-green-500/50" />
                            <CreditCard size={18} />
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-[#f8fafc] flex flex-col font-sans overflow-hidden fixed inset-0">
            {/* Top Bar */}
            <div className="bg-[#545454] p-3 flex justify-between items-center text-white px-8 shadow-md z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center">
                        <h1 className="text-[#FF5F00] text-xl font-black italic tracking-tighter">
                            Siento<span className="text-[#FF5F00]/80">POS</span>
                        </h1>
                    </div>
                    <div className="h-6 w-[1px] bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight">
                            {view === 'tables' ? 'BÖLÜMLER / MASALAR' :
                                view === 'tasks' ? 'GÜNLÜK GÖREVLER' :
                                    view === 'shifts' ? 'GÜNLÜK MESAİ LİSTESİ' :
                                        view === 'delivery' ? 'PAKET SERVİS' : 'BÖLÜMLER / MASALAR'}
                        </span>
                    </div>
                </div>
                <div className="flex-1 flex justify-center px-4 max-w-4xl">
                    <div className="flex w-full items-stretch gap-0 bg-white rounded-md overflow-hidden shadow-sm">
                        <div className="flex items-center px-3 text-gray-400">
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Ürün Ara"
                            className="flex-1 bg-transparent py-2 px-1 text-sm font-bold text-gray-800 placeholder-gray-300 focus:outline-none"
                        />
                        <button className="bg-white border-l border-gray-100 px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all uppercase tracking-wide">
                            Ara
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 backdrop-blur-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        Paket Sipariş
                    </button>
                    <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-black opacity-90">
                            {currentStaff?.first_name} {currentStaff?.last_name}
                        </span>
                        <button
                            onClick={() => {
                                setCurrentStaff(null);
                                setView('login');
                            }}
                            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                        >
                            <Lock size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Sub-Header (Area Navigation) - Only on Tables view */}
            {view === 'tables' && (
                <div className="bg-white border-b border-gray-100 px-8 py-2 flex items-center shadow-sm z-10 shrink-0">
                    <div className="flex bg-gray-50 p-1 rounded-xl overflow-x-auto scroller-hidden">
                        {seatingAreas.map(area => (
                            <button
                                key={area.id}
                                onClick={() => setSelectedAreaId(area.id)}
                                className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedAreaId === area.id
                                    ? 'bg-white text-[#FF5F00] shadow-sm'
                                    : 'text-gray-400 hover:text-[#FF5F00]'
                                    }`}
                            >
                                {area.name}
                            </button>
                        ))}
                        <button
                            onClick={() => setSelectedAreaId('open_tables')}
                            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${selectedAreaId === 'open_tables'
                                ? 'bg-white text-[#FF5F00] shadow-sm'
                                : 'text-gray-400 hover:text-[#FF5F00]'
                                }`}
                        >
                            Açık Masalar
                        </button>
                        {posSettings?.system_flags?.enable_quick_sale && (
                            <button
                                onClick={handleSelfServiceClick}
                                className="px-6 py-2 rounded-lg text-sm font-bold transition-all text-gray-400 hover:text-[#FF5F00] hover:bg-white/50 flex items-center gap-2 whitespace-nowrap"
                            >
                                <LayoutGrid size={16} />
                                Self Servis
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Main Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#F8FAFC]">



                {/* Main Content (Scrollable) */}

                {
                    view === 'tables' && isMovingMode && (
                        <div className="mb-6 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-2xl p-4 flex justify-between items-center shadow-sm max-w-[1800px] mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white">
                                    <Move size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-indigo-900 leading-tight uppercase">Masa Taşıma Modu</h2>
                                    <p className="text-sm font-bold text-indigo-700/70">Taşımak istediğiniz boş masayı seçin: <span className="text-indigo-900">{selectedTable?.name}</span> â†’ ?</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMovingMode(false)}
                                className="bg-white text-indigo-600 px-6 py-2 rounded-xl text-sm font-black hover:bg-white/80 transition-all border border-indigo-100 shadow-sm"
                            >
                                İptal Et
                            </button>
                        </div>
                    )
                }
                {
                    view === 'tables' && isMergingMode && (
                        <div className="mb-6 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-4 flex justify-between items-center shadow-sm max-w-[1800px] mx-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white">
                                    <GitMerge size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-amber-900 leading-tight uppercase">Masa Birleştirme Modu</h2>
                                    <p className="text-sm font-bold text-amber-700/70">İ°çeriğini bu masaya (<span className="text-amber-900">{selectedTable?.name}</span>) aktarmak istediğiniz DOLU masayı seçin.</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsMergingMode(false)}
                                className="bg-white text-amber-600 px-6 py-2 rounded-xl text-sm font-black hover:bg-white/80 transition-all border border-amber-100 shadow-sm"
                            >
                                İptal Et
                            </button>
                        </div>
                    )
                }
                {
                    view === 'tables' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 max-w-[1800px] mx-auto">
                            {tables
                                .filter(t => {
                                    if (selectedAreaId === 'open_tables') {
                                        return t.is_occupied;
                                    }
                                    const isInArea = t.seating_area_id === selectedAreaId;
                                    if (isMovingMode) {
                                        return isInArea && !t.is_occupied;
                                    }
                                    if (isMergingMode) {
                                        return isInArea && t.is_occupied && t.id !== selectedTable?.id;
                                    }
                                    return isInArea;
                                })
                                .map(table => (
                                    <div
                                        key={table.id}
                                        onClick={() => handleTableClick(table)}
                                        className={`rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col min-h-[160px] overflow-hidden ${table.is_occupied ? 'bg-red-100 border-red-200' : 'bg-white border-gray-100'}`}
                                    >
                                        {/* Top Section with Badge */}
                                        <div className="p-5 flex justify-center items-center">
                                            <div className="px-8 py-2.5 rounded-full text-[15px] font-bold transition-all shadow-sm bg-orange-50 text-[#FF5F00] border border-orange-100 uppercase tracking-tight">
                                                {seatingAreas.find(a => a.id === table.seating_area_id)?.name} - Masa {table.name}
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="h-[1px] bg-gray-100 w-full"></div>

                                        {/* Bottom Section with Data */}
                                        <div className={`flex-1 grid grid-cols-2 gap-2 p-4 items-center ${table.is_occupied ? '' : 'bg-white'}`}>
                                            <div className={`flex flex-col items-center border-r ${table.is_occupied ? 'border-red-200/50' : 'border-gray-50'}`}>
                                                <span className={`${table.is_occupied ? 'text-gray-600' : 'text-[#64748B]'} text-xs lg:text-sm font-bold whitespace-nowrap`}>Toplam tutar</span>
                                                <span className={`${table.is_occupied ? 'text-gray-900' : 'text-gray-800'} text-lg lg:text-xl font-black mt-1`}>
                                                    {table.is_occupied ? `₺${parseFloat(table.current_total || 0).toFixed(2).replace('.', ',')}` : '-'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className={`${table.is_occupied ? 'text-gray-600' : 'text-[#64748B]'} text-xs lg:text-sm font-bold whitespace-nowrap`}>Son sipariş</span>
                                                <span className={`${table.is_occupied ? 'text-gray-900 font-mono tracking-tighter' : 'text-gray-800'} text-lg lg:text-xl font-black mt-1`}>
                                                    {table.is_occupied ? formatDigitalDuration(table.last_order_at) : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Table Bottom Footer - Opening Time (Only for Occupied) */}
                                        {table.is_occupied && (
                                            <div className="bg-red-200/40 px-4 py-2 border-t border-red-200/30 flex items-center justify-center gap-2 group-hover:bg-red-200/50 transition-colors">
                                                <span className="text-[12px] font-bold text-gray-700">Açılış :</span>
                                                <Clock size={14} className="text-gray-500" />
                                                <span className="text-[12px] font-mono font-black text-gray-800">{formatDuration(table.opened_at)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )
                }

                {
                    view === 'tasks' && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-gray-800">Aktif Görevler</h2>
                                <div className="bg-[#5D5FEF] text-white px-4 py-2 rounded-xl text-sm font-bold">
                                    {tasks.length} Görev Bulundu
                                </div>
                            </div>
                            <div className="space-y-3">
                                {tasks.map(task => (
                                    <div key={task.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between hover:border-[#5D5FEF]/30 transition-all">
                                        <div className="flex items-center gap-5">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${task.priority === 'Acil' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#5D5FEF]'}`}>
                                                <Bell size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-gray-800">{task.task_title}</h3>
                                                <p className="text-sm text-gray-400 font-bold">{task.task_description}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleCompleteTask(task.id)}
                                                className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm group"
                                                title="Görevi Sil"
                                            >
                                                <Trash2 size={20} className="transition-transform group-hover:scale-110" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                }

                {
                    view === 'shifts' && (
                        <div className="max-w-4xl mx-auto space-y-4">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-gray-800">Bugünkü Mesailer</h2>
                                <div className="bg-[#5D5FEF] text-white px-4 py-2 rounded-xl text-sm font-bold">
                                    {shifts.length} Kayıt Bulundu
                                </div>
                            </div>
                            <div className="space-y-3">
                                {shifts.length === 0 ? (
                                    <div className="bg-white p-10 rounded-[24px] text-center text-gray-400 font-bold border border-dashed border-gray-200">
                                        Bugün için henüz mesai kaydı bulunmuyor.
                                    </div>
                                ) : (
                                    shifts.map(shift => (
                                        <div key={shift.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex items-center justify-between hover:border-[#5D5FEF]/30 transition-all">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5D5FEF] flex items-center justify-center">
                                                    <Clock size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-gray-800">
                                                        {shift.staff?.first_name} {shift.staff?.last_name}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 font-bold">
                                                        {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="px-4 py-1.5 rounded-full text-[13px] font-black bg-emerald-50 text-emerald-600">
                                                    {shift.total_hours || '0'} saat
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                }

                {
                    view === 'statistics' && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 p-8">
                            {/* Header & Controls */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">Ciro İstatistikleri</h2>
                                    <p className="text-gray-400 font-bold mt-1">İşletmenizin finansal durumunu takip edin.</p>
                                </div>
                                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
                                    {['daily', 'weekly', 'monthly'].map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setStatsTimeRange(range)}
                                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${statsTimeRange === range
                                                ? 'bg-[#5D5FEF] text-white shadow-md'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {range === 'daily' ? 'Günlük' : range === 'weekly' ? 'Haftalık' : 'Aylık'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                    <div className="relative">
                                        <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Günlük Ciro</p>
                                        <h3 className="text-4xl font-black text-gray-800">
                                            ₺{statsData.dailyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        <div className="mt-4 flex items-center text-emerald-500 font-bold text-sm bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                            <ArrowUpRight size={16} className="mr-1" />
                                            <span>Bugün</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                    <div className="relative">
                                        <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Haftalık Ciro</p>
                                        <h3 className="text-4xl font-black text-gray-800">
                                            ₺{statsData.weeklyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        <div className="mt-4 flex items-center text-orange-500 font-bold text-sm bg-orange-50 w-fit px-3 py-1 rounded-full">
                                            <Clock size={16} className="mr-1" />
                                            <span>Bu Hafta</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                    <div className="relative">
                                        <p className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Aylık Ciro</p>
                                        <h3 className="text-4xl font-black text-gray-800">
                                            ₺{statsData.monthlyTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </h3>
                                        <div className="mt-4 flex items-center text-blue-500 font-bold text-sm bg-blue-50 w-fit px-3 py-1 rounded-full">
                                            <LayoutGrid size={16} className="mr-1" />
                                            <span>Bu Ay</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chart Area */}
                            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="font-black text-xl text-gray-800">Satış Grafiği (Bu Ay)</h3>
                                    <div className="flex gap-2 text-sm font-bold text-gray-400">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-[#5D5FEF]"></div>
                                            <span>Günlük Toplam</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsBarChart data={statsData.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                                tickFormatter={(value) => `₺${value}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ color: '#5D5FEF', fontWeight: 'bold' }}
                                                formatter={(value) => [`₺${value.toLocaleString('tr-TR')}`, 'Ciro']}
                                                labelStyle={{ fontWeight: 'bold', color: '#1a1a1a', marginBottom: '4px' }}
                                            />
                                            <Bar
                                                dataKey="ciro"
                                                fill="#5D5FEF"
                                                radius={[6, 6, 6, 6]}
                                                barSize={12}
                                                activeBar={{ fill: '#4B4DDF' }}
                                            />
                                        </RechartsBarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                        </div>
                    )}
            </div>

            {
                view === 'table-detail' && selectedTable && (
                    <div className="fixed inset-0 top-[64px] bottom-[72px] flex overflow-hidden bg-white z-30">
                        <div className="flex-1 flex overflow-hidden">
                            {/* Main Interaction Area */}
                            {isPaymentModalOpen ? (
                                <div className="flex-1 flex flex-col bg-white overflow-hidden items-center justify-center p-20 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="text-center mb-16">
                                        <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center text-[#5D5FEF] mx-auto mb-6 shadow-sm">
                                            <Target size={48} />
                                        </div>
                                        <h2 className="text-4xl font-black text-gray-800 uppercase tracking-tighter mb-3">Ödeme Seçenekleri</h2>
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">Lütfen ödeme yöntemini seçin</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10 w-full max-w-3xl">
                                        <button
                                            onClick={() => confirmPayment('cash')}
                                            className="aspect-square bg-emerald-50 hover:bg-emerald-100 border-4 border-emerald-100/50 rounded-[48px] flex flex-col items-center justify-center gap-8 transition-all active:scale-95 group shadow-2xl shadow-emerald-100/20"
                                        >
                                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-emerald-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
                                                <DollarSign size={56} strokeWidth={2.5} />
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-3xl font-black text-emerald-900 uppercase tracking-tight">Nakit</span>
                                                <span className="text-[11px] font-black text-emerald-600/60 uppercase tracking-widest mt-1 block">Hızlı Ödeme</span>
                                            </div>
                                        </button>

                                        <button
                                            onClick={() => confirmPayment('credit_card')}
                                            className="aspect-square bg-indigo-50 hover:bg-indigo-100 border-4 border-indigo-100/50 rounded-[48px] flex flex-col items-center justify-center gap-8 transition-all active:scale-95 group shadow-2xl shadow-indigo-100/20"
                                        >
                                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center text-[#5D5FEF] shadow-xl group-hover:scale-110 transition-transform duration-300">
                                                <CreditCard size={56} strokeWidth={2.5} />
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-3xl font-black text-indigo-900 uppercase tracking-tight">Kart</span>
                                                <span className="text-[11px] font-black text-[#5D5FEF]/60 uppercase tracking-widest mt-1 block">Banka / Kredi</span>
                                            </div>
                                        </button>
                                    </div>

                                    <div className="mt-16 flex flex-col items-center gap-6">
                                        <button
                                            onClick={() => setIsPaymentModalOpen(false)}
                                            className="bg-gray-100 hover:bg-gray-200 text-gray-500 px-16 py-5 rounded-[24px] font-black uppercase tracking-widest text-sm transition-all active:scale-95 flex items-center gap-3"
                                        >
                                            <X size={20} />
                                            Vazgeç
                                        </button>
                                        <div className="px-6 py-2 bg-gray-50 rounded-full border border-gray-100">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Kalan Borç: ₺{parseFloat(selectedTable?.current_total || 0).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex-1 overflow-y-auto scroller-hidden bg-[#F8FAFC]">
                                        <div className="bg-[#EEF2F6] shrink-0">
                                            {/* (Root and Sub Categories logic remains same...) */}
                                            {!searchQuery && (
                                                <>
                                                    <div className="px-8 py-4 flex gap-10 overflow-x-auto scroller-hidden">
                                                        {categories.filter(c => !c.parent_id).map(rootCat => (
                                                            <button
                                                                key={rootCat.id}
                                                                onClick={() => {
                                                                    setActiveCategory(rootCat);
                                                                    const firstSub = categories.find(c => c.parent_id === rootCat.id);
                                                                    setActiveSubCategory(firstSub || null);
                                                                }}
                                                                className={`relative pb-3 text-[17px] font-black transition-all whitespace-nowrap uppercase tracking-tight ${activeCategory?.id === rootCat.id ? 'text-[#1a1a1a]' : 'text-gray-500 hover:text-gray-700'}`}
                                                            >
                                                                {rootCat.name}
                                                                {activeCategory?.id === rootCat.id && (
                                                                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#FF5F00]"></div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="px-8 py-3 flex gap-8 overflow-x-auto scroller-hidden relative group">
                                                        {categories.filter(c => c.parent_id === activeCategory?.id).map(subCat => (
                                                            <button
                                                                key={subCat.id}
                                                                onClick={() => setActiveSubCategory(subCat)}
                                                                className={`relative pb-2 text-sm font-bold transition-all whitespace-nowrap uppercase tracking-wide ${activeSubCategory?.id === subCat.id ? 'text-[#1a1a1a]' : 'text-gray-500 hover:text-gray-700'}`}
                                                            >
                                                                {subCat.name}
                                                                {activeSubCategory?.id === subCat.id && (
                                                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#FF5F00]/40"></div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="p-8">
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                                                {products
                                                    .filter(p => !searchQuery ? (p.category_id === activeSubCategory?.id || p.category_id === activeCategory?.id) : p.name.toLocaleLowerCase('tr-TR').includes(searchQuery.toLocaleLowerCase('tr-TR')))
                                                    .map(product => {
                                                        const priceInfo = getProductPriceInfo(product);
                                                        return (
                                                            <button
                                                                key={product.id}
                                                                onClick={() => addDirectlyToCart(product)}
                                                                className="bg-white rounded-[24px] overflow-hidden border border-gray-100 hover:border-[#FF5F00]/30 shadow-sm hover:shadow-xl hover:shadow-orange-50/50 transition-all group active:scale-95 flex flex-col h-full relative"
                                                            >
                                                                {priceInfo.hasDiscount && (
                                                                    <div className="absolute top-3 right-3 z-10 bg-[#FF5F00] text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-sm animate-pulse">
                                                                        {priceInfo.discountLabel}
                                                                    </div>
                                                                )}
                                                                <div className="relative aspect-square overflow-hidden bg-gray-50">
                                                                    {product.image_url ? (
                                                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                                            <ShoppingBag size={48} strokeWidth={1} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="p-4 flex flex-col flex-1 justify-between">
                                                                    <h3 className="text-[13px] font-black text-gray-800 uppercase leading-tight line-clamp-2 mb-2">{product.name}</h3>
                                                                    <div className="flex flex-col">
                                                                        {priceInfo.hasDiscount ? (
                                                                            <>
                                                                                <div className="text-gray-300 text-xs line-through font-bold">₺{parseFloat(priceInfo.originalPrice).toFixed(2).replace('.', ',')}</div>
                                                                                <div className="font-black text-[#FF5F00] text-lg">₺{parseFloat(priceInfo.discountedPrice).toFixed(2).replace('.', ',')}</div>
                                                                            </>
                                                                        ) : (
                                                                            <div className="font-black text-[#FF5F00] text-lg">₺{parseFloat(product.price).toFixed(2).replace('.', ',')}</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sidebar: Order Summary */}
                                    <div className="w-[420px] bg-white border-l border-gray-100 flex flex-col shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.05)]">
                                        {/* Sidebar Header */}
                                        <div className="p-3 border-b border-gray-100 bg-white shrink-0 flex flex-col gap-2">
                                            <div className="p-4 bg-slate-100 rounded-2xl flex justify-between items-center shadow-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-extrabold text-[#5D5FEF] uppercase tracking-widest mb-0.5">
                                                            {seatingAreas.find(a => a.id === selectedTable?.area_id)?.name || 'SALON'}
                                                        </span>
                                                        <h3 className="text-[32px] font-black text-[#5D5FEF] tracking-tight leading-none">
                                                            {selectedTable?.name}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-gray-400 text-sm font-bold">
                                                        Ürün adedi: <span className="text-gray-600 font-black">{cart.length}</span>
                                                    </div>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setIsHeaderActionMenuOpen(!isHeaderActionMenuOpen)}
                                                            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#5D5FEF] hover:bg-white transition-all shadow-sm bg-white/50"
                                                        >
                                                            <MoreVertical size={20} />
                                                        </button>
                                                        {isHeaderActionMenuOpen && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" onClick={() => setIsHeaderActionMenuOpen(false)}></div>
                                                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                                    <button onClick={() => setView('tables')} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <ArrowLeft size={16} className="text-gray-400" /> Masalara Dön
                                                                    </button>
                                                                    <button onClick={() => { setIsNoteModalOpen(true); setIsHeaderActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <FileText size={16} className="text-gray-400" /> Adisyona İsim Ver
                                                                    </button>
                                                                    <button onClick={() => { setIsMovingMode(true); setView('tables'); setIsHeaderActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <Move size={16} className="text-gray-400" /> Masa Taşı
                                                                    </button>
                                                                    <button onClick={() => { setIsMergingMode(true); setView('tables'); setIsHeaderActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <GitMerge size={16} className="text-gray-400" /> Masa Birleştir
                                                                    </button>
                                                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <Archive size={16} className="text-gray-400" /> Para Çekmecesini Aç
                                                                    </button>
                                                                    <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">
                                                                        <Users size={16} className="text-gray-400" /> Müşteri Sayısı Tanımla
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100/50 shadow-sm">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Açılış</span>
                                                    <span className="text-[13px] font-black text-slate-700">{formatTime(selectedTable?.opened_at)}</span>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Masa Süresi</span>
                                                    <span className="text-[13px] font-black text-slate-700">{formatDuration(selectedTable?.opened_at)}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Son sipariş</span>
                                                    <span className="text-[13px] font-black text-slate-700">{formatTime(selectedTable?.last_order_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tabs Selection */}
                                        <div className="flex items-center justify-between border-b border-gray-100 bg-white shadow-sm shrink-0">
                                            <div className="flex flex-1">
                                                <button
                                                    onClick={() => setActiveSidebarTab('gecmis')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all relative ${activeSidebarTab === 'gecmis' ? 'bg-[#F0F5FF]' : 'hover:bg-gray-50 grayscale opacity-60'}`}
                                                >
                                                    <RefreshCw size={18} className={activeSidebarTab === 'gecmis' ? 'text-[#5D5FEF]' : 'text-gray-400'} />
                                                    <span className={`text-[14px] font-black uppercase tracking-tight ${activeSidebarTab === 'gecmis' ? 'text-gray-900' : 'text-gray-500'}`}>Geçmiş</span>
                                                    {activeSidebarTab === 'gecmis' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#5D5FEF]"></div>}
                                                </button>
                                                <div className="w-[1px] h-full bg-gray-100"></div>
                                                <button
                                                    onClick={() => setActiveSidebarTab('sepet')}
                                                    className={`flex-1 flex items-center justify-center gap-2 py-4 transition-all relative ${activeSidebarTab === 'sepet' ? 'bg-[#F0F5FF]' : 'hover:bg-gray-50 grayscale opacity-60'}`}
                                                >
                                                    <div className="relative">
                                                        <Target size={20} className={activeSidebarTab === 'sepet' ? 'text-[#5D5FEF]' : 'text-gray-400'} />
                                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#5D5FEF] rounded-full border-2 border-white"></div>
                                                    </div>
                                                    <span className={`text-[14px] font-black uppercase tracking-tight ${activeSidebarTab === 'sepet' ? 'text-gray-900' : 'text-gray-500'}`}>Sepet</span>
                                                    {activeSidebarTab === 'sepet' && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#5D5FEF]"></div>}
                                                </button>
                                            </div>
                                            <div className="flex shrink-0 px-3 gap-2 border-l border-gray-100 h-full py-2 bg-white ml-2">
                                                <button
                                                    onClick={() => handleOpenNoteModal()}
                                                    className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-[#5D5FEF] hover:bg-gray-50"
                                                    title="Not Defteri"
                                                >
                                                    <NotebookPen size={20} />
                                                </button>
                                                <div className="relative">
                                                    <button
                                                        onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                                                        className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-50 bg-white"
                                                    >
                                                        <MoreVertical size={20} />
                                                    </button>
                                                    {isActionMenuOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-[60]" onClick={() => setIsActionMenuOpen(false)}></div>
                                                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <button onClick={() => { handleApplyActionToSelected('gift'); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">İkram</button>
                                                                <button onClick={() => { handleApplyActionToSelected('cancel'); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">İptal Et</button>
                                                                <button onClick={() => { handleApplyActionToSelected('waste'); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">Atık</button>
                                                                <button onClick={() => { setIsDiscountModalOpen(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">İndirim Yap</button>
                                                                <button onClick={() => { setIsMovingMode(true); setIsActionMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors">Ürünleri Taşı</button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleRemoveUnsentFromCart}
                                                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${cart.some(i => i.selected && !i.database_id) ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-white border-gray-100 text-gray-300 cursor-not-allowed opacity-50'}`}
                                                    title="Seçili Gönderilmemiş Ürünleri Sil"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Main List Area */}
                                        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white scroller-hidden">
                                            {/* Sepet Tab: New Unsent Items */}
                                            {activeSidebarTab === 'sepet' && (
                                                <>
                                                    {cart.filter(i => !i.database_id).length > 0 ? (
                                                        <div className="bg-indigo-50/10 rounded-2xl p-4 border-2 border-dashed border-indigo-200/50 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="w-6 h-6 rounded-lg bg-[#5D5FEF] text-white flex items-center justify-center text-[11px] font-black">
                                                                    {cart.filter(i => !i.database_id).length}
                                                                </div>
                                                                <span className="text-[14px] font-black text-[#5D5FEF] uppercase tracking-tight">Yeni Sipariş</span>
                                                            </div>
                                                            <div className="space-y-3">
                                                                {cart.filter(i => !i.database_id).map((item, idx) => (
                                                                    <div key={idx} onClick={() => toggleItemSelection(cart.indexOf(item))} className={`p-4 rounded-xl border border-gray-100 transition-all cursor-pointer shadow-sm ${item.selected ? 'bg-white border-[#5D5FEF] ring-1 ring-[#5D5FEF] shadow-md' : 'bg-white hover:border-gray-300'}`}>
                                                                        <div className="flex justify-between items-start">
                                                                            <div className="flex-1">
                                                                                <div className="font-black text-[15px] text-gray-900 leading-tight uppercase">{item.quantity}X {item.name}</div>
                                                                                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-gray-400">
                                                                                    <div className="flex items-center gap-1"><Users size={12} /> <span>{item.staff_name || 'Personel'}</span></div>
                                                                                    <div className="flex items-center gap-1"><Clock size={12} /> <span>{formatTime(item.addedAt)}</span></div>
                                                                                </div>
                                                                                {item.note && (
                                                                                    <div className="mt-2 text-[11px] font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg inline-block">
                                                                                        Not: {item.note}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="font-black text-[15px] text-gray-900 ml-2">
                                                                                ₺{((parseFloat(item.price || 0) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.quantity).toFixed(2).replace('.', ',')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <button
                                                                onClick={handleSendOrder}
                                                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black text-[15px] uppercase tracking-tight shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                                                            >
                                                                <CheckSquare size={20} className="transition-transform group-hover:scale-110" />
                                                                Adisyona Ekle
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-200 opacity-60 py-20">
                                                            <ShoppingBag size={64} strokeWidth={1} className="mb-4" />
                                                            <span className="font-black uppercase tracking-widest text-xs">Sepet Boş</span>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {/* Geçmiş Tab: Sent Items (History) */}
                                            {activeSidebarTab === 'gecmis' && (
                                                <>
                                                    {groupCartItems(cart.filter(i => i.database_id)).length === 0 ? (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-200 opacity-60 py-20">
                                                            <RefreshCw size={64} strokeWidth={1} className="mb-4" />
                                                            <span className="font-black uppercase tracking-widest text-xs">Geçmiş Boş</span>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {groupCartItems(cart.filter(i => i.database_id)).map((item, index) => {
                                                                const isActive = !['paid', 'gift', 'waste', 'cancel'].includes(item.status);
                                                                const isExpanded = expandedGroups.includes(item.key);

                                                                if (item.isGroup) {
                                                                    const someSelected = item.items.some(i => i.selected);

                                                                    return (
                                                                        <div key={item.key} className={`rounded-xl border border-gray-100 shadow-sm transition-all ${someSelected ? 'border-[#5D5FEF] bg-indigo-50/10' : 'bg-white'}`}>
                                                                            <div
                                                                                onClick={() => {
                                                                                    toggleGroupExpansion(item.key);
                                                                                }}
                                                                                className="p-4 flex justify-between items-start gap-3 cursor-pointer"
                                                                            >
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2 mb-1">
                                                                                        <span className="text-[15px] font-black text-gray-900 uppercase leading-tight">{item.items.length}X {item.name}</span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-gray-400">
                                                                                        <div className="flex items-center gap-1"><Users size={12} /> <span>{item.items[0]?.staff_name || 'Personel'}</span></div>
                                                                                        <div className="flex items-center gap-1"><Clock size={12} /> <span>{formatTime(item.items[0]?.created_at || item.items[0]?.addedAt)}</span></div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col items-end gap-1">
                                                                                    <div className="font-black text-[15px] text-gray-900">
                                                                                        ₺{((parseFloat(item.price || 0) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.items.length).toFixed(2).replace('.', ',')}
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            toggleGroupExpansion(item.key);
                                                                                        }}
                                                                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
                                                                                    >
                                                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>

                                                                            {isExpanded && (
                                                                                <div className="px-3 pb-3 space-y-2 border-t border-gray-50 pt-2">
                                                                                    {item.items.map((child, cidx) => (
                                                                                        <div key={cidx} onClick={(e) => { e.stopPropagation(); toggleItemSelection(child.originalIndex); }} className={`p-3 rounded-lg border transition-all cursor-pointer ${child.selected ? 'border-[#5D5FEF] bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
                                                                                            <div className="flex justify-between items-center">
                                                                                                <div className="flex items-center gap-2 text-[12px] font-bold text-gray-500">
                                                                                                    <span>1X {child.name}</span>
                                                                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                                                                    <span>{child.staff_name || 'Personel'}</span>
                                                                                                </div>
                                                                                                <div className="text-[12px] font-black text-gray-700">
                                                                                                    ₺{(parseFloat(child.price || 0) + (child.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)).toFixed(2).replace('.', ',')}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }

                                                                const isPaid = item.status === 'paid';
                                                                const isGift = item.status === 'gift';
                                                                const isWaste = item.status === 'waste';
                                                                const isCancel = item.status === 'cancel';

                                                                let itemClasses = "group relative p-4 rounded-xl border transition-all cursor-pointer shadow-sm bg-white ";
                                                                let textClasses = "text-[15px] font-black leading-tight uppercase ";
                                                                let priceClasses = "font-black text-[15px] ml-2 ";
                                                                let noteClasses = "mt-2 text-[11px] font-bold px-2 py-1 rounded-lg inline-block ";

                                                                if (item.selected) {
                                                                    itemClasses += "border-[#5D5FEF] ring-1 ring-[#5D5FEF] shadow-md";
                                                                    textClasses += "text-gray-900";
                                                                    priceClasses += "text-gray-900";
                                                                    noteClasses += "text-orange-500 bg-orange-50";
                                                                } else if (isActive) {
                                                                    itemClasses += "border-gray-100 hover:border-gray-300";
                                                                    textClasses += "text-gray-900";
                                                                    priceClasses += "text-gray-900";
                                                                    noteClasses += "text-orange-500 bg-orange-50";
                                                                } else {
                                                                    // Processed Items Styling
                                                                    if (isPaid) {
                                                                        itemClasses += "border-gray-100 bg-gray-50 opacity-60 grayscale";
                                                                        textClasses += "text-gray-500 line-through decoration-2 decoration-gray-500";
                                                                        priceClasses += "text-gray-500 line-through decoration-2 decoration-gray-500";
                                                                        noteClasses += "text-gray-500 bg-gray-200";
                                                                    } else if (isGift) {
                                                                        itemClasses += "border-blue-100 bg-blue-50/30";
                                                                        textClasses += "text-blue-900 line-through decoration-2 decoration-blue-300";
                                                                        priceClasses += "text-blue-900 line-through decoration-2 decoration-blue-300";
                                                                        noteClasses += "text-blue-700 bg-blue-100";
                                                                    } else if (isWaste) {
                                                                        itemClasses += "border-red-100 bg-red-50/30";
                                                                        textClasses += "text-red-900 line-through decoration-2 decoration-red-300";
                                                                        priceClasses += "text-red-900 line-through decoration-2 decoration-red-300";
                                                                        noteClasses += "text-red-700 bg-red-100";
                                                                    } else if (isCancel) {
                                                                        itemClasses += "border-gray-200 bg-gray-100";
                                                                        textClasses += "text-gray-500 line-through decoration-2 decoration-gray-900";
                                                                        priceClasses += "text-gray-500 line-through decoration-2 decoration-gray-900";
                                                                        noteClasses += "text-gray-600 bg-gray-200";
                                                                    }
                                                                }

                                                                return (
                                                                    <div key={item.key || index} onClick={() => toggleItemSelection(item.isGroup ? item.items[0].originalIndex : item.originalIndex)} className={itemClasses}>
                                                                        <div className="flex justify-between items-start gap-3">
                                                                            <div className="flex-1">
                                                                                <span className={textClasses}>
                                                                                    {item.quantity}X {item.name}
                                                                                </span>
                                                                                <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-gray-400">
                                                                                    <div className="flex items-center gap-1"><Users size={12} /> <span>{item.staff_name || 'Personel'}</span></div>
                                                                                    <div className="flex items-center gap-1"><Clock size={12} /> <span>{formatTime(item.created_at || item.addedAt)}</span></div>
                                                                                </div>
                                                                                {item.note && (
                                                                                    <div className={noteClasses}>
                                                                                        Not: {item.note}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className={priceClasses}>
                                                                                ₺{((parseFloat(item.price || 0) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Sidebar Footer */}
                                        <div className="border-t border-gray-100 bg-white p-4 shrink-0">
                                            <div className="grid grid-cols-4 gap-2 mb-4">
                                                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Seçilen</span>
                                                    <span className="text-[14px] font-black text-[#5D5FEF]">₺{cart.filter(i => i.selected && !['gift', 'waste', 'paid'].includes(i.status)).reduce((total, item) => total + ((parseFloat(item.price) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.quantity), 0).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ödenen</span>
                                                    <span className="text-[14px] font-black text-emerald-500">₺{tablePayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Kalan</span>
                                                    <span className="text-[14px] font-black text-red-500">₺{Math.max(0, parseFloat(selectedTable?.current_total || 0)).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                                <div className="bg-gray-50 rounded-xl p-3 flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam</span>
                                                    <span className="text-[14px] font-black text-gray-900">₺{(parseFloat(selectedTable?.current_total || 0) + tablePayments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)).toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleTakePayment}
                                                    className="flex-1 bg-[#5D5FEF] hover:bg-[#4B4DDF] text-white py-4 rounded-2xl font-black text-[15px] transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] uppercase tracking-tight"
                                                >
                                                    Ödeme Al
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )
            }


            {/* Payment Modal */}
            {
                isPaymentModalOpen && selectedTable && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[80] p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex animate-in zoom-in-95 duration-200">
                            {/* Left Column: Payment Summary & Item List */}
                            <div className="w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col">
                                <div className="p-6 border-b border-gray-100 bg-white">
                                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Ödeme Detayı</h3>
                                    <p className="text-sm font-bold text-gray-400 mt-1">Masa: {selectedTable.name}</p>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {/* Selected Items for Partial Payment */}
                                    {cart.filter(i => i.selected).length > 0 ? (
                                        <>
                                            <div className="flex items-center gap-2 mb-2 px-2">
                                                <CheckSquare size={16} className="text-[#5D5FEF]" />
                                                <span className="text-xs font-black text-[#5D5FEF] uppercase tracking-wider">Seçili Ürünler</span>
                                            </div>
                                            {cart.filter(i => i.selected).map((item, idx) => (
                                                <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-700 text-sm">{item.quantity}x {item.name}</span>
                                                        <span className="text-[10px] text-gray-400 font-bold">{item.staff_name}</span>
                                                    </div>
                                                    <span className="font-black text-indigo-600">
                                                        ₺{((parseFloat(item.price || 0) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * (item.quantity || 1)).toFixed(2).replace('.', ',')}
                                                    </span>
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                            <ShoppingBag size={48} className="mb-4" />
                                            <p className="text-center font-bold text-sm px-8">Tüm masa bakiyesi ödenecektir.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-white border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-gray-400">Toplam Borç</span>
                                        <span className="text-lg font-black text-gray-800">₺{parseFloat(selectedTable.current_total || 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-emerald-500">Ödenen</span>
                                        <span className="text-lg font-black text-emerald-500">₺{tablePayments.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                        <span className="text-base font-black text-red-500">Kalan</span>
                                        <span className="text-2xl font-black text-red-500">₺{Math.max(0, parseFloat(selectedTable.current_total || 0)).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Keypad & Methods */}
                            <div className="flex-1 flex flex-col bg-white">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">
                                            ₺{paymentInputAmount ||
                                                (cart.some(i => i.selected)
                                                    ? cart.filter(i => i.selected).reduce((total, item) => total + ((parseFloat(item.price) + (item.selectedModifiers?.reduce((acc, m) => acc + parseFloat(m.price || 0), 0) || 0)) * item.quantity), 0).toFixed(2).replace('.', ',')
                                                    : Math.max(0, parseFloat(selectedTable.current_total || 0)).toFixed(2).replace('.', ','))
                                            }
                                        </h2>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Ödenecek Tutar</p>
                                    </div>
                                    <button onClick={() => setIsPaymentModalOpen(false)} className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 p-8 grid grid-cols-2 gap-8">
                                    {/* Keypad */}
                                    <div className="grid grid-cols-3 gap-3 h-full content-center">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <button key={num} onClick={() => handleKeypadPress(num.toString())} className="h-20 rounded-2xl bg-gray-50 hover:bg-gray-100 text-2xl font-bold text-gray-700 transition-colors shadow-sm active:scale-95">
                                                {num}
                                            </button>
                                        ))}
                                        <button onClick={() => handleKeypadPress(',')} className="h-20 rounded-2xl bg-gray-50 hover:bg-gray-100 text-2xl font-bold text-gray-700 transition-colors shadow-sm active:scale-95">,</button>
                                        <button onClick={() => handleKeypadPress('0')} className="h-20 rounded-2xl bg-gray-50 hover:bg-gray-100 text-2xl font-bold text-gray-700 transition-colors shadow-sm active:scale-95">0</button>
                                        <button onClick={() => handleKeypadAction('delete')} className="h-20 rounded-2xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors shadow-sm active:scale-95 flex items-center justify-center">
                                            <Undo2 size={28} />
                                        </button>
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="flex flex-col gap-3 justify-center">
                                        <button onClick={() => confirmPayment('cash')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]">
                                            <DollarSign size={32} />
                                            <span className="font-black uppercase tracking-wider">Nakit</span>
                                        </button>
                                        <button onClick={() => confirmPayment('credit_card')} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]">
                                            <CreditCard size={32} />
                                            <span className="font-black uppercase tracking-wider">Kredi Kartı</span>
                                        </button>
                                        <div className="grid grid-cols-2 gap-3 h-1/4">
                                            <button onClick={() => confirmPayment('mobile')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-colors">Mobil</button>
                                            <button onClick={() => confirmPayment('other')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold text-sm transition-colors">Diğer</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Discount Modal */} {/* Discount Modal */}
            {
                isDiscountModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[75] p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">İndirim Uygula</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">İndirim türünü veya miktarını seçin</p>
                                </div>
                                <button
                                    onClick={() => setIsDiscountModalOpen(false)}
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white transition-all border border-transparent hover:border-red-100"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto scroller-hidden">
                                {/* Custom Discount Inputs */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Özel Yüzde (%)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={customDiscountType === 'percentage' ? customDiscountValue : ''}
                                                onChange={(e) => {
                                                    setCustomDiscountType('percentage');
                                                    setCustomDiscountValue(e.target.value);
                                                }}
                                                placeholder="0"
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D5FEF] rounded-2xl p-4 font-black text-gray-900 transition-all outline-none"
                                            />
                                            <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                        <button
                                            onClick={() => handleApplyDiscount({ type: 'custom_percentage', amount: customDiscountValue })}
                                            disabled={customDiscountType !== 'percentage' || !customDiscountValue}
                                            className="w-full py-2 bg-indigo-50 text-[#5D5FEF] rounded-xl font-bold text-xs hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                        >
                                            Uygula
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Özel Tutar (₺)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={customDiscountType === 'amount' ? customDiscountValue : ''}
                                                onChange={(e) => {
                                                    setCustomDiscountType('amount');
                                                    setCustomDiscountValue(e.target.value);
                                                }}
                                                placeholder="0.00"
                                                className="w-full bg-gray-50 border-2 border-transparent focus:border-[#5D5FEF] rounded-2xl p-4 font-black text-gray-900 transition-all outline-none"
                                            />
                                            <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        </div>
                                        <button
                                            onClick={() => handleApplyDiscount({ type: 'custom_amount', amount: customDiscountValue })}
                                            disabled={customDiscountType !== 'amount' || !customDiscountValue}
                                            className="w-full py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-xs hover:bg-emerald-100 transition-colors disabled:opacity-50"
                                        >
                                            Uygula
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[1px] bg-gray-100 w-full"></div>

                                {/* Predefined Discounts */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tanımlı İndirimler</label>
                                    {discountTypes.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-4">Kayıtlı indirim türü bulunamadı.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {discountTypes.map((dt) => (
                                                <button
                                                    key={dt.id}
                                                    onClick={() => handleApplyDiscount(dt)}
                                                    className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 border-2 border-transparent hover:border-indigo-100 rounded-2xl transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#5D5FEF] shadow-sm">
                                                            <Percent size={20} />
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="font-black text-gray-800 uppercase text-sm">{dt.name}</div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                                                {dt.type === 'Percentage' || dt.type === 'Yüzdelik İndirim' ? `%${dt.amount} İndirim` : `${dt.amount} ₺ Sabit İndirim`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ArrowUpRight className="text-gray-300 group-hover:text-[#5D5FEF] transition-colors" size={20} />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-gray-50/50 border-t border-gray-100">
                                <button
                                    onClick={() => setIsDiscountModalOpen(false)}
                                    className="w-full py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-100 transition-all"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Table Note Modal */}
            {
                isNoteModalOpen && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
                            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                <h3 className="font-black text-gray-800 flex items-center gap-2">
                                    <StickyNote className="text-[#5D5FEF]" size={20} />
                                    {noteModalContext === 'action'
                                        ? (pendingAction?.type === 'cancel' ? 'İptal Nedeni' : (pendingAction?.type === 'gift' ? 'İkram Nedeni' : 'Açıklama'))
                                        : (cart.some(i => i.selected) ? 'Ürün Notu' : 'Masa Notu')}
                                </h3>
                                <button
                                    onClick={() => { setIsNoteModalOpen(false); setNoteModalContext('note'); setPendingAction(null); }}
                                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-100 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="p-5">
                                <textarea
                                    value={activeNoteInput}
                                    onChange={(e) => setActiveNoteInput(e.target.value)}
                                    placeholder={noteModalContext === 'action'
                                        ? `Neden ${pendingAction?.type === 'cancel' ? 'iptal edildiği' : (pendingAction?.type === 'gift' ? 'ikram edildiği' : 'atığa ayrıldığı')} hakkında not giriniz.`
                                        : (cart.some(i => i.selected) ? "Bu ürün için not ekleyin..." : "Bu masa için not ekleyin...")}
                                    className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-bold text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/10 resize-none"
                                ></textarea>
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => setActiveNoteInput('')}
                                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold text-sm transition-colors"
                                    >
                                        Temizle
                                    </button>
                                    <button
                                        onClick={handleSaveNote}
                                        className="flex-[2] py-3 bg-[#5D5FEF] hover:bg-[#4B4DDF] text-white rounded-xl font-bold text-sm transition-colors shadow-lg shadow-indigo-200"
                                    >
                                        Notu Kaydet
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* POS Footer (Navigation) */}
            <div className="bg-white border-t border-gray-100 py-3 flex justify-between items-center px-10 shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 shrink-0">
                <div className="flex flex-col">
                    <span className="font-extrabold text-[#1a1a1a] text-[15px] leading-tight">
                        {user?.business_name || 'İşletme Adı'}
                    </span>
                    {currentStaff && (
                        <span className="text-[#5D5FEF] text-[13px] font-bold leading-tight">
                            {currentStaff.first_name} {currentStaff.last_name}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-6 lg:gap-10 font-bold text-[#475569]">
                    <button
                        onClick={() => setView('tables')}
                        className={`flex items-center gap-2 transition-all group ${view === 'tables' || view === 'table-detail' ? 'text-[#5D5FEF]' : 'hover:text-[#5D5FEF]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${view === 'tables' || view === 'table-detail' ? 'bg-[#F0F5FF]' : 'group-hover:bg-[#F0F5FF]'}`}>
                            <LayoutGrid size={22} />
                        </div>
                        <span className="text-[13px] lg:text-[15px]">Masalar</span>
                    </button>
                    <button
                        onClick={() => setView('tasks')}
                        className={`flex items-center gap-2 transition-all group ${view === 'tasks' ? 'text-[#5D5FEF]' : 'hover:text-[#5D5FEF]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${view === 'tasks' ? 'bg-[#F0F5FF]' : 'group-hover:bg-[#F0F5FF]'}`}>
                            <Target size={22} />
                        </div>
                        <span className="text-[13px] lg:text-[15px]">Görevler</span>
                    </button>
                    <button
                        onClick={() => setView('shifts')}
                        className={`flex items-center gap-2 transition-all group ${view === 'shifts' ? 'text-[#5D5FEF]' : 'hover:text-[#5D5FEF]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${view === 'shifts' ? 'bg-[#F0F5FF]' : 'group-hover:bg-[#F0F5FF]'}`}>
                            <Clock size={22} />
                        </div>
                        <span className="text-[13px] lg:text-[15px]">Mesailer</span>
                    </button>
                    <button
                        onClick={() => setView('delivery')}
                        className={`flex items-center gap-2 transition-all group ${view === 'delivery' ? 'text-[#5D5FEF]' : 'hover:text-[#5D5FEF]'}`}
                    >
                        <div className={`p-2 rounded-xl transition-all ${view === 'delivery' ? 'bg-[#F0F5FF]' : 'group-hover:bg-[#F0F5FF]'}`}>
                            <Globe size={22} />
                        </div>
                        <span className="text-[13px] lg:text-[15px]">Paket Servis</span>
                    </button>
                    {waiterCallEnabled && (
                        <button
                            onClick={() => setIsWaiterCallsModalOpen(true)}
                            className={`flex items-center gap-2 transition-all group ${isWaiterCallsModalOpen ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all relative ${isWaiterCallsModalOpen ? 'bg-red-50' : 'group-hover:bg-red-50'}`}>
                                <Bell size={22} className={waiterCalls.length > 0 ? 'fill-red-500' : ''} />
                                {waiterCalls.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </div>
                            <span className="text-[13px] lg:text-[15px]">Garson Çağrıları</span>
                        </button>
                    )}

                    <div className="relative">
                        <button
                            onClick={() => setIsBottomMenuOpen(!isBottomMenuOpen)}
                            className={`flex items-center gap-2 transition-all group ${isBottomMenuOpen ? 'text-[#5D5FEF]' : 'hover:text-[#5D5FEF]'}`}
                        >
                            <div className={`p-2 rounded-xl transition-all ${isBottomMenuOpen ? 'bg-[#F0F5FF]' : 'group-hover:bg-[#F0F5FF]'}`}>
                                <MoreVertical size={22} />
                            </div>
                        </button>

                        {isBottomMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsBottomMenuOpen(false)}
                                ></div>
                                <div className="absolute right-0 bottom-full mb-4 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
                                    <div className="px-5 py-3 border-b border-gray-50 bg-gray-50/30">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Sistem İşlemleri</span>
                                    </div>
                                    <button
                                        onClick={() => window.location.href = '/isletme/adisyonlar'}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#5D5FEF] flex items-center justify-center transition-transform group-hover:scale-110">
                                            <History size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Önceki Adisyonlar</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <TrendingUp size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Giderler</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button
                                        onClick={() => window.location.href = '/isletme/hesaplar'}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <BarChart3 size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Raporlar</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button
                                        onClick={() => window.location.href = '/pos/kitchen-display'}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <Smartphone size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Mutfak Ekranı</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button
                                        onClick={() => {
                                            navigate('/isletme/pos_react/register_closings');
                                            setIsBottomMenuOpen(false);
                                        }}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <Calculator size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Kasa Kapanışı</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button
                                        onClick={() => navigate('/isletme')}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <LayoutDashboard size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Panele Geri Dön</span>
                                    </button>
                                    <div className="h-[1px] bg-gray-50 mx-5"></div>
                                    <button
                                        onClick={() => navigate('/isletme/terminaller')}
                                        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-600 flex items-center justify-center transition-transform group-hover:scale-110">
                                            <MonitorDot size={20} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700">Terminal Ayarları</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4 text-gray-400">
                    <span className="text-[11px] font-bold tracking-tight text-gray-400/70">Siento<span className="text-gray-400/50">POS</span> - V: 0.1.12</span>
                    <div className="flex items-center gap-2">
                        <Wifi size={18} className="text-green-500/50" />
                        <CreditCard size={18} />
                        <ShieldCheck size={18} />
                    </div>
                </div>
            </div>    {/* Variation Selection Modal */}
            {
                isVariationModalOpen && variationProduct && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-[32px] w-full max-w-[800px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight">{variationProduct.name} - ÖZELLEŞTİR</h3>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Lütfen ürün seçeneklerini ve adetini belirleyin</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsVariationModalOpen(false);
                                        setVariationProduct(null);
                                        setSelectedModifiers([]);
                                        setVariationQuantity(1);
                                        setVariationNote('');
                                    }}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-transparent hover:border-red-100"
                                >
                                    <X size={28} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-hidden flex bg-gray-50/50">
                                {/* Left: Variations List */}
                                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                    {(() => {
                                        const productRecipes = modifierRecipes.filter(r => r.product_id === variationProduct.id);
                                        const groupIds = [...new Set(productRecipes.map(r => {
                                            const opt = modifierOptions.find(o => o.id === r.option_id);
                                            return opt?.group_id;
                                        }))].filter(id => id);

                                        const relevantGroups = modifierGroups.filter(g => groupIds.includes(g.id));

                                        if (relevantGroups.length === 0) {
                                            return (
                                                <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
                                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                        <Settings className="opacity-20" size={32} />
                                                    </div>
                                                    <span className="font-bold text-sm uppercase tracking-widest">Bu ürün için seçenek bulunmuyor</span>
                                                </div>
                                            );
                                        }

                                        return relevantGroups.map(group => (
                                            <div key={group.id} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <h4 className="text-[13px] font-black text-gray-800 uppercase tracking-widest flex items-center gap-2">
                                                            {group.name}
                                                            {group.min_selections > 0 && (
                                                                <span className="text-[10px] text-red-500 bg-red-50 px-2 py-0.5 rounded-md">ZORUNLU</span>
                                                            )}
                                                        </h4>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">
                                                            {group.min_selections > 0 ? `En az ${group.min_selections} seçim` : 'İsteğe bağlı'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {productRecipes
                                                        .filter(r => {
                                                            const opt = modifierOptions.find(o => o.id === r.option_id);
                                                            return opt?.group_id === group.id;
                                                        })
                                                        .map(recipe => {
                                                            const option = modifierOptions.find(o => o.id === recipe.option_id);
                                                            const isSelected = selectedModifiers.some(m => m.id === option.id);
                                                            return (
                                                                <button
                                                                    key={option.id}
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setSelectedModifiers(prev => prev.filter(m => m.id !== option.id));
                                                                        } else {
                                                                            const currentSelections = selectedModifiers.filter(m => m.group_id === group.id);
                                                                            if (group.max_selections === 1) {
                                                                                setSelectedModifiers(prev => [
                                                                                    ...prev.filter(m => m.group_id !== group.id),
                                                                                    { ...option, group_id: group.id }
                                                                                ]);
                                                                            } else if (!group.max_selections || currentSelections.length < group.max_selections) {
                                                                                setSelectedModifiers(prev => [...prev, { ...option, group_id: group.id }]);
                                                                            } else {
                                                                                alert(`Bu gruptan en fazla ${group.max_selections} seçim yapabilirsiniz.`);
                                                                            }
                                                                        }
                                                                    }}
                                                                    className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between group h-full ${isSelected
                                                                        ? 'border-[#FF5F00] bg-orange-50/50 ring-4 ring-orange-50'
                                                                        : 'border-white bg-white hover:border-gray-200 shadow-sm'
                                                                        }`}
                                                                >
                                                                    <div className="flex flex-col">
                                                                        <span className={`text-[13px] font-black uppercase tracking-tight ${isSelected ? 'text-[#FF5F00]' : 'text-gray-700'}`}>
                                                                            {option.name}
                                                                        </span>
                                                                        {recipe.price_adjustment > 0 && (
                                                                            <span className={`text-[11px] font-bold mt-1 ${isSelected ? 'text-[#FF5F00]/60' : 'text-gray-400'}`}>
                                                                                +₺{recipe.price_adjustment}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${isSelected ? 'bg-[#FF5F00] text-white shadow-lg shadow-orange-100 rotate-0' : 'bg-gray-50 text-transparent -rotate-90'}`}>
                                                                        <Check size={14} strokeWidth={4} />
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ));
                                    })()}
                                </div>

                                {/* Right: Quantity and Confirmation */}
                                <div className="w-[300px] border-l border-gray-100 bg-white p-8 flex flex-col">
                                    <div className="flex-1 space-y-8">
                                        <div>
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Adet Seçimi</h4>
                                            <div className="flex items-center justify-between bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-2xl border-2 border-orange-200">
                                                <button
                                                    onClick={() => setVariationQuantity(Math.max(1, variationQuantity - 1))}
                                                    className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all active:scale-95 border border-orange-200"
                                                >
                                                    <Minus size={24} strokeWidth={3} />
                                                </button>
                                                <div className="flex flex-col items-center">
                                                    <span className="text-5xl font-black text-orange-600">{variationQuantity}</span>
                                                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mt-1">Adet</span>
                                                </div>
                                                <button
                                                    onClick={() => setVariationQuantity(variationQuantity + 1)}
                                                    className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center text-orange-500 hover:bg-orange-50 transition-all active:scale-95 border border-orange-200"
                                                >
                                                    <Plus size={24} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Not ekle</h4>
                                            <textarea
                                                value={variationNote}
                                                onChange={(e) => setVariationNote(e.target.value)}
                                                placeholder="Örn: Az şekerli..."
                                                className="w-full h-32 bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:border-orange-200 transition-all resize-none"
                                            ></textarea>
                                        </div>
                                    </div>

                                    <button
                                        onClick={confirmVariations}
                                        className="w-full py-6 bg-[#FF5F00] hover:bg-[#E65600] text-white rounded-[24px] font-black text-lg uppercase tracking-tight transition-all shadow-xl shadow-orange-100 flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        <ShoppingBag size={24} />
                                        EKLE
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Waiter Call Notification Button */}
            {
                waiterCallEnabled && view !== 'login' && (
                    <button
                        onClick={() => setIsWaiterCallsModalOpen(true)}
                        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all ${waiterCalls.length > 0 ? 'bg-red-500 hover:bg-red-600 animate-bounce' : 'bg-gray-400 hover:bg-gray-500 opacity-50 hover:opacity-100'}`}
                    >
                        <Bell size={28} className="fill-white" />
                        {waiterCalls.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-white text-red-500 text-xs font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-red-500">
                                {waiterCalls.length}
                            </span>
                        )}
                    </button>
                )
            }

            {/* Waiter Calls Modal */}
            {
                isWaiterCallsModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[32px] w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
                            <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-white/20 p-3 rounded-full">
                                            <Bell size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black">Garson Çağrıları</h3>
                                            <p className="text-sm opacity-90">{waiterCalls.length} bekleyen çağrı</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsWaiterCallsModalOpen(false)}
                                        className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                                {waiterCalls.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <Bell size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">Bekleyen çağrı yok</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {waiterCalls.map((call) => (
                                            <div
                                                key={call.id}
                                                className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-4 hover:shadow-lg transition-all"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-red-500 text-white w-16 h-16 rounded-full flex items-center justify-center">
                                                            <span className="text-2xl font-black">{call.table_number}</span>
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-gray-800 text-lg">
                                                                {call.area_name ? `${call.area_name} - ` : ''}Masa {call.table_number}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(call.created_at).toLocaleTimeString('tr-TR', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAcknowledgeCall(call.id)}
                                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                                    >
                                                        <Check size={16} />
                                                        Tamam
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default POS;

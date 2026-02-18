import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const RealtimeOrders = () => {
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        // Initial fetch
        const fetchOrders = async () => {
            const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
            if (data) setOrders(data);
        };

        fetchOrders();

        // Realtime subscription
        const subscription = supabase
            .channel('public:orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                console.log('New Order:', payload);
                setOrders(prev => [payload.new, ...prev]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    return (
        <div className="p-4 bg-gray-800 rounded-lg mt-4 text-white">
            <h2 className="text-xl font-bold mb-4">Realtime Orders</h2>
            <div className="space-y-2">
                {orders.length === 0 ? <p className="text-gray-400">No orders yet...</p> :
                    orders.map(order => (
                        <div key={order.id} className="p-3 bg-gray-700 rounded border border-gray-600 flex justify-between">
                            <span>Table: {order.table_number}</span>
                            <span className="font-bold">{order.total} TL</span>
                            <span className="text-xs bg-orange-500 px-2 py-1 rounded capitalize">{order.status}</span>
                        </div>
                    ))
                }
            </div>
        </div>
    );
};

export default RealtimeOrders;

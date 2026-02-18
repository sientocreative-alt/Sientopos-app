const Order = require('../models/Order');
const Table = require('../models/Table');

exports.createOrder = async (req, res) => {
    try {
        const { tableId, items, totalAmount, waiterId } = req.body;

        // Create Order
        const order = new Order({
            table: tableId,
            items,
            totalAmount,
            waiter: waiterId || req.user.userId,
            status: 'open'
        });

        await order.save();

        // Update Table status if it's a table order
        if (tableId) {
            await Table.findByIdAndUpdate(tableId, {
                status: 'occupied',
                currentOrder: order._id
            });
        }

        // Emit socket event (to be implemented)
        // req.io.emit('newOrder', order);

        res.status(201).json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('table', 'name')
            .populate('waiter', 'fullName')
            .sort('-createdAt');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateOrder = async (req, res) => {
    try {
        const { status, paymentMethod, items } = req.body;
        let updateData = req.body;

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });

        if (status === 'closed' || status === 'cancelled') {
            // Free up the table
            if (order.table) {
                await Table.findByIdAndUpdate(order.table, {
                    status: 'empty',
                    $unset: { currentOrder: "" }
                });
            }
            order.closedAt = Date.now();
            await order.save();
        }

        res.json(order);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('table')
            .populate('items.product');
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

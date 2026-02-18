const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Public: Get Active Plans
exports.getPlans = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('is_active', true)
            .order('monthly_price', { ascending: true });

        if (error) throw error;

        res.json({ status: 'success', data });
    } catch (error) {
        console.error('Get Plans Error:', error);
        res.status(500).json({ status: 'error', message: 'Planlar getirilemedi' });
    }
};

// Admin: Create Plan
exports.createPlan = async (req, res) => {
    try {
        console.log('Create Plan Request:', req.body);
        const { name, description, monthly_price, yearly_price, features, yearly_campaign_active } = req.body;

        const { data, error } = await supabase
            .from('subscription_plans')
            .insert([{
                name,
                description,
                monthly_price: parseFloat(monthly_price), // Ensure numbers
                yearly_price: parseFloat(yearly_price),
                features,
                yearly_campaign_active: req.body.yearly_campaign_active || false,
                is_active: true
            }])
            .select();

        if (error) throw error;

        res.json({ status: 'success', data: data[0] });
    } catch (error) {
        console.error('Create Plan Error:', error);
        res.status(500).json({ status: 'error', message: error.message || 'Plan oluşturulamadı' });
    }
};

// Admin: Update Plan
exports.updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('subscription_plans')
            .update({ ...updates, updated_at: new Date() })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ status: 'success', data: data[0] });
    } catch (error) {
        console.error('Update Plan Error:', error);
        res.status(500).json({ status: 'error', message: 'Plan güncellenemedi' });
    }
};

// Admin: Delete (Soft Delete)
exports.deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete by setting is_active = false
        const { data, error } = await supabase
            .from('subscription_plans')
            .update({ is_active: false, updated_at: new Date() })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ status: 'success', message: 'Plan pasife alındı' });
    } catch (error) {
        console.error('Delete Plan Error:', error);
        res.status(500).json({ status: 'error', message: 'Plan silinemedi' });
    }
};

// Admin: Get All Plans (including inactive)
exports.getAllPlansAdmin = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ status: 'success', data });
    } catch (error) {
        console.error('Admin Get Plans Error:', error);
        res.status(500).json({ status: 'error', message: 'Planlar getirilemedi' });
    }
};

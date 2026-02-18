const PaytrService = require('../services/paytr.service');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.listCards = async (req, res) => {
    try {
        const { businessId } = req.body; // Passed from frontend or middleware

        if (!businessId) return res.status(400).json({ error: 'Business ID required' });

        const { data: cards, error } = await supabase
            .from('business_cards')
            .select('*')
            .eq('business_id', businessId);

        if (error) throw error;

        res.json({ status: 'success', cards });
    } catch (error) {
        console.error('List Cards Error:', error);
        res.status(500).json({ status: 'error', message: 'Kartlar getirilemedi' });
    }
};

exports.deleteCard = async (req, res) => {
    try {
        const { ctoken } = req.params;
        const { businessId } = req.body; // or req.user.businessId

        // 1. Get utoken from business
        const { data: business } = await supabase
            .from('businesses')
            .select('paytr_utoken')
            .eq('id', businessId)
            .single();

        if (!business || !business.paytr_utoken) {
            return res.status(400).json({ error: 'PayTR Token bulunamadı' });
        }

        // 2. Call PayTR API
        await PaytrService.deleteSavedCard(business.paytr_utoken, ctoken);

        // 3. Delete from DB
        await supabase
            .from('business_cards')
            .delete()
            .eq('paytr_card_token', ctoken)
            .eq('business_id', businessId);

        res.json({ status: 'success', message: 'Kart başarıyla silindi' });
    } catch (error) {
        console.error('Delete Card Error:', error);
        res.status(500).json({ status: 'error', message: 'Kart silinemedi' });
    }
};

exports.addCardInit = async (req, res) => {
    // This is essentially createPayment with specific params to store card
    // Frontend should call /api/payment/create with store_card=1
    res.status(400).json({ message: 'Use /api/payment/create with store_card=1' });
};

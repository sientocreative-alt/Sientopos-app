const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.reorderAreas = async (req, res) => {
    try {
        const { updates } = req.body; // Expects array of { id, sort_order }

        if (!updates || !Array.isArray(updates)) {
            return res.status(400).json({ message: 'Invalid updates format' });
        }

        // Process updates in parallel
        const promises = updates.map(update =>
            supabase
                .from('seating_areas')
                .update({ sort_order: update.sort_order })
                .eq('id', update.id)
        );

        await Promise.all(promises);

        res.status(200).json({ message: 'Seating areas reordered successfully' });
    } catch (err) {
        console.error('Error reordering areas:', err);
        res.status(500).json({ message: 'Server error during reorder', error: err.message });
    }
};

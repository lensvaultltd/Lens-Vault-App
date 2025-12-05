import express from 'express';
import { supabase } from '../supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res) => {
    const userId = req.user?.uid; // Firebase UID matches Supabase User ID

    try {
        const { data: vault, error } = await supabase
            .from('vaults')
            .select('encrypted_data')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
            throw error;
        }

        if (!vault) {
            return res.json({ success: true, data: null, message: 'No vault found.' });
        }

        res.json({ success: true, data: vault.encrypted_data, message: 'Vault fetched successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error fetching vault.' });
    }
});

router.put('/', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const { encryptedData } = req.body;

    try {
        const { error } = await supabase
            .from('vaults')
            .upsert({ user_id: userId, encrypted_data: encryptedData, updated_at: new Date().toISOString() });

        if (error) throw error;

        res.json({ success: true, message: 'Vault saved successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error saving vault.' });
    }
});

export default router;

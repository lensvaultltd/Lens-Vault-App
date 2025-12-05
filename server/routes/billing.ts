import express from 'express';
import { supabase } from '../supabase';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

router.use(authenticateToken);

// Get available plans (Mock)
router.get('/plans', (req, res) => {
    res.json({
        success: true,
        plans: [
            { id: 'free', name: 'Free', price: 0 },
            { id: 'pro', name: 'Pro', price: 9.99 },
            { id: 'family', name: 'Family', price: 19.99 }
        ]
    });
});

// Subscribe to a plan (Mock)
router.post('/subscribe', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;
    const { planId, cycle } = req.body; // cycle: 'monthly' or 'yearly'

    if (!['free', 'premium', 'family', 'business'].includes(planId)) {
        return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    try {
        const { error } = await supabase.from('users').update({
            subscription_plan: planId,
            billing_cycle: cycle || 'monthly'
        }).eq('id', userId);

        if (error) throw error;
        res.json({ success: true, message: `Successfully upgraded to ${planId} plan.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to update subscription.' });
    }
});

// Cancel subscription (Mock)
router.post('/cancel', async (req: AuthRequest, res) => {
    const userId = req.user?.uid;

    try {
        const { error } = await supabase.from('users').update({
            subscription_plan: 'free'
        }).eq('id', userId);

        if (error) throw error;
        res.json({ success: true, message: 'Subscription canceled. You are now on the Free plan.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to cancel subscription.' });
    }
});

// Verify Paystack Payment
router.post('/verify', async (req: AuthRequest, res: express.Response) => {
    const userId = req.user?.uid;
    const { reference, planId, cycle } = req.body;

    if (!reference || !planId) {
        return res.status(400).json({ success: false, message: 'Missing reference or plan.' });
    }

    try {
        // Verify with Paystack API
        const secretKey = process.env.PAYSTACK_SECRET_KEY;

        if (!secretKey) {
            console.warn('PAYSTACK_SECRET_KEY not set. Skipping verification (Dev Mode fallback).');
            const { error } = await supabase.from('users').update({
                subscription_plan: planId,
                billing_cycle: cycle || 'monthly'
            }).eq('id', userId);
            if (error) throw error;
            return res.json({ success: true, message: 'Subscription updated (Verification skipped).' });
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${secretKey}`
            }
        });

        const data = await response.json();

        if (data.status && data.data.status === 'success') {
            // Payment verified
            const { error } = await supabase.from('users').update({
                subscription_plan: planId,
                billing_cycle: cycle || 'monthly'
            }).eq('id', userId);

            if (error) throw error;
            res.json({ success: true, message: 'Payment verified. Subscription updated.' });
        } else {
            console.error('Paystack verification failed:', data);
            res.status(400).json({ success: false, message: 'Payment verification failed.' });
        }

    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, message: 'Server error during verification.' });
    }
});

export default router;

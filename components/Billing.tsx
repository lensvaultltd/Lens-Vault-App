import React, { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Check, X, ChevronDown, ChevronUp, Shield as ShieldIcon } from 'lucide-react';
import { Subscription } from '../types';
import { Switch } from './ui/switch';

interface BillingProps {
  subscription: Subscription;
  onPlanChange: (plan: 'free' | 'premium' | 'family' | 'business') => void;
  email: string;
}

const plans = [
  {
    name: 'Free Plan',
    id: 'free' as const,
    price: '₦0',
    priceSuffix: '/ month',
    yearlyPrice: '₦0 / year',
    description: 'For basic personal use.',
    features: [
      { text: 'Store unlimited passwords', included: true },
      { text: 'Sync across 1 Device', included: true },
      { text: 'Strong password generator', included: true },
      { text: 'Family & Sharing', included: false },
      { text: 'Dark web email breach monitoring', included: false },
      { text: 'Priority support', included: false },
    ],
  },
  {
    name: 'Premium Plan',
    id: 'premium' as const,
    price: '₦1,500',
    priceSuffix: '/ month',
    yearlyPrice: '₦15,000 / year',
    description: 'For professionals and remote workers.',
    features: [
      { text: 'Store unlimited passwords', included: true },
      { text: 'Auto-fill passwords & 2FA codes', included: true },
      { text: 'Sync across up to 3 devices', included: true },
      { text: 'Dark web email breach monitoring', included: true },
      { text: 'Secure notes & document storage', included: true },
      { text: 'Emergency access recovery', included: true },
      { text: 'Encrypted cloud backup', included: true },
      { text: 'Priority password reset support', included: true },
    ],
    isMostPopular: true,
  },
  {
    name: 'Family Plan',
    id: 'family' as const,
    price: '₦4,500',
    priceSuffix: '/ month',
    yearlyPrice: '₦45,000 / year',
    description: 'For your whole family.',
    features: [
      { text: 'All Premium features', included: true },
      { text: 'Up to 5 user accounts', included: true },
      { text: 'Up to 15 devices', included: true },
      { text: 'Shared family password vault', included: true },
      { text: 'Secure sharing (Netflix, DSTV, etc.)', included: true },
      { text: 'Parental account oversight (optional)', included: true },
      { text: 'Dark web monitoring for the entire family', included: true },
    ],
  },
  {
    name: 'Business Plan',
    id: 'business' as const,
    price: '₦10,000',
    priceSuffix: '/ month',
    yearlyPrice: '₦100,000 / year',
    description: 'For small businesses up to 10 users.',
    features: [
      { text: 'All Family features', included: true },
      { text: '10 user seats', included: true },
      { text: 'Up to 30 devices', included: true },
      { text: 'Role-based access controls', included: true },
      { text: 'Audit logs & login tracking', included: true },
      { text: 'Staff password hygiene scoring', included: true },
      { text: 'Dark web domain monitoring', included: true },
      { text: 'Admin dashboard', included: true },
    ],
  },
];

const PlanFeature: React.FC<{ text: string; included: boolean }> = ({ text, included }) => (
  <li className="flex items-start gap-3 text-sm">
    {included ? (
      <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
    ) : (
      <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
    )}
    <span className={included ? 'text-foreground' : 'text-muted-foreground'}>{text}</span>
  </li>
);

const PlanFeatureComponent: React.FC<{ text: string; included: boolean }> = PlanFeature;
const VISIBLE_FEATURES = 4;

// Helper component to use the hook for each plan button
const PaystackButtonWrapper = ({ email, amount, planId, disabled, onSuccess, onClose, isCurrent, isLoading, buttonText }: any) => {
  const config = {
    reference: (new Date()).getTime().toString(),
    email: email,
    amount: amount * 100, // Amount is in Kobo
    publicKey: (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || '',
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <Button
      className="w-full bg-gradient-accent"
      onClick={() => {
        if (planId === 'free') {
          // Direct switch for free plan
          onSuccess({ reference: 'free-switch' });
        } else {
          // @ts-ignore - react-paystack types might be slightly off
          initializePayment(onSuccess, onClose);
        }
      }}
      disabled={disabled}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
};

const Billing: React.FC<BillingProps> = ({ subscription, onPlanChange, email }) => {
  const [isYearly, setIsYearly] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const toggleFeatures = (planId: string) => {
    setExpandedFeatures(prev => ({ ...prev, [planId]: !prev[planId] }));
  };

  const handlePaystackSuccess = async (reference: any, planId: string) => {
    try {
      const { apiService } = await import('../services/apiService');
      const { toast } = await import('./ui/use-toast');

      // Verify transaction on backend
      const result = await apiService.verifyPayment(reference.reference, planId, isYearly ? 'yearly' : 'monthly');

      if (result.success) {
        toast({ variant: 'success', title: 'Subscription Updated', description: result.message });
        onPlanChange(planId as any);
      } else {
        toast({ variant: 'destructive', title: 'Verification Failed', description: result.message });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaystackClose = () => {
    setIsLoading(false);
    console.log('Payment closed');
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Lens Vault Protection Level</CardTitle>
          <CardDescription>
            Manage your password vault, security features, and billing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <h3 className="font-semibold text-lg">
                {plans.find(p => p.id === subscription.plan)?.name} Plan
                {subscription.status === 'trialing' && <Badge variant="secondary" className="ml-2">Trial</Badge>}
              </h3>
              {subscription.status === 'trialing' && subscription.trialEndsAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Trial ends on {new Date(subscription.trialEndsAt).toLocaleDateString()}.
                </p>
              )}
            </div>
            <Button variant="outline" disabled>Manage Subscription</Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <div className="flex justify-center items-center gap-4 my-8">
          <span className={!isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}>Monthly</span>
          <Switch checked={isYearly} onCheckedChange={setIsYearly} />
          <span className={isYearly ? 'font-semibold text-primary' : 'text-muted-foreground'}>
            Yearly <Badge variant="secondary">Save up to 17%</Badge>
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-start">
          {plans.map(plan => {
            const isCurrent = subscription.plan === plan.id;
            const isExpanded = !!expandedFeatures[plan.id];
            const topFeatures = plan.features.slice(0, VISIBLE_FEATURES);
            const otherFeatures = plan.features.slice(VISIBLE_FEATURES);

            // Calculate amount
            const priceString = isYearly ? plan.yearlyPrice : plan.price;
            const amount = parseInt(priceString.replace(/[^0-9]/g, '')); // Extract number

            return (
              <Card key={plan.id} className={`flex flex-col rounded-xl p-6 text-left card-lift-hover ${plan.isMostPopular ? 'card-glow border-primary/50' : ''}`}>
                {plan.isMostPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-accent">
                    Recommended
                  </Badge>
                )}
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground h-10 mt-1">{plan.description}</p>
                  <div className="my-6">
                    <span className="text-4xl font-bold">
                      {isYearly ? plan.yearlyPrice.split(' ')[0] : plan.price}
                    </span>
                    <span className="text-muted-foreground">
                      {isYearly ? ' / year' : plan.priceSuffix}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {topFeatures.map((feature, i) => (
                      <PlanFeatureComponent key={`top-${i}`} text={feature.text} included={feature.included} />
                    ))}
                  </ul>

                  {otherFeatures.length > 0 && (
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
                      <div className="border-t my-4"></div>
                      <ul className="space-y-3">
                        {otherFeatures.map((feature, i) => (
                          <PlanFeatureComponent key={`other-${i}`} text={feature.text} included={feature.included} />
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  {otherFeatures.length > 0 && (
                    <Button variant="ghost" size="sm" className="w-full mb-3 text-muted-foreground" onClick={() => toggleFeatures(plan.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                      {isExpanded ? 'Show less' : `Show all ${plan.features.length} features`}
                    </Button>
                  )}
                  <PaystackButtonWrapper
                    email={email}
                    amount={amount}
                    planId={plan.id}
                    disabled={isCurrent || isLoading}
                    onSuccess={(ref: any) => handlePaystackSuccess(ref, plan.id)}
                    onClose={handlePaystackClose}
                    isCurrent={isCurrent}
                    isLoading={isLoading}
                    buttonText={isCurrent ? 'Current Plan' : `Switch to ${plan.name}`}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <div className="mt-12 text-center text-sm text-muted-foreground space-y-2">
        <div className="flex items-center justify-center gap-2">
          <ShieldIcon className="h-4 w-4 text-green-500" />
          <p>Secure checkout powered by Lens Vault Encryption.</p>
        </div>
        <p>100% encrypted passwords. Zero-knowledge infrastructure.</p>
      </div>
    </div>
  );
};

export default Billing;

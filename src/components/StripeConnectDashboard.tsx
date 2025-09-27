
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  CreditCard,
  AlertTriangle,
  Banknote
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ConnectAccount {
  hasAccount: boolean;
  accountId?: string;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  details_submitted?: boolean;
  requirements?: any;
  loginLinkUrl?: string;
  country?: string;
  created?: number;
}

interface StripeConnectDashboardProps {
  onSetupNeeded?: () => void;
}

export const StripeConnectDashboard = ({ onSetupNeeded }: StripeConnectDashboardProps) => {
  const [account, setAccount] = useState<ConnectAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const checkAccountStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      setAccount(data);

      if (!data.hasAccount) {
        onSetupNeeded?.();
      }
    } catch (error: any) {
      console.error('Error checking account status:', error);
      toast({
        title: "Error",
        description: "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    checkAccountStatus();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    checkAccountStatus();
  };

  const handleManageAccount = () => {
    if (account?.loginLinkUrl) {
      window.open(account.loginLinkUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-card border-0 shadow-elegant">
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
            <p className="text-muted-foreground">Checking account status...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!account?.hasAccount) {
    return null;
  }

  const getStatusIcon = (enabled: boolean | undefined) => {
    if (enabled) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (charges: boolean | undefined, payouts: boolean | undefined) => {
    if (charges && payouts) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Fully Active</Badge>;
    }
    if (charges) {
      return <Badge variant="secondary">Charges Only</Badge>;
    }
    return <Badge variant="destructive">Pending Setup</Badge>;
  };

  const hasRequirements = account.requirements?.currently_due?.length > 0 || 
                         account.requirements?.eventually_due?.length > 0;

  return (
    <Card className="bg-gradient-card border-0 shadow-elegant">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Payment Account
            </CardTitle>
            <CardDescription>
              Your Stripe Connect account status and settings
            </CardDescription>
          </div>
          {getStatusBadge(account.charges_enabled, account.payouts_enabled)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(account.charges_enabled)}
            <span className="text-sm font-medium">Accept Payments</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(account.payouts_enabled)}
            <span className="text-sm font-medium">Receive Payouts</span>
          </div>
        </div>

        <Separator />

        {/* Requirements Alert */}
        {hasRequirements && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-medium mb-1">Action Required</div>
              {account.requirements?.currently_due?.length > 0 && (
                <div className="text-sm">
                  Complete your account setup to start receiving payments.
                </div>
              )}
              {account.requirements?.eventually_due?.length > 0 && !account.requirements?.currently_due?.length && (
                <div className="text-sm">
                  Additional information will be required in the future.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Account Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Account ID:</span>
            <div className="font-mono text-xs mt-1 p-2 bg-muted rounded">
              {account.accountId}
            </div>
          </div>
          {account.country && (
            <div>
              <span className="text-muted-foreground">Country:</span>
              <div className="font-medium mt-1">{account.country.toUpperCase()}</div>
            </div>
          )}
        </div>

        {account.created && (
          <div className="text-sm">
            <span className="text-muted-foreground">Created:</span>
            <div className="font-medium mt-1">
              {new Date(account.created * 1000).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          {account.loginLinkUrl ? (
            <Button
              onClick={handleManageAccount}
              className="flex-1"
              variant="outline"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Manage Account
            </Button>
          ) : (
            <Button
              onClick={() => onSetupNeeded?.()}
              className="flex-1"
              variant="outline"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Complete Setup
            </Button>
          )}
          
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {account.charges_enabled && account.payouts_enabled && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-medium">Account Active!</div>
              <div className="text-sm">You can now receive payments from students.</div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

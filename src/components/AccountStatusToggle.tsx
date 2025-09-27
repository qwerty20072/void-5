
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pause, Play } from 'lucide-react';

interface AccountStatusToggleProps {
  userId: string;
  currentStatus: string;
  onStatusChange: (newStatus: string) => void;
}

export const AccountStatusToggle = ({ 
  userId, 
  currentStatus, 
  onStatusChange 
}: AccountStatusToggleProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isPaused = currentStatus === 'paused';

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = isPaused ? 'active' : 'paused';
      
      const { error } = await supabase
        .from('profiles')
        .update({ account_status: newStatus } as any)
        .eq('id', userId);

      if (error) throw error;

      onStatusChange(newStatus);
      toast({
        title: `Account ${newStatus === 'active' ? 'activated' : 'paused'}`,
        description: newStatus === 'active' 
          ? 'Students can now chat with you again'
          : 'Students can still book lessons but cannot start new chats',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update account status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Account Status
          <Badge variant={isPaused ? 'secondary' : 'default'}>
            {isPaused ? 'Paused' : 'Active'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Control whether students can start new chats with you. 
          Lesson bookings remain available regardless of status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {isPaused ? (
              <>
                <p>Your account is currently <strong>paused</strong>:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Students cannot start new chats</li>
                  <li>Your profile remains visible</li>
                  <li>Students can still book lessons</li>
                </ul>
              </>
            ) : (
              <>
                <p>Your account is currently <strong>active</strong>:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Students can start new chats</li>
                  <li>Students can book lessons</li>
                  <li>Your profile is fully available</li>
                </ul>
              </>
            )}
          </div>
          
          <Button 
            onClick={toggleStatus}
            disabled={loading}
            variant={isPaused ? 'default' : 'secondary'}
            className="w-full"
          >
            {loading ? 'Updating...' : (
              <>
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate Account
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause Account
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

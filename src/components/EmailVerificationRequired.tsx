import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

const EmailVerificationRequired = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    const getUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    getUserEmail();
  }, []);

  const handleResendVerification = async () => {
    setResending(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.email) {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: user.email
        });

        if (error) {
          toast({
            title: "Failed to resend",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Verification email sent",
            description: "Please check your email for the verification link.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Failed to resend",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            
            <CardTitle className="text-2xl">Verify Your Email</CardTitle>
            
            <CardDescription>
              We've sent a verification link to{' '}
              <span className="font-medium text-foreground">{userEmail}</span>
              <br />
              Please check your email and click the link to verify your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full"
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              Use Different Email
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerificationRequired;
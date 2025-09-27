import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (type === 'email' && token_hash) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'email'
          });

          if (error) {
            console.error('Verification error:', error);
            setStatus('error');
            toast({
              title: "Verification failed",
              description: error.message,
              variant: "destructive",
            });
          } else {
            setStatus('success');
            toast({
              title: "Email verified!",
              description: "Your email has been successfully verified.",
            });
            
            // Redirect to home page after 3 seconds
            setTimeout(() => {
              // Force a page reload to refresh auth state
              window.location.href = '/';
            }, 3000);
          }
        } else {
          setStatus('error');
          toast({
            title: "Invalid verification link",
            description: "The verification link is invalid or expired.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        toast({
          title: "Verification failed",
          description: "An unexpected error occurred during verification.",
          variant: "destructive",
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  const handleResendVerification = async () => {
    setResending(true);
    
    try {
      // Get current user
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

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-8">
      <div className="max-w-md w-full mx-4">
        <Card className="shadow-elegant">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-500" />
              )}
              {status === 'error' && (
                <XCircle className="h-12 w-12 text-destructive" />
              )}
            </div>
            
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription>
              {status === 'loading' && 'Please wait while we verify your email address.'}
              {status === 'success' && 'Your email has been successfully verified. You will be redirected shortly.'}
              {status === 'error' && 'The verification link is invalid, expired, or has already been used.'}
            </CardDescription>
          </CardHeader>
          
          {(status === 'success' || status === 'error') && (
            <CardContent className="space-y-4">
              {status === 'success' && (
                <Button 
                  onClick={handleGoHome}
                  className="w-full"
                >
                  Continue to App
                </Button>
              )}
              
              {status === 'error' && (
                <div className="space-y-3">
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
                    onClick={handleGoHome}
                    className="w-full"
                  >
                    Back to Home
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Verify;
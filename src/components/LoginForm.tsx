
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

const LoginForm = ({ onSwitchToSignup }: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);

    // Basic rate limiting for login attempts
    const loginKey = `login_${values.email}`;
    const rateLimitStore = sessionStorage.getItem(loginKey);
    const now = Date.now();
    
    if (rateLimitStore) {
      const { attempts, resetTime } = JSON.parse(rateLimitStore);
      if (attempts >= 5 && now < resetTime) {
        toast({
          title: "Too many attempts",
          description: "Please wait 15 minutes before trying again.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Clear any failed login attempts on success
      sessionStorage.removeItem(loginKey);
      navigate('/');
      window.scrollTo(0, 0);
    } catch (error) {
      // Track failed login attempts
      const currentAttempts = rateLimitStore ? JSON.parse(rateLimitStore).attempts : 0;
      const newResetTime = now + (15 * 60 * 1000); // 15 minutes
      sessionStorage.setItem(loginKey, JSON.stringify({
        attempts: currentAttempts + 1,
        resetTime: newResetTime
      }));
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-background/95 backdrop-blur shadow-elegant">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Sign in to access your tutoring dashboard
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      className="bg-background"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="bg-background pr-10"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Please wait...' : 'Sign In'}
            </Button>
          </form>
        </Form>
        
        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-sm text-muted-foreground hover:text-primary"
            onClick={() => {
              window.location.href = '/forgot-password';
            }}
          >
            Forgot your password?
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginForm;

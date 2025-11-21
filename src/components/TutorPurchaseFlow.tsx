import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { CreditCard, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TutorPurchaseFlowProps {
  tutorId: string;
  tutorName: string;
  specialties: string[];
  price: string;
}

export const TutorPurchaseFlow = ({ tutorId, tutorName, specialties, price }: TutorPurchaseFlowProps) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      // TODO: Implement Stripe payment flow
      toast({
        title: "Payment Integration Coming Soon",
        description: "Direct lesson purchases will be available soon. Please use the contact form to book sessions.",
      });
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">Purchase Lessons</h3>
        <p className="text-muted-foreground">
          Book your tutoring sessions with {tutorName}
        </p>
      </div>

      <Card className="p-6 bg-muted/30">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="font-semibold">Hourly Rate</span>
            </div>
            <span className="text-2xl font-bold text-primary">{price}</span>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Subjects Available</Label>
            <div className="flex flex-wrap gap-2">
              {specialties.map((specialty) => (
                <Badge key={specialty} variant="outline">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Note:</strong> Direct payment integration is coming soon! In the meantime, please use the "Contact Form" tab to reach out to {tutorName} and arrange your booking. We offer free taster lessons!
        </p>
      </div>

      <Button 
        className="w-full"
        onClick={handlePurchase}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Continue to Payment
          </>
        )}
      </Button>
    </div>
  );
};

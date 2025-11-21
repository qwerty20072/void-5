import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Clock, Package } from 'lucide-react';
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
  const [lessonPackage, setLessonPackage] = useState<'1' | '5'>('1');

  // Extract numeric price from string like "£30/hour"
  const hourlyRate = parseFloat(price.replace(/[£\/hour]/g, ''));
  
  // Calculate total price based on package selection
  const calculateTotal = () => {
    if (lessonPackage === '1') {
      return hourlyRate;
    } else {
      // 5 lessons with 15% discount
      const subtotal = hourlyRate * 5;
      const discount = subtotal * 0.15;
      return subtotal - discount;
    }
  };

  const total = calculateTotal();
  const savings = lessonPackage === '5' ? (hourlyRate * 5 * 0.15) : 0;

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
            <span className="text-xl font-bold text-primary">{price}</span>
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

      <Card className="p-6 bg-gradient-card border-2 border-primary/20">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              <Package className="h-4 w-4 inline mr-2" />
              Select Lesson Package
            </Label>
            <Select value={lessonPackage} onValueChange={(value: '1' | '5') => setLessonPackage(value)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="1">
                  <div className="flex justify-between items-center w-full">
                    <span>1 Lesson</span>
                    <span className="ml-4 font-semibold">£{hourlyRate.toFixed(2)}</span>
                  </div>
                </SelectItem>
                <SelectItem value="5">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center w-full">
                      <span>5 Lessons Pack</span>
                      <span className="ml-4 font-semibold">£{(hourlyRate * 5 * 0.85).toFixed(2)}</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Save 15%!</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            {lessonPackage === '5' && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (5 lessons)</span>
                <span>£{(hourlyRate * 5).toFixed(2)}</span>
              </div>
            )}
            {savings > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="font-medium">Discount (15%)</span>
                <span className="font-medium">-£{savings.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-lg font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary text-2xl">£{total.toFixed(2)}</span>
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-PAYMENT-SUCCESS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Create Supabase client
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Parse request body
    const body = await req.json();
    const { sessionId } = body;
    
    if (!sessionId) {
      throw new Error("Missing sessionId");
    }

    logStep("Processing payment success", { sessionId, userId: user.id });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    // Update payment record in database
    const { error: updateError } = await supabaseService
      .from('payments')
      .update({ status: 'completed' })
      .eq('stripe_session_id', sessionId)
      .eq('student_id', user.id);

    if (updateError) {
      throw new Error(`Failed to update payment record: ${updateError.message}`);
    }

    // If this is a mock papers purchase, update the user's profile
    if (session.metadata?.type === 'mock_papers') {
      const { examType, paperType, setName } = session.metadata;
      
      // Get current profile
      const { data: profile, error: profileError } = await supabaseService
        .from('profiles')
        .select('purchased_mock_papers')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }

      // Update purchased mock papers
      const currentPurchases = profile.purchased_mock_papers || {};
      if (!currentPurchases[examType]) {
        currentPurchases[examType] = {};
      }
      if (!currentPurchases[examType][setName]) {
        currentPurchases[examType][setName] = [];
      }

      // Add the purchased paper type if not already present
      if (!currentPurchases[examType][setName].includes(paperType)) {
        currentPurchases[examType][setName].push(paperType);
      }

      // Update the profile
      const { error: updateProfileError } = await supabaseService
        .from('profiles')
        .update({ 
          purchased_mock_papers: currentPurchases,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateProfileError) {
        throw new Error(`Failed to update profile: ${updateProfileError.message}`);
      }

      logStep("Mock papers purchase recorded", { 
        examType, 
        paperType, 
        setName,
        userId: user.id 
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: "Payment processed successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in handle-payment-success", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
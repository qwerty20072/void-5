import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Edit3, Save, X, LogOut, MessageSquare, Settings, Trash2, Pause, Play, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StripeConnectOnboarding } from '@/components/StripeConnectOnboarding';
import { StripeConnectDashboard } from '@/components/StripeConnectDashboard';
import { AccountStatusToggle } from '@/components/AccountStatusToggle';

interface UserProfile {
  id: string;
  email: string | null;
  name: string | null;
  university: string | null;
  degree: string | null;
  year: string | null;
  subjects: any;
  exam_rates: any;
  user_type: string | null;
  account_status: string | null;
  stripe_account_id: string | null;
  charges_enabled: boolean | null;
  payouts_enabled: boolean | null;
  created_at: string;
  updated_at: string;
}

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    university: string;
    degree: string;
    year: string;
    exam_rates: Record<string, number>;
  }>({
    name: '',
    university: '',
    degree: '',
    year: '',
    exam_rates: {
      TMUA: 30,
      MAT: 30,
      ESAT: 30,
      'interview-prep': 35
    }
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }
      
      setUser(user);
      await fetchProfile(user.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        // Ensure account_status has a default value (handling missing column)
        const profileData = {
          ...data,
          account_status: (data as any).account_status || 'active'
        };
        setProfile(profileData);
        setFormData({
          name: data.name || '',
          university: data.university || '',
          degree: data.degree || '',
          year: data.year || '',
          exam_rates: (typeof data.exam_rates === 'object' && data.exam_rates !== null) 
            ? {...{TMUA: 30, MAT: 30, ESAT: 30, 'interview-prep': 35}, ...data.exam_rates as Record<string, number>}
            : {
                TMUA: 30,
                MAT: 30,
                ESAT: 30,
                'interview-prep': 35
              }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Get the subjects this tutor teaches
      let tutoredExams: string[] = [];
      if (profile?.subjects && typeof profile.subjects === 'object' && !Array.isArray(profile.subjects)) {
        const subjectsObj = profile.subjects as { [key: string]: any };
        if (subjectsObj.exams && Array.isArray(subjectsObj.exams)) {
          tutoredExams = subjectsObj.exams;
        }
      }
      
      // Filter exam_rates to only include subjects this tutor teaches
      let filteredExamRates: Record<string, number> = {};
      if (tutoredExams.length > 0) {
        // Only save rates for subjects the tutor teaches
        tutoredExams.forEach(exam => {
          if (formData.exam_rates[exam] !== undefined) {
            filteredExamRates[exam] = formData.exam_rates[exam];
          }
        });
      } else {
        // If no subjects are set, save all rates (for backward compatibility)
        filteredExamRates = formData.exam_rates;
      }

      const profileData = {
        id: user.id,
        email: user.email,
        name: formData.name || null,
        university: formData.university || null,
        degree: formData.degree || null,
        year: formData.year || null,
        exam_rates: filteredExamRates || null,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData)
        .select()
        .single();

      if (error) throw error;

      // Handle the account_status field safely
      const updatedProfile = {
        ...data,
        account_status: (data as any).account_status || profile?.account_status || 'active'
      };

      setProfile(updatedProfile as UserProfile);
      setIsEditing(false);
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account and all associated data have been permanently deleted.",
      });

      // Navigate to home page after deletion
      navigate('/');
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handlePauseReactivateAccount = async () => {
    if (!user || !profile) return;
    
    setPausing(true);
    const isPaused = profile.account_status === 'paused';
    const newStatus = isPaused ? 'active' : 'paused';
    
    try {
      // Try to update account_status - if column doesn't exist yet, handle gracefully
      const updateData: any = { account_status: newStatus };
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        // If column doesn't exist, just update the local state for now
        if (error.message?.includes('account_status')) {
          setProfile(prev => prev ? { ...prev, account_status: newStatus } : null);
          
          toast({
            title: "Status Updated (Local)",
            description: "Account status updated locally. Database will be updated when column is available.",
          });
          return;
        }
        throw error;
      }

      setProfile(prev => prev ? { ...prev, account_status: newStatus } : null);

      toast({
        title: isPaused ? "Account Reactivated" : "Account Paused",
        description: isPaused 
          ? "Your profile is now visible in the booking section." 
          : "Your profile has been hidden from the booking section.",
      });

    } catch (error: any) {
      console.error('Pause/reactivate account error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update account status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPausing(false);
    }
  };

  const cancelEdit = () => {
    setFormData({
      name: profile?.name || '',
      university: profile?.university || '',
      degree: profile?.degree || '',
      year: profile?.year || '',
      exam_rates: (typeof profile?.exam_rates === 'object' && profile.exam_rates !== null)
        ? {...{TMUA: 30, MAT: 30, ESAT: 30, 'interview-prep': 35}, ...profile.exam_rates as Record<string, number>}
        : {
            TMUA: 30,
            MAT: 30,
            ESAT: 30,
            'interview-prep': 35
          }
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${profile?.user_type === 'tutor' ? 'max-w-7xl' : 'max-w-2xl'}`}>
        {/* Header */}
        <Card className="bg-gradient-card border-0 shadow-elegant mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-between items-start mb-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="text-muted-foreground"
              >
                ← Back to Home
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <div className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              
              <CardTitle className="text-2xl font-bold text-foreground mb-2">
                {profile?.name || 'Welcome!'}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {user.email}
                {profile?.user_type === 'tutor' && (
                  <>
                    <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      Tutor
                    </span>
                    {profile?.account_status === 'paused' && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        Account Paused
                      </span>
                    )}
                  </>
                )}
              </CardDescription>
            </div>
          </CardHeader>
        </Card>

        {/* Main Content */}
        {profile?.user_type === 'tutor' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Settings Card */}
            <Card className="bg-gradient-card border-0 shadow-elegant">
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your tutor profile information and rates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Separator />
                
                {!isEditing ? (
                  // Display Mode
                  <div className="space-y-4">
                    {profile?.university && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">University</h3>
                        <p className="text-muted-foreground">{profile.university}</p>
                      </div>
                    )}
                    
                    {profile?.degree && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Degree</h3>
                        <p className="text-muted-foreground">{profile.degree}</p>
                      </div>
                    )}
                    
                    {profile?.year && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Year</h3>
                        <p className="text-muted-foreground">{profile.year}</p>
                      </div>
                    )}
                    
                    {profile?.exam_rates && (
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Exam Rates</h3>
                        <div className="space-y-1">
                          {Object.entries(profile.exam_rates as Record<string, number>).map(([exam, rate]) => (
                            <p key={exam} className="text-muted-foreground">
                              {exam}: £{rate}/hour
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Member Since</h3>
                      <p className="text-muted-foreground">
                        {new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>

                      <Button 
                        onClick={() => navigate('/change-password')}
                        className="w-full"
                        variant="outline"
                      >
                        <Key className="h-4 w-4 mr-2" />
                        Change Password
                      </Button>

                      <div className="p-6">
                        <AccountStatusToggle 
                          userId={user.id}
                          currentStatus={profile?.account_status || 'active'}
                          onStatusChange={(newStatus) => {
                            setProfile(prev => prev ? { ...prev, account_status: newStatus } : null);
                          }}
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive"
                            className="w-full"
                            disabled={deleting}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Account</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account and remove all your data including:
                              <br />• Your profile information
                              <br />• All your conversations and messages
                              <br />• Payment history
                              <br />• All associated data
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={handleDeleteAccount}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deleting}
                            >
                              {deleting ? 'Deleting...' : 'Delete Account'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        name="university"
                        placeholder="Enter your university"
                        value={formData.university}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degree">Degree</Label>
                      <Input
                        id="degree"
                        name="degree"
                        placeholder="Enter your degree"
                        value={formData.degree}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        name="year"
                        placeholder="Enter your year"
                        value={formData.year}
                        onChange={handleInputChange}
                        className="bg-white"
                      />
                    </div>

                     <div className="space-y-4">
                       <Label className="text-sm font-medium">Exam Rates (£/hour)</Label>
                       <div className="grid grid-cols-2 gap-4">
                         {(() => {
                           // Get the subjects this tutor teaches
                           let tutoredExams: string[] = [];
                           if (profile?.subjects && typeof profile.subjects === 'object' && !Array.isArray(profile.subjects)) {
                             const subjectsObj = profile.subjects as { [key: string]: any };
                             if (subjectsObj.exams && Array.isArray(subjectsObj.exams)) {
                               tutoredExams = subjectsObj.exams;
                             }
                           }
                           
                           // If no subjects are set, show all exams (for backward compatibility)
                           if (tutoredExams.length === 0) {
                             tutoredExams = ['TMUA', 'MAT', 'ESAT', 'interview-prep'];
                           }
                           
                           // Only show exam rate inputs for subjects this tutor teaches
                           return tutoredExams.map((exam) => (
                             <div key={exam} className="space-y-1">
                               <Label htmlFor={exam} className="text-xs">{exam}</Label>
                               <Input
                                 id={exam}
                                 type="number"
                                 placeholder="Rate"
                                 value={formData.exam_rates[exam] || 30}
                                 onChange={(e) => setFormData({
                                   ...formData, 
                                   exam_rates: {
                                     ...formData.exam_rates,
                                     [exam]: parseFloat(e.target.value) || 0
                                   }
                                 })}
                                 className="bg-white"
                               />
                             </div>
                           ));
                         })()}
                       </div>
                     </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        onClick={cancelEdit}
                        variant="outline"
                        disabled={saving}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Settings Card */}
            <div className="space-y-6">
              {showOnboarding || !profile?.stripe_account_id ? (
                <StripeConnectOnboarding 
                  onComplete={() => {
                    setShowOnboarding(false);
                    // Refresh profile to get updated Stripe data
                    if (user) fetchProfile(user.id);
                  }}
                />
              ) : (
                <StripeConnectDashboard 
                  onSetupNeeded={() => setShowOnboarding(true)}
                />
              )}
            </div>
          </div>
        ) : (
          // Student Profile - Simple single card
          <Card className="bg-gradient-card border-0 shadow-elegant">
            <CardContent className="space-y-6">
              <Separator />
              
              {!isEditing ? (
                // Display Mode
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Member Since</h3>
                    <p className="text-muted-foreground">
                      {new Date(profile?.created_at || user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>

                    <Button 
                      onClick={() => navigate('/change-password')}
                      className="w-full"
                      variant="outline"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          className="w-full"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Account</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your account and remove all your data including:
                            <br />• Your profile information
                            <br />• All your conversations and messages
                            <br />• Payment history
                            <br />• All associated data
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                          >
                            {deleting ? 'Deleting...' : 'Delete Account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ) : (
                // Edit Mode for Students (minimal)
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-white"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={saveProfile}
                      disabled={saving}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      onClick={cancelEdit}
                      variant="outline"
                      disabled={saving}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Profile;

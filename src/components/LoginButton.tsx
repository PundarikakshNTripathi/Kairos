import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Mail } from 'lucide-react';

export function LoginButton() {
  const user = useStore(state => state.user);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // If Supabase wasn't configured, don't show the button at all
  if (!supabase) return null;

  if (user) {
    return (
      <Button variant="ghost" size="sm" onClick={() => supabase!.auth.signOut()} className="text-xs text-muted-foreground">
        Sign Out ({user.email})
      </Button>
    );
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase!.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Check your email for the magic link!');
    }
    setLoading(false);
  };

  return (
    <>
      <Button variant="default" size="sm" onClick={() => setIsOpen(true)}>
        Sync to Cloud
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Cloud Sync Authentication</DialogTitle>
          <DialogDescription>
            Securely back up your journal and priorities across all your devices using Supabase.
          </DialogDescription>
          
          <div className="flex flex-col gap-4 mt-4">
            <Button 
              variant="outline" 
              className="w-full flex gap-2 items-center" 
              onClick={() => supabase!.auth.signInWithOAuth({ provider: 'github' })}
            >
              Continue with GitHub
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email} 
                  onChange={(e: any) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" disabled={loading} className="px-3">
                  <Mail className="w-4 h-4" />
                </Button>
              </div>
              {message && <p className="text-xs text-center mt-2 text-muted-foreground">{message}</p>}
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

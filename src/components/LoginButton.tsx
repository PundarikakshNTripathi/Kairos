import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const chip =
  'inline-flex items-center gap-2 border border-border px-3 h-10 md:h-8 font-mono text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors';

export function LoginButton() {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.profile);
  const setProfileOpen = useStore((s) => s.setProfileOpen);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  // Supabase not configured: local-only mode, no sign-in UI.
  if (!supabase) return null;

  if (user) {
    const displayName = profile?.username || user.user_metadata?.user_name || user.user_metadata?.full_name || user.email;
    const avatar = profile?.avatar_url || user.user_metadata?.avatar_url;
    return (
      <div className="flex items-center gap-2" data-testid="signed-in">
        <button onClick={() => setProfileOpen(true)} className={chip} aria-label="Edit profile" data-testid="profile-open">
          {avatar ? <img src={avatar} alt="" className="size-4 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <span className="size-1.5 bg-primary" aria-hidden />}
          <span className="max-w-[10rem] truncate">{displayName}</span>
        </button>
        <button onClick={() => supabase!.auth.signOut()} className={`${chip} hover:!text-primary`} data-testid="sign-out">
          Sign out
        </button>
      </div>
    );
  }

  const handleEmailLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? { text: error.message, error: true } : { text: 'Check your email for the sign-in link.', error: false });
    setLoading(false);
  };

  const oauth = (provider: 'github' | 'google') =>
    supabase!.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });

  return (
    <>
      <button onClick={() => setIsOpen(true)} className={`${chip} !border-primary/60 !text-primary hover:!bg-primary hover:!text-primary-foreground`} data-testid="sync-open">
        Sync to cloud
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-sm p-6 gap-5 border border-border">
          <div>
            <p className="eyebrow">Cloud sync</p>
            <DialogTitle className="font-display !text-4xl !leading-[1.05] mt-2">Keep it somewhere safe</DialogTitle>
            <DialogDescription className="mt-2">
              Sign in to back up your journal and priorities and open them on any device. Without an account everything stays on this device.
            </DialogDescription>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" className="h-10 w-full" onClick={() => oauth('github')}>Continue with GitHub</Button>
            <Button variant="outline" className="h-10 w-full" onClick={() => oauth('google')}>Continue with Google</Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-popover px-2 eyebrow">or by email</span></div>
          </div>

          <form onSubmit={handleEmailLogin} className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="name@example.com"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 h-10"
              />
              <Button type="submit" variant="default" disabled={loading} className="h-10 px-3" aria-label="Send sign-in link">
                <Mail className="size-4" />
              </Button>
            </div>
            {message && (
              <p role="status" className={`text-xs ${message.error ? 'text-primary' : 'text-foreground'}`} data-testid="login-message">
                {message.text}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

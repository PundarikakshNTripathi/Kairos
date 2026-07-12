import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ProfileModal() {
  const isProfileOpen = useStore(state => state.isProfileOpen);
  const setProfileOpen = useStore(state => state.setProfileOpen);
  const user = useStore(state => state.user);
  const profile = useStore(state => state.profile);
  const setProfile = useStore(state => state.setProfile);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isProfileOpen) {
      setUsername(profile?.username || user?.user_metadata?.user_name || user?.user_metadata?.full_name || '');
      setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
      setMessage('');
    }
  }, [isProfileOpen, profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supabase) return;
    
    setLoading(true);
    setMessage('');
    
    const updates = {
      id: user.id,
      username,
      avatar_url: avatarUrl,
    };
    
    const { error } = await supabase.from('profiles').upsert(updates);
    
    if (error) {
      setMessage('Error updating profile');
    } else {
      setProfile({ username, avatar_url: avatarUrl });
      setMessage('Profile updated successfully');
      setTimeout(() => setProfileOpen(false), 1500);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="max-w-sm">
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Update your public profile details.
        </DialogDescription>
        
        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Username</label>
            <Input 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">Avatar URL</label>
            <Input 
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {message && (
            <p className={`text-xs text-center ${message.includes('Error') ? 'text-destructive' : 'text-primary'}`}>
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

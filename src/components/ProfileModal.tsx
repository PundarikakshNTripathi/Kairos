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
  const [isDragging, setIsDragging] = useState(false);

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

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file');
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 256;
      let width = img.width;
      let height = img.height;
      
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(async (blob) => {
        if (!blob || !user || !supabase) return;
        setLoading(true);
        setMessage('Uploading image...');
        
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          
        if (uploadError) {
          setMessage('Error uploading image. Is your storage bucket configured?');
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        setAvatarUrl(publicUrl);
        setMessage('Image uploaded successfully');
        setLoading(false);
      }, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleImageFile(e.clipboardData.files[0]);
    }
  };

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="max-w-sm" onPaste={handlePaste}>
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
            <div 
              className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border/50'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <Input 
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://... or Paste/Drop image"
                className="mb-2"
              />
              <span className="text-xs text-muted-foreground">Drag and drop or paste an image here to upload</span>
            </div>
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

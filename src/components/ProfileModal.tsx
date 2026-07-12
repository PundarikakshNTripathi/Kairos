import { useStore } from '@/store/useStore';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Upload, Loader2 } from 'lucide-react';

export function ProfileModal() {
  const isProfileOpen = useStore(state => state.isProfileOpen);
  const setProfileOpen = useStore(state => state.setProfileOpen);
  const user = useStore(state => state.user);
  const profile = useStore(state => state.profile);
  const setProfile = useStore(state => state.setProfile);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isProfileOpen) {
      setUsername(profile?.username || user?.user_metadata?.user_name || user?.user_metadata?.full_name || '');
      setAvatarUrl(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
      setMessage('');
    }
  }, [isProfileOpen, profile, user]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

    setUploadingImage(true);
    setMessage('Processing image...');

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
        if (!blob || !user || !supabase) {
          setUploadingImage(false);
          return;
        }
        
        setMessage('Uploading to secure cloud...');
        
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, { contentType: 'image/jpeg', upsert: true });
          
        if (uploadError) {
          setMessage('Upload error. Ensure your bucket is configured.');
          setUploadingImage(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
          
        setAvatarUrl(publicUrl);
        
        // Auto-save the new url to the profile table
        const updates = {
          id: user.id,
          username,
          avatar_url: publicUrl,
        };
        await supabase.from('profiles').upsert(updates);
        setProfile({ username, avatar_url: publicUrl });

        setMessage('Avatar updated successfully!');
        setUploadingImage(false);
      }, 'image/jpeg', 0.8);
    };
    
    img.onerror = () => {
      setMessage('Failed to process image format.');
      setUploadingImage(false);
    };
    
    img.src = URL.createObjectURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
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
      <DialogContent className="max-w-sm" onPaste={handlePaste} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogDescription>
          Update your public profile details.
        </DialogDescription>
        
        <div className="flex flex-col items-center gap-4 mt-4">
          {/* Avatar Display */}
          <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
            <div className="w-24 h-24 rounded-full border-2 border-border/50 overflow-hidden bg-muted flex items-center justify-center shadow-lg transition-transform hover:scale-105">
              {uploadingImage ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground/50" />
              )}
              
              {!uploadingImage && (
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-foreground" />
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest text-center mt-[-8px]">
            Click, drag, or paste image
          </p>

          <input 
            id="avatar-upload" 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleImageFile(e.target.files[0]);
              }
            }} 
          />

          <form onSubmit={handleSave} className="flex flex-col gap-4 w-full mt-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest">Username</label>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </div>
            
            {message && (
              <p className={`text-xs text-center ${message.includes('Error') || message.includes('Failed') ? 'text-destructive' : 'text-primary'}`}>
                {message}
              </p>
            )}

            <Button type="submit" disabled={loading || uploadingImage} className="mt-2">
              {loading ? 'Saving...' : 'Save Profile'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

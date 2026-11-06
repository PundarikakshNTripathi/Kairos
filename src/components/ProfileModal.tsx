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
  const setProfile = useStore(state => state.setProfile);

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  // Populate the form once per opening. Depending on `profile`/`user` here would re-run after every
  // successful save and wipe the confirmation message the moment it appears.
  useEffect(() => {
    if (!isProfileOpen) return;
    const { profile: p, user: u } = useStore.getState();
    setUsername(p?.username || u?.user_metadata?.user_name || u?.user_metadata?.full_name || '');
    setAvatarUrl(p?.avatar_url || u?.user_metadata?.avatar_url || '');
    setMessage('');
    setImgFailed(false);
  }, [isProfileOpen]);

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
        setImgFailed(false);
        
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
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) handleImageFile(files[0]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) handleImageFile(files[0]);
  };

  const isError = /error|failed|please select/i.test(message);

  return (
    <Dialog open={isProfileOpen} onOpenChange={setProfileOpen}>
      <DialogContent className="sm:max-w-sm p-6 gap-5 border border-border" onPaste={handlePaste} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
        <div>
          <p className="eyebrow">Account</p>
          <DialogTitle className="font-display !text-4xl !leading-[1.05] mt-2">Your profile</DialogTitle>
          <DialogDescription className="mt-2">Shown only to you. Click, drag or paste an image to change your avatar.</DialogDescription>
        </div>

        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('avatar-upload')?.click()}
            aria-label="Change avatar"
            className="group relative size-24 border border-border bg-muted grid place-items-center overflow-hidden hover:border-primary transition-colors"
          >
            {uploadingImage ? (
              <Loader2 className="size-8 animate-spin text-primary" />
            ) : avatarUrl && !imgFailed ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" onError={() => setImgFailed(true)} onLoad={() => setImgFailed(false)} />
            ) : (
              <User className="size-10 text-muted-foreground" />
            )}
            {!uploadingImage && (
              <span className="absolute inset-0 bg-background/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity grid place-items-center">
                <Upload className="size-6 text-foreground" />
              </span>
            )}
          </button>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            data-testid="avatar-input"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) handleImageFile(e.target.files[0]);
            }}
          />
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="eyebrow">Username</span>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your username" className="h-10" data-testid="username-input" />
          </label>

          {message && (
            <p role="status" className={`text-xs ${isError ? 'text-primary' : 'text-foreground'}`} data-testid="profile-message">
              {message}
            </p>
          )}

          <Button type="submit" disabled={loading || uploadingImage} className="h-10 font-mono text-sm uppercase tracking-[0.18em]" data-testid="profile-save">
            {loading ? 'Saving…' : 'Save profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

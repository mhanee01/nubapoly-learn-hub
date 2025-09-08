import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Download } from 'lucide-react';

interface UserFileItem {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string | null;
  metadata: {
    size?: number;
    mimetype?: string;
  } | null;
}

export default function Uploads() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UserFileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listFiles();
  }, [profile?.id]);

  const listFiles = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const folder = `users/${profile.id}`;
      const { data, error } = await supabase.storage.from('user-uploads').list(folder, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
      if (error) throw error;
      setFiles((data || []) as unknown as UserFileItem[]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to list files. Ensure bucket "user-uploads" exists.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!profile) return;
    const selected = e.target.files;
    if (!selected || selected.length === 0) return;
    setLoading(true);
    try {
      const folder = `users/${profile.id}`;
      for (let i = 0; i < selected.length; i++) {
        const file = selected[i];
        const path = `${folder}/${Date.now()}_${file.name}`;
        const { error } = await supabase.storage.from('user-uploads').upload(path, file, { upsert: false });
        if (error) throw error;
      }
      toast({ title: 'Uploaded', description: 'File(s) uploaded successfully.' });
      await listFiles();
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed. Check storage configuration.', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeFile = async (name: string) => {
    if (!profile) return;
    setLoading(true);
    try {
      const folder = `users/${profile.id}`;
      const path = `${folder}/${name}`;
      const { error } = await supabase.storage.from('user-uploads').remove([path]);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'File deleted.' });
      await listFiles();
    } catch (error) {
      toast({ title: 'Error', description: 'Delete failed.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getPublicUrl = (name: string) => {
    if (!profile) return '';
    const folder = `users/${profile.id}`;
    const { data } = supabase.storage.from('user-uploads').getPublicUrl(`${folder}/${name}`);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Uploads</h1>
        <p className="text-muted-foreground">Upload and manage your personal files.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Input ref={fileInputRef} type="file" multiple onChange={uploadFiles} />
          <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
            <Upload className="h-4 w-4 mr-2" />
            Select Files
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading...</div>
        )}
        {files.length === 0 && !loading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">No files uploaded yet.</CardContent>
          </Card>
        )}
        {files.map((f) => (
          <Card key={f.id} className="hover:shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="font-medium truncate">{f.name}</div>
                <div className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</div>
                {f.metadata?.mimetype && (
                  <div className="mt-1"><Badge variant="outline">{f.metadata.mimetype}</Badge></div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={getPublicUrl(f.name)} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => removeFile(f.name)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}



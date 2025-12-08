import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, Loader2 } from 'lucide-react';
import { ThreeBackground } from '@/components/ThreeBackground';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { FileCard } from '@/components/FileCard';
import { EmptyState } from '@/components/EmptyState';
import { UploadModal } from '@/components/UploadModal';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileRecord } from '@/types/file';

export default function Dashboard() {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [chatFile, setChatFile] = useState<FileRecord | null>(null);
  const { user, session, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchFiles = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFiles((data as FileRecord[]) || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load files',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user]);

  const handleDelete = async (fileId: string) => {
    if (!session?.access_token) return;

    try {
      // Call delete edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fileId }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Delete failed');
      }

      setFiles((prev) => prev.filter((f) => f.file_id !== fileId));
      toast({
        title: 'Deleted',
        description: 'File removed successfully',
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleChat = (fileId: string) => {
    const file = files.find((f) => f.file_id === fileId);
    if (file) {
      setChatFile(file);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ThreeBackground />
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <ThreeBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setIsUploadOpen(true)}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Plus className="h-5 w-5 mr-2" />
              Upload File
            </Button>
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Documents</h1>
          <p className="text-muted-foreground">
            Upload documents and ask questions about them using AI
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onDelete={handleDelete}
                onChat={handleChat}
              />
            ))}
          </div>
        )}
      </main>

      <UploadModal
        open={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={fetchFiles}
      />

      <ChatPanel
        file={chatFile}
        userId={user?.id || ''}
        open={!!chatFile}
        onClose={() => setChatFile(null)}
      />
    </div>
  );
}

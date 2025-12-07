import { useState, useRef } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2, X, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const uploadSchema = z.object({
  friendlyName: z.string().min(1, 'Please enter a name for your file').max(100),
  description: z.string().min(1, 'Please enter a description').max(500),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/json',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.csv', '.json'];

export function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [inputMethod, setInputMethod] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { session } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        toast({
          title: 'Invalid file type',
          description: `Please upload a ${ALLOWED_EXTENSIONS.join(', ')} file`,
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      setTextContent('');
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextContent(e.target.value);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile && !textContent.trim()) {
      toast({
        title: 'No content',
        description: 'Please upload a file or paste text content',
        variant: 'destructive',
      });
      return;
    }

    if (!session?.access_token) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to upload files',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadStatus('Preparing file...');

    try {
      const formData = new FormData();
      formData.append('friendlyName', data.friendlyName);
      formData.append('description', data.description);

      if (selectedFile) {
        formData.append('file', selectedFile);
        formData.append('originalFilename', selectedFile.name);
        formData.append('mimeType', selectedFile.type);
      } else {
        formData.append('textContent', textContent);
        formData.append('originalFilename', `${data.friendlyName}.docx`);
        formData.append('mimeType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      }

      setUploadStatus('Sending to processing pipeline...');

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus('Upload complete!');
      toast({
        title: 'Success',
        description: 'File uploaded and processed successfully',
      });

      // Reset and close
      reset();
      setSelectedFile(null);
      setTextContent('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      setUploadStatus('');
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      reset();
      setSelectedFile(null);
      setTextContent('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass gradient-border sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl gradient-text">Upload Document</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as 'file' | 'text')}>
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="file" className="data-[state=active]:bg-primary/20">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-primary/20">
                <FileText className="h-4 w-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="mt-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      PDF, DOCX, CSV, JSON
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <Textarea
                placeholder="Paste your text content here..."
                value={textContent}
                onChange={handleTextChange}
                className="min-h-[200px] bg-muted/50 border-white/10 focus:border-primary resize-none"
              />
            </TabsContent>
          </Tabs>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="friendlyName">Display Name</Label>
              <Input
                id="friendlyName"
                placeholder="My Important Document"
                className="bg-muted/50 border-white/10 focus:border-primary"
                {...register('friendlyName')}
              />
              {errors.friendlyName && (
                <p className="text-sm text-destructive">{errors.friendlyName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="What is this document about?"
                className="bg-muted/50 border-white/10 focus:border-primary resize-none"
                rows={3}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </div>

          {uploadStatus && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {uploadStatus}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isUploading || (!selectedFile && !textContent.trim())}
              className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Upload'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

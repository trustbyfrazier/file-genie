import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileRecord } from '@/types/file';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FileCardProps {
  file: FileRecord;
  onDelete: (fileId: string) => Promise<void>;
  onChat: (fileId: string) => void;
}

export function FileCard({ file, onDelete, onChat }: FileCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(file.file_id);
    } finally {
      setIsDeleting(false);
    }
  };

  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const getFileIcon = (mimeType: string) => {
    return <FileText className="h-8 w-8 text-primary" />;
  };

  return (
    <Card className="glass gradient-border group hover:glow-pink transition-all duration-300 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-primary/10">
            {getFileIcon(file.mime_type)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate mb-1">
              {file.friendly_name}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              {file.original_filename}
            </p>
            <p className="text-sm text-muted-foreground/80 line-clamp-2">
              {truncateDescription(file.description)}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {format(new Date(file.created_at), 'MMM d, yyyy')}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChat(file.file_id)}
              className="text-secondary hover:text-secondary hover:bg-secondary/10"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Chat
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isDeleting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to delete this file?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete "{file.friendly_name}".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

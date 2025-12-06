import { FileQuestion } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 blur-3xl rounded-full" />
        <div className="relative p-8 rounded-full bg-muted/50 animate-float">
          <FileQuestion className="h-16 w-16 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">No files yet</h3>
      <p className="text-muted-foreground text-center max-w-sm">
        Upload your first document to start asking questions about it with AI
      </p>
    </div>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, MessageSquare, Sparkles } from 'lucide-react';
import { ThreeBackground } from '@/components/ThreeBackground';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: FileText,
      title: 'Upload Documents',
      description: 'Support for PDF, DOCX, CSV, and JSON files',
    },
    {
      icon: Sparkles,
      title: 'AI Processing',
      description: 'Intelligent document analysis and indexing',
    },
    {
      icon: MessageSquare,
      title: 'Chat with Files',
      description: 'Ask questions and get instant answers',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ThreeBackground />

      {/* Hero Section */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6">
          <Logo size="md" />
        </nav>

        {/* Hero Content */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-3xl mx-auto animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Ask Questions</span>
              <br />
              <span className="text-foreground">About Your Files</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-xl mx-auto">
              Upload documents, let AI process them, and have intelligent
              conversations about your content
            </p>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8 py-6 glow-pink"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-6 text-center gradient-border hover:glow-blue transition-all duration-300"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="inline-flex p-4 rounded-xl bg-primary/10 mb-4">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

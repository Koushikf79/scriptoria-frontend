import { ChangeEvent, useState } from 'react';
import { Film, Loader2, Paperclip, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SAMPLE_SCREENPLAY } from '@/lib/mock-data';

interface ProgressState {
  stage: string;
  percentage: number;
  message: string;
}

interface HeroInputProps {
  onAnalyze: (script: string) => void;
  loading: boolean;
  selectedMarket?: 'TOLLYWOOD' | 'BOLLYWOOD' | 'HOLLYWOOD' | 'KOREAN' | 'GENERAL';
  onMarketChange?: (market: 'TOLLYWOOD' | 'BOLLYWOOD' | 'HOLLYWOOD' | 'KOREAN' | 'GENERAL') => void;
  progress?: ProgressState | null;
  error?: string | null;
}

export default function HeroInput({ 
  onAnalyze, 
  loading,
  selectedMarket = 'TOLLYWOOD',
  onMarketChange,
  progress,
  error,
}: HeroInputProps) {
  const [script, setScript] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [readingAttachment, setReadingAttachment] = useState(false);

  const extractPdfText = async (file: File) => {
    const [{ getDocument, GlobalWorkerOptions }, workerSrc] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ]);

    GlobalWorkerOptions.workerSrc = workerSrc.default;

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data }).promise;
    const pages: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (pageText) pages.push(pageText);
    }

    return pages.join('\n\n');
  };

  const handleAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setReadingAttachment(true);

    try {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const content = isPdf ? await extractPdfText(file) : await file.text();

      if (!content.trim()) {
        throw new Error('Empty content');
      }

      setScript(content);
      setAttachmentName(file.name);
    } catch {
      setAttachmentName('Unable to read file');
    } finally {
      setReadingAttachment(false);
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center gap-8 animate-fade-in">
      {/* Hero */}
      <div className="text-center space-y-4 max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Film className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-gradient-gold leading-tight">
          SCRIPTORIA
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto">
          AI-powered pre-production intelligence. Analyze screenplays, model emotions,
          simulate budgets, and generate cinematic storyboard visions.
        </p>
      </div>

      {/* Input */}
      <div className="w-full max-w-3xl space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="glass-card p-1">
          <Textarea
            placeholder="Paste your screenplay here..."
            className="min-h-[200px] bg-transparent border-0 resize-y text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
            value={script}
            onChange={e => setScript(e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Market Selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Market:</label>
          <Select
            value={selectedMarket}
            onValueChange={(value) => {
              onMarketChange?.(value as 'TOLLYWOOD' | 'BOLLYWOOD' | 'HOLLYWOOD' | 'KOREAN' | 'GENERAL');
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TOLLYWOOD">Telugu / Tollywood</SelectItem>
              <SelectItem value="BOLLYWOOD">Bollywood</SelectItem>
              <SelectItem value="HOLLYWOOD">Hollywood</SelectItem>
              <SelectItem value="KOREAN">Korean</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">{progress.message}</span>
              <span className="text-muted-foreground">{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            size="lg"
            onClick={() => onAnalyze(script)}
            disabled={!script.trim() || loading || readingAttachment}
            className="gap-2 gold-glow"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? 'Analyzing...' : 'Analyze Screenplay'}
          </Button>

          <Button
            variant="outline"
            onClick={() => setScript(SAMPLE_SCREENPLAY)}
            disabled={loading || readingAttachment}
          >
            Load Sample Script
          </Button>

          <Button variant="outline" asChild disabled={loading || readingAttachment}>
            <label className="cursor-pointer gap-2 inline-flex items-center">
              <Paperclip className="h-4 w-4" />
              {readingAttachment ? 'Reading File...' : 'Attach File'}
              <input
                type="file"
                accept=".txt,.md,.fountain,.screenplay,.json,.pdf,text/plain,text/markdown,application/json,application/pdf"
                className="hidden"
                onChange={handleAttachment}
              />
            </label>
          </Button>

          {attachmentName && (
            <p className="text-xs text-muted-foreground">Attached: {attachmentName}</p>
          )}
        </div>
      </div>
    </div>
  );
}

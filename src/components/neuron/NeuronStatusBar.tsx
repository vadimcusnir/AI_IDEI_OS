import { Hash, Type } from "lucide-react";

interface NeuronStatusBarProps {
  wordCount: number;
  charCount: number;
  blockCount: number;
}

export function NeuronStatusBar({ wordCount, charCount, blockCount }: NeuronStatusBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-border text-xs text-muted-foreground bg-toolbar">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <Type className="h-3 w-3" />
          {wordCount} words
        </span>
        <span>{charCount} characters</span>
        <span className="flex items-center gap-1">
          <Hash className="h-3 w-3" />
          {blockCount} blocks
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary/70 font-medium">neuron</span>
      </div>
    </div>
  );
}

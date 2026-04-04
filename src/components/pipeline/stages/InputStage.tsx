/**
 * InputStage — Upload content (delegates to InstantActionSurface)
 */
import { InstantActionSurface } from "@/components/extractor/InstantActionSurface";

interface Props {
  onPipelineStart: () => void;
  onPipelineComplete: (result: any) => void;
  onExtractionComplete: () => void;
}

export function InputStage({ onPipelineStart, onPipelineComplete, onExtractionComplete }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-h3 font-bold text-foreground mb-1">
          Upload Content
        </h2>
        <p className="text-caption text-muted-foreground">
          Paste a link, upload a file, or type content to begin analysis.
        </p>
      </div>
      <InstantActionSurface
        onComplete={onExtractionComplete}
        onPipelineStart={onPipelineStart}
        onPipelineComplete={onPipelineComplete}
        compact
      />
    </div>
  );
}

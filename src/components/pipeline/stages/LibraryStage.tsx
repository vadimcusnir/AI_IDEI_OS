/**
 * LibraryStage — Final step showing what was produced, linking to library
 */
import { motion } from "framer-motion";
import { BookOpen, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Props {
  neuronCount: number;
  artifactId?: string;
  onReset: () => void;
}

export function LibraryStage({ neuronCount, artifactId, onReset }: Props) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-lg mx-auto text-center"
    >
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
        <BookOpen className="h-7 w-7 text-primary" />
      </div>
      <h3 className="text-h3 font-bold text-foreground mb-2">
        Pipeline Complete
      </h3>
      <p className="text-caption text-muted-foreground mb-6">
        {neuronCount} neurons processed and stored in your library.
      </p>

      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          onClick={() => navigate("/library")}
          className="w-full"
        >
          Open Library <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        {artifactId && (
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(`/library/${artifactId}`)}
            className="w-full"
          >
            View Artifact
          </Button>
        )}
        <Button variant="ghost" size="lg" onClick={onReset} className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" /> New Pipeline
        </Button>
      </div>
    </motion.div>
  );
}

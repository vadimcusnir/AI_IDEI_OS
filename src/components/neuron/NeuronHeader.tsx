import { Pin, PinOff, Archive, Star, Clock, Share2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const NOTE_COLORS = [
  { name: "Default", value: "default" },
  { name: "Yellow", value: "yellow" },
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Pink", value: "pink" },
  { name: "Purple", value: "purple" },
];

interface NeuronHeaderProps {
  isPinned: boolean;
  isStarred: boolean;
  noteColor: string;
  tags: string[];
  lastEdited: string;
  onTogglePin: () => void;
  onToggleStar: () => void;
  onColorChange: (color: string) => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
}

const colorMap: Record<string, string> = {
  default: "bg-note-default",
  yellow: "bg-note-yellow",
  green: "bg-note-green",
  blue: "bg-note-blue",
  pink: "bg-note-pink",
  purple: "bg-note-purple",
};

function HeaderAction({ icon: Icon, label, active, onClick }: {
  icon: React.ElementType; label: string; active?: boolean; onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "toolbar-active" : "toolbar"}
          size="icon"
          className="h-8 w-8"
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

export function NeuronHeader({
  isPinned, isStarred, noteColor, tags, lastEdited,
  onTogglePin, onToggleStar, onColorChange, showColorPicker, onToggleColorPicker
}: NeuronHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{lastEdited}</span>
        </div>
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="text-xs font-normal px-2 py-0">
            {tag}
          </Badge>
        ))}
      </div>

      <div className="flex items-center gap-0.5 relative">
        <HeaderAction
          icon={isPinned ? PinOff : Pin}
          label={isPinned ? "Unpin" : "Pin"}
          active={isPinned}
          onClick={onTogglePin}
        />
        <HeaderAction
          icon={Star}
          label={isStarred ? "Unstar" : "Star"}
          active={isStarred}
          onClick={onToggleStar}
        />
        <HeaderAction icon={Palette} label="Note color" onClick={onToggleColorPicker} />
        <HeaderAction icon={Share2} label="Share" onClick={() => {}} />
        <HeaderAction icon={Archive} label="Archive" onClick={() => {}} />

        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-10 z-10 flex gap-1.5 p-2 bg-popover border border-border rounded-lg shadow-lg"
          >
            {NOTE_COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => onColorChange(c.value)}
                className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${colorMap[c.value]} ${
                  noteColor === c.value ? "border-toolbar-active scale-110" : "border-transparent"
                }`}
                title={c.name}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

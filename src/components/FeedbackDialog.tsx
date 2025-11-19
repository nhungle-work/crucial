import { useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const [rating, setRating] = useState([7]);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    // For now, just log the feedback
    console.log("Rating:", rating[0]);
    console.log("Feedback:", feedback);
    
    // Reset and close
    setRating([7]);
    setFeedback("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-4xl font-bold text-center bg-gradient-to-r from-[#E87B9E] via-[#D8A7CA] to-[#A8D5BA] bg-clip-text text-transparent">
            Tell me your wish
          </DialogTitle>
          <p className="text-center text-muted-foreground pt-2">
            Let Crucial hear what's in your heart
          </p>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label htmlFor="rating" className="text-base">
              How would you rate Crucial?
            </Label>
            <div className="flex items-center gap-4">
              <Slider
                id="rating"
                min={0}
                max={10}
                step={1}
                value={rating}
                onValueChange={setRating}
                className="flex-1"
              />
              <span className="text-2xl font-semibold text-primary w-12 text-center">
                {rating[0]}
              </span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Not satisfied</span>
              <span>Perfect!</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="feedback" className="text-base">
              What can Crucial improve more?
            </Label>
            <Textarea
              id="feedback"
              placeholder="Share your thoughts, wishes, and suggestions..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <MessageSquareHeart className="mr-2 h-4 w-4" />
              Submit Wish
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

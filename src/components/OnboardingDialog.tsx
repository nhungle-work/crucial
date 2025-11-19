import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import wheelOfLife from "@/assets/wheel-of-life.png";

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OnboardingDialog({ open, onOpenChange }: OnboardingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Crucial 101: How to Design Your Week with Crucial
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="h-full max-h-[70vh] pr-4">
          <div className="space-y-6 text-foreground">
            {/* Main Instructions */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">How to Use Your Weekly Planner</h3>
              <ol className="space-y-3 list-decimal list-inside">
                <li>
                  <strong>Role Column:</strong> Fill in the roles you want to focus on this week. 
                  These could be: son/daughter, boss, employee, parent, spouse, 
                  or an inspiring figure in [your area of interest]
                </li>
                <li>
                  <strong>Goal Column:</strong> Write down the most important thing to accomplish 
                  this week for each role to create the most positive impact.
                </li>
                <li>
                  <strong>Distribute Tasks:</strong> Break down tasks from your goals 
                  into the weekly columns (Monday through Sunday)
                </li>
                <li>
                  <strong>Execute & Track:</strong> Complete tasks and check them off when done. 
                  If a task isn't finished during the day, move it to another day within the week.
                </li>
              </ol>
            </section>

            {/* Wheel of Life */}
            <section className="flex flex-col items-center">
              <img 
                src={wheelOfLife} 
                alt="Wheel of Life" 
                className="w-full max-w-md rounded-lg shadow-md"
              />
              <p className="text-xs text-muted-foreground mt-2 italic">Source: Pinterest</p>
            </section>

            {/* Tips */}
            <section>
              <h3 className="text-lg font-semibold mb-3 text-primary">Pro Tips</h3>
              <div className="space-y-3">
                <div>
                  <strong>1. Finding Your Roles:</strong>
                  <p className="ml-4 text-muted-foreground">
                    Base your roles on your mission statement or the Wheel of Life above. 
                    Choose roles that align with what matters most to you.
                  </p>
                </div>
                <div>
                  <strong>2. The Power of Three:</strong>
                  <p className="ml-4 text-muted-foreground">
                    Three is the magic number. While you can have up to 7 roles per week, 
                    focus on only 3 most important tasks per day for maximum effectiveness.
                  </p>
                </div>
                <div>
                  <strong>3. Respect Your Time:</strong>
                  <p className="ml-4 text-muted-foreground">
                    Treat appointments with yourself as importantly as appointments with others. 
                    Your personal goals deserve dedicated time blocks.
                  </p>
                </div>
              </div>
            </section>

            <div className="flex justify-center pt-4">
              <Button onClick={() => onOpenChange(false)} className="px-8">
                Get Started
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import wheelOfLife from "@/assets/wheel-of-life.png";

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  {
    title: "Role Column",
    description: "Fill in the roles you want to focus on this week. These could be: son/daughter, boss, employee, parent, spouse, or an inspiring figure in your area of interest.",
    highlight: "role",
  },
  {
    title: "Weekly Goals Column",
    description: "Write down the most important thing to accomplish this week for each role to create the most positive impact.",
    highlight: "goals",
  },
  {
    title: "Notes Column",
    description: "Add any additional notes or reminders for each role. This is your space to capture thoughts and context.",
    highlight: "notes",
  },
  {
    title: "Weekly Task Columns",
    description: "Break down tasks from your goals into specific days (Monday through Sunday). Complete tasks and check them off when done. If a task isn't finished during the day, move it to another day within the week.",
    highlight: "days",
  },
  {
    title: "Pro Tips",
    description: "",
    highlight: "tips",
  },
];

export default function OnboardingOverlay({ isOpen, onClose }: OnboardingOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Reset to step 0 when opening
  useState(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  });

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getHighlightPosition = () => {
    switch (currentStepData.highlight) {
      case "role":
        return "left-[2%] top-[22%] w-[9.5%] h-[60%]";
      case "goals":
        return "left-[12%] top-[22%] w-[13%] h-[60%]";
      case "notes":
        return "left-[25.5%] top-[22%] w-[8%] h-[60%]";
      case "days":
        return "left-[34%] top-[22%] w-[9.5%] h-[60%]"; // Only Monday column
      case "tips":
        return "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]";
      default:
        return "";
    }
  };

  const getInstructionPosition = () => {
    switch (currentStepData.highlight) {
      case "role":
        return "left-[13%] top-[25%]";
      case "goals":
        return "left-[28%] top-[25%]";
      case "notes":
        return "left-[36%] top-[25%]";
      case "days":
        return "left-[10%] top-[25%]";
      default:
        return "left-[50%] top-[15%] translate-x-[-50%]";
    }
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Highlighted area - uses box-shadow to darken everything except the highlighted column */}
      {currentStepData.highlight !== "tips" && (
        <div 
          className={`absolute ${getHighlightPosition()} border-4 border-primary rounded-lg animate-scale-in transition-all duration-500`}
          style={{ 
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 40px 10px rgba(255, 182, 193, 0.8)',
          }}
        />
      )}
      
      {/* Dark overlay for tips screen only */}
      {currentStepData.highlight === "tips" && (
        <div className="absolute inset-0 bg-black/85 animate-fade-in" />
      )}

      {/* Instruction card */}
      <div 
        className={`absolute ${
          currentStepData.highlight === "tips" 
            ? "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] w-[90%] max-w-2xl max-h-[85vh] overflow-y-auto" 
            : `${getInstructionPosition()} w-[90%] max-w-md`
        } bg-card border border-border rounded-lg shadow-xl p-6 animate-fade-in transition-all duration-500`}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {currentStepData.highlight === "tips" ? (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-primary text-center mb-6">Pro Tips</h3>
            
            <div className="flex flex-col items-center mb-6">
              <img 
                src={wheelOfLife} 
                alt="Wheel of Life" 
                className="w-full max-w-sm rounded-lg shadow-md"
              />
              <p className="text-xs text-muted-foreground mt-2 italic">Source: Pinterest</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-foreground">1. Finding Your Roles:</strong>
                <p className="text-muted-foreground mt-1">
                  Base your roles on your mission statement or the Wheel of Life above. 
                  Choose roles that align with what matters most to you.
                </p>
              </div>
              <div>
                <strong className="text-foreground">2. The Power of Three:</strong>
                <p className="text-muted-foreground mt-1">
                  Three is the magic number. While you can have up to 7 roles per week, 
                  focus on only 3 most important tasks per day for maximum effectiveness.
                </p>
              </div>
              <div>
                <strong className="text-foreground">3. Respect Your Time:</strong>
                <p className="text-muted-foreground mt-1">
                  Treat appointments with yourself as importantly as appointments with others. 
                  Your personal goals deserve dedicated time blocks.
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
              <Button onClick={handleNext}>
                Get Started
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">
                Step {currentStep + 1} of {steps.length}
              </div>
              <h3 className="text-xl font-bold text-primary mb-3">
                {currentStepData.title}
              </h3>
              <p className="text-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button onClick={handleNext}>
                {isLastStep ? "Finish" : "Next"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

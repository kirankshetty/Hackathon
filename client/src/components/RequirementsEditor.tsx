import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormLabel } from "@/components/ui/form";
import { Plus, X, Upload, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Requirement {
  description: string;
  template: string;
}

interface RequirementsEditorProps {
  requirements: Requirement[];
  onUpdate: (requirements: Requirement[]) => void;
  formId?: string;
}

export function RequirementsEditor({ requirements, onUpdate, formId = "" }: RequirementsEditorProps) {
  const { toast } = useToast();

  const addRequirement = () => {
    const newRequirements = [...requirements, { description: "", template: "" }];
    onUpdate(newRequirements);
  };

  const removeRequirement = (index: number) => {
    if (requirements.length > 1) {
      const newRequirements = requirements.filter((_, i) => i !== index);
      onUpdate(newRequirements);
    }
  };

  const updateRequirement = (index: number, field: 'description' | 'template', value: string) => {
    const newRequirements = [...requirements];
    newRequirements[index] = { ...newRequirements[index], [field]: value };
    onUpdate(newRequirements);
  };

  const handleFileUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a temporary URL for the uploaded file
      const fileUrl = URL.createObjectURL(file);
      updateRequirement(index, 'template', fileUrl);
      
      toast({
        title: "File uploaded",
        description: `${file.name} has been attached to this requirement.`,
      });
    }
  };

  return (
    <div>
      <FormLabel className="text-sm font-medium">Requirements <span className="text-red-500">*</span></FormLabel>
      <div className="space-y-3 mt-2">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-start space-x-2 p-3 border rounded-lg bg-gray-50">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Requirement description..."
                value={req.description}
                onChange={(e) => updateRequirement(index, 'description', e.target.value)}
              />
              <div className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="Template URL (optional)"
                  value={req.template}
                  onChange={(e) => updateRequirement(index, 'template', e.target.value)}
                  className="flex-1"
                />
                <input
                  type="file"
                  id={`file-upload-${formId}-${index}`}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.zip,.ppt,.pptx"
                  onChange={(e) => handleFileUpload(index, e)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById(`file-upload-${formId}-${index}`)?.click()}
                  className="px-3"
                  title="Upload file"
                >
                  <Upload className="w-4 h-4" />
                </Button>
                {req.template && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateRequirement(index, 'template', '')}
                    className="px-3 text-red-500 hover:text-red-700"
                    title="Remove template"
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            {requirements.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeRequirement(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRequirement}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Requirement
        </Button>
      </div>
    </div>
  );
}
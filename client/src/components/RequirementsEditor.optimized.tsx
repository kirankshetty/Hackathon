import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface Requirement {
  id: string;
  type: 'document' | 'text' | 'file' | 'url';
  name: string;
  description: string;
  required: boolean;
  options?: string[];
}

interface RequirementItemProps {
  requirement: Requirement;
  onUpdate: (id: string, updates: Partial<Requirement>) => void;
  onDelete: (id: string) => void;
  index: number;
}

// Memoized requirement item to prevent unnecessary re-renders
const RequirementItem = React.memo(({ requirement, onUpdate, onDelete, index }: RequirementItemProps) => {
  const handleNameChange = useCallback((value: string) => {
    onUpdate(requirement.id, { name: value });
  }, [requirement.id, onUpdate]);

  const handleDescriptionChange = useCallback((value: string) => {
    onUpdate(requirement.id, { description: value });
  }, [requirement.id, onUpdate]);

  const handleTypeChange = useCallback((value: string) => {
    onUpdate(requirement.id, { type: value as Requirement['type'] });
  }, [requirement.id, onUpdate]);

  const handleRequiredChange = useCallback(() => {
    onUpdate(requirement.id, { required: !requirement.required });
  }, [requirement.id, requirement.required, onUpdate]);

  const handleDelete = useCallback(() => {
    onDelete(requirement.id);
  }, [requirement.id, onDelete]);

  return (
    <Card className="group relative border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-gray-400" />
            <CardTitle className="text-sm font-medium">
              Requirement {index + 1}
            </CardTitle>
            <Badge variant={requirement.required ? "default" : "secondary"}>
              {requirement.required ? "Required" : "Optional"}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Name</label>
            <Input
              value={requirement.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Requirement name"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Type</label>
            <Select value={requirement.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="url">URL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">Description</label>
          <Textarea
            value={requirement.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Describe what this requirement is for..."
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`required-${requirement.id}`}
            checked={requirement.required}
            onChange={handleRequiredChange}
            className="rounded border-gray-300"
          />
          <label htmlFor={`required-${requirement.id}`} className="text-sm">
            This is a required field
          </label>
        </div>
      </CardContent>
    </Card>
  );
});

RequirementItem.displayName = 'RequirementItem';

interface RequirementsEditorProps {
  requirements: Requirement[];
  onUpdate: (requirements: Requirement[]) => void;
  className?: string;
}

export const RequirementsEditor: React.FC<RequirementsEditorProps> = ({
  requirements,
  onUpdate,
  className = ""
}) => {
  // Memoize callbacks to prevent child re-renders
  const handleRequirementUpdate = useCallback((id: string, updates: Partial<Requirement>) => {
    const updatedRequirements = requirements.map(req =>
      req.id === id ? { ...req, ...updates } : req
    );
    onUpdate(updatedRequirements);
  }, [requirements, onUpdate]);

  const handleRequirementDelete = useCallback((id: string) => {
    const updatedRequirements = requirements.filter(req => req.id !== id);
    onUpdate(updatedRequirements);
  }, [requirements, onUpdate]);

  const handleAddRequirement = useCallback(() => {
    const newRequirement: Requirement = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'document',
      name: '',
      description: '',
      required: true
    };
    onUpdate([...requirements, newRequirement]);
  }, [requirements, onUpdate]);

  // Memoize the requirements list to prevent unnecessary re-renders
  const requirementItems = useMemo(() => 
    requirements.map((requirement, index) => (
      <RequirementItem
        key={requirement.id}
        requirement={requirement}
        onUpdate={handleRequirementUpdate}
        onDelete={handleRequirementDelete}
        index={index}
      />
    )),
    [requirements, handleRequirementUpdate, handleRequirementDelete]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Stage Requirements</h3>
        <Button onClick={handleAddRequirement} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Requirement
        </Button>
      </div>

      {requirements.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-gray-500 mb-4">No requirements added yet</p>
            <Button onClick={handleAddRequirement} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add First Requirement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requirementItems}
        </div>
      )}

      {requirements.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-gray-600">
            {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} configured
          </p>
          <p className="text-sm text-gray-600">
            {requirements.filter(r => r.required).length} required, {requirements.filter(r => !r.required).length} optional
          </p>
        </div>
      )}
    </div>
  );
};
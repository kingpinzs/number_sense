// IntakeSection — Generic section renderer for personal history intake
// Renders fields based on section definition

import type { IntakeSection as IntakeSectionDef, HistorySectionData } from '../types';

interface IntakeSectionProps {
  section: IntakeSectionDef;
  data: HistorySectionData;
  onChange: (data: HistorySectionData) => void;
}

export default function IntakeSection({ section, data, onChange }: IntakeSectionProps) {
  const handleFieldChange = (key: string, value: string) => {
    onChange({
      ...data,
      data: { ...data.data, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{section.title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
      </div>

      {section.fields.map(field => (
        <div key={field.key}>
          <label htmlFor={`field-${field.key}`} className="text-sm font-medium block mb-1.5">
            {field.label}
          </label>
          {field.type === 'textarea' ? (
            <textarea
              id={`field-${field.key}`}
              value={data.data[field.key] ?? ''}
              onChange={e => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={3}
            />
          ) : field.type === 'checkbox' ? (
            <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
              <input
                id={`field-${field.key}`}
                type="checkbox"
                checked={data.data[field.key] === 'true'}
                onChange={e => handleFieldChange(field.key, e.target.checked ? 'true' : 'false')}
                className="h-5 w-5 rounded border-input accent-primary"
              />
              <span className="text-sm">{field.placeholder}</span>
            </label>
          ) : (
            <input
              id={`field-${field.key}`}
              type="text"
              value={data.data[field.key] ?? ''}
              onChange={e => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[44px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          )}
        </div>
      ))}
    </div>
  );
}

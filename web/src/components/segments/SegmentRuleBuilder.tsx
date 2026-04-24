'use client';

import { useState } from 'react';

export interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
  value2?: unknown;
}

export interface RuleGroup {
  logic: 'AND' | 'OR' | 'NOT';
  conditions: (RuleCondition | RuleGroup)[];
}

export function isGroup(node: RuleCondition | RuleGroup): node is RuleGroup {
  return 'logic' in node && 'conditions' in node;
}

type FieldType = 'string' | 'boolean' | 'number' | 'date' | 'id' | 'special';

export interface FieldMeta {
  label: string;
  type: FieldType;
}

export const ORG_FIELDS: Record<string, FieldMeta> = {
  OrganizationName: { label: 'Organization Name', type: 'string' },
  City: { label: 'City', type: 'string' },
  State: { label: 'State', type: 'string' },
  OrgTypeID: { label: 'Org Type', type: 'id' },
  OwnershipTypeID: { label: 'Ownership Type', type: 'id' },
  GrowthStageID: { label: 'Growth Stage', type: 'id' },
  PriorityLevelID: { label: 'Priority Level', type: 'id' },
  PartnershipStageID: { label: 'Partnership Stage', type: 'id' },
  RelationshipLevelID: { label: 'Relationship Level', type: 'id' },
  FederalContractor: { label: 'Federal Contractor', type: 'boolean' },
  ChampionIdentified: { label: 'Champion Identified', type: 'boolean' },
  ExecutiveSponsor: { label: 'Executive Sponsor', type: 'boolean' },
  InternshipPotentialFlag: { label: 'Internship Potential', type: 'boolean' },
  HiringPotentialFlag: { label: 'Hiring Potential', type: 'boolean' },
  StrategicPriorityLevel: { label: 'Strategic Priority', type: 'string' },
  EngagementStatus: { label: 'Engagement Status', type: 'string' },
  AssignedOwner: { label: 'Assigned Owner', type: 'string' },
  FirstEngagementDate: { label: 'First Engagement Date', type: 'date' },
  LastMeaningfulEngagement: { label: 'Last Meaningful Engagement', type: 'date' },
  NextActionDate: { label: 'Next Action Date', type: 'date' },
  DaysSinceEngagement: { label: 'Days Since Engagement', type: 'number' },
  Tag: { label: 'Strategic Tag', type: 'special' },
  Sector: { label: 'Industry Sector', type: 'special' },
};

export const CONTACT_FIELDS: Record<string, FieldMeta> = {
  FirstName: { label: 'First Name', type: 'string' },
  LastName: { label: 'Last Name', type: 'string' },
  Email: { label: 'Email', type: 'string' },
  OrganizationID: { label: 'Organization', type: 'id' },
  FunctionalAreaID: { label: 'Functional Area', type: 'id' },
  InfluenceLevelID: { label: 'Influence Level', type: 'id' },
  SeniorityLevelID: { label: 'Seniority Level', type: 'id' },
  ContactTypeID: { label: 'Contact Type', type: 'id' },
  PersonaTypeID: { label: 'Persona Type', type: 'id' },
  Alumni: { label: 'Alumni', type: 'boolean' },
  DecisionMakerFlag: { label: 'Decision Maker', type: 'boolean' },
  ChampionFlag: { label: 'Champion', type: 'boolean' },
  DonorFlag: { label: 'Donor', type: 'boolean' },
  City: { label: 'City', type: 'string' },
  State: { label: 'State', type: 'string' },
  WarmthStatus: { label: 'Warmth Status', type: 'string' },
  RelationshipStrength: { label: 'Relationship Strength', type: 'string' },
  LastContactDate: { label: 'Last Contact Date', type: 'date' },
  NextFollowUpDate: { label: 'Next Follow-Up Date', type: 'date' },
  InterestArea: { label: 'Interest Area', type: 'special' },
};

const OPERATORS_BY_TYPE: Record<FieldType, { value: string; label: string }[]> = {
  string: [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'contains', label: 'contains' },
    { value: 'starts_with', label: 'starts with' },
    { value: 'ends_with', label: 'ends with' },
    { value: 'in', label: 'in list' },
    { value: 'not_in', label: 'not in list' },
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
  ],
  boolean: [
    { value: 'is_true', label: 'is true' },
    { value: 'is_false', label: 'is false' },
  ],
  number: [
    { value: 'eq', label: '=' },
    { value: 'neq', label: '≠' },
    { value: 'gt', label: '>' },
    { value: 'gte', label: '≥' },
    { value: 'lt', label: '<' },
    { value: 'lte', label: '≤' },
    { value: 'between', label: 'between' },
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
  ],
  date: [
    { value: 'eq', label: 'on' },
    { value: 'gt', label: 'after' },
    { value: 'lt', label: 'before' },
    { value: 'gte', label: 'on or after' },
    { value: 'lte', label: 'on or before' },
    { value: 'between', label: 'between' },
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
  ],
  id: [
    { value: 'eq', label: 'equals' },
    { value: 'neq', label: 'not equals' },
    { value: 'in', label: 'in' },
    { value: 'not_in', label: 'not in' },
    { value: 'is_blank', label: 'is blank' },
    { value: 'is_not_blank', label: 'is not blank' },
  ],
  special: [
    { value: 'in', label: 'includes any of' },
    { value: 'not_in', label: 'excludes all of' },
  ],
};

const NO_VALUE_OPS = new Set(['is_blank', 'is_not_blank', 'is_true', 'is_false']);
const MULTI_VALUE_OPS = new Set(['in', 'not_in']);

export function emptyGroup(): RuleGroup {
  return { logic: 'AND', conditions: [] };
}

function emptyCondition(): RuleCondition {
  return { field: '', operator: '', value: '' };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('');
  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) onChange([...values, trimmed]);
    setInput('');
  }
  return (
    <div className="flex min-w-[200px] flex-1 flex-wrap items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-400/20">
      {values.map((v, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
          {v}
          <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-blue-400 hover:text-blue-600">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        </span>
      ))}
      <input
        className="min-w-[80px] flex-1 border-0 bg-transparent py-0.5 text-sm outline-none placeholder:text-gray-400"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !input && values.length) onChange(values.slice(0, -1));
        }}
        onBlur={add}
        placeholder={values.length ? '' : placeholder}
      />
    </div>
  );
}

function ConditionRow({ condition, fields, onChange, onRemove }: {
  condition: RuleCondition; fields: Record<string, FieldMeta>; onChange: (c: RuleCondition) => void; onRemove: () => void;
}) {
  const fieldMeta = condition.field ? fields[condition.field] : null;
  const fieldType = fieldMeta?.type ?? 'string';
  const operators = condition.field ? OPERATORS_BY_TYPE[fieldType] : [];
  const showValue = condition.operator && !NO_VALUE_OPS.has(condition.operator);
  const isMulti = MULTI_VALUE_OPS.has(condition.operator);
  const isBetween = condition.operator === 'between';

  function setField(field: string) {
    const newType = fields[field]?.type ?? 'string';
    const firstOp = OPERATORS_BY_TYPE[newType][0]?.value ?? '';
    onChange({ field, operator: firstOp, value: '', value2: undefined });
  }

  function setOperator(operator: string) {
    if (NO_VALUE_OPS.has(operator)) {
      onChange({ ...condition, operator, value: undefined, value2: undefined });
    } else if (MULTI_VALUE_OPS.has(operator)) {
      const prev = condition.value;
      const arr = Array.isArray(prev) ? prev : prev ? [String(prev)] : [];
      onChange({ ...condition, operator, value: arr, value2: undefined });
    } else {
      const prev = condition.value;
      const scalar = Array.isArray(prev) ? prev[0] ?? '' : prev ?? '';
      onChange({ ...condition, operator, value: scalar, value2: operator === 'between' ? condition.value2 ?? '' : undefined });
    }
  }

  const cls = 'block w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20';

  return (
    <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
      <select className={`${cls} min-w-[160px]`} value={condition.field} onChange={(e) => setField(e.target.value)}>
        <option value="">Select field…</option>
        {Object.entries(fields).map(([key, meta]) => <option key={key} value={key}>{meta.label}</option>)}
      </select>
      {condition.field && (
        <select className={`${cls} min-w-[130px]`} value={condition.operator} onChange={(e) => setOperator(e.target.value)}>
          <option value="">Operator…</option>
          {operators.map((op) => <option key={op.value} value={op.value}>{op.label}</option>)}
        </select>
      )}
      {showValue && !isMulti && !isBetween && (
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' || fieldType === 'id' ? 'number' : 'text'}
          className={`${cls} min-w-[160px] flex-1`}
          placeholder="Value"
          value={String(condition.value ?? '')}
          onChange={(e) => onChange({ ...condition, value: fieldType === 'number' || fieldType === 'id' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
        />
      )}
      {showValue && isBetween && (
        <>
          <input type={fieldType === 'date' ? 'date' : 'number'} className={`${cls} min-w-[120px]`} placeholder="From" value={String(condition.value ?? '')} onChange={(e) => onChange({ ...condition, value: e.target.value })} />
          <span className="self-center text-xs text-gray-400">and</span>
          <input type={fieldType === 'date' ? 'date' : 'number'} className={`${cls} min-w-[120px]`} placeholder="To" value={String(condition.value2 ?? '')} onChange={(e) => onChange({ ...condition, value2: e.target.value })} />
        </>
      )}
      {showValue && isMulti && (
        <TagInput
          values={Array.isArray(condition.value) ? condition.value.map(String) : []}
          onChange={(vals) => onChange({ ...condition, value: (fieldType === 'number' || fieldType === 'id' || fieldType === 'special') ? vals.map(Number).filter((n) => !isNaN(n)) : vals })}
          placeholder={fieldType === 'id' || fieldType === 'special' ? 'Enter IDs…' : 'Enter values…'}
        />
      )}
      <button type="button" onClick={onRemove} className="mt-0.5 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove condition">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

export function RuleGroupEditor({ group, fields, onChange, onRemove, depth }: {
  group: RuleGroup; fields: Record<string, FieldMeta>; onChange: (g: RuleGroup) => void; onRemove?: () => void; depth: number;
}) {
  function updateChild(index: number, child: RuleCondition | RuleGroup) {
    const next = deepClone(group);
    next.conditions[index] = child;
    onChange(next);
  }
  function removeChild(index: number) {
    const next = deepClone(group);
    next.conditions.splice(index, 1);
    onChange(next);
  }
  function addCondition() {
    const next = deepClone(group);
    next.conditions.push(emptyCondition());
    onChange(next);
  }
  function addSubGroup() {
    const next = deepClone(group);
    next.conditions.push(emptyGroup());
    onChange(next);
  }

  const logicColors: Record<string, string> = { AND: 'bg-blue-600', OR: 'bg-amber-500', NOT: 'bg-red-500' };

  return (
    <div className={`relative rounded-lg border border-gray-200 bg-white ${depth > 0 ? 'ml-4 border-l-2 border-l-blue-300' : ''}`}>
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Match</span>
        {(['AND', 'OR', 'NOT'] as const).map((l) => (
          <button key={l} type="button" onClick={() => onChange({ ...group, logic: l })}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${group.logic === l ? `${logicColors[l]} text-white` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >{l}</button>
        ))}
        <div className="flex-1" />
        {onRemove && (
          <button type="button" onClick={onRemove} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Remove group">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      <div className="space-y-2 px-4 py-3">
        {group.conditions.length === 0 && (
          <p className="py-3 text-center text-sm text-gray-400">Add a condition or group to build your filter.</p>
        )}
        {group.conditions.map((child, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-gray-100" />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${logicColors[group.logic]} text-white`}>{group.logic}</span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
            )}
            {isGroup(child) ? (
              <RuleGroupEditor group={child} fields={fields} onChange={(g) => updateChild(i, g)} onRemove={() => removeChild(i)} depth={depth + 1} />
            ) : (
              <ConditionRow condition={child} fields={fields} onChange={(c) => updateChild(i, c)} onRemove={() => removeChild(i)} />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5">
        <button type="button" onClick={addCondition}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Condition
        </button>
        <button type="button" onClick={addSubGroup}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>
          Add Group
        </button>
      </div>
    </div>
  );
}

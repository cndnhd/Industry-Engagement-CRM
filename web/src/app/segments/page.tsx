'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  previewSegment,
  executeSegment,
} from '@/lib/api';
import type { SegmentDefinition } from '@/types';

// ─── Rule tree types ──────────────────────────────────────────────────

interface RuleCondition {
  field: string;
  operator: string;
  value?: unknown;
  value2?: unknown;
}

interface RuleGroup {
  logic: 'AND' | 'OR' | 'NOT';
  conditions: (RuleCondition | RuleGroup)[];
}

function isGroup(node: RuleCondition | RuleGroup): node is RuleGroup {
  return 'logic' in node && 'conditions' in node;
}

// ─── Field metadata ───────────────────────────────────────────────────

type FieldType = 'string' | 'boolean' | 'number' | 'date' | 'id' | 'special';

interface FieldMeta {
  label: string;
  type: FieldType;
}

const ORG_FIELDS: Record<string, FieldMeta> = {
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

const CONTACT_FIELDS: Record<string, FieldMeta> = {
  FirstName: { label: 'First Name', type: 'string' },
  LastName: { label: 'Last Name', type: 'string' },
  Title: { label: 'Title / Job Title', type: 'string' },
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
  RelationshipStrength: { label: 'Relationship Strength', type: 'number' },
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

// ─── Helpers ──────────────────────────────────────────────────────────

function emptyGroup(): RuleGroup {
  return { logic: 'AND', conditions: [] };
}

function emptyCondition(): RuleCondition {
  return { field: '', operator: '', value: '' };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// ─── Condition Row ────────────────────────────────────────────────────

function ConditionRow({
  condition,
  fields,
  onChange,
  onRemove,
}: {
  condition: RuleCondition;
  fields: Record<string, FieldMeta>;
  onChange: (c: RuleCondition) => void;
  onRemove: () => void;
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

  const inputCls =
    'block w-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20';

  return (
    <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2.5">
      {/* Field */}
      <select
        className={`${inputCls} min-w-[160px]`}
        value={condition.field}
        onChange={(e) => setField(e.target.value)}
      >
        <option value="">Select field…</option>
        {Object.entries(fields).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>

      {/* Operator */}
      {condition.field && (
        <select
          className={`${inputCls} min-w-[130px]`}
          value={condition.operator}
          onChange={(e) => setOperator(e.target.value)}
        >
          <option value="">Operator…</option>
          {operators.map((op) => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      )}

      {/* Value */}
      {showValue && !isMulti && !isBetween && (
        <input
          type={fieldType === 'date' ? 'date' : fieldType === 'number' || fieldType === 'id' ? 'number' : 'text'}
          className={`${inputCls} min-w-[160px] flex-1`}
          placeholder="Value"
          value={String(condition.value ?? '')}
          onChange={(e) => onChange({ ...condition, value: fieldType === 'number' || fieldType === 'id' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })}
        />
      )}

      {/* Between: two inputs */}
      {showValue && isBetween && (
        <>
          <input
            type={fieldType === 'date' ? 'date' : 'number'}
            className={`${inputCls} min-w-[120px]`}
            placeholder="From"
            value={String(condition.value ?? '')}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
          />
          <span className="self-center text-xs text-gray-400">and</span>
          <input
            type={fieldType === 'date' ? 'date' : 'number'}
            className={`${inputCls} min-w-[120px]`}
            placeholder="To"
            value={String(condition.value2 ?? '')}
            onChange={(e) => onChange({ ...condition, value2: e.target.value })}
          />
        </>
      )}

      {/* Multi-value: tag input */}
      {showValue && isMulti && (
        <TagInput
          values={Array.isArray(condition.value) ? condition.value.map(String) : []}
          onChange={(vals) => onChange({
            ...condition,
            value: (fieldType === 'number' || fieldType === 'id' || fieldType === 'special')
              ? vals.map(Number).filter((n) => !isNaN(n))
              : vals,
          })}
          placeholder={fieldType === 'id' || fieldType === 'special' ? 'Enter IDs…' : 'Enter values…'}
        />
      )}

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="mt-0.5 flex-shrink-0 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        title="Remove condition"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────

function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  function add() {
    const trimmed = input.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
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
          if (e.key === 'Backspace' && !input && values.length) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={add}
        placeholder={values.length ? '' : placeholder}
      />
    </div>
  );
}

// ─── Rule Group ───────────────────────────────────────────────────────

function RuleGroupEditor({
  group,
  fields,
  onChange,
  onRemove,
  depth,
}: {
  group: RuleGroup;
  fields: Record<string, FieldMeta>;
  onChange: (g: RuleGroup) => void;
  onRemove?: () => void;
  depth: number;
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

  const logicColors: Record<string, string> = {
    AND: 'bg-blue-600',
    OR: 'bg-amber-500',
    NOT: 'bg-red-500',
  };

  return (
    <div className={`relative rounded-lg border border-gray-200 bg-white ${depth > 0 ? 'ml-4 border-l-2 border-l-blue-300' : ''}`}>
      {/* Group header */}
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Match</span>
        {(['AND', 'OR', 'NOT'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onChange({ ...group, logic: l })}
            className={`rounded-full px-3 py-0.5 text-xs font-semibold transition-colors ${
              group.logic === l
                ? `${logicColors[l]} text-white`
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {l}
          </button>
        ))}
        <div className="flex-1" />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Remove group"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Children */}
      <div className="space-y-2 px-4 py-3">
        {group.conditions.length === 0 && (
          <p className="py-4 text-center text-sm text-gray-400">No conditions yet. Add a condition or group to get started.</p>
        )}
        {group.conditions.map((child, i) => (
          <div key={i}>
            {i > 0 && (
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 border-t border-gray-100" />
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${logicColors[group.logic]} text-white`}>
                  {group.logic}
                </span>
                <div className="flex-1 border-t border-gray-100" />
              </div>
            )}
            {isGroup(child) ? (
              <RuleGroupEditor
                group={child}
                fields={fields}
                onChange={(g) => updateChild(i, g)}
                onRemove={() => removeChild(i)}
                depth={depth + 1}
              />
            ) : (
              <ConditionRow
                condition={child}
                fields={fields}
                onChange={(c) => updateChild(i, c)}
                onRemove={() => removeChild(i)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-4 py-2.5">
        <button
          type="button"
          onClick={addCondition}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Condition
        </button>
        <button
          type="button"
          onClick={addSubGroup}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6a1.125 1.125 0 0 1-1.125-1.125v-3.75ZM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-8.25ZM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 0 1-1.125-1.125v-2.25Z" /></svg>
          Add Group
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function SegmentsPage() {
  const [segments, setSegments] = useState<SegmentDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  // Current segment editing state
  const [activeId, setActiveId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [entityType, setEntityType] = useState<'O' | 'C'>('O');
  const [rootGroup, setRootGroup] = useState<RuleGroup>(emptyGroup());

  // Preview / execution
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fields = entityType === 'O' ? ORG_FIELDS : CONTACT_FIELDS;

  const loadSegments = useCallback(async () => {
    try {
      const list = await fetchSegments();
      setSegments(list);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSegments(); }, [loadSegments]);

  function resetBuilder() {
    setActiveId(null);
    setName('');
    setDescription('');
    setEntityType('O');
    setRootGroup(emptyGroup());
    setPreviewCount(null);
    setResults(null);
    setConfirmDelete(false);
  }

  function loadSegment(seg: SegmentDefinition) {
    setActiveId(seg.SegmentID);
    setName(seg.Name);
    setDescription(seg.Description ?? '');
    try {
      const parsed = JSON.parse(seg.RulesJson);
      setEntityType(parsed.entityType ?? 'O');
      setRootGroup(parsed.root ?? emptyGroup());
    } catch {
      setEntityType((seg.EntityType as 'O' | 'C') ?? 'O');
      setRootGroup(emptyGroup());
    }
    setPreviewCount(null);
    setResults(null);
    setConfirmDelete(false);
  }

  function buildRulesPayload() {
    return { entityType, root: rootGroup };
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewCount(null);
    try {
      const res = await previewSegment({ entityType, rules: buildRulesPayload() });
      setPreviewCount(res.count);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleExecute() {
    setResultsLoading(true);
    setResults(null);
    try {
      const res = await executeSegment({ entityType, rules: buildRulesPayload() });
      setResults(res);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setResultsLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const body = {
        Name: name,
        EntityType: entityType,
        Description: description || undefined,
        RulesJson: JSON.stringify(buildRulesPayload()),
      };
      if (activeId) {
        await updateSegment(activeId, body);
      } else {
        const created = await createSegment(body);
        setActiveId(created.SegmentID);
      }
      await loadSegments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    setSaving(true);
    try {
      const body = {
        Name: `Copy of ${name}`,
        EntityType: entityType,
        Description: description || undefined,
        RulesJson: JSON.stringify(buildRulesPayload()),
      };
      const created = await createSegment(body);
      setActiveId(created.SegmentID);
      setName(body.Name);
      await loadSegments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duplicate failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!activeId) return;
    setDeleting(true);
    try {
      await deleteSegment(activeId);
      resetBuilder();
      await loadSegments();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────

  const inputCls =
    'block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400/20';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Segment Builder</h1>
          <p className="mt-1 text-sm text-gray-500">Build boolean rule sets to dynamically segment organizations and contacts.</p>
        </div>
        <button
          type="button"
          onClick={resetBuilder}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          + New Segment
        </button>
      </div>

      <div className="flex gap-6 items-start">
        {/* ── Left sidebar: Saved segments ─────────────────────────── */}
        <div className="w-64 flex-shrink-0">
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5">
            <div className="border-b border-gray-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Saved Segments</h2>
            </div>
            <div className="max-h-[calc(100vh-240px)] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : segments.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">No segments yet</p>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {segments.map((seg) => (
                    <li key={seg.SegmentID}>
                      <button
                        type="button"
                        onClick={() => loadSegment(seg)}
                        className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          activeId === seg.SegmentID ? 'bg-blue-50 border-l-2 border-l-blue-600' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-gray-900">{seg.Name}</span>
                          <span className={`flex-shrink-0 inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            seg.EntityType === 'O'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-teal-100 text-teal-700'
                          }`}>
                            {seg.EntityType === 'O' ? 'O' : 'C'}
                          </span>
                        </div>
                        {seg.Description && (
                          <p className="mt-0.5 truncate text-xs text-gray-500">{seg.Description}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* ── Main area ────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Entity type selector */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Entity Type</label>
            <div className="flex gap-4">
              {([['O', 'Organizations'], ['C', 'Contacts']] as const).map(([val, label]) => (
                <label key={val} className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="radio"
                    name="entityType"
                    value={val}
                    checked={entityType === val}
                    onChange={() => {
                      setEntityType(val);
                      setRootGroup(emptyGroup());
                      setPreviewCount(null);
                      setResults(null);
                    }}
                    className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rule builder */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Rules</h2>
            <RuleGroupEditor
              group={rootGroup}
              fields={fields}
              onChange={setRootGroup}
              depth={0}
            />
          </div>

          {/* Preview panel */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Preview</h2>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {previewLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                )}
                Preview Count
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={resultsLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {resultsLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M12 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.75" /></svg>
                )}
                View Results
              </button>

              {previewCount !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                  {previewCount.toLocaleString()} records match
                </span>
              )}
            </div>

            {/* Results table */}
            {results && results.length > 0 && (
              <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(results[0]).slice(0, 8).map((col) => (
                        <th key={col} className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {results.slice(0, 50).map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.keys(results[0]).slice(0, 8).map((col) => (
                          <td key={col} className="whitespace-nowrap px-3 py-2 text-gray-700">
                            {row[col] == null ? '—' : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {results.length > 50 && (
                  <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-center text-xs text-gray-500">
                    Showing 50 of {results.length.toLocaleString()} results
                  </div>
                )}
              </div>
            )}
            {results && results.length === 0 && (
              <p className="mt-4 text-sm text-gray-500">No records match the current rules.</p>
            )}
          </div>

          {/* Save controls */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-950/5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Save Segment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input
                  className={inputCls}
                  placeholder="My Segment"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <input
                  className={inputCls}
                  placeholder="Optional description…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : activeId ? 'Update Segment' : 'Create Segment'}
              </button>
              {activeId && (
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={saving}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Duplicate
                </button>
              )}
              {activeId && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
              {activeId && confirmDelete && (
                <span className="inline-flex items-center gap-2">
                  <span className="text-xs text-red-600 font-medium">Are you sure?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {deleting ? 'Deleting…' : 'Yes, delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import type { BadgeDefinition, BoardFilterPreset, Priority } from "@shared/api";
import type { BoardFilters } from "@client/lib/board";
import { PRIORITY_OPTIONS } from "@client/lib/task-priority";
import { BoardFilterPresets } from "@client/components/board-filter-presets";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";

type BoardFiltersProps = {
  filters: BoardFilters;
  badgeDefinitions: BadgeDefinition[];
  presets: BoardFilterPreset[];
  selectedPresetId: string;
  resultCount: number;
  onFiltersChange: (nextFilters: BoardFilters) => void;
  onClear: () => void;
  onSelectPreset: (presetId: string) => void;
  onSavePreset: (name: string) => Promise<void>;
  onUpdatePreset: (presetId: string, name: string) => Promise<void>;
  onDeletePreset: (presetId: string) => void;
};

function updateFilters(filters: BoardFilters, patch: Partial<BoardFilters>) {
  return {
    ...filters,
    ...patch,
  };
}

export function BoardFilters({
  filters,
  badgeDefinitions,
  presets,
  selectedPresetId,
  resultCount,
  onFiltersChange,
  onClear,
  onSelectPreset,
  onSavePreset,
  onUpdatePreset,
  onDeletePreset,
}: BoardFiltersProps) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 border-t bg-muted/10 px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-1 xl:flex-wrap xl:items-center">
            <Input
              className="xl:w-72"
              placeholder="Search tickets, descriptions, or badges"
              value={filters.query}
              onChange={(event) => onFiltersChange(updateFilters(filters, { query: event.target.value }))}
            />

            <Input
              type="date"
              value={filters.startDate}
              onChange={(event) => onFiltersChange(updateFilters(filters, { startDate: event.target.value }))}
            />

            <Input
              type="date"
              value={filters.endDate}
              onChange={(event) => onFiltersChange(updateFilters(filters, { endDate: event.target.value }))}
            />

            <select
              className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={filters.priority}
              onChange={(event) => onFiltersChange(updateFilters(filters, { priority: event.target.value as Priority | "all" }))}
            >
              <option value="all">All priorities</option>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
              value={filters.badgeId}
              onChange={(event) => onFiltersChange(updateFilters(filters, { badgeId: event.target.value }))}
            >
              <option value="">All badges</option>
              {badgeDefinitions.map((badgeDefinition) => (
                <option key={badgeDefinition.id} value={badgeDefinition.id}>
                  {badgeDefinition.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">{resultCount} visible</Badge>
            <Button onClick={onClear} variant="outline">
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      <BoardFilterPresets
        onDeletePreset={onDeletePreset}
        onSavePreset={onSavePreset}
        onSelectPreset={onSelectPreset}
        onUpdatePreset={onUpdatePreset}
        presets={presets}
        selectedPresetId={selectedPresetId}
      />
    </div>
  );
}

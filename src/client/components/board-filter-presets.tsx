import { useEffect, useState } from "react";
import type { BoardFilterPreset } from "@shared/api";
import { Button } from "@client/components/ui/button";
import { Input } from "@client/components/ui/input";

type BoardFilterPresetsProps = {
  presets: BoardFilterPreset[];
  selectedPresetId: string;
  onSelectPreset: (presetId: string) => void;
  onSavePreset: (name: string) => Promise<void>;
  onUpdatePreset: (presetId: string, name: string) => Promise<void>;
  onDeletePreset: (presetId: string) => void;
};

export function BoardFilterPresets({ presets, selectedPresetId, onSelectPreset, onSavePreset, onUpdatePreset, onDeletePreset }: BoardFilterPresetsProps) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const preset = presets.find((item) => item.id === selectedPresetId);
    setName(preset?.name ?? "");
  }, [presets, selectedPresetId]);

  async function handleSave() {
    if (!name.trim()) {
      return;
    }

    setBusy(true);

    try {
      await onSavePreset(name.trim());
      setName("");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate() {
    if (!selectedPresetId || !name.trim()) {
      return;
    }

    setBusy(true);

    try {
      await onUpdatePreset(selectedPresetId, name.trim());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 border-t bg-background/80 px-3 py-3 sm:px-4 xl:grid-cols-[minmax(0,15rem)_minmax(0,13rem)_auto_auto_auto] xl:items-center">
      <select
        className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
        value={selectedPresetId}
        onChange={(event) => onSelectPreset(event.target.value)}
      >
        <option value="">Saved presets</option>
        {presets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>

      <Input placeholder="Preset name" value={name} onChange={(event) => setName(event.target.value)} />

      <Button disabled={busy || !name.trim()} onClick={() => void handleSave()} variant="outline">
        Save preset
      </Button>

      <Button disabled={busy || !selectedPresetId || !name.trim()} onClick={() => void handleUpdate()} variant="outline">
        Update preset
      </Button>

      <Button disabled={busy || !selectedPresetId} onClick={() => onDeletePreset(selectedPresetId)} variant="ghost">
        Delete preset
      </Button>
    </div>
  );
}

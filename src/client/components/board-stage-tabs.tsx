import type { Category } from "@shared/api";
import { Badge } from "@client/components/ui/badge";
import { Button } from "@client/components/ui/button";
import { cn } from "@client/lib/cn";

type BoardStageTabsProps = {
  categories: Category[];
  activeCategoryId: string | null;
  taskCountMap: Map<string, number>;
  onSelect: (categoryId: string) => void;
};

export function BoardStageTabs({ categories, activeCategoryId, taskCountMap, onSelect }: BoardStageTabsProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="board-stage-tabs" role="tablist" aria-label="Board stages">
      {categories.map((category) => {
        const selected = activeCategoryId === category.id;

        return (
          <Button
            key={category.id}
            aria-selected={selected}
            className={cn("board-stage-tab", selected && "board-stage-tab-active")}
            onClick={() => onSelect(category.id)}
            role="tab"
            size="sm"
            variant={selected ? "default" : "outline"}
          >
            <span>{category.name}</span>
            <Badge variant={selected ? "secondary" : "outline"}>{taskCountMap.get(category.id) ?? 0}</Badge>
          </Button>
        );
      })}
    </div>
  );
}

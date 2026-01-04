import { CircularTable } from "./CircularTable";
import { useSeatingStore } from "@/stores/useSeatingStore";

export function TableGrid() {
  const tables = useSeatingStore((state) => state.tables);

  return (
    <div id="table-grid" className="flex-1 overflow-auto p-8 bg-background">
      <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6 auto-rows-fr">
        {tables.map((table) => (
          <CircularTable key={table.id} table={table} />
        ))}
      </div>
    </div>
  );
}

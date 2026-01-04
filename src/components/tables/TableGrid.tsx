import { CircularTable } from "./CircularTable"
import { useSeatingStore } from "@/stores/useSeatingStore"

export function TableGrid() {
	const tables = useSeatingStore((state) => state.tables)

	return (
		<div
			id="table-grid"
			className="flex-1 overflow-auto p-8 bg-background"
		>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{tables.map((table) => (
					<CircularTable key={table.id} table={table} />
				))}
			</div>
		</div>
	)
}

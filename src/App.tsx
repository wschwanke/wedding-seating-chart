import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { GuestSidebar } from "@/components/sidebar/GuestSidebar"
import { TableGrid } from "@/components/tables/TableGrid"
import { GuestCard } from "@/components/guests/GuestCard"
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Guest } from "@/types"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
	const [activeGuest, setActiveGuest] = useState<Guest | null>(null)
	const assignToSeat = useSeatingStore((state) => state.assignToSeat)
	const groupColors = useSeatingStore((state) => state.settings.groupColors)

	// Configure drag activation - requires 250ms hold before dragging starts
	// This allows clicks on buttons to work without triggering drag
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				delay: 250,
				tolerance: 5,
			},
		}),
	)

	const handleDragStart = (event: DragStartEvent): void => {
		const guest = event.active.data.current?.guest as Guest | undefined
		if (guest) {
			setActiveGuest(guest)
		}
	}

	const handleDragEnd = (event: DragEndEvent): void => {
		const { active, over } = event

		setActiveGuest(null)

		if (!over) return

		// Extract guest from drag data (works for both sidebar and chair drags)
		const guest = active.data.current?.guest as Guest | undefined
		if (!guest) return

		const dropData = over.data.current as { tableId: string; seatIndex: number } | undefined

		if (dropData) {
			assignToSeat(guest.id, dropData.tableId, dropData.seatIndex)
		}
	}

	const getGuestColor = (guest: Guest): string => {
		return groupColors.find((gc) => gc.group === guest.group)?.color || "#888"
	}

	return (
		<TooltipProvider>
			<DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
				<div className="min-h-screen bg-background text-foreground flex flex-col">
					<Header />
					<div className="flex flex-1 overflow-hidden">
						<GuestSidebar />
						<TableGrid />
					</div>
				</div>

				<DragOverlay>
					{activeGuest ? (
						<GuestCard guest={activeGuest} color={getGuestColor(activeGuest)} />
					) : null}
				</DragOverlay>
			</DndContext>
		</TooltipProvider>
	)
}

export default App

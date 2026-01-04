import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"
import { useState } from "react"
import { Header } from "@/components/layout/Header"
import { GuestSidebar } from "@/components/sidebar/GuestSidebar"
import { TableGrid } from "@/components/tables/TableGrid"
import { GuestCard } from "@/components/guests/GuestCard"
import { SettingsPage } from "@/components/settings/SettingsPage"
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Guest, Subgroup } from "@/types"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { Users } from "lucide-react"

function App() {
	const [view, setView] = useState<"main" | "settings">("main")
	const [activeGuest, setActiveGuest] = useState<Guest | null>(null)
	const [activeParty, setActiveParty] = useState<{ subgroup: Subgroup; guests: Guest[] } | null>(null)
	const assignToSeat = useSeatingStore((state) => state.assignToSeat)
	const tables = useSeatingStore((state) => state.tables)
	const relationships = useSeatingStore((state) => state.relationships)

	// Configure drag activation - 100ms delay + 4px distance tolerance
	// This allows clicks on buttons to work without triggering drag
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				delay: 100,
				tolerance: 4,
			},
		}),
	)

	const handleDragStart = (event: DragStartEvent): void => {
		const activeData = event.active.data.current
		
		if (activeData?.type === 'party') {
			setActiveParty({ 
				subgroup: activeData.subgroup as Subgroup, 
				guests: activeData.guests as Guest[] 
			})
			setActiveGuest(null)
		} else {
			const guest = activeData?.guest as Guest | undefined
			if (guest) {
				setActiveGuest(guest)
				setActiveParty(null)
			}
		}
	}

	const handleDragEnd = (event: DragEndEvent): void => {
		const { active, over } = event

		setActiveGuest(null)
		setActiveParty(null)

		if (!over) return

		const activeData = active.data.current
		const dropData = over.data.current as { tableId: string; seatIndex: number } | undefined

		if (!dropData) return

		// Handle party drag
		if (activeData?.type === 'party') {
			const { guests } = activeData as { guests: Guest[] }
			const { tableId, seatIndex } = dropData

			// Find the table
			const table = tables.find(t => t.id === tableId)
			if (!table) return

			// Check if drop seat is empty
			if (table.seats[seatIndex] !== null) {
				// Cannot drop on occupied seat
				return
			}

			// Try to assign party members consecutively from drop seat
			let currentSeat = seatIndex
			for (const guest of guests) {
				// Find next available seat from currentSeat onward
				while (currentSeat < table.seats.length && table.seats[currentSeat] !== null) {
					currentSeat++
				}

				if (currentSeat < table.seats.length) {
					assignToSeat(guest.id, tableId, currentSeat)
					currentSeat++
				} else {
					// No more seats, leave remaining guests unassigned
					break
				}
			}

			return
		}

		// Handle single guest drag (existing logic)
		const guest = activeData?.guest as Guest | undefined
		if (!guest) return

		// Check if drop seat is empty
		const table = tables.find(t => t.id === dropData.tableId)
		if (table && table.seats[dropData.seatIndex] !== null) {
			// Cannot drop on occupied seat
			return
		}

		assignToSeat(guest.id, dropData.tableId, dropData.seatIndex)
	}

	const getGuestColor = (guest: Guest): string => {
		return relationships.find((r) => r.id === guest.relationshipId)?.color || "#888"
	}

	// Show settings page if in settings view
	if (view === "settings") {
		return (
			<TooltipProvider>
				<SettingsPage onBack={() => setView("main")} />
			</TooltipProvider>
		)
	}

	// Main seating chart view
	return (
		<TooltipProvider>
			<DndContext 
				sensors={sensors} 
				collisionDetection={pointerWithin}
				onDragStart={handleDragStart} 
				onDragEnd={handleDragEnd}
			>
				<div className="min-h-screen bg-background text-foreground flex flex-col">
					<Header onSettingsClick={() => setView("settings")} />
					<div className="flex flex-1 overflow-hidden">
						<GuestSidebar />
						<TableGrid />
					</div>
				</div>

				<DragOverlay>
					{activeGuest ? (
						<GuestCard guest={activeGuest} color={getGuestColor(activeGuest)} />
					) : activeParty ? (
						<Card className="p-3 border-l-4" style={{ borderLeftColor: getGuestColor(activeParty.guests[0]) }}>
							<div className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								<span className="font-medium">{activeParty.subgroup.name}</span>
								<span className="text-muted-foreground">({activeParty.guests.length})</span>
							</div>
						</Card>
					) : null}
				</DragOverlay>
			</DndContext>
		</TooltipProvider>
	)
}

export default App

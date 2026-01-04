import { useState, useMemo, useCallback, memo } from "react"
import { Card } from "@/components/ui/card"
import { Chair } from "./Chair"
import { GuestForm } from "@/components/guests/GuestForm"
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Guest, Table } from "@/types"
import { Settings, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CircularTableProps {
	table: Table
}

export const CircularTable = memo(function CircularTable({ table }: CircularTableProps) {
	const guests = useSeatingStore((state) => state.guests)
	const relationships = useSeatingStore((state) => state.relationships)
	const updateTableName = useSeatingStore((state) => state.updateTableName)
	const updateTableChairCount = useSeatingStore(
		(state) => state.updateTableChairCount,
	)
	const isTableOverCapacity = useSeatingStore(
		(state) => state.isTableOverCapacity,
	)

	const [tableName, setTableName] = useState(table.name)
	const [chairCount, setChairCount] = useState(table.chairCount)
	const [guestFormOpen, setGuestFormOpen] = useState(false)
	const [editingGuest, setEditingGuest] = useState<Guest | undefined>()

	const handleEditGuest = useCallback((guest: Guest): void => {
		setEditingGuest(guest)
		setGuestFormOpen(true)
	}, [])

	const handleSaveSettings = useCallback((): void => {
		if (tableName !== table.name) {
			updateTableName(table.id, tableName)
		}
		if (chairCount !== table.chairCount) {
			updateTableChairCount(table.id, chairCount)
		}
	}, [tableName, table.name, table.id, chairCount, table.chairCount, updateTableName, updateTableChairCount])

	const preventDrag = useCallback((e: React.PointerEvent): void => {
		e.stopPropagation()
	}, [])

	// Memoize guest color lookup to prevent recalculation on every render
	const getGuestColor = useCallback((guestId: string | null): string | undefined => {
		if (!guestId) return undefined
		const guest = guests.find((g) => g.id === guestId)
		if (!guest) return undefined
		return relationships.find((r) => r.id === guest.relationshipId)?.color
	}, [guests, relationships])

	// Calculate chair positions in a circle - memoize to prevent recalculation
	const radius = 100 // pixels from center
	const centerX = 150
	const centerY = 150

	const chairPositions = useMemo(() => 
		Array.from({ length: table.chairCount }, (_, i) => {
			const angle = (i / table.chairCount) * 2 * Math.PI - Math.PI / 2
			return {
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle),
			}
		}),
		[table.chairCount]
	)

	const assignedCount = table.seats.filter((s) => s !== null).length
	const isOverCapacity = isTableOverCapacity(table.id)

	return (
		<>
		<Card className="relative">
			<div className="p-4">
				{/* Table header */}
				<div className="flex items-center justify-between mb-2">
					<h3 className="font-semibold text-sm">{table.name}</h3>
					<Popover>
						<PopoverTrigger asChild>
							<Button 
								variant="ghost" 
								size="icon" 
								className="h-6 w-6"
								onPointerDown={preventDrag}
								aria-label="Table settings"
							>
								<Settings className="h-4 w-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="space-y-3">
								<div className="space-y-2">
									<Label htmlFor={`name-${table.id}`}>Table Name</Label>
									<Input
										id={`name-${table.id}`}
										value={tableName}
										onChange={(e) => setTableName(e.target.value)}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`chairs-${table.id}`}>Number of Chairs</Label>
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setChairCount(Math.max(1, chairCount - 1))
											}
										>
											<Minus className="h-4 w-4" />
										</Button>
										<Input
											id={`chairs-${table.id}`}
											type="number"
											min="1"
											max="50"
											value={chairCount}
											onChange={(e) =>
												setChairCount(Number.parseInt(e.target.value, 10))
											}
											className="text-center"
										/>
										<Button
											variant="outline"
											size="icon"
											className="h-8 w-8"
											onClick={() =>
												setChairCount(Math.min(50, chairCount + 1))
											}
										>
											<Plus className="h-4 w-4" />
										</Button>
									</div>
								</div>
								<Button onClick={handleSaveSettings} size="sm" className="w-full">
									Save
								</Button>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				{/* Capacity indicator */}
				<div
					className={cn(
						"text-xs mb-3",
						isOverCapacity ? "text-destructive font-medium" : "text-muted-foreground",
					)}
				>
					{assignedCount} / {table.chairCount} seats
					{isOverCapacity && " - Over capacity!"}
				</div>

				{/* Circular table visualization */}
				<div className="relative" style={{ width: "300px", height: "300px" }}>
					{/* Table center */}
					<div
						className="absolute rounded-full border-4 border-muted bg-background flex items-center justify-center"
						style={{
							left: "50%",
							top: "50%",
							transform: "translate(-50%, -50%)",
							width: "130px",
							height: "130px",
						}}
					>
						<span className="text-3xl font-bold text-muted-foreground/30">
							{table.name.split(" ")[1] || table.name}
						</span>
					</div>

				{/* Chairs */}
				{table.seats.map((guestId, index) => {
					const guest = guestId ? guests.find((g) => g.id === guestId) : null
					return (
						<Chair
							key={index}
							tableId={table.id}
							seatIndex={index}
							guest={guest || null}
							color={getGuestColor(guestId)}
							position={chairPositions[index]}
							onEdit={guest ? () => handleEditGuest(guest) : undefined}
						/>
					)
				})}
			</div>
		</div>
		</Card>

		<GuestForm
			open={guestFormOpen}
			onOpenChange={setGuestFormOpen}
			guest={editingGuest}
		/>
	</>
	)
})

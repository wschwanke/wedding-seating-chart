import { useState, useMemo, memo } from "react"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Guest } from "@/types"
import { User, X, Edit } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface ChairProps {
	tableId: string
	seatIndex: number
	guest: Guest | null
	color?: string
	position: { x: number; y: number }
	onEdit?: () => void
}

export const Chair = memo(function Chair({
	tableId,
	seatIndex,
	guest,
	color,
	position,
	onEdit,
}: ChairProps) {
	const [popoverOpen, setPopoverOpen] = useState(false)
	const unassignGuest = useSeatingStore((state) => state.unassignGuest)
	const relationships = useSeatingStore((state) => state.relationships)
	
	// Memoize relationship lookup to prevent unnecessary recalculations
	const relationship = useMemo(() => 
		guest ? relationships.find((r) => r.id === guest.relationshipId) : null,
		[guest, relationships]
	)

	const { isOver, setNodeRef: setDropRef } = useDroppable({
		id: `${tableId}-${seatIndex}`,
		data: { tableId, seatIndex },
	})

	const { 
		attributes, 
		listeners, 
		setNodeRef: setDragRef, 
		transform, 
		isDragging 
	} = useDraggable({
		id: guest ? `chair-${guest.id}` : `empty-${tableId}-${seatIndex}`,
		data: { guest },
		disabled: !guest,
	})

	const handleRemoveFromSeat = (): void => {
		if (guest) {
			unassignGuest(guest.id)
			setPopoverOpen(false)
		}
	}

	// If no guest, render empty chair
	if (!guest) {
		return (
			<div
				ref={setDropRef}
				className="absolute"
				style={{
					left: `${position.x}px`,
					top: `${position.y}px`,
					transform: "translate(-50%, -50%)",
				}}
			>
			<div
				className={cn(
					"w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-[transform,box-shadow,border-color]",
					"bg-muted/50 border-border",
					isOver && "ring-2 ring-primary ring-offset-2 scale-110",
				)}
			>
				<User className="h-5 w-5 text-muted-foreground/50" />
				</div>
			</div>
		)
	}

	// Guest is seated - show popover with actions
	return (
		<div
			ref={setDropRef}
			className="absolute"
			style={{
				left: `${position.x}px`,
				top: `${position.y}px`,
				transform: "translate(-50%, -50%)",
			}}
		>
			<Popover open={popoverOpen && !isDragging} onOpenChange={setPopoverOpen}>
				<PopoverTrigger asChild>
					<div
						ref={setDragRef}
						{...attributes}
						{...listeners}
						onClick={(e) => {
							e.stopPropagation()
							// Only open popover if not currently dragging
							if (!isDragging) {
								setPopoverOpen(true)
							}
						}}
					className={cn(
						"w-14 h-14 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-[transform,box-shadow,border-color]",
						"bg-background border-primary shadow-md cursor-grab active:cursor-grabbing hover:scale-105 select-none",
						isOver && "ring-2 ring-primary ring-offset-2 scale-110",
						isDragging && "opacity-30",
					)}
					style={{
						backgroundColor: color ? `${color}20` : undefined,
						borderColor: color || undefined,
						...(transform && !isDragging && { transform: CSS.Translate.toString(transform) }),
					}}
					>
						<div className="text-center overflow-hidden pointer-events-none">
							<div className="text-xs font-bold">
								{guest.firstName.charAt(0).toUpperCase()}{guest.lastName.charAt(0).toUpperCase()}
							</div>
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent className="w-64" side="top">
					<div className="space-y-3">
						<div className="space-y-1">
							<p className="font-medium">
								{guest.firstName} {guest.lastName}
							</p>
							<p className="text-sm text-muted-foreground">{relationship?.name || "Unknown"}</p>
							{guest.partySize > 1 && (
								<p className="text-xs text-muted-foreground">
									Party of {guest.partySize}
								</p>
							)}
						</div>
						<div className="space-y-2">
							{onEdit && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => {
										onEdit()
										setPopoverOpen(false)
									}}
									className="w-full justify-start"
								>
									<Edit className="h-4 w-4 mr-2" />
									Edit Guest
								</Button>
							)}
							<Button
								variant="outline"
								size="sm"
								onClick={handleRemoveFromSeat}
								className="w-full justify-start"
							>
								<X className="h-4 w-4 mr-2" />
								Remove from Seat
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
})

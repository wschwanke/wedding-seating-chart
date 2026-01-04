import { useState } from "react"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Guest } from "@/types"
import { User, Trash2, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface ChairProps {
	tableId: string
	seatIndex: number
	guest: Guest | null
	color?: string
	position: { x: number; y: number }
}

export function Chair({
	tableId,
	seatIndex,
	guest,
	color,
	position,
}: ChairProps) {
	const [popoverOpen, setPopoverOpen] = useState(false)
	const unassignGuest = useSeatingStore((state) => state.unassignGuest)
	const deleteGuest = useSeatingStore((state) => state.deleteGuest)

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

	const handleDeleteGuest = (): void => {
		if (
			guest &&
			window.confirm(
				`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`,
			)
		) {
			deleteGuest(guest.id)
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
						"w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all",
						"bg-muted/50 border-border",
						isOver && "ring-2 ring-primary ring-offset-2 scale-110",
					)}
				>
					<User className="h-4 w-4 text-muted-foreground/50" />
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
			<Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
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
							"w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all",
							"bg-background border-primary shadow-md cursor-pointer hover:scale-105",
							isOver && "ring-2 ring-primary ring-offset-2 scale-110",
							isDragging && "opacity-50",
						)}
						style={{
							backgroundColor: color ? `${color}20` : undefined,
							borderColor: color || undefined,
							...(transform && { transform: CSS.Translate.toString(transform) }),
						}}
					>
						<div className="text-center leading-tight overflow-hidden pointer-events-none">
							<div className="text-[10px] font-semibold truncate px-1">
								{guest.firstName}
							</div>
							<div className="text-[9px] truncate px-1">{guest.lastName}</div>
						</div>
					</div>
				</PopoverTrigger>
				<PopoverContent className="w-64" side="top">
					<div className="space-y-3">
						<div className="space-y-1">
							<p className="font-medium">
								{guest.firstName} {guest.lastName}
							</p>
							<p className="text-sm text-muted-foreground">{guest.group}</p>
							{guest.partySize > 1 && (
								<p className="text-xs text-muted-foreground">
									Party of {guest.partySize}
								</p>
							)}
						</div>
						<div className="flex flex-col gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleRemoveFromSeat}
								className="w-full justify-start"
							>
								<X className="h-4 w-4 mr-2" />
								Remove from Seat
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={handleDeleteGuest}
								className="w-full justify-start"
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Delete Guest
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}

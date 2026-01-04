import { useDroppable, useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import type { Guest } from "@/types"
import { User } from "lucide-react"

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
				ref={guest ? setDragRef : undefined}
				{...(guest ? { ...attributes, ...listeners } : {})}
				className={cn(
					"w-12 h-12 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all",
					guest
						? "bg-background border-primary shadow-md cursor-grab active:cursor-grabbing"
						: "bg-muted/50 border-border",
					isOver && "ring-2 ring-primary ring-offset-2 scale-110",
					isDragging && "opacity-50",
				)}
				style={{
					backgroundColor: guest && color ? `${color}20` : undefined,
					borderColor: guest && color ? color : undefined,
					...(transform && { transform: CSS.Translate.toString(transform) }),
				}}
			>
				{guest ? (
					<div className="text-center leading-tight overflow-hidden pointer-events-none">
						<div className="text-[10px] font-semibold truncate px-1">
							{guest.firstName}
						</div>
						<div className="text-[9px] truncate px-1">{guest.lastName}</div>
					</div>
				) : (
					<User className="h-4 w-4 text-muted-foreground/50" />
				)}
			</div>
		</div>
	)
}

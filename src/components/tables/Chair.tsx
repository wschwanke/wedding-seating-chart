import { useDroppable } from "@dnd-kit/core"
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
	const { isOver, setNodeRef } = useDroppable({
		id: `${tableId}-${seatIndex}`,
		data: { tableId, seatIndex },
	})

	return (
		<div
			ref={setNodeRef}
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
					guest
						? "bg-background border-primary shadow-md"
						: "bg-muted/50 border-border",
					isOver && "ring-2 ring-primary ring-offset-2 scale-110",
				)}
				style={{
					backgroundColor: guest && color ? `${color}20` : undefined,
					borderColor: guest && color ? color : undefined,
				}}
			>
				{guest ? (
					<div className="text-center leading-tight overflow-hidden">
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

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Users, User, Edit, Trash2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Guest, GuestAssignment } from "@/types"
import { cn } from "@/lib/utils"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface GuestCardProps {
	guest: Guest
	color?: string
	onEdit?: () => void
	assignment?: GuestAssignment
}

export function GuestCard({ guest, color, onEdit, assignment }: GuestCardProps) {
	const deleteGuest = useSeatingStore((state) => state.deleteGuest)

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: guest.id,
			data: { guest },
		})

	const style = {
		// Don't apply transform when dragging - let DragOverlay handle it
		transform: isDragging ? undefined : CSS.Translate.toString(transform),
		borderLeftColor: color || "#888",
	}

	const handleDelete = (e: React.MouseEvent): void => {
		e.stopPropagation()
		if (
			window.confirm(
				`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`,
			)
		) {
			deleteGuest(guest.id)
		}
	}

	const handleEdit = (e: React.MouseEvent): void => {
		e.stopPropagation()
		onEdit?.()
	}

	const preventDrag = (e: React.PointerEvent): void => {
		e.stopPropagation()
	}

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={cn(
				"p-3 cursor-grab active:cursor-grabbing border-l-4 transition-shadow hover:shadow-md",
				isDragging && "opacity-50",
				assignment && "opacity-70",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						{guest.partySize > 1 ? (
							<Users className="h-4 w-4 flex-shrink-0" />
						) : (
							<User className="h-4 w-4 flex-shrink-0" />
						)}
						<p className="font-medium truncate">
							{guest.firstName} {guest.lastName}
						</p>
					</div>
					<p className="text-sm text-muted-foreground truncate">{guest.relationship}</p>
					{guest.partySize > 1 && (
						<p className="text-xs text-muted-foreground">
							Party of {guest.partySize}
						</p>
					)}
					{assignment && (
						<div className="flex items-center gap-1 mt-1">
							<span 
								className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
							>
								<MapPin className="h-3 w-3" />
								{assignment.tableName}, Seat {assignment.seatIndex + 1}
							</span>
						</div>
					)}
				</div>
				<div className="flex gap-1">
					{guest.isMainGuest && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={handleEdit}
							onPointerDown={preventDrag}
							aria-label={`Edit ${guest.firstName} ${guest.lastName}`}
						>
							<Edit className="h-3 w-3" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-destructive hover:text-destructive"
						onClick={handleDelete}
						onPointerDown={preventDrag}
						aria-label={`Delete ${guest.firstName} ${guest.lastName}`}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</Card>
	)
}

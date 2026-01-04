import { useMemo, useCallback, memo } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Users, User, Edit, Trash2, MapPin, GripVertical, Armchair } from "lucide-react"
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

export const GuestCard = memo(function GuestCard({ guest, color, onEdit, assignment }: GuestCardProps) {
	const deleteGuest = useSeatingStore((state) => state.deleteGuest)
	const unassignGuest = useSeatingStore((state) => state.unassignGuest)
	const relationships = useSeatingStore((state) => state.relationships)

	// Memoize relationship lookup
	const relationship = useMemo(() => 
		relationships.find((r) => r.id === guest.relationshipId),
		[relationships, guest.relationshipId]
	)

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: guest.id,
			data: { guest },
		})

	// Memoize style object
	const style = useMemo(() => ({
		// Don't apply transform when dragging - let DragOverlay handle it
		transform: isDragging ? undefined : CSS.Translate.toString(transform),
		borderLeftColor: color || "#888",
	}), [isDragging, transform, color])

	const handleDelete = useCallback((e: React.MouseEvent): void => {
		e.stopPropagation()
		if (
			window.confirm(
				`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`,
			)
		) {
			deleteGuest(guest.id)
		}
	}, [guest.firstName, guest.lastName, guest.id, deleteGuest])

	const handleEdit = useCallback((e: React.MouseEvent): void => {
		e.stopPropagation()
		onEdit?.()
	}, [onEdit])

	const handleUnassign = useCallback((e: React.MouseEvent): void => {
		e.stopPropagation()
		unassignGuest(guest.id)
	}, [guest.id, unassignGuest])

	const preventDrag = useCallback((e: React.PointerEvent): void => {
		e.stopPropagation()
	}, [])

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={cn(
				"p-3 cursor-grab active:cursor-grabbing border-l-4 transition-shadow hover:shadow-md select-none",
				isDragging && "opacity-50",
				assignment && "opacity-70",
			)}
		>
			<div className="flex items-start justify-between gap-2">
				<GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
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
					<p className="text-sm text-muted-foreground truncate">{relationship?.name || "Unknown"}</p>
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
					{assignment && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={handleUnassign}
							onPointerDown={preventDrag}
							aria-label={`Remove ${guest.firstName} from seat`}
						>
							<Armchair className="h-3 w-3" />
						</Button>
					)}
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
})

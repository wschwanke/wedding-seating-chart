import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Users, User, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Guest } from "@/types"
import { cn } from "@/lib/utils"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface GuestCardProps {
	guest: Guest
	color?: string
	onEdit?: () => void
}

export function GuestCard({ guest, color, onEdit }: GuestCardProps) {
	const deleteGuest = useSeatingStore((state) => state.deleteGuest)

	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: guest.id,
			data: { guest },
		})

	const style = {
		transform: CSS.Translate.toString(transform),
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

	return (
		<Card
			ref={setNodeRef}
			style={style}
			{...listeners}
			{...attributes}
			className={cn(
				"p-3 cursor-grab active:cursor-grabbing border-l-4 transition-shadow hover:shadow-md",
				isDragging && "opacity-50",
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
					<p className="text-sm text-muted-foreground truncate">{guest.group}</p>
					{guest.partySize > 1 && (
						<p className="text-xs text-muted-foreground">
							Party of {guest.partySize}
						</p>
					)}
				</div>
				<div className="flex gap-1">
					{guest.isMainGuest && (
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={handleEdit}
						>
							<Edit className="h-3 w-3" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 text-destructive hover:text-destructive"
						onClick={handleDelete}
					>
						<Trash2 className="h-3 w-3" />
					</Button>
				</div>
			</div>
		</Card>
	)
}

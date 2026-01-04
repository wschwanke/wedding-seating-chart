import { useState } from "react"
import { Settings, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/export/ExportButton"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface HeaderProps {
	onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
	const [dialogOpen, setDialogOpen] = useState(false)
	const clearAllSeats = useSeatingStore((state) => state.clearAllSeats)

	const handleClearSeating = () => {
		clearAllSeats()
		setDialogOpen(false)
	}

	return (
		<header className="border-b bg-background">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Wedding Seating Chart</h1>
					<div className="flex items-center gap-2">
						<ExportButton />
						<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
							<DialogTrigger asChild>
								<Button variant="outline" size="sm">
									<Trash2 className="h-4 w-4 mr-2" />
									Clear Seating
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Clear All Seating Assignments?</DialogTitle>
									<DialogDescription>
										This will remove all guests from their seats. The guests will remain in your guest list.
									</DialogDescription>
								</DialogHeader>
								<DialogFooter>
									<DialogClose asChild>
										<Button variant="outline">Cancel</Button>
									</DialogClose>
									<Button variant="destructive" onClick={handleClearSeating}>
										Clear Seating
									</Button>
								</DialogFooter>
							</DialogContent>
						</Dialog>
						<Button
							variant="outline"
							size="sm"
							onClick={onSettingsClick}
						>
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Button>
					</div>
				</div>
			</div>
		</header>
	)
}

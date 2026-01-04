import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExportButton } from "@/components/export/ExportButton"

interface HeaderProps {
	onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
	return (
		<header className="border-b bg-background">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<h1 className="text-3xl font-bold">Wedding Seating Chart</h1>
					<div className="flex items-center gap-2">
						<ExportButton />
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

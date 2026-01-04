import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SettingsDialog } from "@/components/settings/SettingsDialog"
import { ExportButton } from "@/components/export/ExportButton"
import { useState } from "react"

export function Header() {
	const [settingsOpen, setSettingsOpen] = useState(false)

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
							onClick={() => setSettingsOpen(true)}
						>
							<Settings className="h-4 w-4 mr-2" />
							Settings
						</Button>
					</div>
				</div>
			</div>
			<SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
		</header>
	)
}

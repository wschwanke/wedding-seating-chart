import { useState } from "react"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useSeatingStore } from "@/stores/useSeatingStore"

interface SettingsDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

export function SettingsDialog({
	open,
	onOpenChange,
}: SettingsDialogProps) {
	const settings = useSeatingStore((state) => state.settings)
	const updateSettings = useSeatingStore((state) => state.updateSettings)

	const [tableCount, setTableCount] = useState(settings.tableCount)
	const [defaultChairCount, setDefaultChairCount] = useState(
		settings.defaultChairCount,
	)

	const handleSave = (): void => {
		updateSettings({
			tableCount,
			defaultChairCount,
		})
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
					<DialogDescription>
						Configure your seating chart layout and defaults
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="tableCount">Number of Tables</Label>
						<Input
							id="tableCount"
							type="number"
							min="1"
							max="100"
							value={tableCount}
							onChange={(e) => setTableCount(Number.parseInt(e.target.value, 10))}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="defaultChairCount">Default Chairs per Table</Label>
						<Input
							id="defaultChairCount"
							type="number"
							min="1"
							max="50"
							value={defaultChairCount}
							onChange={(e) =>
								setDefaultChairCount(Number.parseInt(e.target.value, 10))
							}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave}>Save Changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

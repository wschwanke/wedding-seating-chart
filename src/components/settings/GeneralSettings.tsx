import { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSeatingStore } from "@/stores/useSeatingStore"

export function GeneralSettings() {
	const settings = useSeatingStore((state) => state.settings)
	const updateSettings = useSeatingStore((state) => state.updateSettings)
	const clearAll = useSeatingStore((state) => state.clearAll)

	const [tableCount, setTableCount] = useState(settings.tableCount)
	const [defaultChairCount, setDefaultChairCount] = useState(settings.defaultChairCount)
	const [clearDialogOpen, setClearDialogOpen] = useState(false)

	const handleSave = () => {
		updateSettings({
			tableCount: Math.max(1, tableCount),
			defaultChairCount: Math.max(1, defaultChairCount),
		})
	}

	const handleClearAll = () => {
		clearAll()
		setClearDialogOpen(false)
		// Reset form values to defaults
		setTableCount(10)
		setDefaultChairCount(10)
	}

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold">General Settings</h3>
				<p className="text-sm text-muted-foreground">
					Configure table and seating defaults
				</p>
			</div>

			<Card className="p-6">
				<div className="space-y-6">
					<div className="space-y-2">
						<Label htmlFor="table-count">Table Count</Label>
						<Input
							id="table-count"
							type="number"
							min="1"
							max="100"
							value={tableCount}
							onChange={(e) => setTableCount(Number.parseInt(e.target.value, 10))}
						/>
						<p className="text-xs text-muted-foreground">
							Number of tables in the venue
						</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="chair-count">Default Chairs per Table</Label>
						<Input
							id="chair-count"
							type="number"
							min="1"
							max="20"
							value={defaultChairCount}
							onChange={(e) => setDefaultChairCount(Number.parseInt(e.target.value, 10))}
						/>
						<p className="text-xs text-muted-foreground">
							Default number of chairs for new tables
						</p>
					</div>

					<Button onClick={handleSave}>
						Save Settings
					</Button>
				</div>
			</Card>

			<Card className="p-6 border-destructive">
				<div className="space-y-4">
					<div>
						<h4 className="text-lg font-semibold text-destructive">Danger Zone</h4>
						<p className="text-sm text-muted-foreground">
							Irreversible actions that will delete all data
						</p>
					</div>

					<Button
						variant="destructive"
						onClick={() => setClearDialogOpen(true)}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Clear All Data
					</Button>
				</div>
			</Card>

			<Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Clear All Data</DialogTitle>
						<DialogDescription>
							This will permanently delete all guests, parties, relationships, and table assignments.
							This action cannot be undone.
						</DialogDescription>
					</DialogHeader>

					<DialogFooter>
						<Button variant="outline" onClick={() => setClearDialogOpen(false)}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleClearAll}>
							Clear Everything
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

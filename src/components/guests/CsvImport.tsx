import { Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef, useState } from "react"
import { parseCSV, downloadSampleCSV } from "@/lib/csv-parser"
import { useSeatingStore } from "@/stores/useSeatingStore"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

export function CsvImport() {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const importGuests = useSeatingStore((state) => state.importGuests)
	const relationships = useSeatingStore((state) => state.relationships)
	const addRelationship = useSeatingStore((state) => state.addRelationship)
	const [errorDialog, setErrorDialog] = useState<{
		open: boolean
		errors: string[]
	}>({ open: false, errors: [] })

	const handleFileChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	): Promise<void> => {
		const file = e.target.files?.[0]
		if (!file) return

		const result = await parseCSV(file)

		if (!result.success) {
			setErrorDialog({ open: true, errors: result.errors })
			return
		}

		// Add new relationships that don't exist
		const relationshipIdMap = new Map<string, string>() // old ID -> new ID
		for (const relationship of result.relationships) {
			const existing = relationships.find((r) => r.name === relationship.name)
			if (existing) {
				relationshipIdMap.set(relationship.id, existing.id)
			} else {
				const newId = addRelationship(relationship.name, relationship.color)
				relationshipIdMap.set(relationship.id, newId)
			}
		}

		// Update guest relationshipIds to match store IDs
		const updatedGuests = result.guests.map((guest) => ({
			...guest,
			relationshipId: relationshipIdMap.get(guest.relationshipId) || guest.relationshipId,
		}))

		importGuests(updatedGuests)

		// Reset file input
		if (fileInputRef.current) {
			fileInputRef.current.value = ""
		}
	}

	const handleImportClick = (): void => {
		fileInputRef.current?.click()
	}

	return (
		<>
			<div className="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={handleImportClick}
					className="flex-1"
				>
					<Upload className="h-4 w-4 mr-2" />
					Import CSV
				</Button>
				<Button variant="ghost" size="sm" onClick={downloadSampleCSV}>
					<Download className="h-4 w-4 mr-2" />
					Sample
				</Button>
			</div>
			<input
				ref={fileInputRef}
				type="file"
				accept=".csv"
				className="hidden"
				onChange={handleFileChange}
			/>

			<Dialog
				open={errorDialog.open}
				onOpenChange={(open) => setErrorDialog({ ...errorDialog, open })}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>CSV Import Errors</DialogTitle>
						<DialogDescription>
							Please fix the following errors and try again:
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{errorDialog.errors.map((error, index) => (
							<div key={index} className="text-sm text-destructive">
								• {error}
							</div>
						))}
					</div>
				</DialogContent>
			</Dialog>
		</>
	)
}

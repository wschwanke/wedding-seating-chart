import { useState } from "react"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Relationship } from "@/types"

export function RelationshipManager() {
	const relationships = useSeatingStore((state) => state.relationships)
	const guests = useSeatingStore((state) => state.guests)
	const addRelationship = useSeatingStore((state) => state.addRelationship)
	const updateRelationship = useSeatingStore((state) => state.updateRelationship)
	const deleteRelationship = useSeatingStore((state) => state.deleteRelationship)

	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null)
	const [name, setName] = useState("")
	const [color, setColor] = useState("#3b82f6")

	const handleAdd = () => {
		setEditingRelationship(null)
		setName("")
		setColor("#3b82f6")
		setDialogOpen(true)
	}

	const handleEdit = (relationship: Relationship) => {
		setEditingRelationship(relationship)
		setName(relationship.name)
		setColor(relationship.color)
		setDialogOpen(true)
	}

	const handleSave = () => {
		if (!name.trim()) return

		if (editingRelationship) {
			updateRelationship(editingRelationship.id, { name: name.trim(), color })
		} else {
			addRelationship(name.trim(), color)
		}

		setDialogOpen(false)
		setEditingRelationship(null)
		setName("")
		setColor("#3b82f6")
	}

	const handleDelete = (id: string) => {
		const success = deleteRelationship(id)
		if (!success) {
			alert("Cannot delete relationship with assigned guests. Please reassign or delete those guests first.")
		}
	}

	const getGuestCount = (relationshipId: string) => {
		return guests.filter((g) => g.relationshipId === relationshipId).length
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Relationships</h3>
					<p className="text-sm text-muted-foreground">
						Manage relationship categories for your guests
					</p>
				</div>
				<Button onClick={handleAdd} size="sm">
					<Plus className="h-4 w-4 mr-2" />
					Add
				</Button>
			</div>

			<div className="space-y-2">
				{relationships.length === 0 ? (
					<Card className="p-6 text-center text-sm text-muted-foreground">
						No relationships yet. Add one to get started.
					</Card>
				) : (
					relationships.map((relationship) => {
						const guestCount = getGuestCount(relationship.id)
						const hasGuests = guestCount > 0

						return (
							<Card key={relationship.id} className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div
											className="h-6 w-6 rounded border-2"
											style={{ backgroundColor: relationship.color, borderColor: relationship.color }}
										/>
										<div>
											<div className="font-medium">{relationship.name}</div>
											<div className="text-sm text-muted-foreground">
												{guestCount} guest{guestCount !== 1 ? "s" : ""}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(relationship)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDelete(relationship.id)}
											disabled={hasGuests}
											title={hasGuests ? "Remove all guests first" : "Delete relationship"}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</Card>
						)
					})
				)}
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingRelationship ? "Edit Relationship" : "Add Relationship"}
						</DialogTitle>
						<DialogDescription>
							{editingRelationship
								? "Update the relationship name and color"
								: "Create a new relationship category"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="relationship-name">Name</Label>
							<Input
								id="relationship-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Family, Friends, Work"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="relationship-color">Color</Label>
							<div className="flex gap-2">
								<Input
									id="relationship-color"
									type="color"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									className="w-20 h-10"
								/>
								<Input
									type="text"
									value={color}
									onChange={(e) => setColor(e.target.value)}
									placeholder="#3b82f6"
									className="flex-1"
								/>
							</div>
						</div>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button type="button" onClick={handleSave} disabled={!name.trim()}>
							{editingRelationship ? "Update" : "Add"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

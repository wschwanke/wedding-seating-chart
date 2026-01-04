import { useState } from "react"
import { Plus, Pencil, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useSeatingStore } from "@/stores/useSeatingStore"
import { Combobox, type ComboboxItem } from "@/components/ui/combobox"
import type { Subgroup } from "@/types"

export function PartyManager() {
	const subgroups = useSeatingStore((state) => state.subgroups)
	const guests = useSeatingStore((state) => state.guests)
	const relationships = useSeatingStore((state) => state.relationships)
	const createParty = useSeatingStore((state) => state.createParty)
	const updateSubgroup = useSeatingStore((state) => state.updateSubgroup)
	const deleteParty = useSeatingStore((state) => state.deleteParty)

	const [dialogOpen, setDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [editingParty, setEditingParty] = useState<Subgroup | null>(null)
	const [deletingParty, setDeletingParty] = useState<Subgroup | null>(null)
	const [name, setName] = useState("")
	const [relationshipId, setRelationshipId] = useState("")

	const handleAdd = () => {
		setEditingParty(null)
		setName("")
		setRelationshipId(relationships[0]?.id || "")
		setDialogOpen(true)
	}

	const handleEdit = (party: Subgroup) => {
		setEditingParty(party)
		setName(party.name)
		// Relationship is not stored in subgroup, so we don't set it for edit
		setDialogOpen(true)
	}

	const handleSave = () => {
		if (!name.trim()) return

		if (editingParty) {
			updateSubgroup(editingParty.id, name.trim())
		} else {
			createParty(name.trim(), relationshipId)
		}

		setDialogOpen(false)
		setEditingParty(null)
		setName("")
		setRelationshipId("")
	}

	const handleDeleteClick = (party: Subgroup) => {
		setDeletingParty(party)
		setDeleteDialogOpen(true)
	}

	const handleDeleteConfirm = (deleteGuests: boolean) => {
		if (deletingParty) {
			deleteParty(deletingParty.id, deleteGuests)
		}
		setDeleteDialogOpen(false)
		setDeletingParty(null)
	}

	const getPartyGuestCount = (subgroupId: string) => {
		return guests.filter((g) => g.subgroupId === subgroupId).length
	}

	const relationshipItems: ComboboxItem[] = relationships.map((rel) => ({
		id: rel.id,
		label: rel.name,
	}))

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="text-lg font-semibold">Parties</h3>
					<p className="text-sm text-muted-foreground">
						Manage party groups for your guests
					</p>
				</div>
				<Button onClick={handleAdd} size="sm">
					<Plus className="h-4 w-4 mr-2" />
					Add
				</Button>
			</div>

			<div className="space-y-2">
				{subgroups.length === 0 ? (
					<Card className="p-6 text-center text-sm text-muted-foreground">
						No parties yet. Parties are created when you add guests with party size &gt; 1, or you can create empty parties here.
					</Card>
				) : (
					subgroups.map((subgroup) => {
						const guestCount = getPartyGuestCount(subgroup.id)

						return (
							<Card key={subgroup.id} className="p-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Users className="h-5 w-5 text-muted-foreground" />
										<div>
											<div className="font-medium">{subgroup.name}</div>
											<div className="text-sm text-muted-foreground">
												{guestCount} member{guestCount !== 1 ? "s" : ""}
											</div>
										</div>
									</div>
									<div className="flex gap-2">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEdit(subgroup)}
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteClick(subgroup)}
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

			{/* Add/Edit Dialog */}
			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingParty ? "Edit Party" : "Add Party"}
						</DialogTitle>
						<DialogDescription>
							{editingParty
								? "Update the party name"
								: "Create a new party group"}
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="party-name">Name</Label>
							<Input
								id="party-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g., Smith Family Party"
								required
							/>
						</div>

						{!editingParty && (
							<div className="space-y-2">
								<Label htmlFor="party-relationship">Relationship (for new guests)</Label>
								<Combobox
									items={relationshipItems}
									value={relationshipId}
									onValueChange={setRelationshipId}
									placeholder="Select relationship..."
									emptyMessage="No relationships available. Add one first."
								/>
								<p className="text-xs text-muted-foreground">
									This will be used when adding new guests to this party
								</p>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button 
							type="button" 
							onClick={handleSave} 
							disabled={!name.trim() || (!editingParty && !relationshipId)}
						>
							{editingParty ? "Update" : "Add"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Party</DialogTitle>
						<DialogDescription>
							What would you like to do with the {getPartyGuestCount(deletingParty?.id || "")} guest(s) in this party?
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-3 py-4">
						<Button
							variant="outline"
							className="w-full justify-start"
							onClick={() => handleDeleteConfirm(false)}
						>
							<Users className="h-4 w-4 mr-2" />
							Keep guests as solo (remove party association)
						</Button>
						<Button
							variant="destructive"
							className="w-full justify-start"
							onClick={() => handleDeleteConfirm(true)}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							Delete party and all guests
						</Button>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

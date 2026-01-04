import { useState, useEffect } from "react"
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
import { Combobox, type ComboboxItem } from "@/components/ui/combobox"
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Guest } from "@/types"
import { Plus } from "lucide-react"

interface GuestFormProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	guest?: Guest
}

export function GuestForm({
	open,
	onOpenChange,
	guest,
}: GuestFormProps) {
	const addGuest = useSeatingStore((state) => state.addGuest)
	const updateGuest = useSeatingStore((state) => state.updateGuest)
	const updateGuestParty = useSeatingStore((state) => state.updateGuestParty)
	const addGuestToParty = useSeatingStore((state) => state.addGuestToParty)
	const relationships = useSeatingStore((state) => state.relationships)
	const subgroups = useSeatingStore((state) => state.subgroups)

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [partySize, setPartySize] = useState(1)
	const [relationshipId, setRelationshipId] = useState("")
	const [subgroupId, setSubgroupId] = useState<string>("")

	useEffect(() => {
		if (guest) {
			setFirstName(guest.firstName)
			setLastName(guest.lastName)
			setPartySize(guest.partySize)
			setRelationshipId(guest.relationshipId)
			setSubgroupId(guest.subgroupId || "")
		} else {
			setFirstName("")
			setLastName("")
			setPartySize(1)
			setRelationshipId(relationships[0]?.id || "")
			setSubgroupId("")
		}
	}, [guest, open, relationships])

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault()

		if (!firstName.trim() || !lastName.trim() || !relationshipId) {
			return
		}

		if (guest) {
			// Update existing guest
			updateGuest(guest.id, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				relationshipId,
			})
			
			// Update party assignment if changed
			if (guest.subgroupId !== (subgroupId || null)) {
				updateGuestParty(guest.id, subgroupId || null)
			}
		} else {
			// Add new guest (party name is auto-generated in store)
			addGuest({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				partySize,
				party: "", // Will be auto-generated in store
				relationshipId,
			})
		}

		onOpenChange(false)
	}

	const handleAddGuestToParty = () => {
		if (guest?.subgroupId) {
			addGuestToParty(guest.subgroupId)
		}
	}

	const relationshipItems: ComboboxItem[] = relationships.map((rel) => ({
		id: rel.id,
		label: rel.name,
		description: undefined,
	}))

	const partyItems: ComboboxItem[] = [
		{ id: "", label: "No Party (Solo Guest)", description: undefined },
		...subgroups.map((sg) => ({
			id: sg.id,
			label: sg.name,
			description: `${sg.guestIds.length} members`,
		})),
	]

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{guest ? "Edit Guest" : "Add Guest"}</DialogTitle>
					<DialogDescription>
						{guest
							? "Update guest information"
							: "Add a new guest to your list"}
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input
								id="firstName"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder="John"
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input
								id="lastName"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder="Smith"
								required
							/>
						</div>

						{!guest && (
							<div className="space-y-2">
								<Label htmlFor="partySize">Party Size</Label>
								<Input
									id="partySize"
									type="number"
									min="1"
									max="20"
									value={partySize}
									onChange={(e) => setPartySize(Number.parseInt(e.target.value, 10))}
									required
								/>
								<p className="text-xs text-muted-foreground">
									Number of people in the party (including this guest)
								</p>
							</div>
						)}

						<div className="space-y-2">
							<Label htmlFor="relationship">Relationship</Label>
							<Combobox
								items={relationshipItems}
								value={relationshipId}
								onValueChange={setRelationshipId}
								placeholder="Select relationship..."
								searchPlaceholder="Search relationships..."
								emptyMessage="No relationships found. Add one in Settings."
							/>
						</div>

						{guest && (
							<div className="space-y-2">
								<Label htmlFor="party">Party</Label>
								<Combobox
									items={partyItems}
									value={subgroupId}
									onValueChange={setSubgroupId}
									placeholder="Select party..."
									searchPlaceholder="Search parties..."
									emptyMessage="No parties found."
								/>
								{guest.isMainGuest && guest.subgroupId && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={handleAddGuestToParty}
										className="w-full"
									>
										<Plus className="h-4 w-4 mr-2" />
										Add Guest to This Party
									</Button>
								)}
							</div>
						)}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
							Cancel
						</Button>
						<Button type="submit">{guest ? "Update" : "Add"} Guest</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

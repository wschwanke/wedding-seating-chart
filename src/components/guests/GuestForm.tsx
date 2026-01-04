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
import { useSeatingStore } from "@/stores/useSeatingStore"
import type { Guest } from "@/types"

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

	const [firstName, setFirstName] = useState("")
	const [lastName, setLastName] = useState("")
	const [partySize, setPartySize] = useState(1)
	const [group, setGroup] = useState("")

	useEffect(() => {
		if (guest) {
			setFirstName(guest.firstName)
			setLastName(guest.lastName)
			setPartySize(guest.partySize)
			setGroup(guest.group)
		} else {
			setFirstName("")
			setLastName("")
			setPartySize(1)
			setGroup("")
		}
	}, [guest, open])

	const handleSubmit = (e: React.FormEvent): void => {
		e.preventDefault()

		if (!firstName.trim() || !lastName.trim() || !group.trim()) {
			return
		}

		if (guest) {
			// Update existing guest
			updateGuest(guest.id, {
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				group: group.trim(),
				// Note: party size is immutable after creation to avoid complications
			})
		} else {
			// Add new guest
			addGuest({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				partySize,
				group: group.trim(),
			})
		}

		onOpenChange(false)
	}

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

						<div className="space-y-2">
							<Label htmlFor="partySize">Party Size</Label>
							<Input
								id="partySize"
								type="number"
								min="1"
								max="20"
								value={partySize}
								onChange={(e) => setPartySize(Number.parseInt(e.target.value, 10))}
								disabled={!!guest}
								required
							/>
							{guest && (
								<p className="text-xs text-muted-foreground">
									Party size cannot be changed after creation
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="group">Relationship / Group</Label>
							<Input
								id="group"
								value={group}
								onChange={(e) => setGroup(e.target.value)}
								placeholder="Family, Friends, Work, etc."
								required
							/>
						</div>
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

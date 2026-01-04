import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { useSeatingStore } from "./stores/useSeatingStore"

// Helper to get fresh store state
const getStore = () => useSeatingStore.getState()

describe("App - Party Drag and Drop", () => {
	let familyRelId: string
	let tableId: string

	beforeEach(() => {
		// Clear localStorage to reset persisted state
		localStorage.clear()

		// Create test relationship
		const store = getStore()
		familyRelId = store.addRelationship("Family", "#ff0000")
		
		// Get the first table ID
		tableId = store.tables[0].id
	})

	afterEach(() => {
		// Reset store after each test
		getStore().clearAll()
	})

	it("should wrap around when party is dropped on last seat with empty first seats", () => {
		// Create a party of 3
		getStore().addGuest({
			firstName: "John",
			lastName: "Smith",
			partySize: 3,
			relationshipId: familyRelId,
		})

		const { guests, subgroups, tables } = getStore()
		expect(guests).toHaveLength(3)
		expect(subgroups).toHaveLength(1)

		const table = tables.find((t) => t.id === tableId)!
		const partyGuests = guests.filter((g) => g.subgroupId === subgroups[0].id)

		// Simulate dropping party on last seat (index 9 for 10-seat table)
		const dropSeatIndex = 9

		// Manually execute the party assignment logic from App.tsx
		const emptySeats: number[] = []
		for (let i = 0; i < table.seats.length; i++) {
			const seatIdx = (dropSeatIndex + i) % table.seats.length
			if (table.seats[seatIdx] === null) {
				emptySeats.push(seatIdx)
			}
		}

		// Assign guests to available seats
		partyGuests.forEach((guest, idx) => {
			if (idx < emptySeats.length) {
				getStore().assignToSeat(guest.id, tableId, emptySeats[idx])
			}
		})

		// Verify assignments
		const updatedTable = getStore().tables.find((t) => t.id === tableId)!
		
		// Guests should be in seats 9, 0, 1 (wrapping around)
		expect(updatedTable.seats[9]).toBe(partyGuests[0].id)
		expect(updatedTable.seats[0]).toBe(partyGuests[1].id)
		expect(updatedTable.seats[1]).toBe(partyGuests[2].id)

		// All party members should be assigned
		const assignedGuests = partyGuests.filter((g) => {
			return updatedTable.seats.includes(g.id)
		})
		expect(assignedGuests).toHaveLength(3)
	})

	it("should handle party larger than available seats", () => {
		// Create a party of 5
		getStore().addGuest({
			firstName: "Jane",
			lastName: "Doe",
			partySize: 5,
			relationshipId: familyRelId,
		})

		const { guests, subgroups } = getStore()
		expect(guests).toHaveLength(5)

		const partyGuests = guests.filter((g) => g.subgroupId === subgroups[0].id)

		// Fill some seats first - create 7 individual guests to occupy seats
		const blockerIds: string[] = []
		for (let i = 0; i < 7; i++) {
			const blockerId = getStore().addGuest({
				firstName: `Blocker${i}`,
				lastName: "Guest",
				partySize: 1,
				relationshipId: familyRelId,
			})
			blockerIds.push(blockerId)
			getStore().assignToSeat(blockerId, tableId, i)
		}

		const dropSeatIndex = 7 // First available seat

		// Manually execute the party assignment logic from App.tsx
		const updatedTable = getStore().tables.find((t) => t.id === tableId)!
		const emptySeats: number[] = []
		for (let i = 0; i < updatedTable.seats.length; i++) {
			const seatIdx = (dropSeatIndex + i) % updatedTable.seats.length
			if (updatedTable.seats[seatIdx] === null) {
				emptySeats.push(seatIdx)
			}
		}

		// Should only find 3 empty seats (7, 8, 9)
		expect(emptySeats).toHaveLength(3)

		// Assign guests to available seats
		partyGuests.forEach((guest, idx) => {
			if (idx < emptySeats.length) {
				getStore().assignToSeat(guest.id, tableId, emptySeats[idx])
			}
		})

		// Verify only 3 out of 5 party members are assigned
		const finalTable = getStore().tables.find((t) => t.id === tableId)!
		const assignedPartyMembers = partyGuests.filter((g) => 
			finalTable.seats.includes(g.id)
		)
		expect(assignedPartyMembers).toHaveLength(3)

		// Remaining 2 should be unassigned
		const unassignedPartyMembers = partyGuests.filter((g) => 
			!finalTable.seats.includes(g.id)
		)
		expect(unassignedPartyMembers).toHaveLength(2)
	})

	it("should fill consecutively then wrap when dropped on middle seat", () => {
		// Create a party of 4
		getStore().addGuest({
			firstName: "Bob",
			lastName: "Johnson",
			partySize: 4,
			relationshipId: familyRelId,
		})

		const { guests, subgroups } = getStore()
		expect(guests).toHaveLength(4)

		const partyGuests = guests.filter((g) => g.subgroupId === subgroups[0].id)

		// Occupy some middle seats: 2, 3, 8 with separate guests
		const blocker1Id = getStore().addGuest({
			firstName: "Blocker1",
			lastName: "Guest",
			partySize: 1,
			relationshipId: familyRelId,
		})
		const blocker2Id = getStore().addGuest({
			firstName: "Blocker2",
			lastName: "Guest",
			partySize: 1,
			relationshipId: familyRelId,
		})
		const blocker3Id = getStore().addGuest({
			firstName: "Blocker3",
			lastName: "Guest",
			partySize: 1,
			relationshipId: familyRelId,
		})
		getStore().assignToSeat(blocker1Id, tableId, 2)
		getStore().assignToSeat(blocker2Id, tableId, 3)
		getStore().assignToSeat(blocker3Id, tableId, 8)

		// Drop party on seat 5
		const dropSeatIndex = 5

		// Manually execute the party assignment logic from App.tsx
		const updatedTable = getStore().tables.find((t) => t.id === tableId)!
		const emptySeats: number[] = []
		for (let i = 0; i < updatedTable.seats.length; i++) {
			const seatIdx = (dropSeatIndex + i) % updatedTable.seats.length
			if (updatedTable.seats[seatIdx] === null) {
				emptySeats.push(seatIdx)
			}
		}

		// Empty seats from position 5 wrapping: [5, 6, 7, 9, 0, 1, 4]
		// First 4 should be: [5, 6, 7, 9]
		expect(emptySeats[0]).toBe(5)
		expect(emptySeats[1]).toBe(6)
		expect(emptySeats[2]).toBe(7)
		expect(emptySeats[3]).toBe(9)

		// Assign guests to available seats
		partyGuests.forEach((guest, idx) => {
			if (idx < emptySeats.length) {
				getStore().assignToSeat(guest.id, tableId, emptySeats[idx])
			}
		})

		// Verify assignments - party should be in seats 5, 6, 7, 9
		const finalTable = getStore().tables.find((t) => t.id === tableId)!
		expect(finalTable.seats[5]).toBe(partyGuests[0].id)
		expect(finalTable.seats[6]).toBe(partyGuests[1].id)
		expect(finalTable.seats[7]).toBe(partyGuests[2].id)
		expect(finalTable.seats[9]).toBe(partyGuests[3].id)
	})

	it("should work normally when dropped on first seat with all seats empty", () => {
		// Create a party of 3
		getStore().addGuest({
			firstName: "Alice",
			lastName: "Williams",
			partySize: 3,
			relationshipId: familyRelId,
		})

		const { guests, subgroups, tables } = getStore()
		expect(guests).toHaveLength(3)

		const table = tables.find((t) => t.id === tableId)!
		const partyGuests = guests.filter((g) => g.subgroupId === subgroups[0].id)

		// Drop party on first seat
		const dropSeatIndex = 0

		// Manually execute the party assignment logic from App.tsx
		const emptySeats: number[] = []
		for (let i = 0; i < table.seats.length; i++) {
			const seatIdx = (dropSeatIndex + i) % table.seats.length
			if (table.seats[seatIdx] === null) {
				emptySeats.push(seatIdx)
			}
		}

		// Assign guests to available seats
		partyGuests.forEach((guest, idx) => {
			if (idx < emptySeats.length) {
				getStore().assignToSeat(guest.id, tableId, emptySeats[idx])
			}
		})

		// Verify assignments - party should be in seats 0, 1, 2
		const finalTable = getStore().tables.find((t) => t.id === tableId)!
		expect(finalTable.seats[0]).toBe(partyGuests[0].id)
		expect(finalTable.seats[1]).toBe(partyGuests[1].id)
		expect(finalTable.seats[2]).toBe(partyGuests[2].id)
	})
})

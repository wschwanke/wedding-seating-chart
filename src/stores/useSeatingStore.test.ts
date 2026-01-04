import { describe, it, expect, beforeEach, afterEach } from "vitest"
import { useSeatingStore } from "./useSeatingStore"

// Helper to get fresh store state
const getStore = () => useSeatingStore.getState()

describe("useSeatingStore", () => {
	let familyRelId: string
	let friendsRelId: string

	beforeEach(() => {
		// Clear localStorage to reset persisted state
		localStorage.clear()
		
		// Create test relationships
		const store = getStore()
		familyRelId = store.addRelationship("Family", "#ff0000")
		friendsRelId = store.addRelationship("Friends", "#00ff00")
	})

	afterEach(() => {
		// Reset store after each test
		getStore().clearAll()
	})

	describe("Guest Management", () => {
		it("should add a guest", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const guests = getStore().guests
			expect(guestId).toBeDefined()
			expect(guests).toHaveLength(1)
			expect(guests[0].firstName).toBe("John")
			expect(guests[0].isMainGuest).toBe(true)
		})

		it("should create subgroup for party size > 1", () => {
			getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 3,
				relationshipId: familyRelId,
			})

			const { guests, subgroups } = getStore()
			// Should create 3 guests total (1 main + 2 party members)
			expect(guests).toHaveLength(3)
			expect(subgroups).toHaveLength(1)

			const mainGuest = guests.find((g) => g.isMainGuest)
			expect(mainGuest?.partySize).toBe(3)

			const partyMembers = guests.filter((g) => !g.isMainGuest)
			expect(partyMembers).toHaveLength(2)
			expect(partyMembers[0].firstName).toContain("John Smith's Guest")
		})

		it("should update a guest", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			getStore().updateGuest(guestId, { firstName: "Jane" })

			const updatedGuest = getStore().guests.find((g) => g.id === guestId)
			expect(updatedGuest?.firstName).toBe("Jane")
			expect(updatedGuest?.lastName).toBe("Smith")
		})

		it("should delete a guest", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			getStore().deleteGuest(guestId)

			expect(getStore().guests).toHaveLength(0)
		})

		it("should delete guest with party members", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 3,
				relationshipId: familyRelId,
			})

			expect(getStore().guests).toHaveLength(3)
			expect(getStore().subgroups).toHaveLength(1)

			getStore().deleteGuest(guestId)

			// Should delete all party members
			expect(getStore().guests).toHaveLength(0)
			expect(getStore().subgroups).toHaveLength(0)
		})

		it("should add relationship with color", () => {
			const newRelId = getStore().addRelationship("Coworkers", "#0000ff")

			const relationship = getStore().relationships.find((r) => r.id === newRelId)
			expect(relationship).toBeDefined()
			expect(relationship?.name).toBe("Coworkers")
			expect(relationship?.color).toBe("#0000ff")
		})
	})

	describe("Table Management", () => {
		it("should assign guest to seat", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guestId, tableId, 0)

			expect(getStore().tables[0].seats[0]).toBe(guestId)
		})

		it("should move guest between seats", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guestId, tableId, 0)
			expect(getStore().tables[0].seats[0]).toBe(guestId)

			// Move to different seat
			getStore().assignToSeat(guestId, tableId, 5)
			expect(getStore().tables[0].seats[0]).toBeNull()
			expect(getStore().tables[0].seats[5]).toBe(guestId)
		})

		it("should unassign guest", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guestId, tableId, 0)
			expect(getStore().tables[0].seats[0]).toBe(guestId)

			getStore().unassignGuest(guestId)
			expect(getStore().tables[0].seats[0]).toBeNull()
		})

		it("should update table name", () => {
			const tableId = getStore().tables[0].id

			getStore().updateTableName(tableId, "Head Table")

			expect(getStore().tables[0].name).toBe("Head Table")
		})

		it("should update table chair count", () => {
			const tableId = getStore().tables[0].id

			expect(getStore().tables[0].chairCount).toBe(10)
			expect(getStore().tables[0].seats).toHaveLength(10)

			getStore().updateTableChairCount(tableId, 8)

			expect(getStore().tables[0].chairCount).toBe(8)
			expect(getStore().tables[0].seats).toHaveLength(8)
		})
	})

	describe("Utility Functions", () => {
		it("should get unassigned guests", () => {
			const guest1 = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})
			const guest2 = getStore().addGuest({
				firstName: "Jane",
				lastName: "Doe",
				partySize: 1,
				relationshipId: friendsRelId,
			})

			// Assign one guest
			getStore().assignToSeat(guest1, getStore().tables[0].id, 0)

			const unassigned = getStore().getUnassignedGuests()
			expect(unassigned).toHaveLength(1)
			expect(unassigned[0].id).toBe(guest2)
		})

		it("should get assigned guests with table info", () => {
			const guest1 = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guest1, tableId, 3)

			const assigned = getStore().getAssignedGuests()
			expect(assigned).toHaveLength(1)
			expect(assigned[0].guest.id).toBe(guest1)
			expect(assigned[0].assignment.tableId).toBe(tableId)
			expect(assigned[0].assignment.seatIndex).toBe(3)
		})

		it("should get guest assignment", () => {
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guestId, tableId, 5)

			const assignment = getStore().getGuestAssignment(guestId)
			expect(assignment).toBeDefined()
			expect(assignment?.tableId).toBe(tableId)
			expect(assignment?.seatIndex).toBe(5)
		})

		it("should detect table over capacity", () => {
			const tableId = getStore().tables[0].id

			// Fill all 10 seats
			for (let i = 0; i < 10; i++) {
				const guestId = getStore().addGuest({
					firstName: `Guest${i}`,
					lastName: "Test",
					partySize: 1,
					relationshipId: familyRelId,
				})
				getStore().assignToSeat(guestId, tableId, i)
			}

			// Table is at capacity, not over
			expect(getStore().isTableOverCapacity(tableId)).toBe(false)

			// Expand capacity and add more guests
			getStore().updateTableChairCount(tableId, 12)
			const extra1 = getStore().addGuest({
				firstName: "Extra1",
				lastName: "Guest",
				partySize: 1,
				relationshipId: familyRelId,
			})
			const extra2 = getStore().addGuest({
				firstName: "Extra2",
				lastName: "Guest",
				partySize: 1,
				relationshipId: familyRelId,
			})
			getStore().assignToSeat(extra1, tableId, 10)
			getStore().assignToSeat(extra2, tableId, 11)

			// Still not over capacity (12 guests, 12 chairs)
			expect(getStore().isTableOverCapacity(tableId)).toBe(false)

			// Now manually set capacity to less than assigned (simulating over-capacity scenario)
			// This would happen if capacity check is disabled and guests are force-assigned
			const table = getStore().tables.find((t) => t.id === tableId)
			if (table) {
				table.chairCount = 8 // 12 guests, 8 chairs = over capacity
			}
			expect(getStore().isTableOverCapacity(tableId)).toBe(true)
		})
	})

	describe("Settings", () => {
		it("should update relationship", () => {
			getStore().updateRelationship(familyRelId, { name: "Extended Family", color: "#ff00ff" })

			const relationship = getStore().relationships.find((r) => r.id === familyRelId)
			expect(relationship?.name).toBe("Extended Family")
			expect(relationship?.color).toBe("#ff00ff")
		})

		it("should update table count", () => {
			expect(getStore().tables).toHaveLength(10)

			getStore().updateSettings({ tableCount: 15 })

			expect(getStore().tables).toHaveLength(15)
		})

		it("should update default chair count", () => {
			getStore().updateSettings({ defaultChairCount: 12 })

			expect(getStore().settings.defaultChairCount).toBe(12)
		})

		it("should unassign guests when reducing chair count", () => {
			// Add a guest
			const guestId = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			// Get first table
			const tableId = getStore().tables[0].id

			// Assign guest to seat 9 (index 8) of a 10-chair table
			getStore().assignToSeat(guestId, tableId, 8)

			// Verify guest is assigned
			expect(getStore().getUnassignedGuests()).toHaveLength(0)
			const table = getStore().tables.find((t) => t.id === tableId)
			expect(table?.seats[8]).toBe(guestId)

			// Reduce chair count to 8 (removes seats 8 and 9)
			getStore().updateTableChairCount(tableId, 8)

			// Guest should now be unassigned (seat was removed)
			const unassigned = getStore().getUnassignedGuests()
			expect(unassigned).toHaveLength(1)
			expect(unassigned[0].id).toBe(guestId)

			// Table should have 8 seats now
			const updatedTable = getStore().tables.find((t) => t.id === tableId)
			expect(updatedTable?.seats.length).toBe(8)
		})
	})

	describe("Import Guests", () => {
		it("should import multiple guests", () => {
			getStore().importGuests([
				{ firstName: "John", lastName: "Smith", partySize: 1, relationshipId: familyRelId },
				{ firstName: "Jane", lastName: "Doe", partySize: 2, relationshipId: friendsRelId },
			])

			// 1 guest + 1 guest with party size 2 (2 total guests) = 3 guests
			expect(getStore().guests).toHaveLength(3)
		})

		it("should detect duplicates", () => {
			getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})

			getStore().importGuests([
				{ firstName: "John", lastName: "Smith", partySize: 1, relationshipId: familyRelId },
			])

			expect(getStore().duplicates).toHaveLength(1)
			expect(getStore().duplicates[0].firstName).toBe("John")
		})
	})

	describe("State Migration", () => {
		it("should migrate old state with group/groupColors format", () => {
			// Simulate old state structure (version < 2)
			const oldState = {
				guests: [
					{
						id: "guest-1",
						firstName: "John",
						lastName: "Smith",
						partySize: 1,
						group: "Family", // Old property name
						isMainGuest: true,
						party: "John Smith's Party",
					},
					{
						id: "guest-2",
						firstName: "Jane",
						lastName: "Doe",
						partySize: 1,
						group: "Friends", // Old property name
						isMainGuest: true,
						party: "",
					},
				],
				settings: {
					tableCount: 10,
					defaultChairCount: 10,
					groupColors: [ // Old property name
						{ group: "Family", color: "#ff0000" },
						{ group: "Friends", color: "#00ff00" },
					],
				},
				tables: [],
				subgroups: [],
				duplicates: [],
			}

			// Get the migration function from the store config
			const storageConfig = (useSeatingStore as any).persist.getOptions()
			const migratedState = storageConfig.migrate(oldState, 1) // version 1 -> 2

			// Verify relationships were created
			expect(migratedState.relationships).toHaveLength(2)
			expect(migratedState.relationships[0].name).toBe("Family")
			expect(migratedState.relationships[0].color).toBe("#ff0000")
			expect(migratedState.relationships[1].name).toBe("Friends")
			expect(migratedState.relationships[1].color).toBe("#00ff00")

			// Verify guests were migrated to use relationshipId
			expect(migratedState.guests[0]).not.toHaveProperty("group")
			expect(migratedState.guests[0]).toHaveProperty("relationshipId")
			expect(migratedState.guests[0].relationshipId).toBeTruthy()
			expect(migratedState.guests[0].party).toBe("John Smith's Party")

			// Verify settings were cleaned up
			expect(migratedState.settings).not.toHaveProperty("groupColors")
			expect(migratedState.settings.tableCount).toBe(10)
		})

		it("should migrate old state with relationship/relationshipColors format", () => {
			// Simulate alternative old state structure
			const oldState = {
				guests: [
					{
						id: "guest-1",
						firstName: "John",
						lastName: "Smith",
						partySize: 1,
						relationship: "Bride's Family", // Alternative old property name
						isMainGuest: true,
					},
				],
				settings: {
					tableCount: 10,
					defaultChairCount: 10,
					relationshipColors: [ // Alternative old property name
						{ relationship: "Bride's Family", color: "#ff0000" },
					],
				},
				tables: [],
				subgroups: [],
				duplicates: [],
			}

			const storageConfig = (useSeatingStore as any).persist.getOptions()
			const migratedState = storageConfig.migrate(oldState, 1)

			// Verify relationships were created
			expect(migratedState.relationships).toHaveLength(1)
			expect(migratedState.relationships[0].name).toBe("Bride's Family")
			expect(migratedState.relationships[0].color).toBe("#ff0000")

			// Verify guests were migrated
			expect(migratedState.guests[0]).not.toHaveProperty("relationship")
			expect(migratedState.guests[0]).toHaveProperty("relationshipId")
		})

		it("should handle guests with groups not in settings", () => {
			// Old state with guest having a group not defined in settings
			const oldState = {
				guests: [
					{
						id: "guest-1",
						firstName: "John",
						lastName: "Smith",
						partySize: 1,
						group: "Coworkers", // Not in groupColors
						isMainGuest: true,
					},
				],
				settings: {
					tableCount: 10,
					defaultChairCount: 10,
					groupColors: [
						{ group: "Family", color: "#ff0000" },
					],
				},
				tables: [],
				subgroups: [],
				duplicates: [],
			}

			const storageConfig = (useSeatingStore as any).persist.getOptions()
			const migratedState = storageConfig.migrate(oldState, 1)

			// Should create 2 relationships: Family (from settings) + Coworkers (from guest)
			expect(migratedState.relationships).toHaveLength(2)
			const coworkersRel = migratedState.relationships.find((r: any) => r.name === "Coworkers")
			expect(coworkersRel).toBeDefined()
			expect(coworkersRel?.color).toMatch(/^#[0-9a-f]{6}$/i) // Random color
		})

		it("should preserve party field when migrating", () => {
			const oldState = {
				guests: [
					{
						id: "guest-1",
						firstName: "John",
						lastName: "Smith",
						partySize: 3,
						group: "Family",
						isMainGuest: true,
						party: "John Smith's Party",
					},
				],
				settings: {
					tableCount: 10,
					defaultChairCount: 10,
					groupColors: [{ group: "Family", color: "#ff0000" }],
				},
				tables: [],
				subgroups: [],
				duplicates: [],
			}

			const storageConfig = (useSeatingStore as any).persist.getOptions()
			const migratedState = storageConfig.migrate(oldState, 1)

			expect(migratedState.guests[0].party).toBe("John Smith's Party")
		})

		it("should not migrate state already at version 2", () => {
			// Current version state
			const currentState = {
				guests: [
					{
						id: "guest-1",
						firstName: "John",
						lastName: "Smith",
						partySize: 1,
						relationshipId: "rel-1",
						isMainGuest: true,
						party: "",
					},
				],
				relationships: [
					{ id: "rel-1", name: "Family", color: "#ff0000" },
				],
				settings: {
					tableCount: 10,
					defaultChairCount: 10,
				},
				tables: [],
				subgroups: [],
				duplicates: [],
			}

			const storageConfig = (useSeatingStore as any).persist.getOptions()
			const result = storageConfig.migrate(currentState, 2)

			// Should return unchanged
			expect(result).toBe(currentState)
		})
	})

	describe("Seat Swapping", () => {
		it("should swap guests in same table", () => {
			// Add two guests
			const guest1Id = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})
			const guest2Id = getStore().addGuest({
				firstName: "Jane",
				lastName: "Doe",
				partySize: 1,
				relationshipId: friendsRelId,
			})

			// Get first table
			const tableId = getStore().tables[0].id

			// Assign both guests to different seats in same table
			getStore().assignToSeat(guest1Id, tableId, 0) // John in seat 0
			getStore().assignToSeat(guest2Id, tableId, 5) // Jane in seat 5

			// Verify initial positions
			let table = getStore().tables.find((t) => t.id === tableId)
			expect(table?.seats[0]).toBe(guest1Id)
			expect(table?.seats[5]).toBe(guest2Id)

			// Swap seats
			getStore().swapSeats(guest1Id, guest2Id)

			// Verify swapped positions
			table = getStore().tables.find((t) => t.id === tableId)
			expect(table?.seats[0]).toBe(guest2Id) // Jane now in seat 0
			expect(table?.seats[5]).toBe(guest1Id) // John now in seat 5
		})

		it("should swap guests across different tables", () => {
			// Add two guests
			const guest1Id = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})
			const guest2Id = getStore().addGuest({
				firstName: "Jane",
				lastName: "Doe",
				partySize: 1,
				relationshipId: friendsRelId,
			})

			// Get two different tables
			const table1Id = getStore().tables[0].id
			const table2Id = getStore().tables[1].id

			// Assign guests to different tables
			getStore().assignToSeat(guest1Id, table1Id, 2) // John in table 1, seat 2
			getStore().assignToSeat(guest2Id, table2Id, 7) // Jane in table 2, seat 7

			// Verify initial positions
			let table1 = getStore().tables.find((t) => t.id === table1Id)
			let table2 = getStore().tables.find((t) => t.id === table2Id)
			expect(table1?.seats[2]).toBe(guest1Id)
			expect(table2?.seats[7]).toBe(guest2Id)

			// Swap seats across tables
			getStore().swapSeats(guest1Id, guest2Id)

			// Verify swapped positions
			table1 = getStore().tables.find((t) => t.id === table1Id)
			table2 = getStore().tables.find((t) => t.id === table2Id)
			expect(table1?.seats[2]).toBe(guest2Id) // Jane now in table 1, seat 2
			expect(table2?.seats[7]).toBe(guest1Id) // John now in table 2, seat 7
		})

		it("should not swap if one guest is not seated", () => {
			// Add two guests
			const guest1Id = getStore().addGuest({
				firstName: "John",
				lastName: "Smith",
				partySize: 1,
				relationshipId: familyRelId,
			})
			const guest2Id = getStore().addGuest({
				firstName: "Jane",
				lastName: "Doe",
				partySize: 1,
				relationshipId: friendsRelId,
			})

			// Assign only one guest
			const tableId = getStore().tables[0].id
			getStore().assignToSeat(guest1Id, tableId, 0)

			// Try to swap (guest2 is not seated)
			getStore().swapSeats(guest1Id, guest2Id)

			// Verify no change (guest1 still in seat 0, guest2 still unassigned)
			const table = getStore().tables.find((t) => t.id === tableId)
			expect(table?.seats[0]).toBe(guest1Id)
			expect(getStore().getUnassignedGuests().some((g) => g.id === guest2Id)).toBe(true)
		})
	})
})

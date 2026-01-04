import { describe, it, expect } from "vitest"
import { autoAssignGuests } from "./auto-assign"
import type { Guest, Table, Subgroup } from "@/types"

function createGuest(
	id: string,
	firstName: string,
	relationship: string,
	partySize = 1,
	subgroupId?: string,
): Guest {
	return {
		id,
		firstName,
		lastName: "Test",
		partySize,
		party: partySize > 1 ? `${firstName}'s Party` : "",
		relationship,
		isMainGuest: true,
		subgroupId,
	}
}

function createTable(id: string, chairCount: number): Table {
	return {
		id,
		name: `Table ${id}`,
		chairCount,
		seats: Array(chairCount).fill(null),
	}
}

describe("Auto-Assign Algorithm", () => {
	it("should assign guests to tables", () => {
		const guests: Guest[] = [
			createGuest("1", "John", "Family"),
			createGuest("2", "Jane", "Family"),
			createGuest("3", "Bob", "Friends"),
		]

		const tables: Table[] = [createTable("t1", 10), createTable("t2", 10)]

		const result = autoAssignGuests(guests, tables, [])

		// All guests should be assigned
		const assignedGuests = result.flatMap((t) => t.seats.filter((s) => s !== null))
		expect(assignedGuests).toHaveLength(3)
	})

	it("should keep same group together when possible", () => {
		const guests: Guest[] = [
			createGuest("1", "John", "Family"),
			createGuest("2", "Jane", "Family"),
			createGuest("3", "Bob", "Family"),
			createGuest("4", "Alice", "Friends"),
		]

		const tables: Table[] = [createTable("t1", 10), createTable("t2", 10)]

		const result = autoAssignGuests(guests, tables, [])

		// Family members should all be at the same table
		const table1FamilyCount = result[0].seats.filter((seat) => {
			if (!seat) return false
			const guest = guests.find((g) => g.id === seat)
			return guest?.relationship === "Family"
		}).length

		const table2FamilyCount = result[1].seats.filter((seat) => {
			if (!seat) return false
			const guest = guests.find((g) => g.id === seat)
			return guest?.relationship === "Family"
		}).length

		// All 3 family members should be at one table
		expect(table1FamilyCount === 3 || table2FamilyCount === 3).toBe(true)
	})

	it("should handle subgroups correctly", () => {
		const subgroup: Subgroup = {
			id: "sg1",
			name: "John's Party",
			guestIds: ["1", "2"],
		}

		const guests: Guest[] = [
			createGuest("1", "John", "Family", 1, "sg1"),
			createGuest("2", "John's Guest 1", "Family", 1, "sg1"),
			createGuest("3", "Bob", "Friends"),
		]

		const tables: Table[] = [createTable("t1", 10)]

		const result = autoAssignGuests(guests, tables, [subgroup])

		// Subgroup members should be assigned
		const table1 = result[0]
		expect(table1.seats.filter((s) => s === "1" || s === "2")).toHaveLength(2)
	})

	it("should handle tables with limited capacity", () => {
		const guests: Guest[] = Array.from({ length: 25 }, (_, i) =>
			createGuest(`${i}`, `Guest${i}`, "Family"),
		)

		const tables: Table[] = [
			createTable("t1", 10),
			createTable("t2", 10),
			createTable("t3", 10),
		]

		const result = autoAssignGuests(guests, tables, [])

		// All 25 guests should be assigned across 3 tables
		const assignedGuests = result.flatMap((t) => t.seats.filter((s) => s !== null))
		expect(assignedGuests).toHaveLength(25)
	})

	it("should clear existing assignments", () => {
		const guests: Guest[] = [createGuest("1", "John", "Family")]

		const tables: Table[] = [
			{
				id: "t1",
				name: "Table 1",
				chairCount: 10,
				seats: ["1", null, null, null, null, null, null, null, null, null],
			},
		]

		const result = autoAssignGuests(guests, tables, [])

		// Should reassign (not just keep existing)
		const assignedSeats = result[0].seats.filter((s) => s !== null)
		expect(assignedSeats).toHaveLength(1)
	})

	it("should prioritize larger groups first", () => {
		const guests: Guest[] = [
			createGuest("1", "Alice", "Small", 1),
			createGuest("2", "Bob", "Large", 1),
			createGuest("3", "Charlie", "Large", 1),
			createGuest("4", "David", "Large", 1),
			createGuest("5", "Eve", "Large", 1),
		]

		const tables: Table[] = [createTable("t1", 4), createTable("t2", 4)]

		const result = autoAssignGuests(guests, tables, [])

		// Larger group should be prioritized and kept together
		const table1LargeCount = result[0].seats.filter((seat) => {
			if (!seat) return false
			const guest = guests.find((g) => g.id === seat)
			return guest?.relationship === "Large"
		}).length

		const table2LargeCount = result[1].seats.filter((seat) => {
			if (!seat) return false
			const guest = guests.find((g) => g.id === seat)
			return guest?.relationship === "Large"
		}).length

		// Large group members should be mostly at the same table
		expect(Math.max(table1LargeCount, table2LargeCount)).toBeGreaterThanOrEqual(3)
	})

	it("should handle empty guest list", () => {
		const guests: Guest[] = []
		const tables: Table[] = [createTable("t1", 10)]

		const result = autoAssignGuests(guests, tables, [])

		expect(result[0].seats.every((s) => s === null)).toBe(true)
	})
})

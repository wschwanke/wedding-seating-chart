import type { Guest, Table, Subgroup } from "@/types"

interface RelationshipWithGuests {
	relationshipId: string
	guests: Guest[]
}

/**
 * Auto-assign guests to tables, prioritizing keeping relationships together
 */
export function autoAssignGuests(
	guests: Guest[],
	tables: Table[],
	subgroups: Subgroup[],
): Table[] {
	// Clear all current assignments
	const clearedTables = tables.map((table) => ({
		...table,
		seats: Array(table.chairCount).fill(null),
	}))

	// Group guests by their relationshipId
	const relationshipMap = new Map<string, Guest[]>()

	for (const guest of guests) {
		const relationshipId = guest.relationshipId
		if (!relationshipMap.has(relationshipId)) {
			relationshipMap.set(relationshipId, [])
		}
		relationshipMap.get(relationshipId)!.push(guest)
	}

	// Convert to sorted array (largest relationship groups first)
	const relationshipsWithGuests: RelationshipWithGuests[] = Array.from(relationshipMap.entries())
		.map(([relationshipId, guestsInRelationship]) => ({
			relationshipId,
			guests: guestsInRelationship,
			totalSeats: guestsInRelationship.reduce((sum, g) => sum + g.partySize, 0),
		}))
		.sort((a, b) => b.totalSeats - a.totalSeats)

	let currentTableIndex = 0
	let currentSeatIndex = 0

	// Helper to find next available seat
	const getNextAvailableSeat = (): {
		tableIndex: number
		seatIndex: number
	} | null => {
		for (let ti = currentTableIndex; ti < clearedTables.length; ti++) {
			const table = clearedTables[ti]
			for (
				let si = ti === currentTableIndex ? currentSeatIndex : 0;
				si < table.chairCount;
				si++
			) {
				if (table.seats[si] === null) {
					return { tableIndex: ti, seatIndex: si }
				}
			}
		}
		return null
	}

	// Helper to check if subgroup members should be seated together
	const getSubgroupMembers = (guest: Guest): Guest[] => {
		if (!guest.subgroupId) return [guest]

		const subgroup = subgroups.find((sg) => sg.id === guest.subgroupId)
		if (!subgroup) return [guest]

		return guests.filter((g) => subgroup.guestIds.includes(g.id))
	}

	// Try to seat each relationship group together at a table
	for (const relationshipData of relationshipsWithGuests) {
		// Process guests, handling subgroups
		const processedGuests = new Set<string>()

		for (const guest of relationshipData.guests) {
			if (processedGuests.has(guest.id)) continue

			const subgroupMembers = getSubgroupMembers(guest)
			const seatsNeeded = subgroupMembers.reduce(
				(sum, g) => sum + g.partySize,
				0,
			)

			// Find a table with enough consecutive or total seats
			let assigned = false

			// Try current table first
			if (currentTableIndex < clearedTables.length) {
				const currentTable = clearedTables[currentTableIndex]
				const availableSeats = currentTable.seats.filter((s) => s === null).length

				if (availableSeats >= seatsNeeded) {
					// Assign to current table
					for (const member of subgroupMembers) {
						const next = getNextAvailableSeat()
						if (next) {
							clearedTables[next.tableIndex].seats[next.seatIndex] = member.id
							currentSeatIndex = next.seatIndex + 1
							processedGuests.add(member.id)
						}
					}
					assigned = true
				}
			}

			// If not assigned, try next tables
			if (!assigned) {
				// Move to next table
				currentTableIndex++
				currentSeatIndex = 0

				if (currentTableIndex < clearedTables.length) {
					// Assign to new table
					for (const member of subgroupMembers) {
						const next = getNextAvailableSeat()
						if (next) {
							clearedTables[next.tableIndex].seats[next.seatIndex] = member.id
							currentSeatIndex = next.seatIndex + 1
							processedGuests.add(member.id)
						}
					}
				} else {
					// No more tables, just fill remaining seats
					for (const member of subgroupMembers) {
						const next = getNextAvailableSeat()
						if (next) {
							clearedTables[next.tableIndex].seats[next.seatIndex] = member.id
							processedGuests.add(member.id)
						}
					}
				}
			}
		}

		// After processing a group, consider moving to next table for next group
		// (to keep groups separate when possible)
		const currentTable = clearedTables[currentTableIndex]
		if (currentTable && currentSeatIndex > 0) {
			currentTableIndex++
			currentSeatIndex = 0
		}
	}

	return clearedTables
}

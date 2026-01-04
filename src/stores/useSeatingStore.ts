import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
	Guest,
	Relationship,
	Subgroup,
	Table,
	Settings,
	DuplicateGuest,
	SeatingStore,
	GuestAssignment,
} from "@/types"
import { generateId, generateRandomColor } from "@/lib/utils"
import { autoAssignGuests } from "@/lib/auto-assign"

const DEFAULT_SETTINGS: Settings = {
	tableCount: 10,
	defaultChairCount: 10,
}

const createInitialTables = (count: number, chairCount: number): Table[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: generateId(),
		name: `Table ${i + 1}`,
		chairCount,
		seats: Array(chairCount).fill(null),
	}))
}

export const useSeatingStore = create<SeatingStore>()(
	persist(
		(set, get) => ({
			guests: [],
			subgroups: [],
			tables: createInitialTables(
				DEFAULT_SETTINGS.tableCount,
				DEFAULT_SETTINGS.defaultChairCount,
			),
			relationships: [],
			settings: DEFAULT_SETTINGS,
			duplicates: [],

			// Guest actions
			addGuest: (guestData) => {
				const id = generateId()
				const state = get()

				// Auto-generate party name if party size > 1
				const party = guestData.partySize > 1 
					? `${guestData.firstName} ${guestData.lastName}'s Party` 
					: ""

				// Create main guest
				const mainGuest: Guest = {
					...guestData,
					id,
					party,
					isMainGuest: true,
				}

				const newGuests: Guest[] = [mainGuest]

				// Create party members if party size > 1
				if (guestData.partySize > 1) {
					const subgroupId = generateId()
					const partyMembers: Guest[] = []

					for (let i = 1; i < guestData.partySize; i++) {
						partyMembers.push({
							id: generateId(),
							firstName: `${guestData.firstName} ${guestData.lastName}'s Guest`,
							lastName: `${i}`,
							partySize: 1,
							party,
							relationshipId: guestData.relationshipId,
							subgroupId,
							isMainGuest: false,
							parentGuestId: id,
						})
					}

					newGuests.push(...partyMembers)

					// Create subgroup
					const subgroup: Subgroup = {
						id: subgroupId,
						name: party,
						guestIds: [id, ...partyMembers.map((g) => g.id)],
					}

					// Update main guest with subgroup
					mainGuest.subgroupId = subgroupId

					set({
						guests: [...state.guests, ...newGuests],
						subgroups: [...state.subgroups, subgroup],
					})
				} else {
					set({
						guests: [...state.guests, mainGuest],
					})
				}

				return id
			},

			updateGuest: (id, updates) => {
				set({
					guests: get().guests.map((g) =>
						g.id === id ? { ...g, ...updates } : g,
					),
				})
			},

			// Relationship actions
			addRelationship: (name, color) => {
				const state = get()
				const id = generateId()
				const newRelationship: Relationship = {
					id,
					name,
					color: color || generateRandomColor(),
				}
				set({
					relationships: [...state.relationships, newRelationship],
				})
				return id
			},

			updateRelationship: (id, updates) => {
				set({
					relationships: get().relationships.map((r) =>
						r.id === id ? { ...r, ...updates } : r,
					),
				})
			},

			deleteRelationship: (id) => {
				const state = get()
				// Check if any guests use this relationship
				const hasGuests = state.guests.some((g) => g.relationshipId === id)
				if (hasGuests) {
					return false
				}
				set({
					relationships: state.relationships.filter((r) => r.id !== id),
				})
				return true
			},

			deleteGuest: (id) => {
				const state = get()
				const guest = state.guests.find((g) => g.id === id)

				if (!guest) return

				let guestsToRemove = [id]

				// If this is a main guest with party members, remove them too
				if (guest.isMainGuest && guest.subgroupId) {
					const subgroup = state.subgroups.find((sg) => sg.id === guest.subgroupId)
					if (subgroup) {
						guestsToRemove = subgroup.guestIds
					}
				}

				// Remove from tables
				const updatedTables = state.tables.map((table) => ({
					...table,
					seats: table.seats.map((seat) =>
						guestsToRemove.includes(seat ?? "") ? null : seat,
					),
				}))

				// Remove from subgroups
				const updatedSubgroups = state.subgroups
					.map((sg) => ({
						...sg,
						guestIds: sg.guestIds.filter((gid) => !guestsToRemove.includes(gid)),
					}))
					.filter((sg) => sg.guestIds.length > 0)

				set({
					guests: state.guests.filter((g) => !guestsToRemove.includes(g.id)),
					tables: updatedTables,
					subgroups: updatedSubgroups,
				})
			},

			importGuests: (guestsData) => {
				const state = get()
				const newGuests: Guest[] = []
				const newSubgroups: Subgroup[] = []
				const newDuplicates: DuplicateGuest[] = []

				for (const guestData of guestsData) {
					// Check for duplicates
					const existingGuest = state.guests.find(
						(g) =>
							g.firstName.toLowerCase() === guestData.firstName.toLowerCase() &&
							g.lastName.toLowerCase() === guestData.lastName.toLowerCase(),
					)

					if (existingGuest) {
						const relationship = state.relationships.find((r) => r.id === guestData.relationshipId)
						newDuplicates.push({
							id: generateId(),
							firstName: guestData.firstName,
							lastName: guestData.lastName,
							relationship: relationship?.name || "",
						})
						// Still import but mark as duplicate
					}

					const id = generateId()
					
					// Auto-generate party name if party size > 1
					const party = guestData.partySize > 1 
						? `${guestData.firstName} ${guestData.lastName}'s Party` 
						: ""

					const mainGuest: Guest = {
						...guestData,
						id,
						party,
						isMainGuest: true,
					}

					newGuests.push(mainGuest)

					// Create party members if party size > 1
					if (guestData.partySize > 1) {
						const subgroupId = generateId()
						const partyMembers: Guest[] = []

						for (let i = 1; i < guestData.partySize; i++) {
							partyMembers.push({
								id: generateId(),
								firstName: `${guestData.firstName} ${guestData.lastName}'s Guest`,
								lastName: `${i}`,
								partySize: 1,
								party,
								relationshipId: guestData.relationshipId,
								subgroupId,
								isMainGuest: false,
								parentGuestId: id,
							})
						}

						newGuests.push(...partyMembers)

						// Create subgroup
						newSubgroups.push({
							id: subgroupId,
							name: party,
							guestIds: [id, ...partyMembers.map((g) => g.id)],
						})

						// Update main guest with subgroup
						mainGuest.subgroupId = subgroupId
					}
				}

				set({
					guests: [...state.guests, ...newGuests],
					subgroups: [...state.subgroups, ...newSubgroups],
					duplicates: [...state.duplicates, ...newDuplicates],
				})
			},

			resolveDuplicate: (duplicateId, action) => {
				const state = get()
				const duplicate = state.duplicates.find((d) => d.id === duplicateId)

				if (!duplicate) return

				if (action === "remove") {
					// Find and remove the duplicate guest
					const guestToRemove = state.guests.find((g) => {
						const relationship = state.relationships.find((r) => r.id === g.relationshipId)
						return (
							g.firstName === duplicate.firstName &&
							g.lastName === duplicate.lastName &&
							relationship?.name === duplicate.relationship
						)
					})

					if (guestToRemove) {
						get().deleteGuest(guestToRemove.id)
					}
				}

				set({
					duplicates: state.duplicates.filter((d) => d.id !== duplicateId),
				})
			},

			// Subgroup actions
			createSubgroup: (name, guestIds) => {
				const state = get()
				const id = generateId()

				const newSubgroup: Subgroup = {
					id,
					name,
					guestIds,
				}

				// Update guests with subgroup ID
				const updatedGuests = state.guests.map((g) =>
					guestIds.includes(g.id) ? { ...g, subgroupId: id } : g,
				)

				set({
					subgroups: [...state.subgroups, newSubgroup],
					guests: updatedGuests,
				})
			},

			updateSubgroup: (id, name) => {
				set({
					subgroups: get().subgroups.map((sg) =>
						sg.id === id ? { ...sg, name } : sg,
					),
				})
			},

			deleteSubgroup: (id) => {
				const state = get()

				// Remove subgroup reference from guests
				const updatedGuests = state.guests.map((g) =>
					g.subgroupId === id ? { ...g, subgroupId: undefined } : g,
				)

				set({
					subgroups: state.subgroups.filter((sg) => sg.id !== id),
					guests: updatedGuests,
				})
			},

			addToSubgroup: (subgroupId, guestId) => {
				const state = get()

				const updatedSubgroups = state.subgroups.map((sg) =>
					sg.id === subgroupId
						? { ...sg, guestIds: [...sg.guestIds, guestId] }
						: sg,
				)

				const updatedGuests = state.guests.map((g) =>
					g.id === guestId ? { ...g, subgroupId } : g,
				)

				set({
					subgroups: updatedSubgroups,
					guests: updatedGuests,
				})
			},

			removeFromSubgroup: (subgroupId, guestId) => {
				const state = get()

				const updatedSubgroups = state.subgroups
					.map((sg) =>
						sg.id === subgroupId
							? { ...sg, guestIds: sg.guestIds.filter((id) => id !== guestId) }
							: sg,
					)
					.filter((sg) => sg.guestIds.length > 0)

				const updatedGuests = state.guests.map((g) =>
					g.id === guestId ? { ...g, subgroupId: undefined } : g,
				)

				set({
					subgroups: updatedSubgroups,
					guests: updatedGuests,
				})
			},

			createParty: (name, _relationshipId) => {
				const state = get()
				const id = generateId()
				const newSubgroup: Subgroup = {
					id,
					name,
					guestIds: [],
				}
				set({
					subgroups: [...state.subgroups, newSubgroup],
				})
				return id
			},

			deleteParty: (subgroupId, deleteGuests) => {
				const state = get()
				const subgroup = state.subgroups.find((sg) => sg.id === subgroupId)
				if (!subgroup) return

				if (deleteGuests) {
					// Delete all guests in the party
					const guestIdsToRemove = new Set(subgroup.guestIds)
					
					// Remove from tables
					const updatedTables = state.tables.map((table) => ({
						...table,
						seats: table.seats.map((seat) =>
							guestIdsToRemove.has(seat ?? "") ? null : seat,
						),
					}))

					set({
						guests: state.guests.filter((g) => !guestIdsToRemove.has(g.id)),
						subgroups: state.subgroups.filter((sg) => sg.id !== subgroupId),
						tables: updatedTables,
					})
				} else {
					// Make guests solo
					const updatedGuests = state.guests.map((g) =>
						g.subgroupId === subgroupId
							? { ...g, subgroupId: undefined, party: "" }
							: g,
					)
					set({
						guests: updatedGuests,
						subgroups: state.subgroups.filter((sg) => sg.id !== subgroupId),
					})
				}
			},

			updateGuestParty: (guestId, newSubgroupId) => {
				const state = get()
				const guest = state.guests.find((g) => g.id === guestId)
				if (!guest) return

				// Remove from current subgroup if exists
				let updatedSubgroups = state.subgroups
				if (guest.subgroupId) {
					updatedSubgroups = updatedSubgroups
						.map((sg) =>
							sg.id === guest.subgroupId
								? { ...sg, guestIds: sg.guestIds.filter((id) => id !== guestId) }
								: sg,
						)
						.filter((sg) => sg.guestIds.length > 0)
				}

				// Add to new subgroup if provided
				if (newSubgroupId) {
					updatedSubgroups = updatedSubgroups.map((sg) =>
						sg.id === newSubgroupId
							? { ...sg, guestIds: [...sg.guestIds, guestId] }
							: sg,
					)
					const newSubgroup = state.subgroups.find((sg) => sg.id === newSubgroupId)
					const newParty = newSubgroup?.name || ""
					
					set({
						guests: state.guests.map((g) =>
							g.id === guestId
								? { ...g, subgroupId: newSubgroupId, party: newParty }
								: g,
						),
						subgroups: updatedSubgroups,
					})
				} else {
					// Make solo
					set({
						guests: state.guests.map((g) =>
							g.id === guestId
								? { ...g, subgroupId: undefined, party: "" }
								: g,
						),
						subgroups: updatedSubgroups,
					})
				}
			},

			addGuestToParty: (subgroupId) => {
				const state = get()
				const subgroup = state.subgroups.find((sg) => sg.id === subgroupId)
				if (!subgroup) return ""

				// Find the main guest to get relationship
				const mainGuest = state.guests.find(
					(g) => g.subgroupId === subgroupId && g.isMainGuest,
				)
				if (!mainGuest) return ""

				// Count existing party members to generate appropriate name
				const partyMembers = state.guests.filter((g) => g.subgroupId === subgroupId)
				const guestNumber = partyMembers.filter((g) => !g.isMainGuest).length + 1

				const newGuestId = generateId()
				const newGuest: Guest = {
					id: newGuestId,
					firstName: `${mainGuest.firstName} ${mainGuest.lastName}'s Guest`,
					lastName: `${guestNumber}`,
					partySize: 1,
					party: subgroup.name,
					relationshipId: mainGuest.relationshipId,
					subgroupId,
					isMainGuest: false,
					parentGuestId: mainGuest.id,
				}

				set({
					guests: [...state.guests, newGuest],
					subgroups: state.subgroups.map((sg) =>
						sg.id === subgroupId
							? { ...sg, guestIds: [...sg.guestIds, newGuestId] }
							: sg,
					),
				})

				return newGuestId
			},

			// Table actions
			assignToSeat: (guestId, tableId, seatIndex) => {
				const state = get()

				// Remove guest from current seat if assigned
				const updatedTables = state.tables.map((table) => ({
					...table,
					seats: table.seats.map((seat) => (seat === guestId ? null : seat)),
				}))

				// Assign to new seat
				const finalTables = updatedTables.map((table) =>
					table.id === tableId
						? {
								...table,
								seats: table.seats.map((seat, idx) =>
									idx === seatIndex ? guestId : seat,
								),
							}
						: table,
				)

				set({ tables: finalTables })
			},

		unassignGuest: (guestId) => {
			set({
				tables: get().tables.map((table) => ({
					...table,
					seats: table.seats.map((seat) => (seat === guestId ? null : seat)),
				})),
			})
		},

		swapSeats: (guestId1, guestId2) => {
			const state = get()
			
			// Find both guests' current seats
			let guest1Seat: { tableId: string; seatIndex: number } | null = null
			let guest2Seat: { tableId: string; seatIndex: number } | null = null
			
			for (const table of state.tables) {
				for (let i = 0; i < table.seats.length; i++) {
					if (table.seats[i] === guestId1) {
						guest1Seat = { tableId: table.id, seatIndex: i }
					}
					if (table.seats[i] === guestId2) {
						guest2Seat = { tableId: table.id, seatIndex: i }
					}
				}
			}
			
			// Both guests must be seated to swap
			if (!guest1Seat || !guest2Seat) return
			
			// Perform the swap
			set({
				tables: state.tables.map((table) => {
					if (table.id === guest1Seat!.tableId) {
						return {
							...table,
							seats: table.seats.map((seat, idx) => {
								if (idx === guest1Seat!.seatIndex) return guestId2
								if (idx === guest2Seat!.seatIndex && guest2Seat!.tableId === table.id) return guestId1
								return seat
							})
						}
					}
					if (table.id === guest2Seat!.tableId && guest2Seat!.tableId !== guest1Seat!.tableId) {
						return {
							...table,
							seats: table.seats.map((seat, idx) => {
								if (idx === guest2Seat!.seatIndex) return guestId1
								return seat
							})
						}
					}
					return table
				})
			})
		},

		moveSubgroup: (subgroupId, tableId, startSeatIndex) => {
				const state = get()
				const subgroup = state.subgroups.find((sg) => sg.id === subgroupId)

				if (!subgroup) return

				// Remove all subgroup members from current seats
				let updatedTables = state.tables.map((table) => ({
					...table,
					seats: table.seats.map((seat) =>
						subgroup.guestIds.includes(seat ?? "") ? null : seat,
					),
				}))

				// Assign subgroup members to consecutive seats
				updatedTables = updatedTables.map((table) => {
					if (table.id === tableId) {
						const newSeats = [...table.seats]
						subgroup.guestIds.forEach((guestId, index) => {
							const seatIndex = startSeatIndex + index
							if (seatIndex < newSeats.length) {
								newSeats[seatIndex] = guestId
							}
						})
						return { ...table, seats: newSeats }
					}
					return table
				})

				set({ tables: updatedTables })
			},

			updateTableName: (tableId, name) => {
				set({
					tables: get().tables.map((t) =>
						t.id === tableId ? { ...t, name } : t,
					),
				})
			},

			updateTableChairCount: (tableId, chairCount) => {
				set({
					tables: get().tables.map((t) => {
						if (t.id === tableId) {
							const newSeats = [...t.seats]
							if (chairCount > t.chairCount) {
								// Add empty seats
								newSeats.push(...Array(chairCount - t.chairCount).fill(null))
							} else if (chairCount < t.chairCount) {
								// Remove seats (keep existing assignments)
								newSeats.splice(chairCount)
							}
							return { ...t, chairCount, seats: newSeats }
						}
						return t
					}),
				})
			},

			// Settings actions
			updateSettings: (newSettings) => {
				const state = get()
				const updatedSettings = { ...state.settings, ...newSettings }

				// Handle table count change
				if (
					newSettings.tableCount !== undefined &&
					newSettings.tableCount !== state.settings.tableCount
				) {
					const currentCount = state.tables.length
					const newCount = newSettings.tableCount

					if (newCount > currentCount) {
						// Add new tables
						const newTables = Array.from(
							{ length: newCount - currentCount },
							(_, i) => ({
								id: generateId(),
								name: `Table ${currentCount + i + 1}`,
								chairCount: updatedSettings.defaultChairCount,
								seats: Array(updatedSettings.defaultChairCount).fill(null),
							}),
						)
						set({
							settings: updatedSettings,
							tables: [...state.tables, ...newTables],
						})
					} else {
						// Remove tables (keep first N)
						set({
							settings: updatedSettings,
							tables: state.tables.slice(0, newCount),
						})
					}
				} else {
					set({ settings: updatedSettings })
				}
			},

		// Utility actions
		autoAssign: () => {
			const state = get()
			const updatedTables = autoAssignGuests(
				state.guests,
				state.tables,
				state.subgroups,
			)
			set({ tables: updatedTables })
		},

		clearAll: () => {
			set({
				guests: [],
				subgroups: [],
				tables: createInitialTables(
					DEFAULT_SETTINGS.tableCount,
					DEFAULT_SETTINGS.defaultChairCount,
				),
				relationships: [],
				settings: DEFAULT_SETTINGS,
				duplicates: [],
			})
		},

		clearAllSeats: () => {
			const state = get()
			const updatedTables = state.tables.map(table => ({
				...table,
				seats: Array(table.chairCount).fill(null)
			}))
			set({ tables: updatedTables })
		},

		getUnassignedGuests: () => {
				const state = get()
				const assignedGuestIds = new Set(
					state.tables.flatMap((t) => t.seats.filter((s) => s !== null) as string[]),
				)
				return state.guests.filter((g) => !assignedGuestIds.has(g.id))
			},

			getAssignedGuests: () => {
				const state = get()
				const assigned: Array<{ guest: Guest; assignment: GuestAssignment }> = []

				for (const table of state.tables) {
					for (let i = 0; i < table.seats.length; i++) {
						const guestId = table.seats[i]
						if (guestId) {
							const guest = state.guests.find((g) => g.id === guestId)
							if (guest) {
								assigned.push({
									guest,
									assignment: {
										guestId,
										tableId: table.id,
										tableName: table.name,
										seatIndex: i,
									},
								})
							}
						}
					}
				}

				return assigned
			},

			getGuestAssignment: (guestId) => {
				const state = get()

				for (const table of state.tables) {
					const seatIndex = table.seats.findIndex((seat) => seat === guestId)
					if (seatIndex !== -1) {
						return {
							guestId,
							tableId: table.id,
							tableName: table.name,
							seatIndex,
						}
					}
				}

				return null
			},

			getGuestsBySubgroup: (subgroupId) => {
				const state = get()
				const subgroup = state.subgroups.find((sg) => sg.id === subgroupId)
				if (!subgroup) return []
				return state.guests.filter((g) => subgroup.guestIds.includes(g.id))
			},

			isTableOverCapacity: (tableId) => {
				const table = get().tables.find((t) => t.id === tableId)
				if (!table) return false
				const assignedSeats = table.seats.filter((s) => s !== null).length
				return assignedSeats > table.chairCount
			},
		}),
		{
			name: "seating-chart-storage",
			version: 2,
			migrate: (persistedState: any, version: number) => {
				// Migration from version 0 or 1 to version 2
				if (version < 2) {
					const oldState = persistedState as any
					
					// Create relationships from old groupColors or relationshipColors
					const relationshipMap = new Map<string, string>() // name -> id
					const relationships: Relationship[] = []
					
					// Handle both naming conventions: groupColors (older) and relationshipColors (newer)
					const groupColors = oldState.settings?.groupColors || oldState.settings?.relationshipColors || []
					
					// Get unique relationships from settings if they exist
					for (const rc of groupColors) {
						const name = rc.group || rc.relationship // Handle both property names
						if (name) {
							const id = generateId()
							relationshipMap.set(name, id)
							relationships.push({ 
								id, 
								name, 
								color: rc.color 
							})
						}
					}
					
					// Also get unique relationships from guests (in case some weren't in settings)
					if (oldState.guests) {
						for (const guest of oldState.guests) {
							const groupName = guest.group || guest.relationship // Handle both property names
							if (groupName && !relationshipMap.has(groupName)) {
								const id = generateId()
								relationshipMap.set(groupName, id)
								relationships.push({ 
									id, 
									name: groupName, 
									color: generateRandomColor() 
								})
							}
						}
					}
					
					// Migrate guests to use relationshipId
					const migratedGuests = oldState.guests?.map((guest: any) => {
						const groupName = guest.group || guest.relationship // Handle both property names
						const relationshipId = relationshipMap.get(groupName) || ""
						const { group, relationship, ...rest } = guest
						return {
							...rest,
							relationshipId,
							party: guest.party || "", // Ensure party field exists
						}
					}) || []
					
					// Return migrated state
					return {
						...oldState,
						guests: migratedGuests,
						relationships,
						settings: {
							tableCount: oldState.settings?.tableCount || DEFAULT_SETTINGS.tableCount,
							defaultChairCount: oldState.settings?.defaultChairCount || DEFAULT_SETTINGS.defaultChairCount,
						},
					}
				}
				return persistedState
			},
		},
	),
)

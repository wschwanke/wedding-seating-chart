import { create } from "zustand"
import { persist } from "zustand/middleware"
import type {
	Guest,
	Subgroup,
	Table,
	Settings,
	DuplicateGuest,
	SeatingStore,
	GuestAssignment,
} from "@/types"
import { generateId, generateRandomColor } from "@/lib/utils"

const DEFAULT_SETTINGS: Settings = {
	tableCount: 10,
	defaultChairCount: 10,
	groupColors: [],
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
			settings: DEFAULT_SETTINGS,
			duplicates: [],

			// Guest actions
			addGuest: (guestData) => {
				const id = generateId()
				const state = get()

				// Create main guest
				const mainGuest: Guest = {
					...guestData,
					id,
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
							group: guestData.group,
							subgroupId,
							isMainGuest: false,
							parentGuestId: id,
						})
					}

					newGuests.push(...partyMembers)

					// Create subgroup
					const subgroup: Subgroup = {
						id: subgroupId,
						name: `${guestData.firstName} ${guestData.lastName}'s Party`,
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

				// Auto-assign color to new group if it doesn't exist
				if (!state.settings.groupColors.find((gc) => gc.group === guestData.group)) {
					get().updateGroupColor(guestData.group, generateRandomColor())
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
						newDuplicates.push({
							id: generateId(),
							firstName: guestData.firstName,
							lastName: guestData.lastName,
							group: guestData.group,
						})
						// Still import but mark as duplicate
					}

					const id = generateId()
					const mainGuest: Guest = {
						...guestData,
						id,
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
								group: guestData.group,
								subgroupId,
								isMainGuest: false,
								parentGuestId: id,
							})
						}

						newGuests.push(...partyMembers)

						// Create subgroup
						newSubgroups.push({
							id: subgroupId,
							name: `${guestData.firstName} ${guestData.lastName}'s Party`,
							guestIds: [id, ...partyMembers.map((g) => g.id)],
						})

						// Update main guest with subgroup
						mainGuest.subgroupId = subgroupId
					}

					// Auto-assign color to new group if it doesn't exist
					if (!state.settings.groupColors.find((gc) => gc.group === guestData.group)) {
						state.updateGroupColor(guestData.group, generateRandomColor())
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
					const guestToRemove = state.guests.find(
						(g) =>
							g.firstName === duplicate.firstName &&
							g.lastName === duplicate.lastName &&
							g.group === duplicate.group,
					)

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

			updateGroupColor: (group, color) => {
				const state = get()
				const existingColorIndex = state.settings.groupColors.findIndex(
					(gc) => gc.group === group,
				)

				if (existingColorIndex !== -1) {
					const updatedColors = [...state.settings.groupColors]
					updatedColors[existingColorIndex] = { group, color }
					set({
						settings: { ...state.settings, groupColors: updatedColors },
					})
				} else {
					set({
						settings: {
							...state.settings,
							groupColors: [...state.settings.groupColors, { group, color }],
						},
					})
				}
			},

			// Utility actions
			autoAssign: () => {
				// Implementation in auto-assign.ts
				const state = get()
				const { autoAssignGuests } = require("@/lib/auto-assign")
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
					settings: DEFAULT_SETTINGS,
					duplicates: [],
				})
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
		},
	),
)

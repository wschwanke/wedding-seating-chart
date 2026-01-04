export interface Guest {
	id: string
	firstName: string
	lastName: string
	partySize: number
	group: string
	subgroupId?: string
	isMainGuest: boolean // True if this is the primary person, false if "+1"
	parentGuestId?: string // For "+1" guests, reference to main guest
}

export interface Subgroup {
	id: string
	name: string
	guestIds: string[]
}

export interface Table {
	id: string
	name: string
	chairCount: number
	seats: (string | null)[] // Array of guest IDs or null for empty seats
}

export interface GroupColor {
	group: string
	color: string
}

export interface Settings {
	tableCount: number
	defaultChairCount: number
	groupColors: GroupColor[]
}

export interface DuplicateGuest {
	id: string
	firstName: string
	lastName: string
	group: string
}

export interface GuestAssignment {
	guestId: string
	tableId: string
	tableName: string
	seatIndex: number
}

export interface SeatingStore {
	guests: Guest[]
	subgroups: Subgroup[]
	tables: Table[]
	settings: Settings
	duplicates: DuplicateGuest[]

	// Guest actions
	addGuest: (guest: Omit<Guest, "id" | "isMainGuest" | "parentGuestId">) => string
	updateGuest: (id: string, updates: Partial<Guest>) => void
	deleteGuest: (id: string) => void
	importGuests: (guests: Omit<Guest, "id" | "isMainGuest" | "parentGuestId">[]) => void
	resolveDuplicate: (duplicateId: string, action: "keep" | "remove") => void

	// Subgroup actions
	createSubgroup: (name: string, guestIds: string[]) => void
	updateSubgroup: (id: string, name: string) => void
	deleteSubgroup: (id: string) => void
	addToSubgroup: (subgroupId: string, guestId: string) => void
	removeFromSubgroup: (subgroupId: string, guestId: string) => void

	// Table actions
	assignToSeat: (guestId: string, tableId: string, seatIndex: number) => void
	unassignGuest: (guestId: string) => void
	moveSubgroup: (subgroupId: string, tableId: string, startSeatIndex: number) => void
	updateTableName: (tableId: string, name: string) => void
	updateTableChairCount: (tableId: string, chairCount: number) => void

	// Settings actions
	updateSettings: (settings: Partial<Settings>) => void
	updateGroupColor: (group: string, color: string) => void

	// Utility actions
	autoAssign: () => void
	clearAll: () => void
	getUnassignedGuests: () => Guest[]
	getAssignedGuests: () => Array<{ guest: Guest; assignment: GuestAssignment }>
	getGuestAssignment: (guestId: string) => GuestAssignment | null
	getGuestsBySubgroup: (subgroupId: string) => Guest[]
	isTableOverCapacity: (tableId: string) => boolean
}

export interface CSVRow {
	"first name": string
	"last name": string
	"party size": string
	"relationship or group": string
}

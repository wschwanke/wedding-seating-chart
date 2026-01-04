export interface Relationship {
	id: string
	name: string
	color: string
}

export interface Guest {
	id: string
	firstName: string
	lastName: string
	partySize: number
	party: string // Auto-generated party name (e.g., "John Smith's Party")
	relationshipId: string // Reference to Relationship by ID
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

export interface Settings {
	tableCount: number
	defaultChairCount: number
}

export interface DuplicateGuest {
	id: string
	firstName: string
	lastName: string
	relationship: string
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
	relationships: Relationship[]
	settings: Settings
	duplicates: DuplicateGuest[]

	// Guest actions
	addGuest: (guest: Omit<Guest, "id" | "isMainGuest" | "parentGuestId" | "party"> & { party?: string }) => string
	updateGuest: (id: string, updates: Partial<Guest>) => void
	deleteGuest: (id: string) => void
	importGuests: (guests: (Omit<Guest, "id" | "isMainGuest" | "parentGuestId" | "party"> & { party?: string })[]) => void
	resolveDuplicate: (duplicateId: string, action: "keep" | "remove") => void

	// Relationship actions
	addRelationship: (name: string, color?: string) => string
	updateRelationship: (id: string, updates: Partial<Omit<Relationship, "id">>) => void
	deleteRelationship: (id: string) => boolean

	// Subgroup/Party actions
	createSubgroup: (name: string, guestIds: string[]) => void
	updateSubgroup: (id: string, name: string) => void
	deleteSubgroup: (id: string) => void
	addToSubgroup: (subgroupId: string, guestId: string) => void
	removeFromSubgroup: (subgroupId: string, guestId: string) => void
	createParty: (name: string, relationshipId: string) => string
	deleteParty: (subgroupId: string, deleteGuests: boolean) => void
	
	// Guest party management
	updateGuestParty: (guestId: string, newSubgroupId: string | null) => void
	addGuestToParty: (subgroupId: string) => string

	// Table actions
	assignToSeat: (guestId: string, tableId: string, seatIndex: number) => void
	unassignGuest: (guestId: string) => void
	moveSubgroup: (subgroupId: string, tableId: string, startSeatIndex: number) => void
	updateTableName: (tableId: string, name: string) => void
	updateTableChairCount: (tableId: string, chairCount: number) => void

	// Settings actions
	updateSettings: (settings: Partial<Settings>) => void

	// Utility actions
	autoAssign: () => void
	clearAll: () => void
	clearAllSeats: () => void
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
	"relationship": string
}

import { useSeatingStore } from "./useSeatingStore"
import { useMemo } from "react"

/**
 * Stable selector for looking up a relationship by ID
 * Memoized to prevent unnecessary re-renders in child components
 */
export function useRelationship(relationshipId: string | undefined) {
	const relationships = useSeatingStore((state) => state.relationships)
	return useMemo(() => {
		if (!relationshipId) return undefined
		return relationships.find((r) => r.id === relationshipId)
	}, [relationships, relationshipId])
}

/**
 * Stable selector for getting relationship color
 * Returns a fallback color if relationship not found
 */
export function useRelationshipColor(relationshipId: string | undefined): string {
	const relationships = useSeatingStore((state) => state.relationships)
	return useMemo(() => {
		if (!relationshipId) return "#888"
		return relationships.find((r) => r.id === relationshipId)?.color || "#888"
	}, [relationships, relationshipId])
}

/**
 * Stable selector for getting a guest by ID
 */
export function useGuest(guestId: string | undefined) {
	const guests = useSeatingStore((state) => state.guests)
	return useMemo(() => {
		if (!guestId) return undefined
		return guests.find((g) => g.id === guestId)
	}, [guests, guestId])
}

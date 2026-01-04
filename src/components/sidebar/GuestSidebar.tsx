import { useState, useMemo, useCallback, memo } from "react"
import { Plus, Users, AlertCircle, Wand2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GuestCard } from "@/components/guests/GuestCard"
import { GuestForm } from "@/components/guests/GuestForm"
import { CsvImport } from "@/components/guests/CsvImport"
import { useSeatingStore } from "@/stores/useSeatingStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronRight } from "lucide-react"
import { useDraggable } from "@dnd-kit/core"
import type { Guest, Subgroup, GuestAssignment } from "@/types"
import { cn } from "@/lib/utils"

interface PartyHeaderProps {
	subgroup: Subgroup
	guests: Guest[]
	relationshipColor: string
	isExpanded: boolean
	onToggle: () => void
	onEditGuest: (guest: Guest) => void
	assignments?: Array<{ guest: Guest; assignment: GuestAssignment }>
}

const PartyHeader = memo(function PartyHeader({ 
	subgroup, 
	guests, 
	relationshipColor, 
	isExpanded, 
	onToggle, 
	onEditGuest,
	assignments 
}: PartyHeaderProps) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `party-${subgroup.id}`,
		data: {
			type: 'party',
			subgroup,
			guests
		}
	})

	return (
		<div className="space-y-2">
			<div
				ref={setNodeRef}
				{...attributes}
				{...listeners}
				className={cn(
					"flex items-center gap-2 w-full text-left text-sm font-medium transition-colors select-none",
					"cursor-grab active:cursor-grabbing",
					isDragging && "opacity-50"
				)}
			>
				<GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
				<button
					type="button"
					onClick={onToggle}
					className="flex items-center gap-2 flex-1 hover:text-primary transition-colors cursor-pointer"
				>
					{isExpanded ? (
						<ChevronDown className="h-4 w-4" />
					) : (
						<ChevronRight className="h-4 w-4" />
					)}
					<Users className="h-4 w-4" />
					{subgroup.name}
					<span className="text-muted-foreground font-normal">
						({guests.length})
					</span>
				</button>
			</div>
			{isExpanded && (
				<div className="ml-6 space-y-2">
					{assignments ? (
						// Assigned guests with assignment info
						assignments.map(({ guest, assignment }) => (
							<GuestCard
								key={guest.id}
								guest={guest}
								color={relationshipColor}
								onEdit={() => onEditGuest(guest)}
								assignment={assignment}
							/>
						))
					) : (
						// Unassigned guests
						guests.map((guest) => (
							<GuestCard
								key={guest.id}
								guest={guest}
								color={relationshipColor}
								onEdit={() => onEditGuest(guest)}
							/>
						))
					)}
				</div>
			)}
		</div>
	)
})

export function GuestSidebar() {
	const [guestFormOpen, setGuestFormOpen] = useState(false)
	const [editingGuest, setEditingGuest] = useState<Guest | undefined>()

	const guests = useSeatingStore((state) => state.guests)
	const subgroups = useSeatingStore((state) => state.subgroups)
	const duplicates = useSeatingStore((state) => state.duplicates)
	const tables = useSeatingStore((state) => state.tables) // Subscribe to trigger re-render on seat changes
	const relationships = useSeatingStore((state) => state.relationships)
	const updateRelationship = useSeatingStore((state) => state.updateRelationship)
	const resolveDuplicate = useSeatingStore((state) => state.resolveDuplicate)
	const getUnassignedGuests = useSeatingStore((state) => state.getUnassignedGuests)
	const getAssignedGuests = useSeatingStore((state) => state.getAssignedGuests)
	const autoAssign = useSeatingStore((state) => state.autoAssign)

	// Memoize expensive guest computations - only recalculate when data changes
	const unassignedGuests = useMemo(() => 
		tables && getUnassignedGuests(),
		[tables, getUnassignedGuests]
	)
	
	const assignedGuestsData = useMemo(() => 
		tables && getAssignedGuests(),
		[tables, getAssignedGuests]
	)

	// Get unique relationships from guests (needed for initial expansion state)
	const uniqueRelationshipIds = useMemo(() => 
		Array.from(new Set(guests.map((g) => g.relationshipId))),
		[guests]
	)
	
	const uniqueRelationships = useMemo(() => 
		relationships.filter((r) => uniqueRelationshipIds.includes(r.id)),
		[relationships, uniqueRelationshipIds]
	)

	// Track expanded state for relationships and subgroups/parties
	// Separate states for unassigned (expanded by default) and assigned (collapsed by default)
	const [expandedUnassignedRelationships, setExpandedUnassignedRelationships] = useState<Set<string>>(() => {
		// Start with all relationships expanded in unassigned section
		return new Set(uniqueRelationshipIds)
	})
	const [expandedAssignedRelationships, setExpandedAssignedRelationships] = useState<Set<string>>(new Set())
	const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set())

	const toggleUnassignedRelationship = useCallback((relationship: string): void => {
		setExpandedUnassignedRelationships((prev) => {
			const next = new Set(prev)
			if (next.has(relationship)) {
				next.delete(relationship)
			} else {
				next.add(relationship)
			}
			return next
		})
	}, [])

	const toggleAssignedRelationship = useCallback((relationship: string): void => {
		setExpandedAssignedRelationships((prev) => {
			const next = new Set(prev)
			if (next.has(relationship)) {
				next.delete(relationship)
			} else {
				next.add(relationship)
			}
			return next
		})
	}, [])

	const toggleSubgroup = useCallback((subgroupId: string): void => {
		setExpandedSubgroups((prev) => {
			const next = new Set(prev)
			if (next.has(subgroupId)) {
				next.delete(subgroupId)
			} else {
				next.add(subgroupId)
			}
			return next
		})
	}, [])

	const handleEditGuest = useCallback((guest: Guest): void => {
		setEditingGuest(guest)
		setGuestFormOpen(true)
	}, [])

	const handleAddGuest = useCallback((): void => {
		setEditingGuest(undefined)
		setGuestFormOpen(true)
	}, [])

	// Helper to organize guests by relationship -> party -> guests hierarchy
	// Memoized to prevent recalculation on every render
	const organizeGuestsByRelationship = useCallback((guestList: Guest[]) => {
		const relationshipMap = new Map<string, {
			parties: Map<string, { subgroup: Subgroup; guests: Guest[] }>,
			soloGuests: Guest[]
		}>()

		// Initialize map for each relationship
		const relationshipIds = Array.from(new Set(guestList.map(g => g.relationshipId)))
		relationshipIds.forEach(relId => {
			relationshipMap.set(relId, {
				parties: new Map(),
				soloGuests: []
			})
		})

		// Organize guests
		guestList.forEach(guest => {
			const relData = relationshipMap.get(guest.relationshipId)
			if (!relData) return

			if (guest.subgroupId) {
				// Guest belongs to a party
				const subgroup = subgroups.find(sg => sg.id === guest.subgroupId)
				if (subgroup) {
					if (!relData.parties.has(subgroup.id)) {
						relData.parties.set(subgroup.id, { subgroup, guests: [] })
					}
					relData.parties.get(subgroup.id)!.guests.push(guest)
				}
			} else {
				// Solo guest (partySize = 1, no subgroup)
				relData.soloGuests.push(guest)
			}
		})

		return relationshipMap
	}, [subgroups])

	const unassignedByRelationship = useMemo(() => 
		organizeGuestsByRelationship(unassignedGuests),
		[unassignedGuests, organizeGuestsByRelationship]
	)
	
	// For assigned guests, we need to include assignment data
	// Memoized to prevent recalculation on every render
	const organizeAssignedByRelationship = useCallback(() => {
		const relationshipMap = new Map<string, {
			parties: Map<string, { subgroup: Subgroup; guestsData: Array<{ guest: Guest; assignment: GuestAssignment }> }>,
			soloGuestsData: Array<{ guest: Guest; assignment: GuestAssignment }>
		}>()

		const relationshipIds = Array.from(new Set(assignedGuestsData.map(d => d.guest.relationshipId)))
		relationshipIds.forEach(relId => {
			relationshipMap.set(relId, {
				parties: new Map(),
				soloGuestsData: []
			})
		})

		assignedGuestsData.forEach(data => {
			const relData = relationshipMap.get(data.guest.relationshipId)
			if (!relData) return

			if (data.guest.subgroupId) {
				const subgroup = subgroups.find(sg => sg.id === data.guest.subgroupId)
				if (subgroup) {
					if (!relData.parties.has(subgroup.id)) {
						relData.parties.set(subgroup.id, { subgroup, guestsData: [] })
					}
					relData.parties.get(subgroup.id)!.guestsData.push(data)
				}
			} else {
				relData.soloGuestsData.push(data)
			}
		})

		return relationshipMap
	}, [assignedGuestsData, subgroups])

	const assignedByRelationship = useMemo(() => 
		organizeAssignedByRelationship(),
		[organizeAssignedByRelationship]
	)

	return (
		<div className="w-[408px] border-r bg-muted/20 flex flex-col h-full">
			<div className="p-4 border-b space-y-2">
				<h2 className="text-lg font-semibold">Guests</h2>
				<CsvImport />
				<Button onClick={handleAddGuest} size="sm" className="w-full">
					<Plus className="h-4 w-4 mr-2" />
					Add Guest
				</Button>
				<Button
					onClick={autoAssign}
					size="sm"
					variant="secondary"
					className="w-full"
				>
					<Wand2 className="h-4 w-4 mr-2" />
					Auto Assign
				</Button>
			</div>

			<Tabs defaultValue="all" className="flex-1 flex flex-col overflow-hidden">
				<TabsList className="mx-4 mt-2">
					<TabsTrigger value="all" className="flex-1">
						All Guests
					</TabsTrigger>
					<TabsTrigger value="groups" className="flex-1">
						Groups
					</TabsTrigger>
				</TabsList>

				<TabsContent value="all" className="flex-1 overflow-hidden mt-2">
					{duplicates.length > 0 && (
						<div className="px-4 pb-2">
							<Card className="border-destructive">
								<CardHeader className="pb-3">
									<CardTitle className="text-sm flex items-center gap-2">
										<AlertCircle className="h-4 w-4" />
										Duplicates Detected
									</CardTitle>
									<CardDescription className="text-xs">
										{duplicates.length} potential duplicate(s) found
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{duplicates.map((dup) => (
										<div
											key={dup.id}
											className="flex items-center justify-between text-sm"
										>
											<span>
												{dup.firstName} {dup.lastName}
											</span>
											<div className="flex gap-1">
												<Button
													size="sm"
													variant="outline"
													onClick={() => resolveDuplicate(dup.id, "keep")}
												>
													Keep
												</Button>
												<Button
													size="sm"
													variant="destructive"
													onClick={() => resolveDuplicate(dup.id, "remove")}
												>
													Remove
												</Button>
											</div>
										</div>
									))}
								</CardContent>
							</Card>
						</div>
					)}

					<ScrollArea className="flex-1">
						<div className="px-4 space-y-4 pb-4">
							{/* UNASSIGNED SECTION */}
							<div className="space-y-2">
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
									Unassigned ({unassignedGuests.length})
								</h3>
								{unassignedGuests.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										All guests are assigned
									</p>
								) : (
									<div className="space-y-3">
										{/* Group by Relationship */}
										{Array.from(unassignedByRelationship.entries()).map(([relationshipId, relData]) => {
											const totalGuests = relData.soloGuests.length + 
												Array.from(relData.parties.values()).reduce((sum, party) => sum + party.guests.length, 0)
											
											if (totalGuests === 0) return null

											const relationship = relationships.find(r => r.id === relationshipId)
											if (!relationship) return null

											const isRelExpanded = expandedUnassignedRelationships.has(relationshipId)
											const relationshipColor = relationship.color

											return (
												<div key={relationshipId} className="space-y-2">
													{/* Relationship Header */}
								<button
									type="button"
									onClick={() => toggleUnassignedRelationship(relationshipId)}
									className="flex items-center gap-2 w-full text-left text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
								>
														{isRelExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
														<div 
															className="h-3 w-3 rounded-full border-2" 
															style={{ backgroundColor: relationshipColor, borderColor: relationshipColor }}
														/>
														{relationship.name}
														<span className="text-muted-foreground font-normal">
															({totalGuests})
														</span>
													</button>

													{isRelExpanded && (
														<div className="ml-5 space-y-2">
															{/* Parties within this relationship */}
															{Array.from(relData.parties.values()).map(({ subgroup, guests: partyGuests }) => {
																return <PartyHeader
																key={subgroup.id}
																subgroup={subgroup}
																guests={partyGuests}
																relationshipColor={relationshipColor}
																isExpanded={expandedSubgroups.has(subgroup.id)}
																onToggle={() => toggleSubgroup(subgroup.id)}
																onEditGuest={handleEditGuest}
															/>
														})}

															{/* Solo guests (partySize = 1) */}
															{relData.soloGuests.map((guest) => (
																<GuestCard
																	key={guest.id}
																	guest={guest}
																	color={relationshipColor}
																	onEdit={() => handleEditGuest(guest)}
																/>
															))}
														</div>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>

							{/* ASSIGNED SECTION */}
							<div className="space-y-2 pt-2 border-t">
								<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
									Assigned ({assignedGuestsData.length})
								</h3>
								{assignedGuestsData.length === 0 ? (
									<p className="text-sm text-muted-foreground text-center py-4">
										No guests assigned yet
									</p>
								) : (
									<div className="space-y-3">
										{/* Group by Relationship */}
										{Array.from(assignedByRelationship.entries()).map(([relationshipId, relData]) => {
											const totalGuests = relData.soloGuestsData.length + 
												Array.from(relData.parties.values()).reduce((sum, party) => sum + party.guestsData.length, 0)
											
											if (totalGuests === 0) return null

											const relationship = relationships.find(r => r.id === relationshipId)
											if (!relationship) return null

											const isRelExpanded = expandedAssignedRelationships.has(relationshipId)
											const relationshipColor = relationship.color

											return (
												<div key={relationshipId} className="space-y-2">
													{/* Relationship Header */}
									<button
										type="button"
										onClick={() => toggleAssignedRelationship(relationshipId)}
										className="flex items-center gap-2 w-full text-left text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
									>
														{isRelExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
														<div 
															className="h-3 w-3 rounded-full border-2" 
															style={{ backgroundColor: relationshipColor, borderColor: relationshipColor }}
														/>
														{relationship.name}
														<span className="text-muted-foreground font-normal">
															({totalGuests})
														</span>
													</button>

													{isRelExpanded && (
														<div className="ml-5 space-y-2">
														{/* Parties within this relationship */}
														{Array.from(relData.parties.values()).map(({ subgroup, guestsData }) => {
															const guests = guestsData.map(d => d.guest)
															const assignments = guestsData.map(d => ({ guest: d.guest, assignment: d.assignment }))
															
															return <PartyHeader 
																key={subgroup.id}
																subgroup={subgroup}
																guests={guests}
																relationshipColor={relationshipColor}
																isExpanded={expandedSubgroups.has(subgroup.id)}
																onToggle={() => toggleSubgroup(subgroup.id)}
																onEditGuest={handleEditGuest}
																assignments={assignments}
															/>
														})}

															{/* Solo guests (partySize = 1) */}
															{relData.soloGuestsData.map(({ guest, assignment }) => (
																<GuestCard
																	key={guest.id}
																	guest={guest}
																	color={relationshipColor}
																	onEdit={() => handleEditGuest(guest)}
																	assignment={assignment}
																/>
															))}
														</div>
													)}
												</div>
											)
										})}
									</div>
								)}
							</div>
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="groups" className="flex-1 overflow-hidden mt-2">
					<ScrollArea className="h-full">
						<div className="px-4 space-y-3 pb-4">
							{uniqueRelationships.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No relationships yet
								</p>
							) : (
								uniqueRelationships.map((relationship) => {
									const relationshipGuests = guests.filter((g) => g.relationshipId === relationship.id)

									return (
										<div key={relationship.id} className="space-y-2">
											<div className="flex items-center gap-2">
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="h-6 w-6 rounded border-2 cursor-pointer hover:scale-110 transition-transform"
															style={{ backgroundColor: relationship.color }}
														/>
													</PopoverTrigger>
													<PopoverContent className="w-64">
														<div className="space-y-2">
															<Label htmlFor={`color-${relationship.id}`}>Color for "{relationship.name}"</Label>
															<Input
																id={`color-${relationship.id}`}
																type="color"
																value={relationship.color}
																onChange={(e) =>
																	updateRelationship(relationship.id, { color: e.target.value })
																}
															/>
														</div>
													</PopoverContent>
												</Popover>
												<span className="font-medium">{relationship.name}</span>
												<span className="text-sm text-muted-foreground">
													({relationshipGuests.length})
												</span>
											</div>
										</div>
									)
								})
							)}
						</div>
					</ScrollArea>
				</TabsContent>
			</Tabs>

			<GuestForm
				open={guestFormOpen}
				onOpenChange={setGuestFormOpen}
				guest={editingGuest}
			/>
		</div>
	)
}

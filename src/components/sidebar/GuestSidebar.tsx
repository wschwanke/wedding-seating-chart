import { useState } from "react"
import { Plus, Users, AlertCircle, Wand2 } from "lucide-react"
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
import type { Guest } from "@/types"

export function GuestSidebar() {
	const [guestFormOpen, setGuestFormOpen] = useState(false)
	const [editingGuest, setEditingGuest] = useState<Guest | undefined>()

	const guests = useSeatingStore((state) => state.guests)
	const subgroups = useSeatingStore((state) => state.subgroups)
	const duplicates = useSeatingStore((state) => state.duplicates)
	const groupColors = useSeatingStore((state) => state.settings.groupColors)
	const updateGroupColor = useSeatingStore((state) => state.updateGroupColor)
	const resolveDuplicate = useSeatingStore((state) => state.resolveDuplicate)
	const getUnassignedGuests = useSeatingStore((state) => state.getUnassignedGuests)
	const autoAssign = useSeatingStore((state) => state.autoAssign)

	const unassignedGuests = getUnassignedGuests()

	// Group unassigned guests by subgroup
	const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(new Set())

	const toggleSubgroup = (subgroupId: string): void => {
		setExpandedSubgroups((prev) => {
			const next = new Set(prev)
			if (next.has(subgroupId)) {
				next.delete(subgroupId)
			} else {
				next.add(subgroupId)
			}
			return next
		})
	}

	const handleEditGuest = (guest: Guest): void => {
		setEditingGuest(guest)
		setGuestFormOpen(true)
	}

	const handleAddGuest = (): void => {
		setEditingGuest(undefined)
		setGuestFormOpen(true)
	}

	const getGuestColor = (guest: Guest): string => {
		return groupColors.find((gc) => gc.group === guest.group)?.color || "#888"
	}

	// Get unique groups
	const uniqueGroups = Array.from(new Set(guests.map((g) => g.group)))

	// Organize unassigned guests
	const unassignedSubgroups = subgroups.filter((sg) =>
		sg.guestIds.some((gid) => unassignedGuests.find((g) => g.id === gid)),
	)

	const unassignedWithoutSubgroup = unassignedGuests.filter((g) => !g.subgroupId)

	return (
		<div className="w-80 border-r bg-muted/20 flex flex-col h-full">
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

			<Tabs defaultValue="unassigned" className="flex-1 flex flex-col overflow-hidden">
				<TabsList className="mx-4 mt-2">
					<TabsTrigger value="unassigned" className="flex-1">
						Unassigned ({unassignedGuests.length})
					</TabsTrigger>
					<TabsTrigger value="groups" className="flex-1">
						Groups
					</TabsTrigger>
				</TabsList>

				<TabsContent value="unassigned" className="flex-1 overflow-hidden mt-2">
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
						<div className="px-4 space-y-2 pb-4">
							{unassignedGuests.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									All guests are assigned to tables
								</p>
							) : (
								<>
									{/* Subgroups */}
									{unassignedSubgroups.map((subgroup) => {
										const subgroupGuests = unassignedGuests.filter((g) =>
											subgroup.guestIds.includes(g.id),
										)
										if (subgroupGuests.length === 0) return null

										const isExpanded = expandedSubgroups.has(subgroup.id)

										return (
											<div key={subgroup.id} className="space-y-2">
												<button
													type="button"
													onClick={() => toggleSubgroup(subgroup.id)}
													className="flex items-center gap-2 w-full text-left text-sm font-medium hover:text-primary transition-colors"
												>
													{isExpanded ? (
														<ChevronDown className="h-4 w-4" />
													) : (
														<ChevronRight className="h-4 w-4" />
													)}
													<Users className="h-4 w-4" />
													{subgroup.name}
													<span className="text-muted-foreground">
														({subgroupGuests.length})
													</span>
												</button>
												{isExpanded && (
													<div className="ml-6 space-y-2">
														{subgroupGuests.map((guest) => (
															<GuestCard
																key={guest.id}
																guest={guest}
																color={getGuestColor(guest)}
																onEdit={() => handleEditGuest(guest)}
															/>
														))}
													</div>
												)}
											</div>
										)
									})}

									{/* Individual guests without subgroup */}
									{unassignedWithoutSubgroup.map((guest) => (
										<GuestCard
											key={guest.id}
											guest={guest}
											color={getGuestColor(guest)}
											onEdit={() => handleEditGuest(guest)}
										/>
									))}
								</>
							)}
						</div>
					</ScrollArea>
				</TabsContent>

				<TabsContent value="groups" className="flex-1 overflow-hidden mt-2">
					<ScrollArea className="h-full">
						<div className="px-4 space-y-3 pb-4">
							{uniqueGroups.length === 0 ? (
								<p className="text-sm text-muted-foreground text-center py-8">
									No groups yet
								</p>
							) : (
								uniqueGroups.map((group) => {
									const color =
										groupColors.find((gc) => gc.group === group)?.color || "#888"
									const groupGuests = guests.filter((g) => g.group === group)

									return (
										<div key={group} className="space-y-2">
											<div className="flex items-center gap-2">
												<Popover>
													<PopoverTrigger asChild>
														<button
															type="button"
															className="h-6 w-6 rounded border-2 cursor-pointer hover:scale-110 transition-transform"
															style={{ backgroundColor: color }}
														/>
													</PopoverTrigger>
													<PopoverContent className="w-64">
														<div className="space-y-2">
															<Label>Color for "{group}"</Label>
															<Input
																type="color"
																value={color}
																onChange={(e) =>
																	updateGroupColor(group, e.target.value)
																}
															/>
														</div>
													</PopoverContent>
												</Popover>
												<span className="font-medium">{group}</span>
												<span className="text-sm text-muted-foreground">
													({groupGuests.length})
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

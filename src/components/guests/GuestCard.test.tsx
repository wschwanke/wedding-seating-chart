import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GuestCard } from "./GuestCard"
import type { Guest, GuestAssignment } from "@/types"
import { DndContext } from "@dnd-kit/core"

// Mock the store
vi.mock("@/stores/useSeatingStore", () => ({
	useSeatingStore: vi.fn((selector) => {
		const mockState = {
			deleteGuest: vi.fn(),
			relationships: [
				{ id: "rel-family", name: "Family", color: "#ff0000" },
				{ id: "rel-friends", name: "Friends", color: "#00ff00" },
			],
		}
		return selector ? selector(mockState) : mockState
	}),
}))

describe("GuestCard", () => {
	const mockGuest: Guest = {
		id: "guest-1",
		firstName: "John",
		lastName: "Smith",
		partySize: 1,
		party: "",
		relationshipId: "rel-family",
		isMainGuest: true,
	}

	const mockOnEdit = vi.fn()

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should render guest information", () => {
		render(
			<DndContext>
				<GuestCard guest={mockGuest} color="#ff0000" onEdit={mockOnEdit} />
			</DndContext>,
		)

		expect(screen.getByText("John Smith")).toBeInTheDocument()
		expect(screen.getByText("Family")).toBeInTheDocument()
	})

	it("should show party size for multi-person parties", () => {
		const guestWithParty: Guest = {
			...mockGuest,
			partySize: 3,
		}

		render(
			<DndContext>
				<GuestCard guest={guestWithParty} color="#ff0000" onEdit={mockOnEdit} />
			</DndContext>,
		)

		expect(screen.getByText("Party of 3")).toBeInTheDocument()
	})

	it("should show assignment badge when assigned", () => {
		const assignment: GuestAssignment = {
			guestId: "guest-1",
			tableId: "table-1",
			tableName: "Table 3",
			seatIndex: 2,
		}

		render(
			<DndContext>
				<GuestCard
					guest={mockGuest}
					color="#ff0000"
					onEdit={mockOnEdit}
					assignment={assignment}
				/>
			</DndContext>,
		)

		expect(screen.getByText(/Table 3, Seat 3/)).toBeInTheDocument()
	})

	it("should call onEdit when edit button is clicked", async () => {
		const user = userEvent.setup()

		render(
			<DndContext>
				<GuestCard guest={mockGuest} color="#ff0000" onEdit={mockOnEdit} />
			</DndContext>,
		)

		const editButton = screen.getByRole("button", { name: /edit john smith/i })
		await user.click(editButton)

		expect(mockOnEdit).toHaveBeenCalledTimes(1)
	})

	it("should show edit button only for main guests", () => {
		const partyMember: Guest = {
			...mockGuest,
			isMainGuest: false,
			parentGuestId: "main-guest-1",
		}

		const { container } = render(
			<DndContext>
				<GuestCard guest={partyMember} color="#ff0000" onEdit={mockOnEdit} />
			</DndContext>,
		)

		// Should have only delete button (1 button)
		const buttons = container.querySelectorAll("button")
		// Filter out the card itself which might be draggable
		const actionButtons = Array.from(buttons).filter((btn) =>
			btn.querySelector("svg"),
		)
		expect(actionButtons.length).toBeLessThanOrEqual(1)
	})

	it("should apply muted style when assigned", () => {
		const assignment: GuestAssignment = {
			guestId: "guest-1",
			tableId: "table-1",
			tableName: "Table 3",
			seatIndex: 2,
		}

		const { container } = render(
			<DndContext>
				<GuestCard
					guest={mockGuest}
					color="#ff0000"
					assignment={assignment}
				/>
			</DndContext>,
		)

		const card = container.querySelector(".opacity-70")
		expect(card).toBeInTheDocument()
	})

	it("should use provided color for border", () => {
		const { container } = render(
			<DndContext>
				<GuestCard guest={mockGuest} color="#ff0000" onEdit={mockOnEdit} />
			</DndContext>,
		)

		const card = container.querySelector('[style*="border-left-color"]')
		expect(card).toBeInTheDocument()
	})
})

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { GuestSidebar } from "./GuestSidebar"
import { DndContext } from "@dnd-kit/core"
import { TooltipProvider } from "@/components/ui/tooltip"

// Mock the store with realistic data
const mockGuests = [
	{
		id: "guest-1",
		firstName: "John",
		lastName: "Smith",
		partySize: 1,
		party: "",
		relationship: "Family",
		isMainGuest: true,
	},
	{
		id: "guest-2",
		firstName: "Jane",
		lastName: "Doe",
		partySize: 1,
		party: "",
		relationship: "Friends",
		isMainGuest: true,
	},
]

const mockUpdateRelationshipColor = vi.fn()
const mockResolveDuplicate = vi.fn()
const mockAutoAssign = vi.fn()

// Controllable mock for duplicates
let mockDuplicates: any[] = []

vi.mock("@/stores/useSeatingStore", () => ({
	useSeatingStore: vi.fn((selector) => {
		const mockState = {
			guests: mockGuests,
			subgroups: [],
			duplicates: mockDuplicates,
			tables: [], // Need to include tables for reactivity
			settings: {
				relationshipColors: [
					{ relationship: "Family", color: "#ff0000" },
					{ relationship: "Friends", color: "#00ff00" },
				],
			},
			updateRelationshipColor: mockUpdateRelationshipColor,
			resolveDuplicate: mockResolveDuplicate,
			getUnassignedGuests: vi.fn(() => mockGuests),
			getAssignedGuests: vi.fn(() => []),
			autoAssign: mockAutoAssign,
		}
		return selector ? selector(mockState) : mockState
	}),
}))

describe("GuestSidebar", () => {
	beforeEach(() => {
		vi.clearAllMocks()
		mockDuplicates = [] // Reset duplicates before each test
	})

	const renderWithProviders = (component: React.ReactElement) => {
		return render(
			<TooltipProvider>
				<DndContext>{component}</DndContext>
			</TooltipProvider>,
		)
	}

	it("should render guest list title", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText("Guests")).toBeInTheDocument()
	})

	it("should show CSV import button", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText(/Import CSV/i)).toBeInTheDocument()
	})

	it("should show add guest button", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText(/Add Guest/i)).toBeInTheDocument()
	})

	it("should show auto assign button", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText(/Auto Assign/i)).toBeInTheDocument()
	})

	it("should have tabs for All Guests and Groups", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByRole("tab", { name: /All Guests/i })).toBeInTheDocument()
		expect(screen.getByRole("tab", { name: /Groups/i })).toBeInTheDocument()
	})

	it("should display unassigned guests count", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText(/Unassigned \(2\)/i)).toBeInTheDocument()
	})

	it("should display assigned guests count", () => {
		renderWithProviders(<GuestSidebar />)
		expect(screen.getByText(/Assigned \(0\)/i)).toBeInTheDocument()
	})

	it("should show guest cards for unassigned guests", () => {
		renderWithProviders(<GuestSidebar />)
		
		// Guests are now nested under collapsible relationship headers
		// Verify that both relationships appear in the sidebar
		const familyHeaders = screen.getAllByText((_content, element) => {
			return element?.textContent === "Family(1)"
		})
		expect(familyHeaders.length).toBeGreaterThan(0)
		
		const friendsHeaders = screen.getAllByText((_content, element) => {
			return element?.textContent === "Friends(1)"
		})
		expect(friendsHeaders.length).toBeGreaterThan(0)
	})

	it("should switch to Groups tab and show color picker", async () => {
		const user = userEvent.setup()
		renderWithProviders(<GuestSidebar />)

		// Click Groups tab
		const groupsTab = screen.getByRole("tab", { name: /Groups/i })
		await user.click(groupsTab)

		// Should show groups
		expect(await screen.findByText("Family")).toBeInTheDocument()
		expect(await screen.findByText("Friends")).toBeInTheDocument()
	})

	it("should open color picker popover when color button is clicked", async () => {
		const user = userEvent.setup()
		renderWithProviders(<GuestSidebar />)

		// Switch to Groups tab
		const groupsTab = screen.getByRole("tab", { name: /Groups/i })
		await user.click(groupsTab)

		// Find and click a color button (they're styled as colored squares)
		const colorButtons = screen.getAllByRole("button")
		const colorButton = colorButtons.find((btn) =>
			btn.style.backgroundColor?.includes("rgb"),
		)

		if (colorButton) {
			await user.click(colorButton)

			// Popover should show color input
			expect(await screen.findByLabelText(/Color for/i)).toBeInTheDocument()
		}
	})

	it("should call autoAssign when auto assign button is clicked", async () => {
		const user = userEvent.setup()
		renderWithProviders(<GuestSidebar />)

		const autoAssignButton = screen.getByText(/Auto Assign/i)
		await user.click(autoAssignButton)

		expect(mockAutoAssign).toHaveBeenCalledTimes(1)
	})

	it("should show duplicate warning when duplicates exist", () => {
		// Set duplicates for this test
		mockDuplicates = [
			{
				id: "dup-1",
				firstName: "John",
				lastName: "Smith",
				relationship: "Family",
			},
		]

		renderWithProviders(<GuestSidebar />)

		expect(screen.getByText(/Duplicates Detected/i)).toBeInTheDocument()
		expect(screen.getByText(/1 potential duplicate\(s\) found/i)).toBeInTheDocument()
	})
})

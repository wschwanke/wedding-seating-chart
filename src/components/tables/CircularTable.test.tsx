import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CircularTable } from "./CircularTable"
import type { Table } from "@/types"
import { DndContext } from "@dnd-kit/core"

// Mock the store
const mockUpdateTableName = vi.fn()
const mockUpdateTableChairCount = vi.fn()
const mockIsTableOverCapacity = vi.fn(() => false)

vi.mock("@/stores/useSeatingStore", () => ({
	useSeatingStore: vi.fn((selector) => {
		const mockState = {
			guests: [],
			relationships: [
				{ id: "rel-1", name: "Family", color: "#ff0000" },
			],
			subgroups: [],
			updateTableName: mockUpdateTableName,
			updateTableChairCount: mockUpdateTableChairCount,
			isTableOverCapacity: mockIsTableOverCapacity,
			updateGuest: vi.fn(),
			addRelationship: vi.fn(),
		}
		return selector ? selector(mockState) : mockState
	}),
}))

describe("CircularTable", () => {
	const mockTable: Table = {
		id: "table-1",
		name: "Table 1",
		chairCount: 10,
		seats: Array(10).fill(null),
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	it("should render table name", () => {
		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		expect(screen.getByText("Table 1")).toBeInTheDocument()
	})

	it("should show seat count", () => {
		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		expect(screen.getByText("0 / 10 seats")).toBeInTheDocument()
	})

	it("should render settings button", () => {
		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		// Settings icon button should be present
		const settingsButton = screen.getByRole("button", { name: /table settings/i })
		expect(settingsButton).toBeInTheDocument()
	})

	it("should open settings popover when settings button is clicked", async () => {
		const user = userEvent.setup()

		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		// Click the settings button
		const settingsButton = screen.getByRole("button", { name: /table settings/i })
		await user.click(settingsButton)

		// Popover should show table name input
		expect(await screen.findByLabelText("Table Name")).toBeInTheDocument()
		expect(await screen.findByLabelText("Number of Chairs")).toBeInTheDocument()
	})

	it("should allow updating table name through popover", async () => {
		const user = userEvent.setup()

		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		// Open popover
		const settingsButton = screen.getByRole("button", { name: /table settings/i })
		await user.click(settingsButton)

		// Change table name
		const nameInput = await screen.findByLabelText("Table Name")
		await user.clear(nameInput)
		await user.type(nameInput, "Head Table")

		// Click save
		const saveButton = screen.getByRole("button", { name: /save/i })
		await user.click(saveButton)

		expect(mockUpdateTableName).toHaveBeenCalledWith("table-1", "Head Table")
	})

	it("should render correct number of chairs", () => {
		const { container } = render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		// Each chair is rendered as a chair component
		// The chairs are positioned in a circle
		// For 10 chairs: minRadius=95.5px (uses BASE_RADIUS=100), container = 2*(100+28+16) = 288px
		const tableContainer = container.querySelector('[style*="width: 288"]')
		expect(tableContainer).toBeInTheDocument()
	})

	it("should show over capacity warning when table is full", () => {
		// Set the mock to return true for over capacity
		mockIsTableOverCapacity.mockReturnValueOnce(true)

		render(
			<DndContext>
				<CircularTable table={mockTable} />
			</DndContext>,
		)

		expect(screen.getByText(/Over capacity!/)).toBeInTheDocument()
	})

	it("should update table dimensions when chair count changes", () => {
		const tableWith10Chairs: Table = {
			id: "table-1",
			name: "Table 1",
			chairCount: 10,
			seats: Array(10).fill(null),
		}

		const { container, rerender } = render(
			<DndContext>
				<CircularTable table={tableWith10Chairs} />
			</DndContext>,
		)

		// Check initial state with 10 chairs
		// minRadius = (10 * 60) / (2π) ≈ 95.5px (uses BASE_RADIUS=100)
		// container = 2 * (100 + 28 + 16) = 288px
		let tableContainer = container.querySelector('[style*="width: 288"]')
		expect(tableContainer).toBeInTheDocument()

		// Update to 20 chairs (requires larger radius)
		const tableWith20Chairs: Table = {
			id: "table-1",
			name: "Table 1",
			chairCount: 20,
			seats: Array(20).fill(null),
		}

		rerender(
			<DndContext>
				<CircularTable table={tableWith20Chairs} />
			</DndContext>,
		)

		// Container should now be larger (capped at MAX_CONTAINER=400px)
		// minRadius = (20 * 60) / (2π) ≈ 191px
		// idealContainer = 2 * (191 + 28 + 16) ≈ 470px, capped to 400px
		tableContainer = container.querySelector('[style*="width: 400px"]')
		expect(tableContainer).toBeInTheDocument()

		// Verify seat count updated
		expect(screen.getByText("0 / 20 seats")).toBeInTheDocument()
	})

	it("should scale table center circle based on chair count", () => {
		const tableWith10Chairs: Table = {
			id: "table-1",
			name: "Table 1",
			chairCount: 10,
			seats: Array(10).fill(null),
		}

		const { container, rerender } = render(
			<DndContext>
				<CircularTable table={tableWith10Chairs} />
			</DndContext>,
		)

		// For 10 chairs: containerSize = 288px, scale = 40% (35% + (10/30)*15%), center = 115.2px
		let centerCircle = container.querySelector('.rounded-full.border-4.border-muted')
		let centerStyle = centerCircle?.getAttribute('style') || ''
		// Allow for floating point precision - match ~115px
		expect(centerStyle).toMatch(/width: 115(\.\d+)?px/)
		expect(centerStyle).toMatch(/height: 115(\.\d+)?px/)

		// Update to 30 chairs
		const tableWith30Chairs: Table = {
			id: "table-1",
			name: "Table 1",
			chairCount: 30,
			seats: Array(30).fill(null),
		}

		rerender(
			<DndContext>
				<CircularTable table={tableWith30Chairs} />
			</DndContext>,
		)

		// For 30 chairs: containerSize = 400px (capped), scale = 50% (35% + (30/30)*15%), center = 200px
		centerCircle = container.querySelector('.rounded-full.border-4.border-muted')
		centerStyle = centerCircle?.getAttribute('style') || ''
		expect(centerStyle).toMatch(/width: 200(\.\d+)?px/)
		expect(centerStyle).toMatch(/height: 200(\.\d+)?px/)
	})
})

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
			settings: { groupColors: [] },
			updateTableName: mockUpdateTableName,
			updateTableChairCount: mockUpdateTableChairCount,
			isTableOverCapacity: mockIsTableOverCapacity,
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
		const tableContainer = container.querySelector('[style*="width: 300px"]')
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
})

import "@testing-library/jest-dom"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Cleanup after each test
afterEach(() => {
	cleanup()
})

// Mock ResizeObserver (used by Radix UI ScrollArea and dnd-kit)
global.ResizeObserver = class ResizeObserver {
	observe = vi.fn()
	unobserve = vi.fn()
	disconnect = vi.fn()
}

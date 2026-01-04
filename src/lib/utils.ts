import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
	return twMerge(clsx(inputs))
}

/**
 * Generate a random color for group assignment
 */
export function generateRandomColor(): string {
	const colors = [
		"#ef4444", // red
		"#f97316", // orange
		"#f59e0b", // amber
		"#eab308", // yellow
		"#84cc16", // lime
		"#22c55e", // green
		"#10b981", // emerald
		"#14b8a6", // teal
		"#06b6d4", // cyan
		"#0ea5e9", // sky
		"#3b82f6", // blue
		"#6366f1", // indigo
		"#8b5cf6", // violet
		"#a855f7", // purple
		"#d946ef", // fuchsia
		"#ec4899", // pink
		"#f43f5e", // rose
	]
	return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

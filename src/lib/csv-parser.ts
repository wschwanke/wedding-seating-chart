import Papa from "papaparse"
import type { CSVRow, Guest } from "@/types"

export interface CSVParseResult {
	success: boolean
	guests: Omit<Guest, "id" | "isMainGuest" | "parentGuestId">[]
	errors: string[]
}

export function parseCSV(file: File): Promise<CSVParseResult> {
	return new Promise((resolve) => {
		Papa.parse<CSVRow>(file, {
			header: true,
			skipEmptyLines: true,
			transformHeader: (header) => header.toLowerCase().trim(),
			complete: (results) => {
				const errors: string[] = []
				const guests: Omit<Guest, "id" | "isMainGuest" | "parentGuestId">[] = []

				// Validate headers
				const requiredHeaders = [
					"first name",
					"last name",
					"party size",
					"relationship",
				]
				const headers = results.meta.fields || []

				const missingHeaders = requiredHeaders.filter(
					(h) => !headers.includes(h),
				)

				if (missingHeaders.length > 0) {
					errors.push(
						`Missing required columns: ${missingHeaders.join(", ")}. Expected headers: "first name", "last name", "party size", "relationship"`,
					)
					resolve({ success: false, guests: [], errors })
					return
				}

				// Parse each row
				results.data.forEach((row, index) => {
					const rowNumber = index + 2 // +2 because: 0-indexed + 1 for header row + 1 for human-readable

					// Validate row data
					if (!row["first name"]?.trim()) {
						errors.push(`Row ${rowNumber}: Missing first name`)
						return
					}

					if (!row["last name"]?.trim()) {
						errors.push(`Row ${rowNumber}: Missing last name`)
						return
					}

					if (!row["party size"]?.trim()) {
						errors.push(`Row ${rowNumber}: Missing party size`)
						return
					}

					if (!row["relationship"]?.trim()) {
						errors.push(`Row ${rowNumber}: Missing relationship`)
						return
					}

					const partySize = Number.parseInt(row["party size"], 10)

					if (Number.isNaN(partySize)) {
						errors.push(
							`Row ${rowNumber}: Invalid party size "${row["party size"]}" (must be a number)`,
						)
						return
					}

					// Ignore rows where party size is 0 or negative
					if (partySize < 1) {
						return
					}

					const firstName = row["first name"].trim()
					const lastName = row["last name"].trim()
					const relationship = row["relationship"].trim()
					
					// Generate party name
					const party = partySize > 1 ? `${firstName} ${lastName}'s Party` : ""

					guests.push({
						firstName,
						lastName,
						partySize,
						party,
						relationship,
					})
				})

				resolve({
					success: errors.length === 0,
					guests,
					errors,
				})
			},
			error: (error) => {
				resolve({
					success: false,
					guests: [],
					errors: [`Failed to parse CSV: ${error.message}`],
				})
			},
		})
	})
}

export function downloadSampleCSV(): void {
	const sampleData = [
		["first name", "last name", "party size", "relationship"],
		["John", "Smith", "2", "Family"],
		["Jane", "Doe", "1", "Friends"],
		["Bob", "Johnson", "3", "Work"],
		["Alice", "Williams", "2", "Family"],
		["Charlie", "Brown", "1", "Friends"],
	]

	const csvContent = sampleData.map((row) => row.join(",")).join("\n")
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")

	link.href = URL.createObjectURL(blob)
	link.download = "sample_guest_list.csv"
	link.click()

	URL.revokeObjectURL(link.href)
}

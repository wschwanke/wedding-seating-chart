import Papa from "papaparse"
import type { CSVRow, Guest, Relationship } from "@/types"
import { generateId, generateRandomColor } from "@/lib/utils"

export interface CSVParseResult {
	success: boolean
	guests: Omit<Guest, "id" | "isMainGuest" | "parentGuestId">[]
	relationships: Relationship[]
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
				const relationshipMap = new Map<string, string>() // name -> id
				const relationships: Relationship[] = []

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
					resolve({ success: false, guests: [], relationships: [], errors })
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
					const relationshipName = row["relationship"].trim()
					
					// Generate party name
					const party = partySize > 1 ? `${firstName} ${lastName}'s Party` : ""

					// Create or lookup relationship
					let relationshipId = relationshipMap.get(relationshipName)
					if (!relationshipId) {
						relationshipId = generateId()
						relationshipMap.set(relationshipName, relationshipId)
						relationships.push({
							id: relationshipId,
							name: relationshipName,
							color: generateRandomColor(),
						})
					}

					guests.push({
						firstName,
						lastName,
						partySize,
						party,
						relationshipId,
					})
				})

				resolve({
					success: errors.length === 0,
					guests,
					relationships,
					errors,
				})
			},
			error: (error) => {
				resolve({
					success: false,
					guests: [],
					relationships: [],
					errors: [`Failed to parse CSV: ${error.message}`],
				})
			},
		})
	})
}

export function downloadSampleCSV(): void {
	const sampleData = [
		["first name", "last name", "party size", "relationship"],
		// Bride's Family (12 people)
		["Robert", "Anderson", "2", "Bride's Family"],
		["Margaret", "Anderson", "1", "Bride's Family"],
		["William", "Thompson", "3", "Bride's Family"],
		["Susan", "Martinez", "2", "Bride's Family"],
		["David", "Anderson", "4", "Bride's Family"],
		// Groom's Family (10 people)
		["James", "Wilson", "2", "Groom's Family"],
		["Patricia", "Wilson", "1", "Groom's Family"],
		["Michael", "Davis", "3", "Groom's Family"],
		["Elizabeth", "Brown", "2", "Groom's Family"],
		["Richard", "Wilson", "2", "Groom's Family"],
		// Bride's Friends (14 people)
		["Jennifer", "Garcia", "2", "Bride's Friends"],
		["Sarah", "Miller", "1", "Bride's Friends"],
		["Emily", "Taylor", "2", "Bride's Friends"],
		["Ashley", "Moore", "3", "Bride's Friends"],
		["Amanda", "Jackson", "2", "Bride's Friends"],
		["Stephanie", "White", "2", "Bride's Friends"],
		["Nicole", "Harris", "2", "Bride's Friends"],
		// Groom's Friends (12 people)
		["Christopher", "Lee", "2", "Groom's Friends"],
		["Matthew", "Clark", "1", "Groom's Friends"],
		["Daniel", "Lewis", "3", "Groom's Friends"],
		["Andrew", "Walker", "2", "Groom's Friends"],
		["Joshua", "Hall", "2", "Groom's Friends"],
		["Brandon", "Young", "2", "Groom's Friends"],
		// Work - Bride (10 people)
		["Karen", "Allen", "2", "Work - Bride"],
		["Nancy", "King", "1", "Work - Bride"],
		["Lisa", "Wright", "2", "Work - Bride"],
		["Betty", "Scott", "3", "Work - Bride"],
		["Dorothy", "Green", "2", "Work - Bride"],
		// Work - Groom (8 people)
		["Thomas", "Adams", "2", "Work - Groom"],
		["Steven", "Baker", "1", "Work - Groom"],
		["Paul", "Nelson", "2", "Work - Groom"],
		["Mark", "Carter", "3", "Work - Groom"],
		// College Friends (12 people)
		["Kevin", "Mitchell", "2", "College Friends"],
		["Brian", "Roberts", "2", "College Friends"],
		["Jason", "Turner", "3", "College Friends"],
		["Ryan", "Phillips", "2", "College Friends"],
		["Justin", "Campbell", "1", "College Friends"],
		["Eric", "Evans", "2", "College Friends"],
		// Neighbors (6 people)
		["George", "Parker", "2", "Neighbors"],
		["Edward", "Collins", "2", "Neighbors"],
		["Ronald", "Stewart", "2", "Neighbors"],
	]

	const csvContent = sampleData.map((row) => row.join(",")).join("\n")
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
	const link = document.createElement("a")

	link.href = URL.createObjectURL(blob)
	link.download = "sample_wedding_guest_list.csv"
	link.click()

	URL.revokeObjectURL(link.href)
}

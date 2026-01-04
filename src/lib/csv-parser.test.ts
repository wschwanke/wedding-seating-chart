import { describe, it, expect } from "vitest"
import { parseCSV } from "./csv-parser"

describe("CSV Parser", () => {
	it("should parse valid CSV with correct headers", async () => {
		const csvContent = `first name,last name,party size,relationship
John,Smith,2,Family
Jane,Doe,1,Friends`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(true)
		expect(result.guests).toHaveLength(2)
		expect(result.errors).toHaveLength(0)
		expect(result.relationships).toHaveLength(2)

		expect(result.guests[0].firstName).toBe("John")
		expect(result.guests[0].lastName).toBe("Smith")
		expect(result.guests[0].partySize).toBe(2)
		expect(result.guests[0].relationshipId).toBeDefined()
		expect(result.guests[0].party).toBe("John Smith's Party")
		
		// Check relationships were created
		const familyRel = result.relationships.find((r) => r.name === "Family")
		expect(familyRel).toBeDefined()
		expect(result.guests[0].relationshipId).toBe(familyRel?.id)
	})

	it("should handle case-insensitive headers", async () => {
		const csvContent = `FIRST NAME,LAST NAME,PARTY SIZE,RELATIONSHIP
John,Smith,1,Family`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(true)
		expect(result.guests).toHaveLength(1)
	})

	it("should trim whitespace from values", async () => {
		const csvContent = `first name,last name,party size,relationship
  John  ,  Smith  ,  1  ,  Family  `

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(true)
		expect(result.guests[0].firstName).toBe("John")
		expect(result.guests[0].lastName).toBe("Smith")
		expect(result.guests[0].relationshipId).toBeDefined()
		expect(result.relationships).toHaveLength(1)
		expect(result.relationships[0].name).toBe("Family")
	})

	it("should reject CSV with missing headers", async () => {
		const csvContent = `first name,last name,party size
John,Smith,1`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(false)
		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toContain("Missing required columns")
	})

	it("should reject rows with missing first name", async () => {
		const csvContent = `first name,last name,party size,relationship
,Smith,1,Family`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(false)
		expect(result.errors[0]).toContain("Missing first name")
	})

	it("should reject rows with missing last name", async () => {
		const csvContent = `first name,last name,party size,relationship
John,,1,Family`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(false)
		expect(result.errors[0]).toContain("Missing last name")
	})

	it("should reject rows with invalid party size", async () => {
		const csvContent = `first name,last name,party size,relationship
John,Smith,abc,Family`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(false)
		expect(result.errors[0]).toContain("Invalid party size")
	})

	it("should ignore rows with party size less than 1", async () => {
		const csvContent = `first name,last name,party size,relationship
John,Smith,0,Family
Jane,Doe,1,Friends`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		// Party size 0 should be silently ignored, only Jane should be imported
		expect(result.success).toBe(true)
		expect(result.guests).toHaveLength(1)
		expect(result.guests[0].firstName).toBe("Jane")
	})

	it("should skip empty lines", async () => {
		const csvContent = `first name,last name,party size,relationship
John,Smith,1,Family

Jane,Doe,1,Friends`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(true)
		expect(result.guests).toHaveLength(2)
	})

	it("should parse multiple valid rows", async () => {
		const csvContent = `first name,last name,party size,relationship
John,Smith,1,Family
Jane,Doe,2,Friends
Bob,Johnson,3,Work
Alice,Williams,1,Family`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(true)
		expect(result.guests).toHaveLength(4)
		expect(result.guests.map((g) => g.firstName)).toEqual([
			"John",
			"Jane",
			"Bob",
			"Alice",
		])
	})

	it("should collect all validation errors", async () => {
		const csvContent = `first name,last name,party size,relationship
,Smith,1,Family
John,,2,Friends
Bob,Johnson,abc,Work`

		const file = new File([csvContent], "guests.csv", { type: "text/csv" })
		const result = await parseCSV(file)

		expect(result.success).toBe(false)
		expect(result.errors).toHaveLength(3)
		expect(result.guests).toHaveLength(0)
	})
})

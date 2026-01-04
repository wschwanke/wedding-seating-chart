import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toPng } from "html-to-image"
import { useCallback } from "react"

export function ExportButton() {
	const handleExport = useCallback(async () => {
		const element = document.getElementById("table-grid")
		if (!element) {
			console.error("Table grid element not found")
			return
		}

		try {
			const dataUrl = await toPng(element, {
				quality: 1.0,
				pixelRatio: 2,
			})

			const link = document.createElement("a")
			link.download = `seating-chart-${new Date().toISOString().split("T")[0]}.png`
			link.href = dataUrl
			link.click()
		} catch (error) {
			console.error("Failed to export seating chart:", error)
		}
	}, [])

	return (
		<Button variant="default" size="sm" onClick={handleExport}>
			<Download className="h-4 w-4 mr-2" />
			Export
		</Button>
	)
}

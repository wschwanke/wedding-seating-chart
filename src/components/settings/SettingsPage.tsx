import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RelationshipManager } from "./RelationshipManager"
import { PartyManager } from "./PartyManager"
import { GeneralSettings } from "./GeneralSettings"

interface SettingsPageProps {
	onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
	return (
		<div className="min-h-screen bg-background flex flex-col">
			<div className="border-b">
				<div className="container max-w-4xl mx-auto p-4">
					<div className="flex items-center gap-4">
						<Button variant="ghost" size="sm" onClick={onBack}>
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Seating Chart
						</Button>
						<div className="flex-1">
							<h1 className="text-2xl font-bold">Settings</h1>
							<p className="text-sm text-muted-foreground">
								Manage relationships, parties, and general settings
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex-1 container max-w-4xl mx-auto p-4">
				<Tabs defaultValue="relationships" className="space-y-6">
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="relationships">Relationships</TabsTrigger>
						<TabsTrigger value="parties">Parties</TabsTrigger>
						<TabsTrigger value="general">General</TabsTrigger>
					</TabsList>

					<TabsContent value="relationships" className="space-y-4">
						<RelationshipManager />
					</TabsContent>

					<TabsContent value="parties" className="space-y-4">
						<PartyManager />
					</TabsContent>

					<TabsContent value="general" className="space-y-4">
						<GeneralSettings />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}

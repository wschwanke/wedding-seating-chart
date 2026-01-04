import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface ComboboxItem {
	id: string
	label: string
	description?: string
}

interface ComboboxProps {
	items: ComboboxItem[]
	value: string
	onValueChange: (value: string) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyMessage?: string
	renderItem?: (item: ComboboxItem) => React.ReactNode
	className?: string
}

export function Combobox({
	items,
	value,
	onValueChange,
	placeholder = "Select an item...",
	searchPlaceholder = "Search...",
	emptyMessage = "No items found.",
	renderItem,
	className,
}: ComboboxProps) {
	const [open, setOpen] = useState(false)

	const selectedItem = items.find((item) => item.id === value)

	const handleSelect = (itemId: string) => {
		onValueChange(itemId === value ? "" : itemId)
		setOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn("w-full justify-between", className)}
				>
					{selectedItem ? selectedItem.label : placeholder}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-full p-0" align="start">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.id}
									value={item.id}
									onSelect={() => handleSelect(item.id)}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === item.id ? "opacity-100" : "opacity-0",
										)}
									/>
									{renderItem ? (
										renderItem(item)
									) : (
										<div className="flex flex-col items-start">
											<span>{item.label}</span>
											{item.description && (
												<span className="text-xs text-muted-foreground">
													{item.description}
												</span>
											)}
										</div>
									)}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}

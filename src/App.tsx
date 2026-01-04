import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDndContext,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { GuestSidebar } from "@/components/sidebar/GuestSidebar";
import { TableGrid } from "@/components/tables/TableGrid";
import { GuestCard } from "@/components/guests/GuestCard";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { useSeatingStore } from "@/stores/useSeatingStore";
import type { Guest, Subgroup } from "@/types";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import { Users, ArrowLeftRight } from "lucide-react";

interface ChairDragOverlayProps {
  guest: Guest;
  color: string;
}

function ChairDragOverlay({ guest, color }: ChairDragOverlayProps) {
  const { over } = useDndContext();
  const tables = useSeatingStore((state) => state.tables);
  
  // Check if we're hovering over an occupied seat (swap scenario)
  const isSwapScenario = over && (() => {
    const dropData = over.data.current as { tableId: string; seatIndex: number } | undefined;
    if (!dropData) return false;
    const table = tables.find((t) => t.id === dropData.tableId);
    return table && table.seats[dropData.seatIndex] !== null;
  })();
  
  return (
    <div className="relative">
      {isSwapScenario && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-2 py-1 rounded-md flex items-center gap-1 text-xs font-semibold shadow-lg">
          <ArrowLeftRight className="h-3 w-3" />
          Swap
        </div>
      )}
      <div
        className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-xs font-medium shadow-lg"
        style={{
          backgroundColor: color ? `${color}20` : "#f5f5f5",
          borderColor: color || "#888",
        }}
      >
        <div className="text-center">
          <div className="text-sm font-bold">
            {guest.firstName.charAt(0).toUpperCase()}
            {guest.lastName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [view, setView] = useState<"main" | "settings">("main");
  const [activeGuest, setActiveGuest] = useState<Guest | null>(null);
  const [activeParty, setActiveParty] = useState<{
    subgroup: Subgroup;
    guests: Guest[];
  } | null>(null);
  const [dragSource, setDragSource] = useState<"chair" | "sidebar" | null>(
    null,
  );
  const assignToSeat = useSeatingStore((state) => state.assignToSeat);
  const swapSeats = useSeatingStore((state) => state.swapSeats);
  const tables = useSeatingStore((state) => state.tables);
  const relationships = useSeatingStore((state) => state.relationships);

  // Configure drag activation - 3px distance threshold
  // This allows clicks on buttons to work without triggering drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent): void => {
    const activeData = event.active.data.current;
    const activeId = String(event.active.id);

    // Determine drag source
    const isFromChair = activeId.startsWith("chair-");
    setDragSource(isFromChair ? "chair" : "sidebar");

    if (activeData?.type === "party") {
      setActiveParty({
        subgroup: activeData.subgroup as Subgroup,
        guests: activeData.guests as Guest[],
      });
      setActiveGuest(null);
    } else {
      const guest = activeData?.guest as Guest | undefined;
      if (guest) {
        setActiveGuest(guest);
        setActiveParty(null);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event;

    setActiveGuest(null);
    setActiveParty(null);
    setDragSource(null);

    if (!over) return;

    const activeData = active.data.current;
    const dropData = over.data.current as
      | { tableId: string; seatIndex: number }
      | undefined;

    if (!dropData) return;

    // Handle party drag
    if (activeData?.type === "party") {
      const { guests } = activeData as { guests: Guest[] };
      const { tableId, seatIndex } = dropData;

      // Find the table
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;

      // Check if drop seat is empty
      if (table.seats[seatIndex] !== null) {
        // Cannot drop on occupied seat
        return;
      }

      // Collect empty seats starting from drop position, wrapping around
      const emptySeats: number[] = [];
      for (let i = 0; i < table.seats.length; i++) {
        const seatIdx = (seatIndex + i) % table.seats.length;
        if (table.seats[seatIdx] === null) {
          emptySeats.push(seatIdx);
        }
      }

      // Assign guests to available seats
      guests.forEach((guest, idx) => {
        if (idx < emptySeats.length) {
          assignToSeat(guest.id, tableId, emptySeats[idx]);
        }
        // Remaining guests left unassigned if not enough seats
      });

      return;
    }

    // Handle single guest drag (existing logic)
    const guest = activeData?.guest as Guest | undefined;
    if (!guest) return;

    // Check if drop seat is occupied
    const table = tables.find((t) => t.id === dropData.tableId);
    const targetGuestId = table?.seats[dropData.seatIndex];
    
    if (targetGuestId) {
      // Seat is occupied
      if (dragSource === 'chair') {
        // Dragging from chair to occupied seat -> SWAP
        swapSeats(guest.id, targetGuestId);
      } else {
        // Dragging from sidebar to occupied seat -> BLOCK
        return;
      }
    } else {
      // Seat is empty -> normal assignment
      assignToSeat(guest.id, dropData.tableId, dropData.seatIndex);
    }
  };

  const getGuestColor = useCallback(
    (guest: Guest): string => {
      return (
        relationships.find((r) => r.id === guest.relationshipId)?.color ||
        "#888"
      );
    },
    [relationships],
  );

  // Show settings page if in settings view
  if (view === "settings") {
    return (
      <TooltipProvider>
        <SettingsPage onBack={() => setView("main")} />
      </TooltipProvider>
    );
  }

  // Main seating chart view
  return (
    <TooltipProvider>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-background text-foreground flex flex-col">
          <Header onSettingsClick={() => setView("settings")} />
          <div className="flex flex-1 overflow-hidden">
            <GuestSidebar />
            <TableGrid />
          </div>
        </div>

        <DragOverlay>
          {activeGuest && dragSource === "chair" ? (
            <ChairDragOverlay
              guest={activeGuest}
              color={getGuestColor(activeGuest)}
            />
          ) : activeGuest ? (
            <GuestCard guest={activeGuest} color={getGuestColor(activeGuest)} />
          ) : activeParty ? (
            <Card
              className="p-3 border-l-4"
              style={{ borderLeftColor: getGuestColor(activeParty.guests[0]) }}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">{activeParty.subgroup.name}</span>
                <span className="text-muted-foreground">
                  ({activeParty.guests.length})
                </span>
              </div>
            </Card>
          ) : null}
        </DragOverlay>
      </DndContext>
    </TooltipProvider>
  );
}

export default App;

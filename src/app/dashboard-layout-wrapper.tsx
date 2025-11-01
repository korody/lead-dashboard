"use client"

import { Navigation } from "@/components/ui/navigation"
import { DashboardControls } from "@/components/ui/dashboard-controls"
import { useRealTimeMetrics } from "@/hooks/use-metrics"
import { useState } from "react"
import { DateRangeOption } from "@/components/ui/date-range-filter"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [selectedDays, setSelectedDays] = useState<DateRangeOption>(9999)
  const { isRealTimeEnabled, toggleRealTime, refresh } = useRealTimeMetrics(selectedDays)

  return (
    <div className="flex w-full min-h-screen">
      <Navigation>
        <DashboardControls
          selectedDays={selectedDays}
          onDaysChange={setSelectedDays}
          isRealTimeEnabled={isRealTimeEnabled}
          onToggleRealTime={toggleRealTime}
          onRefresh={refresh}
        />
      </Navigation>
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  )
}

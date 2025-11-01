"use client"

import { Navigation } from "@/components/ui/navigation"

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen">
      <Navigation />
      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  )
}

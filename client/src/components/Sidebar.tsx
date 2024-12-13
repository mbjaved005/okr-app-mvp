import { Home, Target, BarChart3, Users, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const sidebarItems = [
  { icon: Home, label: "Dashboard", path: "/" },
  { icon: Target, label: "OKRs", path: "/okrs" },
  { icon: Users, label: "Teams", path: "/teams" },
  { icon: BarChart3, label: "Reports", path: "/reports", disabled: true },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed left-0 top-0 z-20 h-screen w-64 border-r bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">OKR Tracker</h2>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="space-y-2 p-4">
          {sidebarItems.map((item) => (
            <TooltipProvider key={item.path} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      variant={location.pathname === item.path ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        location.pathname === item.path && "bg-secondary",
                        item.disabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={() => !item.disabled && navigate(item.path)}
                      disabled={item.disabled}
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.label}
                      {item.disabled && <Lock className="ml-2 h-3 w-3" />}
                    </Button>
                  </div>
                </TooltipTrigger>
                {item.disabled && (
                  <TooltipContent side="right" align="center" className="bg-black text-white">
                    <p>Coming Soon! 🚀</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
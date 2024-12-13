import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const notifications = [
  {
    id: 1,
    title: "New OKR assigned",
    description: "You have been assigned a new OKR by John Doe",
    time: "5 minutes ago",
    unread: true,
  },
  {
    id: 2,
    title: "OKR update required",
    description: "Please update your Q1 OKR progress",
    time: "1 hour ago",
    unread: true,
  },
  {
    id: 3,
    title: "OKR completed",
    description: "Team Frontend Development OKR has been completed",
    time: "2 hours ago",
    unread: false,
  },
]

export function NotificationsMenu() {
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-500 text-white border-2 border-background"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Notifications</p>
            <p className="text-xs leading-none text-muted-foreground">
              You have {unreadCount} unread notifications
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup className="max-h-[300px] overflow-auto">
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="cursor-pointer">
              <div className="flex items-start gap-2 py-2">
                {notification.unread && (
                  <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {notification.time}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="w-full text-center cursor-pointer">
          <span className="text-sm text-blue-500 mx-auto">View all notifications</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, Users } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"

export function ProfileMenu() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  console.log("ProfileMenu rendering. User data:", user);

  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => {
        const match = name.match(/^[A-Za-z]|\d+/g);
        return match ? match.join('') : '';
      })
      .join('');
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const profilePictureUrl = user?.profilePicture ? `http://localhost:3000/${user.profilePicture.replace(/\\/g, '/')}` : undefined;

  console.log("Rendering Avatar. profilePicture:", profilePictureUrl, "name:", user?.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-10 w-10 cursor-pointer">
          {profilePictureUrl ? (
            <AvatarImage src={profilePictureUrl} alt={user?.name} />
          ) : (
            <AvatarFallback className="bg-blue-100 text-blue-600">
              {console.log("Avatar fallback rendering. Initials:", getInitials(user?.name || ''))}
              {getInitials(user?.name || '')}
            </AvatarFallback>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Welcome, {user?.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {user?.role === 'Admin' && (
            <DropdownMenuItem onClick={() => navigate("/user-management")}>
              <Users className="mr-2 h-4 w-4" />
              <span>User Management</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
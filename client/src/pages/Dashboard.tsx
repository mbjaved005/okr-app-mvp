import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Users, TrendingUp, Filter, RotateCcw } from "lucide-react"
import { useEffect, useState } from "react"
import { getOKRs } from "@/api/okr"
import { getUsers } from "@/api/users"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import departments from '@/data/departments.json';

export function Dashboard() {
  console.log("Dashboard component rendered");
  const [okrs, setOkrs] = useState([])
  const [filteredOkrs, setFilteredOkrs] = useState([])
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [filters, setFilters] = useState({
    category: "all",
    department: "all",
    quarter: "all",
    startDate: "",
    endDate: ""
  })
  const [progressData, setProgressData] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [okrsResponse, usersResponse] = await Promise.all([
          getOKRs(),
          getUsers()
        ])
        console.log("OKRs fetched:", okrsResponse.okrs);
        console.log("Users fetched:", usersResponse.users);
        setOkrs(okrsResponse.okrs)
        setFilteredOkrs(okrsResponse.okrs)
        setUsers(usersResponse.users)
        setFilteredUsers(usersResponse.users)
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    const filtered = okrs.filter(okr => {
      const matchesCategory = filters.category === "all" || okr.category === filters.category
      const matchesDepartment = filters.department === "all" || okr.department === filters.department

      const okrDate = new Date(okr.startDate)
      const quarter = Math.floor((okrDate.getMonth() + 3) / 3)
      const matchesQuarter = filters.quarter === "all" || `Q${quarter}` === filters.quarter

      const startDate = filters.startDate ? new Date(filters.startDate) : null
      const endDate = filters.endDate ? new Date(filters.endDate) : null
      const okrStartDate = new Date(okr.startDate)
      const okrEndDate = new Date(okr.endDate)

      const matchesDateRange = (!startDate || okrStartDate >= startDate) &&
                             (!endDate || okrEndDate <= endDate)

      return matchesCategory && matchesDepartment && matchesQuarter && matchesDateRange
    })

    // Update filtered users based on department filter
    const filteredUsersByDepartment = users.filter(user =>
      filters.department === "all" || user.department === filters.department
    )

    setFilteredOkrs(filtered)
    setFilteredUsers(filteredUsersByDepartment)

    // Get months based on filters
    const months = getFilteredMonths(filters)

    // Update progress data based on filtered OKRs and months
    const progressByMonth = months.map(month => ({
      month,
      progress: calculateAverageProgressForMonth(filtered, month)
    }))
    setProgressData(progressByMonth)
    console.log("Filters applied:", filters);
    console.log("Filtered OKRs:", filtered);
    console.log("Filtered Users:", filteredUsersByDepartment);
    console.log("Progress Data:", progressByMonth);
  }, [filters, okrs, users])

  const getFilteredMonths = (filters) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      const startMonth = startDate.getMonth()
      const endMonth = endDate.getMonth()

      if (startMonth <= endMonth) {
        return months.slice(startMonth, endMonth + 1)
      } else {
        // Handle case when date range spans across years
        return [...months.slice(startMonth), ...months.slice(0, endMonth + 1)]
      }
    }

    if (filters.quarter !== 'all') {
      const quarterMap = {
        'Q1': [0, 1, 2],
        'Q2': [3, 4, 5],
        'Q3': [6, 7, 8],
        'Q4': [9, 10, 11]
      }
      const quarterMonths = quarterMap[filters.quarter]
      return months.filter((_, index) => quarterMonths.includes(index))
    }

    return months
  }

  const calculateAverageProgressForMonth = (filteredOkrs, month) => {
    const monthIndex = new Date(`${month} 1, 2024`).getMonth()
    const okrsInMonth = filteredOkrs.filter(okr => {
      const startDate = new Date(okr.startDate)
      const endDate = new Date(okr.endDate)
      const currentDate = new Date(2024, monthIndex, 1) // Using 2024 as reference year

      // Check if the OKR's date range includes this month
      return startDate <= currentDate && endDate >= currentDate
    })

    if (okrsInMonth.length === 0) return 0
    return Math.round(okrsInMonth.reduce((sum, okr) => sum + okr.progress, 0) / okrsInMonth.length)
  }

  const calculateAverageProgress = () => {
    if (filteredOkrs.length === 0) return 0
    const totalProgress = filteredOkrs.reduce((sum, okr) => sum + okr.progress, 0)
    return Math.round(totalProgress / filteredOkrs.length)
  }

  const resetFilters = () => {
    setIsResetting(true)
    setTimeout(() => {
      setFilters({
        category: "all",
        department: "all",
        quarter: "all",
        startDate: "",
        endDate: ""
      })
      setIsResetting(false)
      setIsFilterOpen(false)
    }, 500)
    console.log("Filters reset");
  }

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== "all" && value !== "").length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {getActiveFiltersCount() > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-100 text-blue-700"
                >
                  {getActiveFiltersCount()}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filter OKRs</SheetTitle>
              <SheetDescription>
                Refine your OKR view using the filters below
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Team">Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select
                  value={filters.department}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.departments.map(department => (
                      <SelectItem key={department} value={department}>
                        {department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quarter</Label>
                <Select
                  value={filters.quarter}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, quarter: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Quarters</SelectItem>
                    <SelectItem value="Q1">Q1</SelectItem>
                    <SelectItem value="Q2">Q2</SelectItem>
                    <SelectItem value="Q3">Q3</SelectItem>
                    <SelectItem value="Q4">Q4</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="grid grid-cols-1 gap-4">
                  <div className="w-5/7">
                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="w-5/7">
                    <Label className="text-xs text-muted-foreground">End Date</Label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button
                onClick={resetFilters}
                className={`w-full bg-blue-500 text-white hover:bg-blue-600 ${
                  isResetting ? 'animate-pulse' : ''
                }`}
                disabled={isResetting || getActiveFiltersCount() === 0}
              >
                <div className="relative flex items-center justify-center gap-2">
                  <RotateCcw className={`h-4 w-4 transition-transform duration-500 ${
                    isResetting ? 'animate-spin' : ''
                  }`} />
                  Reset Filters
                </div>
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total OKRs</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOkrs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
            {filters.department !== "all" && (
              <p className="text-sm text-muted-foreground mt-1">
                in {filters.department} department
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateAverageProgress()}%</div>
            <Progress value={calculateAverageProgress()} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
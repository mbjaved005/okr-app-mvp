import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const departmentData = [
  { name: "Frontend", value: 75 },
  { name: "Backend", value: 82 },
  { name: "QA", value: 68 },
]

const progressData = [
  { name: "Q1", Individual: 65, Team: 78, quarter: 1 },
  { name: "Q2", Individual: 72, Team: 85, quarter: 2 },
  { name: "Q3", Individual: 78, Team: 88, quarter: 3 },
  { name: "Q4", Individual: 85, Team: 92, quarter: 4 },
]

const COLORS = {
  department: ["#2563eb", "#16a34a", "#dc2626", "#eab308"],
  quarters: {
    1: "#3b82f6", // Blue
    2: "#10b981", // Green
    3: "#f59e0b", // Yellow
    4: "#ef4444", // Red
  }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name}: {entry.value}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <div className="flex gap-4">
          <Select defaultValue="2024">
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <YAxis 
                    tick={{ fill: '#666' }}
                    tickLine={{ stroke: '#666' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  {progressData.map((entry) => (
                    <Bar
                      key={entry.quarter}
                      dataKey="Individual"
                      fill={COLORS.quarters[entry.quarter]}
                      name={`Q${entry.quarter} Individual`}
                    />
                  ))}
                  {progressData.map((entry) => (
                    <Bar
                      key={entry.quarter}
                      dataKey="Team"
                      fill={COLORS.quarters[entry.quarter]}
                      name={`Q${entry.quarter} Team`}
                      opacity={0.7}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {departmentData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS.department[index % COLORS.department.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Key Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Average Progress</p>
                <p className="text-2xl font-bold">76%</p>
                <p className="text-sm text-green-600">↑ 12% from last quarter</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Completed OKRs</p>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-green-600">↑ 4 from last quarter</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">On Track</p>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-green-600">↑ 7% from last quarter</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
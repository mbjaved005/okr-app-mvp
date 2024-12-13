import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateOKR, getOKRById } from "@/api/okr"
import { getUsers } from "@/api/users"
import { useToast } from "@/hooks/useToast"
import { Plus, Target, Trash2, X, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import departments from '@/data/departments.json';

type User = {
  id: string
  name: string
  email: string
}

type KeyResult = {
  id?: string
  title: string
  currentValue: number
  targetValue: number
}

type FormData = {
  title: string
  description: string
  startDate: string
  endDate: string
  department: string
  category: string
  owners: string[]
  keyResults: KeyResult[]
}

type OKR = {
  id: string
  title: string
  description: string
  startDate: string
  endDate: string
  department: string
  category: string
  owners: string[]
  keyResults: KeyResult[]
}

export function EditOKRDialog({
  open,
  onOpenChange,
  okrId,
  onOKRUpdated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  okrId: string
  onOKRUpdated: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [openCombobox, setOpenCombobox] = useState(false)
  const [category, setCategory] = useState<string>("")
  const { toast } = useToast()
  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      department: "",
      category: "",
      owners: [],
      keyResults: []
    }
  })
  const { fields, append, remove } = useFieldArray({
    control,
    name: "keyResults"
  })

  useEffect(() => {
    if (open && okrId) {
      getOKRById(okrId)
        .then(data => {
          const okr = data.okr;
          console.log('Editing OKR:', okr);
          console.log('Initial Start Date:', new Date(okr.startDate));
          console.log('Initial End Date:', okr.endDate);
          reset({
            title: okr.title,
            description: okr.description,
            startDate: okr.startDate.split("T")[0],
            endDate: okr.endDate.split("T")[0],
            department: okr.department.toLowerCase(),
            category: okr.category.toLowerCase(),
            owners: okr.owners,
            keyResults: okr.keyResults
          })
          setCategory(okr.category.toLowerCase())
          const selectedUsers = users.filter(user =>
            okr.owners.includes(user.id)
          )
          setSelectedUsers(selectedUsers)
        })
        .catch(error => {
          console.error('Error fetching OKR by ID:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch OKR details",
          })
        });
    }
  }, [open, okrId, reset, toast, users])

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getUsers()
      setUsers(response.users)
    }
    fetchUsers()
  }, [])

  const watchKeyResults = watch("keyResults")

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100)
  }

  const handleUserSelect = (selectedUser: User) => {
    if (category === "individual" && selectedUsers.length > 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Individual OKRs can only have one owner"
      })
      return
    }
    setSelectedUsers([...selectedUsers, selectedUser])
    setValue('owners', [...selectedUsers, selectedUser].map(u => u.id))
    setOpenCombobox(false)
  }

  const handleUserRemove = (userId: string) => {
    const newSelectedUsers = selectedUsers.filter(u => u.id !== userId)
    setSelectedUsers(newSelectedUsers)
    setValue('owners', newSelectedUsers.map(u => u.id))
  }

  const handleCategoryChange = (value: string) => {
    setCategory(value)
    if (value === "individual" && selectedUsers.length > 1) {
      const firstUser = selectedUsers[0]
      setSelectedUsers([firstUser])
      setValue('owners', [firstUser.id])
      toast({
        title: "Notice",
        description: "Individual OKRs can only have one owner. Additional owners have been removed."
      })
    }
    setValue('category', value)
  }

  const availableUsers = users.filter(user =>
    !selectedUsers.some(selected => selected.id === user.id)
  )

  const onSubmit = async (data: FormData) => {
    try {
      if (data.category === "individual" && selectedUsers.length > 1) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Individual OKRs can only have one owner"
        })
        return
      }
      if (data.category === "team" && selectedUsers.length < 2) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Team OKRs must have at least two owners"
        })
        return
      }
      if (new Date(data.startDate) >= new Date(data.endDate)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "End Date must be greater than Start Date"
        })
        return
      }
      for (const keyResult of data.keyResults) {
        if (keyResult.currentValue > keyResult.targetValue) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Current value cannot be greater than target value in key results"
          });
          return;
        }
      }
      setLoading(true)
      await updateOKR(okrId, data)
      toast({
        title: "Success",
        description: "OKR updated successfully",
      })
      onOKRUpdated()
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating OKR:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update OKR",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] max-h-[90vh] bg-white dark:bg-gray-900">
        <DialogHeader className="px-8 pt-8 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Target className="h-5 w-5 text-blue-500" />
            Edit OKR
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Update the details of your OKR
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] px-8 py-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
              <div className="grid w-full gap-3">
                <Label htmlFor="title" className="text-sm font-medium">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter OKR title"
                  className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && <span className="text-red-500">{errors.title.message}</span>}
              </div>

              <div className="grid w-full gap-3">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Enter OKR description"
                  className="min-h-[100px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid w-full gap-3">
                  <Label htmlFor="startDate" className="text-sm font-medium">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    className="w-[140px] h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    {...register("startDate", { required: "Start date is required" })}
                  />
                  {errors.startDate && <span className="text-red-500">{errors.startDate.message}</span>}
                </div>
                <div className="grid w-full gap-3">
                  <Label htmlFor="endDate" className="text-sm font-medium">
                    End Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    className="w-[140px] h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    {...register("endDate", { required: "End date is required" })}
                  />
                  {errors.endDate && <span className="text-red-500">{errors.endDate.message}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="grid w-full gap-3">
                  <Label htmlFor="department" className="text-sm font-medium">
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <Select value={watch("department")} onValueChange={(value) => setValue("department", value)}>
                    <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.departments.map(department => (
                        <SelectItem key={department} value={department.toLowerCase()}>
                          {department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.department && <span className="text-red-500">{errors.department.message}</span>}
                </div>
                <div className="grid w-full gap-3">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Select value={watch("category")} onValueChange={handleCategoryChange} disabled={category === "individual"}>
                    <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="team">Team</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <span className="text-red-500">{errors.category.message}</span>}
                </div>
              </div>

              <div className="grid w-full gap-3">
                <Label className="text-sm font-medium">
                  Owners <span className="text-red-500">*</span>
                </Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCombobox}
                      className="h-11 justify-between bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                    >
                      Select owners
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search users..." className="h-11" />
                      <CommandEmpty>No users found.</CommandEmpty>
                      <CommandGroup>
                        {availableUsers.map((user) => (
                          <CommandItem
                            key={user.id}
                            onSelect={() => handleUserSelect(user)}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900 cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "h-4 w-4",
                                selectedUsers.some(selected => selected.id === user.id)
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {user.name}
                            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                              ({user.email})
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedUsers.map((user) => (
                    <Badge
                      key={user.id}
                      variant="secondary"
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                    >
                      {user.name}
                      {category !== "individual" && (
                        <button
                          type="button"
                          onClick={() => handleUserRemove(user.id)}
                          className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                    Key Results <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ title: "", currentValue: 0, targetValue: 100 })}
                    className="border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-6">
                        <div className="grid w-full gap-3">
                          <Label className="text-sm font-medium">Title</Label>
                          <Input
                            {...register(`keyResults.${index}.title` as const, { required: "Key result title is required" })}
                            placeholder="Enter key result title"
                            className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                          />
                          {errors.keyResults?.[index]?.title && <span className="text-red-500">{errors.keyResults[index].title?.message}</span>}
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="grid w-full gap-3">
                            <Label className="text-sm font-medium">Current Value</Label>
                            <Input
                              type="number"
                              {...register(`keyResults.${index}.currentValue` as const, {
                                required: "Current value is required",
                                valueAsNumber: true,
                                validate: value => (value >= 0 && value <= watch(`keyResults.${index}.targetValue`)) || "Give Valid Input"
                              })}
                              className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                            />
                          </div>
                          <div className="grid w-full gap-3">
                            <Label className="text-sm font-medium">Target Value</Label>
                            <Input
                              type="number"
                              {...register(`keyResults.${index}.targetValue` as const, {
                                required: "Target value is required",
                                valueAsNumber: true,
                                validate: value => value >= 0 || "Give Valid Input"
                              })}
                              className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                            />
                            {errors.keyResults?.[index]?.targetValue && <span className="text-red-500">{errors.keyResults[index].targetValue?.message}</span>}
                          </div>
                        </div>
                        {errors.keyResults?.[index]?.currentValue && (
                          <span className="text-red-500">{errors.keyResults[index].currentValue?.message}</span>
                        )}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Progress</span>
                            <span className="font-medium">
                              {calculateProgress(
                                watchKeyResults[index]?.currentValue || 0,
                                watchKeyResults[index]?.targetValue || 1
                              )}%
                            </span>
                          </div>
                          <Progress
                            value={calculateProgress(
                              watchKeyResults[index]?.currentValue || 0,
                              watchKeyResults[index]?.targetValue || 1
                            )}
                            className="h-2 bg-gray-100 dark:bg-gray-700"
                          />
                        </div>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="sticky bottom-0 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                {loading ? (
                  "Updating..."
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Update OKR
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
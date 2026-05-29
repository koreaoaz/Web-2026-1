"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Loader2, AlertCircle } from "lucide-react"

interface Study {
  id: string
  name: string
  leader: string
  color: string
  day: string
  startTime: string
  endTime: string
  startSlot: number
  endSlot: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
)

const timeToSlot = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number)
  return (hours - 9) * 2 + (minutes >= 30 ? 1 : 0)
}

export const TimetableDemo = () => {
  const [studies, setStudies] = useState<Study[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStudies()
  }, [])

const loadStudies = async () => {
  setIsLoading(true)
  setError(null)

  try {
    const { data, error } = await supabase
      .from("editor_3_study_timetable")
      .select("*")
      .order("start_time")

    if (error) {
      setError(`Database error: ${error.message}`)
      setStudies([])
      return
    }

    if (!data || data.length === 0) {
      setStudies([])
      return
    }

    const validStudies: Study[] = []

    data.forEach((item: any, index: number) => {
      if (!item.start_time || !item.end_time || !item.study_name) return

      const startParts = item.start_time.split(" ")
      const endParts = item.end_time.split(" ")

      if (startParts.length < 2 || endParts.length < 2) return

      const day = startParts[0]
      const startTime = startParts[1]
      const endTime = endParts[1]

      validStudies.push({
        id: item.id?.toString() || `temp-${index}`,
        name: item.study_name,
        leader: item.leader || "Unknown",
        color: item.color || "#6b7280",
        day,
        startTime,
        endTime,
        startSlot: timeToSlot(startTime),
        endSlot: timeToSlot(endTime),
      })
    })

    setStudies(validStudies)
  } catch (err) {
    console.error(err)
    setError("Failed to load studies")
    setStudies([])
  } finally {
    setIsLoading(false)
  }
}

      setStudies(validStudies)
    } catch (err) {
      setError("Failed to load studies.")
      setStudies([])
    } finally {
      setIsLoading(false)
    }
  }

  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 11; hour <= 22; hour++) {
      slots.push({ type: "hour", hour })
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const days = ["월요일", "화요일", "수요일", "목요일", "금요일"]
  const dayLabels = ["월", "화", "수", "목", "금"]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">{error}</span>
        </div>
      )}

      {studies.length === 0 && !isLoading && (
        <div className="text-center p-8 text-muted-foreground">
          <p>No studies found in the database.</p>
        </div>
      )}

      {studies.length > 0 && (
        <div className="w-full">
          <div className="bg-card rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <div className="w-full min-w-[300px]">
                <div className="grid grid-cols-[0.3fr_repeat(5,1fr)] border-b bg-white">
                  <div className="p-2 text-center font-medium text-xs sm:text-sm"></div>
                  {dayLabels.map((day) => (
                    <div key={day} className="p-1 text-center font-medium text-[10px] border-l">
                      {day}
                    </div>
                  ))}
                </div>

                {timeSlots.map((slot) => {
                  const hour = slot.hour!

                  return (
                    <div
                      key={`hour-${hour}`}
                      className="grid grid-cols-[0.3fr_repeat(5,1fr)] border-b relative"
                      style={{ minHeight: "45px" }}
                    >
                      <div className="px-0.5 py-0.5 text-right text-[9px] font-medium bg-white">
                        {hour % 12 === 0 ? 12 : hour % 12}
                      </div>

                      {days.map((day) => {
                        const dayStudies = studies.filter(
                          (study) =>
                            study.day === day &&
                            study.startSlot < (hour - 9 + 1) * 2 &&
                            study.endSlot > (hour - 9) * 2
                        )

                        return (
                          <div key={day} className="border-l relative overflow-visible">
                            {dayStudies.map((study) => {
                              const startHour = Math.floor(study.startSlot / 2) + 9

                              if (startHour !== hour) return null

                              const overlappingStudies = dayStudies.filter(
                                (s) =>
                                  s.startSlot < study.endSlot &&
                                  s.endSlot > study.startSlot
                              )

                              const overlapIndex = overlappingStudies.findIndex(
                                (s) => s.id === study.id
                              )

                              const height = (study.endSlot - study.startSlot) * 22
                              const offset = overlapIndex * 7

                              return (
                                <div
                                  key={study.id}
                                  className="
                                    absolute
                                    p-1
                                    text-xs
                                    rounded-md
                                    overflow-hidden
                                    shadow-sm
                                    transition-all
                                    duration-200
                                    hover:z-50
                                    hover:scale-105
                                  "
                                  style={{
                                    backgroundColor: `${study.color}33`,
                                    border: `2px solid ${study.color}`,
                                    color: "#111827",
                                    height: `${height}px`,
                                    top: `${(study.startSlot % 2) * 25 + offset}px`,
                                    left: `${offset}px`,
                                    right: `${offset}px`,
                                    zIndex: 10 + overlapIndex,
                                    backdropFilter: "blur(2px)",
                                  }}
                                  title={`${study.name} / ${study.leader} / ${study.startTime}~${study.endTime}`}
                                >
                                  <div className="font-bold text-[10px] leading-tight break-words">
                                    {study.name}
                                  </div>
                                  <div className="text-[9px] leading-tight break-words opacity-80">
                                    {study.leader}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimetableDemo
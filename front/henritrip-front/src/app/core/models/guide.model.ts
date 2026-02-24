export interface Activity {
  id: number
  title: string
  description?: string
  startTime?: string
  endTime?: string
  location?: string
}

export interface GuideDay {
  id: number
  dayNumber: number
  title: string
  date?: string
  activities: Activity[]
}

export interface Guide {
  id: number
  title: string
  description: string
  destination?: string
  coverImageUrl?: string
  daysCount?: number
}

export interface GuideDetail extends Guide {
  days: GuideDay[]
}

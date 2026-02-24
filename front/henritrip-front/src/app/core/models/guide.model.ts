export interface Guide {
  id: number
  title: string
  description: string
  destination?: string
  coverImageUrl?: string
  daysCount?: number
  mobility?: string
  season?: string
  forWho?: string
}

export interface GuideActivity {
  id: number
  title: string
  description: string
  category: string
  address: string
  phoneNumber?: string
  openingHours?: string
  website?: string
  startTime?: string
  endTime?: string
  forWho?: string
  visitOrder: number
}

export interface GuideDay {
  id: number
  dayNumber: number
  title: string
  date?: string
  activities: GuideActivity[]
}

export interface GuideDetail extends Guide {
  days: GuideDay[]
  invitedUserIds?: number[]
}

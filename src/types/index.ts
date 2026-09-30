// ── Daily Verse / Monthly JSON types ──────────────────────────────────────
export interface DailyContent {
  id:               string   // "2026-09-01-001"
  date:             string   // "2026-09-01"
  verse_of_the_day: VerseOfDay
  reflection:       Section
  daily_prayer:     Section
  life_application: Section
}

export interface VerseOfDay {
  reference: string   // "Proverbs 22:1"
  text:      string
}

export interface Section {
  title:   string
  content: string
}

// ── Story types ───────────────────────────────────────────────────────────
export interface Story {
  id:               string   // "story_001"
  title:            string
  tag:              string   // "Prophecy" | "Faith" | ...
  summary:          string
  image_name:       string   // Firebase Storage reference key
  read_time:        string   // "7 min read"
  scripture:        string
  story:            string
  reflection:       string
  prayer:           string
  life_application: string
}

// ── Prayer types ──────────────────────────────────────────────────────────
export interface PrayerCategory {
  id:          string
  name:        string
  description: string
  icon:        string
  count:       number
}

export interface Prayer {
  id:         string
  title:      string
  category:   string
  content:    string
  scripture?: string
  tags?:      string[]
  createdAt?: string
}

// ── Jesus Teaching types ──────────────────────────────────────────────────
export interface JesusTeaching {
  id:          number | string
  topic?:      string
  title:       string
  reference:   string
  teaching?:   string
  meaning?:    string
  application?: string
  content?:    string
  scripture?:  string
  tag?:        string
  image_name?: string
}

// ── Community Creation types ──────────────────────────────────────────────
export interface CommunityCreation {
  id:        string
  imageUrl:  string
  verse:     string
  reference: string
  author?:   string
  likes?:    number
  createdAt: string
}

// ── Bible types ───────────────────────────────────────────────────────────
export interface BibleBook {
  id:       number
  name:     string
  abbrev:   string
  chapters: number
}

export interface BibleVerse {
  book:    string
  chapter: number
  verse:   number
  text:    string
}

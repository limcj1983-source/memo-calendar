import * as chrono from 'chrono-node'

export interface ExtractedDate {
  text: string
  startDate: Date
  endDate?: Date
  index: number
}

function parseKoreanDate(text: string): ExtractedDate[] {
  const results: ExtractedDate[] = []
  const now = new Date()

  // 오전/오후 N시 먼저 파싱
  const timePattern = /(오전|오후)\s?(\d{1,2})시?/g
  let hourOffset = 9
  let hasTime = false

  const timeMatches = Array.from(text.matchAll(timePattern))
  if (timeMatches.length > 0) {
    const tm = timeMatches[0]
    const meridiem = tm[1]
    const hour = parseInt(tm[2])
    hourOffset = meridiem === '오후' && hour < 12 ? hour + 12 : hour
    hasTime = true
  }

  // 내일
  const tomorrowPattern = /내일/g
  const tomorrowMatches = Array.from(text.matchAll(tomorrowPattern))
  if (tomorrowMatches.length > 0) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(hasTime ? hourOffset : 9, 0, 0, 0)

    results.push({
      text: '내일' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: tomorrow,
      index: tomorrowMatches[0].index!
    })
  }

  // 모레
  const dayAfterPattern = /모레/g
  const dayAfterMatches = Array.from(text.matchAll(dayAfterPattern))
  if (dayAfterMatches.length > 0) {
    const dayAfter = new Date(now)
    dayAfter.setDate(dayAfter.getDate() + 2)
    dayAfter.setHours(hasTime ? hourOffset : 9, 0, 0, 0)

    results.push({
      text: '모레' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: dayAfter,
      index: dayAfterMatches[0].index!
    })
  }

  // N일 후
  const daysLaterPattern = /(\d+)일?\s?후/g
  const daysLaterMatches = Array.from(text.matchAll(daysLaterPattern))
  for (const match of daysLaterMatches) {
    const days = parseInt(match[1])
    const futureDate = new Date(now)
    futureDate.setDate(futureDate.getDate() + days)
    futureDate.setHours(hasTime ? hourOffset : 9, 0, 0, 0)

    results.push({
      text: match[0],
      startDate: futureDate,
      index: match.index!
    })
  }

  // 다음주 요일
  const nextWeekPattern = /다음\s?주\s?(월|화|수|목|금|토|일)요일/g
  const nextWeekMatches = Array.from(text.matchAll(nextWeekPattern))
  for (const match of nextWeekMatches) {
    const dayMap: { [key: string]: number } = {
      '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 0
    }
    const targetDay = dayMap[match[1]]
    const currentDay = now.getDay()
    let daysToAdd = targetDay - currentDay + 7
    if (daysToAdd < 7) daysToAdd += 7

    const nextWeekDate = new Date(now)
    nextWeekDate.setDate(nextWeekDate.getDate() + daysToAdd)
    nextWeekDate.setHours(hasTime ? hourOffset : 9, 0, 0, 0)

    results.push({
      text: match[0],
      startDate: nextWeekDate,
      index: match.index!
    })
  }

  // N월 N일
  const monthDayPattern = /(\d{1,2})월\s?(\d{1,2})일/g
  const monthDayMatches = Array.from(text.matchAll(monthDayPattern))
  for (const match of monthDayMatches) {
    const month = parseInt(match[1]) - 1
    const day = parseInt(match[2])
    const year = now.getFullYear()
    const targetDate = new Date(year, month, day)

    // 이미 지난 날짜면 내년으로
    if (targetDate < now) {
      targetDate.setFullYear(year + 1)
    }

    targetDate.setHours(hasTime ? hourOffset : 9, 0, 0, 0)

    results.push({
      text: match[0],
      startDate: targetDate,
      index: match.index!
    })
  }

  return results
}

export function extractDates(text: string): ExtractedDate[] {
  // Try chrono first (for English)
  const chronoResults = chrono.parse(text, new Date(), { forwardDate: true })
  const results: ExtractedDate[] = chronoResults.map((result) => ({
    text: result.text,
    startDate: result.start.date(),
    endDate: result.end ? result.end.date() : undefined,
    index: result.index
  }))

  // Add Korean date parsing
  const koreanResults = parseKoreanDate(text)
  results.push(...koreanResults)

  return results
}

export function hasDateReferences(text: string): boolean {
  const chronoResults = chrono.parse(text)
  const koreanResults = parseKoreanDate(text)
  return chronoResults.length > 0 || koreanResults.length > 0
}

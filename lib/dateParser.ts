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

  // 오전/오후 N시 N분 파싱 (분은 선택적)
  const timePattern = /(오전|오후)\s?(\d{1,2})시?\s?(\d{1,2}분)?/g
  let hourOffset = 9
  let minuteOffset = 0
  let hasTime = false

  const timeMatches = Array.from(text.matchAll(timePattern))
  if (timeMatches.length > 0) {
    const tm = timeMatches[0]
    const meridiem = tm[1]
    const hour = parseInt(tm[2])
    const minute = tm[3] ? parseInt(tm[3]) : 0

    // 오전/오후 처리
    if (meridiem === '오후') {
      hourOffset = hour === 12 ? 12 : hour + 12
    } else {
      hourOffset = hour === 12 ? 0 : hour
    }
    minuteOffset = minute
    hasTime = true

    console.log('🕐 Time parsed:', {
      text: tm[0],
      meridiem,
      hour,
      minute,
      hourOffset,
      minuteOffset
    })
  }

  // Helper function to create date with KST timezone
  const createKSTDate = (baseDate: Date, hour: number, minute: number): Date => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth() + 1
    const day = baseDate.getDate()
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
    return new Date(dateString)
  }

  // 내일
  const tomorrowPattern = /내일/g
  const tomorrowMatches = Array.from(text.matchAll(tomorrowPattern))
  if (tomorrowMatches.length > 0) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = createKSTDate(tomorrow, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: '내일' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: tomorrowDate,
      index: tomorrowMatches[0].index!
    })
  }

  // 모레
  const dayAfterPattern = /모레/g
  const dayAfterMatches = Array.from(text.matchAll(dayAfterPattern))
  if (dayAfterMatches.length > 0) {
    const dayAfter = new Date(now)
    dayAfter.setDate(dayAfter.getDate() + 2)
    const dayAfterDate = createKSTDate(dayAfter, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: '모레' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: dayAfterDate,
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
    const futureDateKST = createKSTDate(futureDate, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: match[0],
      startDate: futureDateKST,
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
    const nextWeekDateKST = createKSTDate(nextWeekDate, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: match[0],
      startDate: nextWeekDateKST,
      index: match.index!
    })
  }

  // N월 N일 (한글 형식)
  const monthDayPattern = /(\d{1,2})월\s?(\d{1,2})일/g
  const monthDayMatches = Array.from(text.matchAll(monthDayPattern))
  for (const match of monthDayMatches) {
    const month = parseInt(match[1])
    const day = parseInt(match[2])
    let year = now.getFullYear()

    // 날짜 문자열 생성 (한국 시간대 +09:00 명시)
    const hour = hasTime ? hourOffset : 9
    const minute = hasTime ? minuteOffset : 0
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`

    const targetDate = new Date(dateString)

    // 이미 지난 날짜면 내년으로
    if (targetDate < now) {
      year += 1
      const nextYearDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
      const nextYearDate = new Date(nextYearDateString)
      results.push({
        text: match[0],
        startDate: nextYearDate,
        index: match.index!
      })
    } else {
      results.push({
        text: match[0],
        startDate: targetDate,
        index: match.index!
      })
    }

    console.log('📅 Korean date parsed:', {
      text: match[0],
      month,
      day,
      hasTime,
      hour,
      minute,
      dateString,
      finalDate: targetDate.toISOString()
    })
  }

  // 숫자 날짜 형식: 11.05, 11/5, 11-5
  const numericDatePattern = /(\d{1,2})[.\/\-](\d{1,2})/g
  const numericMatches = Array.from(text.matchAll(numericDatePattern))
  for (const match of numericMatches) {
    const month = parseInt(match[1])
    const day = parseInt(match[2])

    // 유효한 월/일 범위 체크
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      let year = now.getFullYear()

      // 날짜 문자열 생성 (한국 시간대 +09:00 명시)
      const hour = hasTime ? hourOffset : 9
      const minute = hasTime ? minuteOffset : 0
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`

      const targetDate = new Date(dateString)

      // 이미 지난 날짜면 내년으로
      if (targetDate < now) {
        year += 1
        const nextYearDateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+09:00`
        const nextYearDate = new Date(nextYearDateString)
        results.push({
          text: match[0],
          startDate: nextYearDate,
          index: match.index!
        })
      } else {
        results.push({
          text: match[0],
          startDate: targetDate,
          index: match.index!
        })
      }
    }
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

  // 중복 제거 (같은 위치의 날짜는 하나만)
  const seen = new Set(results.map(r => r.index))
  for (const kr of koreanResults) {
    if (!seen.has(kr.index)) {
      results.push(kr)
      seen.add(kr.index)
    }
  }

  return results
}

export function hasDateReferences(text: string): boolean {
  const chronoResults = chrono.parse(text)
  const koreanResults = parseKoreanDate(text)
  return chronoResults.length > 0 || koreanResults.length > 0
}

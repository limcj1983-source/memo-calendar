import * as chrono from 'chrono-node'

export interface ExtractedDate {
  text: string
  startDate: string  // ISO string without timezone
  endDate?: string   // ISO string without timezone
  index: number
}

// Helper to convert Date to ISO string without timezone (YYYY-MM-DDTHH:mm:ss)
function dateToLocalISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
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

  // Helper function to create date with local time (no timezone conversion)
  const createLocalDate = (baseDate: Date, hour: number, minute: number): Date => {
    const year = baseDate.getFullYear()
    const month = baseDate.getMonth()
    const day = baseDate.getDate()
    return new Date(year, month, day, hour, minute, 0, 0)
  }

  // 내일
  const tomorrowPattern = /내일/g
  const tomorrowMatches = Array.from(text.matchAll(tomorrowPattern))
  if (tomorrowMatches.length > 0) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDate = createLocalDate(tomorrow, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: '내일' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: dateToLocalISO(tomorrowDate),
      index: tomorrowMatches[0].index!
    })
  }

  // 모레
  const dayAfterPattern = /모레/g
  const dayAfterMatches = Array.from(text.matchAll(dayAfterPattern))
  if (dayAfterMatches.length > 0) {
    const dayAfter = new Date(now)
    dayAfter.setDate(dayAfter.getDate() + 2)
    const dayAfterDate = createLocalDate(dayAfter, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: '모레' + (hasTime ? ' ' + timeMatches[0][0] : ''),
      startDate: dateToLocalISO(dayAfterDate),
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
    const futureDateLocal = createLocalDate(futureDate, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: match[0],
      startDate: dateToLocalISO(futureDateLocal),
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
    const nextWeekDateLocal = createLocalDate(nextWeekDate, hasTime ? hourOffset : 9, hasTime ? minuteOffset : 0)

    results.push({
      text: match[0],
      startDate: dateToLocalISO(nextWeekDateLocal),
      index: match.index!
    })
  }

  // N월 N일 (한글 형식)
  const monthDayPattern = /(\d{1,2})월\s?(\d{1,2})일/g
  const monthDayMatches = Array.from(text.matchAll(monthDayPattern))
  for (const match of monthDayMatches) {
    const month = parseInt(match[1]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(match[2])
    let year = now.getFullYear()

    // 시간 설정 (입력된 그대로 사용)
    const hour = hasTime ? hourOffset : 9
    const minute = hasTime ? minuteOffset : 0

    // 로컬 시간으로 날짜 생성 (timezone 변환 없음)
    const targetDate = new Date(year, month, day, hour, minute, 0, 0)

    // 이미 지난 날짜면 내년으로
    if (targetDate < now) {
      year += 1
      const nextYearDate = new Date(year, month, day, hour, minute, 0, 0)
      results.push({
        text: match[0],
        startDate: dateToLocalISO(nextYearDate),
        index: match.index!
      })
    } else {
      results.push({
        text: match[0],
        startDate: dateToLocalISO(targetDate),
        index: match.index!
      })
    }

    console.log('📅 Korean date parsed:', {
      text: match[0],
      month: month + 1,
      day,
      hasTime,
      hour,
      minute,
      finalDate: targetDate.toISOString()
    })
  }

  // 숫자 날짜 형식: 11.05, 11/5, 11-5
  const numericDatePattern = /(\d{1,2})[.\/\-](\d{1,2})/g
  const numericMatches = Array.from(text.matchAll(numericDatePattern))
  for (const match of numericMatches) {
    const month = parseInt(match[1]) - 1 // JavaScript months are 0-indexed
    const day = parseInt(match[2])

    // 유효한 월/일 범위 체크
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      let year = now.getFullYear()

      // 시간 설정 (입력된 그대로 사용)
      const hour = hasTime ? hourOffset : 9
      const minute = hasTime ? minuteOffset : 0

      // 로컬 시간으로 날짜 생성 (timezone 변환 없음)
      const targetDate = new Date(year, month, day, hour, minute, 0, 0)

      // 이미 지난 날짜면 내년으로
      if (targetDate < now) {
        year += 1
        const nextYearDate = new Date(year, month, day, hour, minute, 0, 0)
        results.push({
          text: match[0],
          startDate: dateToLocalISO(nextYearDate),
          index: match.index!
        })
      } else {
        results.push({
          text: match[0],
          startDate: dateToLocalISO(targetDate),
          index: match.index!
        })
      }
    }
  }

  return results
}

// Parse English time formats like "pm3", "am11"
function parseEnglishTime(text: string): { hour: number; minute: number } | null {
  const pmPattern = /pm(\d{1,2})/i
  const amPattern = /am(\d{1,2})/i

  const pmMatch = text.match(pmPattern)
  if (pmMatch) {
    const hour = parseInt(pmMatch[1])
    return {
      hour: hour === 12 ? 12 : hour + 12,
      minute: 0
    }
  }

  const amMatch = text.match(amPattern)
  if (amMatch) {
    const hour = parseInt(amMatch[1])
    return {
      hour: hour === 12 ? 0 : hour,
      minute: 0
    }
  }

  return null
}

export function extractDates(text: string): ExtractedDate[] {
  const now = new Date()

  // Try chrono first (for English) - use current date as reference
  const chronoResults = chrono.parse(text, now, { forwardDate: true })
  const results: ExtractedDate[] = chronoResults.map((result) => {
    const parsedDate = result.start.date()

    // chrono가 반환한 Date에서 숫자만 추출해서 로컬 Date 생성
    let localDate = new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
      parsedDate.getHours(),
      parsedDate.getMinutes(),
      parsedDate.getSeconds()
    )

    // chrono가 시간을 파싱하지 못한 경우 (기본값 12:00), pm3/am11 같은 형식 확인
    if (parsedDate.getHours() === 12 && parsedDate.getMinutes() === 0) {
      const timeInfo = parseEnglishTime(text)
      if (timeInfo) {
        localDate = new Date(
          parsedDate.getFullYear(),
          parsedDate.getMonth(),
          parsedDate.getDate(),
          timeInfo.hour,
          timeInfo.minute,
          0
        )
      }
    }

    console.log('🌍 Chrono parsed:', {
      text: result.text,
      parsed: parsedDate.toISOString(),
      year: parsedDate.getFullYear(),
      month: parsedDate.getMonth(),
      date: parsedDate.getDate(),
      hours: parsedDate.getHours(),
      minutes: parsedDate.getMinutes(),
      localDate: localDate.toISOString()
    })

    return {
      text: result.text,
      startDate: dateToLocalISO(localDate),
      endDate: result.end ? dateToLocalISO(new Date(
        result.end.date().getFullYear(),
        result.end.date().getMonth(),
        result.end.date().getDate(),
        result.end.date().getHours(),
        result.end.date().getMinutes(),
        result.end.date().getSeconds()
      )) : undefined,
      index: result.index
    }
  })

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

  console.log('📋 All extracted dates:', results.map(r => ({
    text: r.text,
    date: r.startDate.toISOString(),
    localTime: r.startDate.toLocaleString('ko-KR')
  })))

  return results
}

export function hasDateReferences(text: string): boolean {
  const chronoResults = chrono.parse(text)
  const koreanResults = parseKoreanDate(text)
  return chronoResults.length > 0 || koreanResults.length > 0
}

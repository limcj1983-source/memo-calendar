'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'

export default function LanguageSwitcher() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const currentLocale = params.locale as string

  const switchLanguage = (newLocale: string) => {
    // Replace the locale in the pathname
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  return (
    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLanguage(locale)}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            currentLocale === locale
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {locale === 'en' ? 'EN' : '한국어'}
        </button>
      ))}
    </div>
  )
}

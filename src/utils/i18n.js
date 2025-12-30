import koTranslations from '../locales/ko.json'
import enTranslations from '../locales/en.json'

const translations = {
  ko: koTranslations,
  en: enTranslations
}

// 기본 언어는 영문
const defaultLanguage = 'en'

// 현재 언어 가져오기 (localStorage 또는 기본값)
export const getCurrentLanguage = () => {
  const saved = localStorage.getItem('language')
  if (saved === '한글' || saved === 'ko') return 'ko'
  if (saved === 'English' || saved === 'en') return 'en'
  return defaultLanguage
}

// 언어 설정
export const setLanguage = (lang) => {
  const langCode = lang === '한글' ? 'ko' : 'en'
  localStorage.setItem('language', langCode)
  return langCode
}

// 번역 함수
export const t = (key, lang = null) => {
  const currentLang = lang || getCurrentLanguage()
  const keys = key.split('.')
  let value = translations[currentLang]
  
  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      // 번역이 없으면 기본 언어(영문)에서 찾기
      value = translations[defaultLanguage]
      for (const k2 of keys) {
        if (value && typeof value === 'object') {
          value = value[k2]
        } else {
          return key // 번역이 없으면 키 반환
        }
      }
      break
    }
  }
  
  // 빈 문자열도 유효한 값으로 처리
  if (value === undefined || value === null) {
    return key
  }
  return value
}

// 언어 이름 가져오기
export const getLanguageName = (langCode) => {
  return langCode === 'ko' ? '한글' : 'English'
}

export default {
  getCurrentLanguage,
  setLanguage,
  t,
  getLanguageName
}


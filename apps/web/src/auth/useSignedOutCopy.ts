import { en, es } from '@mygame/catalog'
import { useContext, useEffect, useState } from 'react'
import { DocumentLanguageContext } from '../copy/DocumentLanguageContext'
import type { LineLanguage } from '../design-system/Label'
import type { SignedOutCopy } from './SignedOutCopy'
import { keepSignedOutLanguage, signedOutLanguageOf } from './signedOutLanguage'

const browserStorage = (): Storage => window.localStorage

export function useSignedOutCopy(): SignedOutCopy {
  const drawDocumentIn = useContext(DocumentLanguageContext)
  if (drawDocumentIn === undefined) {
    throw new Error('useSignedOutCopy needs the root document above it')
  }
  const [language, setLanguage] = useState<LineLanguage>(() =>
    signedOutLanguageOf(browserStorage, navigator.language),
  )
  useEffect(() => {
    drawDocumentIn(language)
    return () => drawDocumentIn('en')
  }, [drawDocumentIn, language])
  const onSwitch = (switched: LineLanguage): void => {
    keepSignedOutLanguage(browserStorage, switched)
    setLanguage(switched)
  }
  return { language, catalog: language === 'es' ? es : en, onSwitch }
}

import fs from 'fs'
import path from 'path'

interface ContentPage {
  pageTitle: string
  content: string
}

const pageTitles: Record<string, Record<string, string>> = {
  en: {
    accessibility: 'Accessibility statement for Check in with your probation officer',
    guidance: 'About the Check in with your probation officer service',
    'practitioner-guidance': 'About online check ins',
    privacy: 'Probation Service Privacy Notice',
  },
  cy: {
    accessibility: "Datganiad hygyrchedd ar gyfer Cofrestru gyda'ch swyddog prawf",
    guidance: "Ynglŷn â'r gwasanaeth Cofrestru gyda'ch swyddog prawf",
    'practitioner-guidance': 'Ynglŷn â chofrestriadau ar-lein',
    privacy: 'Hysbysiad Preifatrwydd Gwasanaeth Prawf',
  },
}

export default function loadContentPage(pageName: string, language: string = 'en'): ContentPage {
  const lang = pageTitles[language] ? language : 'en'
  const title = pageTitles[lang]?.[pageName]

  if (!title) {
    throw new Error(`Unknown content page: ${pageName}`)
  }

  const htmlPath = path.join(__dirname, '..', 'content', lang, `${pageName}.html`)
  const content = fs.readFileSync(htmlPath, 'utf-8')

  return {
    pageTitle: title,
    content,
  }
}

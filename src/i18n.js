import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en  from './locales/en.json'
import fr  from './locales/fr.json'
import sw  from './locales/sw.json'
import mfe from './locales/mfe.json'
import pt  from './locales/pt.json'
import ar  from './locales/ar.json'
import hi  from './locales/hi.json'
import am  from './locales/am.json'
import ha  from './locales/ha.json'
import yo  from './locales/yo.json'
import ig  from './locales/ig.json'
import zu  from './locales/zu.json'
import so  from './locales/so.json'
import mg  from './locales/mg.json'
import sn  from './locales/sn.json'
import bn  from './locales/bn.json'
import tl  from './locales/tl.json'
import vi  from './locales/vi.json'
import id  from './locales/id.json'
import th  from './locales/th.json'
import ur  from './locales/ur.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en:  { translation: en },
      fr:  { translation: fr },
      sw:  { translation: sw },
      mfe: { translation: mfe },
      pt:  { translation: pt },
      ar:  { translation: ar },
      hi:  { translation: hi },
      am:  { translation: am },
      ha:  { translation: ha },
      yo:  { translation: yo },
      ig:  { translation: ig },
      zu:  { translation: zu },
      so:  { translation: so },
      mg:  { translation: mg },
      sn:  { translation: sn },
      bn:  { translation: bn },
      tl:  { translation: tl },
      vi:  { translation: vi },
      id:  { translation: id },
      th:  { translation: th },
      ur:  { translation: ur },
    },
    lng: localStorage.getItem('gg_language') || 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  })

export default i18n

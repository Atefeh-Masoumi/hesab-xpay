import { toAbsoluteUrl } from '@/utils';
import arMessages from './messages/ar.json';
import enMessages from './messages/en.json';
import frMessages from './messages/fr.json';
import zhMessages from './messages/zh.json';
import faMessages from './messages/fa.json';
import { type TLanguage } from './types.d';

const I18N_MESSAGES = {
  en: enMessages,
  ar: arMessages,
  fr: frMessages,
  zh: zhMessages,
  fa:faMessages,
};

const I18N_CONFIG_KEY = 'i18nConfig';

const I18N_LANGUAGES: readonly TLanguage[] = [
  {
    label: 'English',
    code: 'en',
    direction: 'ltr',
    flag: toAbsoluteUrl('/media/flag/united-states.svg'),
    messages: I18N_MESSAGES.en
  },
  {
    label: 'Farsi ',
    code: 'fa',
    direction: 'rtl',
    flag: toAbsoluteUrl('/media/flag/iran.svg'),
    messages: I18N_MESSAGES.fa
  }
  
];

const I18N_DEFAULT_LANGUAGE: TLanguage = I18N_LANGUAGES[0];

export { I18N_CONFIG_KEY, I18N_DEFAULT_LANGUAGE, I18N_LANGUAGES, I18N_MESSAGES };

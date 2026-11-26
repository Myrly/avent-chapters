import { frenchCoreMessages } from "./i18n-fr-core.js";
import { frenchEpubMessages } from "./i18n-fr-epub.js";
import { englishCoreMessages } from "./i18n-en-core.js";
import { englishEpubMessages } from "./i18n-en-epub.js";
import { savedMessages } from "./i18n-saved-messages.js";

export const messages = {
  fr: { ...frenchCoreMessages, ...frenchEpubMessages, ...savedMessages.fr },
  en: { ...englishCoreMessages, ...englishEpubMessages, ...savedMessages.en },
};

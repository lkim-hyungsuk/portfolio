const JSESSIONID_REGEX = /JSESSIONID="?([^";]+)"?/;
const INTERFACE_LOCALE_REGEX = /v=2&lang=([^;&"]*)/;

export function getCsrfToken() {
  const match = document.cookie.match(JSESSIONID_REGEX);
  return (match && match[1]) || '';
}

export function getInterfaceLocale(): string {
  const langMatch = document.cookie.match(INTERFACE_LOCALE_REGEX);

  if (langMatch && langMatch[1]) {
    return langMatch[1];
  }
  return '';
}

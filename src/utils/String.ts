const toAbsoluteApiUrl = (pathname: string): string => import.meta.env.VITE_APP_PUBLIC_URL + pathname;

const digitSeparator = (value?: number | string): string => {
  if (value === undefined || value === null) return '0';
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return '0';
  
  return numValue.toLocaleString('fa-IR');
};

export const camelToSnakeCase = (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
};

export const snakeToCamelCase = (str: string) => {
  return str.replace(/(_\w)/g, (match) => match[1].toUpperCase());
};

export { toAbsoluteApiUrl, digitSeparator };

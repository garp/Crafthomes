import { clsx, type ClassValue } from 'clsx';
import { toast } from 'react-toastify';
import { twMerge } from 'tailwind-merge';
import DOMPurify from 'dompurify';
import type { TErrorResponse } from '../store/types/common.types';
import type { TCurrency } from '../store/types/project.types';
import type { TFormMode } from '../types/common.types';
import type { TTaskAssignee } from '../store/types/task.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getFromLocal = <T>(key: string): T | null => {
  const userData = localStorage.getItem(key);
  try {
    return userData ? (JSON.parse(userData) as T) : null;
  } catch (error) {
    console.error('Error parsing userData:', error);
    return null;
  }
};

export const setInLocal = (key: string, value: any) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.log('Error in setting data', e);
  }
};

export function debounce<F extends (...args: any[]) => void>(fn: F, delay: number) {
  let timer: ReturnType<typeof setTimeout>;

  return function (this: any, ...args: Parameters<F>) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  } as F & { cancel: () => void };
}

export function parseSnakeCase(options: { label: string; value: string }[] | undefined) {
  if (!options) return [];
  for (const option of options) {
    option.label = option.label
      .split('_')
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(' ');
  }
  return options;
}

export function parseSnakeCaseString(str: string | undefined) {
  if (!str) return '';
  return str
    ?.split('_')
    ?.map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

export function getParam(key: string) {
  const queryString = window.location.search;
  const params = new URLSearchParams(queryString);
  return params.get(key);
}

export function getTotalPages(totalCount: number | undefined, pageLength: number = 10) {
  if (!totalCount) return 1;
  return Math.ceil(totalCount / pageLength);
}

export const buildParams = (arg?: Record<string, any>) => {
  if (!arg) return {};
  const {
    pageNo,
    pageLimit,
    search,
    id,
    searchText,
    phaseId,
    projectId,
    clientId,
    userId,
    designation,
    type,
    status,
    categoryId,
    subCategoryId,
    brandId,
    startDate,
    endDate,
    ...rest
  } = arg;
  return {
    ...(pageNo && { pageNo }),
    ...(pageLimit && { pageLimit }),
    ...(search && { search }),
    ...(id && { id }),
    ...(searchText && { searchText }),
    ...(phaseId && { phaseId }),
    ...(projectId && { projectId }),
    ...(clientId && { clientId }),
    ...(userId && { userId }),
    ...(designation && { designation }),
    ...(type && { type }),
    ...(status && { status }),
    ...(categoryId && { categoryId }),
    ...(subCategoryId && { subCategoryId }),
    ...(brandId && { brandId }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),

    ...rest, // allow custom params if needed
  };
};

export function capitalizeString(str: string) {
  if (!str) return '';
  const splitted = str.split(' ');
  let capitalizedString = '';
  const filtered = splitted.filter(Boolean); //removes white spaces
  for (const st of filtered) {
    capitalizedString += st[0]?.toUpperCase() + st?.slice(1) + (splitted.length > 1 ? ' ' : '');
  }
  // console.log(capitalizedString);
  return capitalizedString;
}

export function parseEndPoint(endpoint: string = '') {
  if (!endpoint) return '';
  return capitalizeString(endpoint.split('-').join(' '));
}

export function handleCatch(error: { data: TErrorResponse }, errorMessage: string) {
  if (error?.data?.message) toast.error(error?.data?.message);
  else toast.error('Internal server error');
  console.error(errorMessage, error);
}

// Format number with Indian comma system (12,50,500)
function formatIndianNumber(num: number, fixedDecimals: boolean = false): string {
  const roundedValue = Math.round(num * 100) / 100; // Round to 2 decimal places
  const [integerPart, decimalPart] = roundedValue.toFixed(2).split('.');

  // Format integer part with Indian comma system
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInteger =
    otherNumbers !== ''
      ? otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
      : lastThree;

  // If fixedDecimals is true, show up to 2 decimals but hide .00
  if (fixedDecimals) {
    // Remove trailing zeros (300.00 → 300, 300.50 → 300.5, 300.55 → 300.55)
    const cleanDecimal = decimalPart.replace(/0+$/, '');
    return cleanDecimal ? `${formattedInteger}.${cleanDecimal}` : formattedInteger;
  }

  // Check if number is a whole number (no decimal part needed)
  if (roundedValue === Math.floor(roundedValue)) {
    return formattedInteger;
  }

  // Has decimal part - remove trailing zeros
  const cleanDecimal = decimalPart.replace(/0+$/, '');

  return cleanDecimal ? `${formattedInteger}.${cleanDecimal}` : formattedInteger;
}

// Format number with US comma system (100,489,999)
function formatUSNumber(num: number, fixedDecimals: boolean = false): string {
  const roundedValue = Math.round(num * 100) / 100; // Round to 2 decimal places
  const [integerPart, decimalPart] = roundedValue.toFixed(2).split('.');

  // Format integer part with US comma system
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // If fixedDecimals is true, show up to 2 decimals but hide .00
  if (fixedDecimals) {
    // Remove trailing zeros (300.00 → 300, 300.50 → 300.5, 300.55 → 300.55)
    const cleanDecimal = decimalPart.replace(/0+$/, '');
    return cleanDecimal ? `${formattedInteger}.${cleanDecimal}` : formattedInteger;
  }

  // Remove trailing zeros from decimal part
  const cleanDecimal = decimalPart.replace(/0+$/, '');

  return cleanDecimal ? `${formattedInteger}.${cleanDecimal}` : formattedInteger;
}

export function prefixCurrencyInPrice(
  mrp: number | undefined | null,
  currency: TCurrency,
  fixedDecimals: boolean = false,
) {
  if (mrp === null || mrp === undefined) return '';

  switch (currency) {
    case 'INR':
      return '₹' + formatIndianNumber(mrp, fixedDecimals);
    case 'USD':
      return '$' + formatUSNumber(mrp, fixedDecimals);
    default:
      return '₹' + formatIndianNumber(mrp, fixedDecimals);
  }
}

export function getButtonText(text: string, disabled: boolean, mode: TFormMode) {
  return mode === 'create'
    ? disabled
      ? 'Creating...'
      : 'Create ' + text
    : disabled
      ? 'Updating...'
      : 'Update ' + text;
}

/**
 * Convert a number to words (Indian numbering system)
 * Supports numbers up to 99,99,99,999 (99 crores)
 */
export function numberToWords(num: number | string | null | undefined): string {
  if (num === null || num === undefined || num === '') return '';

  const number = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(number) || number < 0) return '';
  if (number === 0) return 'Zero';

  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];

  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return one > 0 ? `${tens[ten]} ${ones[one]}` : tens[ten];
    }
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return remainder > 0
      ? `${ones[hundred]} Hundred ${convertHundreds(remainder)}`
      : `${ones[hundred]} Hundred`;
  };

  const convert = (n: number): string => {
    if (n === 0) return '';
    if (n < 100) return convertHundreds(n);
    if (n < 1000) {
      // For numbers 100-999, use hundreds
      return convertHundreds(n);
    }
    if (n < 100000) {
      // Thousands and Lakhs
      if (n < 10000) {
        // 1000 to 9999
        const thousand = Math.floor(n / 1000);
        const remainder = n % 1000;
        return remainder > 0
          ? `${convertHundreds(thousand)} Thousand ${convertHundreds(remainder)}`
          : `${convertHundreds(thousand)} Thousand`;
      } else {
        // 10000 to 99999 (10K to 99K)
        const thousand = Math.floor(n / 1000);
        const remainder = n % 1000;
        return remainder > 0
          ? `${convertHundreds(thousand)} Thousand ${convertHundreds(remainder)}`
          : `${convertHundreds(thousand)} Thousand`;
      }
    }
    if (n < 10000000) {
      // Lakhs (100,000 to 99,99,999)
      const lakh = Math.floor(n / 100000);
      const remainder = n % 100000;
      return remainder > 0
        ? `${convertHundreds(lakh)} Lakh ${convert(remainder)}`
        : `${convertHundreds(lakh)} Lakh`;
    }
    if (n < 1000000000) {
      // Crores (1,00,00,000 to 99,99,99,999)
      const crore = Math.floor(n / 10000000);
      const remainder = n % 10000000;
      return remainder > 0
        ? `${convertHundreds(crore)} Crore ${convert(remainder)}`
        : `${convertHundreds(crore)} Crore`;
    }
    if (n < 100000000000) {
      // 100 Crores to 9999 Crores (Arab: 1,00,00,00,000 to 99,99,99,99,999)
      const arab = Math.floor(n / 1000000000);
      const remainder = n % 1000000000;
      return remainder > 0
        ? `${convert(arab)} Arab ${convert(remainder)}`
        : `${convert(arab)} Arab`;
    }
    if (n < 10000000000000) {
      // 10000 Crores to 99999 Crores (Kharab: 10,00,00,00,00,000 to 99,99,99,99,99,999)
      const kharab = Math.floor(n / 100000000000);
      const remainder = n % 100000000000;
      return remainder > 0
        ? `${convert(kharab)} Kharab ${convert(remainder)}`
        : `${convert(kharab)} Kharab`;
    }
    if (n < 1000000000000000) {
      // 100000 Crores (Neel: 1,00,00,00,00,00,000 to 99,99,99,99,99,99,999)
      const neel = Math.floor(n / 10000000000000);
      const remainder = n % 10000000000000;
      return remainder > 0
        ? `${convert(neel)} Neel ${convert(remainder)}`
        : `${convert(neel)} Neel`;
    }
    return '';
  };

  // Handle decimal part
  const integerPart = Math.floor(number);
  const decimalPart = Math.round((number - integerPart) * 100);

  let result = convert(integerPart).trim();

  if (decimalPart > 0) {
    result += ` and ${convertHundreds(decimalPart)} Paise`;
  }

  return result || '';
}

export function parseHTMLToText(html: string | undefined): string {
  if (!html) return '';
  if (typeof window !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  } else {
    // Fallback for non-browser environments (e.g. SSR)
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string safe for dangerouslySetInnerHTML
 */
export function sanitizeHTML(html: string | undefined | null): string {
  if (!html) return '';
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p',
        'br',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'blockquote',
        'code',
        'pre',
        'span',
        'div',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });
  }
  // Fallback for SSR - basic sanitization
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

export function calculateDuration(
  startDate: string | Date | undefined,
  endDate: string | Date | undefined,
) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const diffMs = end.getTime() - start.getTime();
  if (isNaN(diffMs)) return null;

  const diffSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(diffSeconds / (3600 * 24));
  // const hours = Math.floor((diffSeconds % (3600 * 24)) / 3600);
  // const minutes = Math.floor((diffSeconds % 3600) / 60);

  // Duration = difference in days
  // If start=Jan21 and end=Jan28, duration = 7 days (28-21=7)
  return days;
}

/**
 * Downloads a file from a URL
 * @param url - The URL of the file to download
 * @param filename - The name to save the file as
 */
export const downloadFile = async (url: string, filename: string): Promise<void> => {
  try {
    // Fetch the file as a blob
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    const blob = await response.blob();

    // Create an object URL from the blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Get task assignee names with priority: TaskAssignee first, then assigneeUser as fallback
 * @param task - Task object with TaskAssignee and/or assigneeUser fields
 * @returns Comma-separated string of assignee names or '—' if none
 */
export const isTaskCompleted = (status?: string, taskStatus?: string): boolean => {
  const normalizedStatus = (status || '').toUpperCase();
  const normalizedTaskStatus = (taskStatus || '').toUpperCase();
  return normalizedStatus === 'COMPLETED' || normalizedTaskStatus === 'COMPLETED';
};

export const isTaskApprovalPending = (
  task?: {
    status?: string;
    taskStatus?: string;
    approvalStatus?: string | null;
  } | null,
): boolean => {
  if (!task) return false;
  return (
    isTaskCompleted(task.status, task.taskStatus) &&
    (task.approvalStatus || 'PENDING') !== 'APPROVED'
  );
};

export const isTaskApproved = (task?: { approvalStatus?: string | null } | null): boolean =>
  (task?.approvalStatus || '').toUpperCase() === 'APPROVED';

export const canUserApproveTask = (
  task:
    | {
        status?: string;
        taskStatus?: string;
        approvalStatus?: string | null;
        project?: { assignProjectManager?: string | null } | null;
        phase?: { project?: { assignProjectManager?: string | null } | null } | null;
      }
    | null
    | undefined,
  currentUser?: { id?: string; role?: { name?: string } | null } | null,
): boolean => {
  if (!task || !currentUser?.id) return false;

  const isSuperAdmin = currentUser?.role?.name === 'super_admin';
  const projectManagerId =
    task.project?.assignProjectManager || task.phase?.project?.assignProjectManager;

  return isTaskApprovalPending(task) && (isSuperAdmin || projectManagerId === currentUser.id);
};

export const getTaskAssigneeNames = (
  task?: {
    TaskAssignee?: TTaskAssignee[];
    assigneeUser?: { id: string; name: string } | { id: string; name: string }[];
  } | null,
): string => {
  if (!task) return '—';

  // Priority 1: Use TaskAssignee if available
  if (task?.TaskAssignee && Array.isArray(task.TaskAssignee) && task.TaskAssignee.length > 0) {
    return (
      task.TaskAssignee.filter((ta) => ta?.User?.name)
        .map((ta) => ta?.User?.name)
        .join(', ') || '—'
    );
  }

  // Priority 2: Fallback to assigneeUser
  if (task?.assigneeUser) {
    if (Array.isArray(task.assigneeUser)) {
      const names = task.assigneeUser
        .filter((u) => u?.name) // Filter out invalid entries
        .map((u) => u.name)
        .join(', ');
      return names || '—';
    }
    return task.assigneeUser?.name || '—';
  }

  return '—';
};

/**
 * Formats a comma-separated string of names to show first name, then "+X more" for remaining
 * @param namesString - Comma-separated string of names
 * @returns Formatted string (e.g., "John, +4 more")
 */
export const formatAssigneeNames = (namesString: string): string => {
  if (!namesString || namesString === '—') return namesString;

  const names = namesString
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  if (names.length <= 1) {
    return names.join(', ');
  }

  const firstName = names[0];
  const remainingCount = names.length - 1;
  return `${firstName} +${remainingCount} more`;
};

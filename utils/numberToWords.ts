// Simple integer-to-words converter for amounts up to thousands.
// Examples:
// 4000 -> "Four thousand only"
// 4310 -> "Four thousand three hundred ten only"

function numberToWordsUnderThousand(n: number): string {
  const ones = [
    '',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];

  const tens = [
    '',
    '',
    'twenty',
    'thirty',
    'forty',
    'fifty',
    'sixty',
    'seventy',
    'eighty',
    'ninety',
  ];

  let words = '';

  const hundred = Math.floor(n / 100);
  const rest = n % 100;

  if (hundred > 0) {
    words += `${ones[hundred]} hundred`;
    if (rest > 0) words += ' ';
  }

  if (rest > 0) {
    if (rest < 20) {
      words += ones[rest];
    } else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      words += tens[t];
      if (o > 0) words += ` ${ones[o]}`;
    }
  }

  return words.trim();
}

export function amountNumberToWords(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '';

  const intPart = Math.floor(n);
  if (intPart === 0) return '';

  const thousands = Math.floor(intPart / 1000);
  const rest = intPart % 1000;
  let words = '';

  if (thousands > 0) {
    words += `${numberToWordsUnderThousand(thousands)} thousand`;
    if (rest > 0) words += ' ';
  }

  if (rest > 0) {
    words += numberToWordsUnderThousand(rest);
  }

  const trimmed = words.trim();
  if (!trimmed) return '';
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return `${capitalized} only`;
}



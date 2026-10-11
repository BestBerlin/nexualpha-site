// Turkish dative suffix after a percentage ("%40'a kadar", "%25'e varan").
// The suffix follows the vowel harmony of the spoken number's last word, not of the digits:
// %40 kırk → %40'a, %60 altmış → %60'a, %25 yirmi beş → %25'e, %50 elli → %50'ye, %20 yirmi → %20'ye, %10 on → %10'a.
// A word ending in a vowel takes the buffer consonant "y" ('ye / 'ya).
const UNITS = ["sıfır", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const TENS = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];
const BACK_VOWELS = new Set(["a", "ı", "o", "u"]);
const VOWELS = new Set(["a", "ı", "o", "u", "e", "i", "ö", "ü"]);

// Last spoken word of a non-negative integer read in Turkish.
function lastWordOfInteger(n) {
  if (n === 0) return UNITS[0];
  if (n % 10 !== 0) return UNITS[n % 10];
  if (n % 100 !== 0) return TENS[(n % 100) / 10];
  if (n % 1000 !== 0) return "yüz";
  if (n % 1000000 !== 0) return "bin";
  return "milyon";
}

// Last spoken word of a number; decimals are read "on iki virgül beş", so the fractional digits decide.
export function trNumberLastWord(value) {
  const text = String(value).trim().replace(",", ".");
  const [intPart, fracPart] = text.split(".");
  if (fracPart && /[1-9]/.test(fracPart)) return lastWordOfInteger(Number.parseInt(fracPart.replace(/0+$/, ""), 10));
  return lastWordOfInteger(Math.abs(Number.parseInt(intPart, 10)) || 0);
}

// Dative suffix (with apostrophe) for a number: "'a", "'e", "'ya" or "'ye".
export function trDativeSuffix(value) {
  const word = trNumberLastWord(value);
  const letters = [...word];
  const lastVowel = [...letters].reverse().find((ch) => VOWELS.has(ch)) || "e";
  const vowel = BACK_VOWELS.has(lastVowel) ? "a" : "e";
  const buffer = VOWELS.has(letters[letters.length - 1]) ? "y" : "";
  return `'${buffer}${vowel}`;
}

// "%40'a" — Turkish puts the percent sign before the number.
export function trPercentDative(value) {
  return `%${value}${trDativeSuffix(value)}`;
}

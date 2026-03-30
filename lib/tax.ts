/**
 * HMRC tax thresholds keyed by UK tax year.
 * Update each April when HMRC publishes new rates.
 * All amounts in GBP (not pence).
 *
 * Sources:
 *   https://www.gov.uk/income-tax-rates
 *   https://www.gov.uk/self-employed-national-insurance-rates
 */

interface TaxBands {
  personalAllowance: number  // income below this is tax-free
  basicRateLimit:    number  // basic rate applies up to (personalAllowance + basicRateLimit)
  basicRate:         number  // e.g. 0.20
  higherRate:        number  // e.g. 0.40
  ni4Lower:          number  // Class 4 NI lower profits limit
  ni4Upper:          number  // Class 4 NI upper profits limit
  ni4BasicRate:      number  // e.g. 0.09
  ni4HigherRate:     number  // e.g. 0.02
}

const THRESHOLDS: Record<string, TaxBands> = {
  '2024-25': {
    personalAllowance: 12_570,
    basicRateLimit:    37_700,
    basicRate:         0.20,
    higherRate:        0.40,
    ni4Lower:          12_570,
    ni4Upper:          50_270,
    ni4BasicRate:      0.09,
    ni4HigherRate:     0.02,
  },
  '2025-26': {
    personalAllowance: 12_570,
    basicRateLimit:    37_700,
    basicRate:         0.20,
    higherRate:        0.40,
    ni4Lower:          12_570,
    ni4Upper:          50_270,
    ni4BasicRate:      0.09,
    ni4HigherRate:     0.02,
  },
}

const FALLBACK_TAX_YEAR = '2024-25'

/**
 * Estimate combined Income Tax + Class 4 NI liability for a sole trader.
 * Returns an integer number of pence.
 */
export function estimateTax(
  incomePence:   number,
  expensesPence: number,
  taxYear:       string = FALLBACK_TAX_YEAR,
): number {
  const bands      = THRESHOLDS[taxYear] ?? THRESHOLDS[FALLBACK_TAX_YEAR]
  const profitGBP  = Math.max(0, incomePence - expensesPence) / 100
  const taxable    = Math.max(0, profitGBP - bands.personalAllowance)
  const basicBand  = Math.min(taxable, bands.basicRateLimit)
  const higherBand = Math.max(0, taxable - bands.basicRateLimit)
  const incomeTax  = basicBand * bands.basicRate + higherBand * bands.higherRate

  const ni4Base    = Math.min(Math.max(0, profitGBP - bands.ni4Lower), bands.ni4Upper - bands.ni4Lower)
  const ni4Higher  = Math.max(0, profitGBP - bands.ni4Upper)
  const ni4        = ni4Base * bands.ni4BasicRate + ni4Higher * bands.ni4HigherRate

  return Math.round((incomeTax + ni4) * 100)
}

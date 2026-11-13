const PALETTE = [
  '#e4572e', '#17bebb', '#ffc914', '#76b041',
  '#8e6cdf', '#f283b6', '#3d8bfd', '#ff8c42',
]

/** a default colour for the next new subject */
export function nextColor(count: number): string {
  return PALETTE[count % PALETTE.length]
}

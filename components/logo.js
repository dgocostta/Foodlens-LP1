/* eslint-disable @next/next/no-img-element */
// Full horizontal lockup (icon + "FoodLens" + GROUP) and a square icon-only mark.
const LOGO_URL = '/foodlens-logo.png'
const ICON_URL = '/foodlens-icon.png'

export const FOODLENS_LOGO = LOGO_URL
export const FOODLENS_ICON = ICON_URL

// size = scale; icon = use the square plate mark only (for tight/square spots)
export function Logo({ size = 'md', icon = false, className = '' }) {
  const sizes = {
    xs: 'h-7',
    sm: 'h-8 md:h-9',
    md: 'h-10 md:h-12',
    lg: 'h-12 md:h-16',
    xl: 'h-16 md:h-20',
  }
  return (
    <img
      src={icon ? ICON_URL : LOGO_URL}
      alt="FoodLens Group"
      className={`${sizes[size] || sizes.md} w-auto object-contain select-none drop-shadow-[0_2px_10px_rgba(255,90,31,0.25)] ${className}`}
      draggable={false}
    />
  )
}

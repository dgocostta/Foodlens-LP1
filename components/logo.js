/* eslint-disable @next/next/no-img-element */
const LOGO_URL = 'https://customer-assets.emergentagent.com/wingman/6e978d7c-1e64-42c4-b4ae-a71d4297a51c/attachments/b2e12e6cc719455bbc9b633b05df069b_image.png'

export const FOODLENS_LOGO = LOGO_URL

export function Logo({ size = 'md', showWordmark = false, className = '' }) {
  const sizes = {
    xs: 'h-6',
    sm: 'h-7 md:h-8',
    md: 'h-9 md:h-10',
    lg: 'h-12 md:h-14',
    xl: 'h-16 md:h-20',
  }
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={LOGO_URL}
        alt="FoodLens"
        className={`${sizes[size] || sizes.md} w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,90,31,0.35)] select-none`}
        draggable={false}
      />
      {showWordmark && (
        <span className="font-bold tracking-tight text-base md:text-lg">FoodLens</span>
      )}
    </div>
  )
}

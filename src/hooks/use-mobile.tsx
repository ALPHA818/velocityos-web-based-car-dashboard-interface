import * as React from "react"

const MOBILE_BREAKPOINT = 768

function computeIsMobile(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(computeIsMobile)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(computeIsMobile())
    }
    mql.addEventListener("change", onChange)
    setIsMobile(computeIsMobile())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}

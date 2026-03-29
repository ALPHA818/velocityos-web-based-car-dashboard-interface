import * as React from "react"

const MOBILE_BREAKPOINT = 1024

const MOBILE_UA_PATTERN = /android|iphone|ipad|ipod|mobile/i

export function useIsLandscapeMobile() {
  const [isLandscapeMobile, setIsLandscapeMobile] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const update = () => {
      const shortestSide = Math.min(window.innerWidth, window.innerHeight)
      const isLandscape = window.innerWidth > window.innerHeight

      // Prefer device capability and UA checks so Android WebView landscape is detected
      // even when CSS pixels exceed a strict phone breakpoint.
      const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches
      const isMobileUserAgent = MOBILE_UA_PATTERN.test(navigator.userAgent)
      const isMobileLike = hasCoarsePointer || isMobileUserAgent || shortestSide <= MOBILE_BREAKPOINT

      setIsLandscapeMobile(isLandscape && isMobileLike)
    }

    update()
    window.addEventListener("resize", update)
    window.addEventListener("orientationchange", update)

    return () => {
      window.removeEventListener("resize", update)
      window.removeEventListener("orientationchange", update)
    }
  }, [])

  return isLandscapeMobile
}

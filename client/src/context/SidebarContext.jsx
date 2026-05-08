// client/src/context/SidebarContext.jsx
import { createContext, useContext, useState } from 'react'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggle = () => {
    if (window.innerWidth <= 850) setMobileOpen(o => !o)
    else setCollapsed(c => !c)
  }
  const close = () => setMobileOpen(false)

  return (
    <SidebarContext.Provider value={{ collapsed, mobileOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)

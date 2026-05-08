// client/src/components/common/AppShell.jsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useSidebar } from '../../context/SidebarContext'

const ADD_ROUTES = {
  '/':'/leads','/analytics':'/leads','/leads':'/leads','/quotations':'/quotations',
  '/salespo':'/salespo','/procurement':'/procurement','/inventory':'/inventory',
  '/delivery':'/delivery','/ar':'/ar','/ap':'/ap','/customers':'/customers',
  '/vendors':'/vendors','/catalog':'/catalog','/bglc':'/bglc','/tenders':'/tenders',
}

export default function AppShell() {
  const { mobileOpen, close } = useSidebar()
  const navigate = useNavigate()
  const location = useLocation()

  const handleAddClick = () => {
    const target = ADD_ROUTES[location.pathname]
    if (target) navigate(target)
  }

  return (
    <div className="app-shell">
      {mobileOpen && (
        <div onClick={close} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.3)',zIndex:150 }} />
      )}
      <Sidebar />
      <div className="main">
        <Topbar onAddClick={handleAddClick} />
        <div className="view-container">
          <div className="view view-enter">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

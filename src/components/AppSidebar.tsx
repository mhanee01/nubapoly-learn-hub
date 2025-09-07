import { useAuth } from '@/hooks/useAuth';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Home,
  BookOpen,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  GraduationCap,
  ClipboardList,
  Upload,
  Calendar,
  Award
} from 'lucide-react';

export function AppSidebar() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'hover:bg-sidebar-accent/50';

  // Define navigation items based on user role
  const getNavigationItems = () => {
    const commonItems = [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
    ];

    if (profile?.role === 'student') {
      return [
        ...commonItems,
        // Student-only features can be added here in the future
      ];
    }

    if (profile?.role === 'admin') {
      return [
        ...commonItems,
        { title: 'Users', url: '/users', icon: Users },
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="h-4 w-4" />
                      {state !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
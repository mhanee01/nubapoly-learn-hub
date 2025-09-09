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
  Upload,
  Library,
  UserIcon,
  BarChart3,
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
      { title: 'Profile', url: '/profile', icon: UserIcon },
    ];

    if (profile?.role === 'student') {
      return [
        ...commonItems,
        { title: 'View Books', url: '/books', icon: BookOpen },
        { title: 'Upload Book', url: '/upload', icon: Upload },
        { title: 'Library', url: '/library', icon: Library },
      ];
    }

    if (profile?.role === 'admin') {
      return [
        ...commonItems,
        { title: 'Users', url: '/users', icon: Users },
        { title: 'Analytics', url: '/analytics', icon: BarChart3 },
        { title: 'View Books', url: '/books', icon: BookOpen },
        { title: 'Upload Book', url: '/upload', icon: Upload },
        { title: 'Library', url: '/library', icon: Library },
      ];
    }

    return commonItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {profile?.role === 'admin' ? 'Admin Panel' : 'Student Portal'}
          </SidebarGroupLabel>
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
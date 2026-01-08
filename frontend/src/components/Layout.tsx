import React, { useEffect, useMemo } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space, Typography, theme, Breadcrumb } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import styled from 'styled-components';
import ThemeToggle from './ThemeToggle';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import NotificationBell from './NotificationBell';
import { getMenuItemsForRole, MenuItem, getMenuItemByKey } from '../config/menuConfig';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  z-index: 1;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  height: 64px;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
`;

const StyledContent = styled(Content)`
  margin: 24px 16px;
  padding: 24px;
  min-height: 280px;
  background: #fff;
  border-radius: 8px;
`;

/**
 * Convert MenuItem to Ant Menu item structure
 */
function convertMenuItemToAntMenu(item: MenuItem, allMenuItems: MenuItem[]): any {
  return {
    key: item.key,
    icon: item.icon,
    label: <span title={item.label}>{item.label}</span>,
    children: item.children
      ? item.children.map(child => convertMenuItemToAntMenu(child, allMenuItems))
      : undefined
  };
}

/**
 * Find active menu key from pathname
 */
function getActiveKeyFromPath(pathname: string, menuItems: MenuItem[]): string | undefined {
  // Exact path matches
  const pathMap: Record<string, string> = {
    '/': 'dashboard',
    '/portal': 'dashboard',
    '/appointments': 'appointments',
    '/appointments/new': 'book-appointment',
    '/appointments/emergency': 'emergency-appointment',
    '/doctor/availability-setup': 'availability-setup',
    '/appointments/book-with-slots': 'book-appointment',
    '/patients': 'patients',
    '/records': 'records',
    '/pharmacy': 'pharmacy',
    '/settings': 'settings',
    '/laboratory': 'laboratory',
    '/laboratory/dashboard': 'lab-dashboard',
    '/triage': 'triage',
    '/queue': 'queue',
    '/admin/appointments': 'all-appointments',
    '/admin/appointments-management': 'appointment-management',
    '/admin/services': 'manage-services',
    '/admin/doctors': 'staff',
    '/admin/departments': 'departments-admin',
    '/admin/emergency-requests': 'emergency-requests',
    '/admin/callback-requests': 'callback-requests',
  };

  // Check exact path match first
  if (pathMap[pathname]) {
    return pathMap[pathname];
  }

  // Check prefix matches
  const prefixMap: Record<string, string> = {
    '/appointments/': 'appointments',
    '/appointments/book': 'book-appointment',
    '/doctor/': 'doctor',
    '/patients/': 'patients',
    '/records/': 'records',
    '/pharmacy/': 'pharmacy',
    '/laboratory/': 'laboratory',
    '/admin/appointments': 'all-appointments',
    '/admin/services': 'manage-services',
    '/admin/doctors': 'staff',
    '/admin/': 'staff',
    '/triage/': 'triage',
    '/queue/': 'queue',
    '/billing/': 'billing',
  };

  for (const [prefix, key] of Object.entries(prefixMap)) {
    if (pathname.startsWith(prefix)) {
      return key;
    }
  }

  return undefined;
}

const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = React.useState<boolean>(() => {
    try { return localStorage.getItem('hms_sider_collapsed') === '1'; } catch { return false; }
  });
  const { settings } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const location = useLocation();

  // Use keyboard shortcuts
  useKeyboardShortcuts();

  // Apply settings when component mounts or settings change
  useEffect(() => {
    const layoutElement = document.querySelector('.app-layout');
    if (layoutElement) {
      layoutElement.classList.remove('theme-light', 'theme-dark');
      layoutElement.classList.add(`theme-${settings.theme}`);

      layoutElement.classList.remove('font-small', 'font-medium', 'font-large');
      layoutElement.classList.add(`font-${settings.fontSize}`);

      if (settings.accessibility.highContrastMode) {
        layoutElement.classList.add('high-contrast');
      } else {
        layoutElement.classList.remove('high-contrast');
      }

      if (settings.accessibility.reducedMotion) {
        layoutElement.classList.add('reduced-motion');
      } else {
        layoutElement.classList.remove('reduced-motion');
      }

      if (settings.accessibility.largeText) {
        layoutElement.classList.add('large-text');
      } else {
        layoutElement.classList.remove('large-text');
      }
    }
  }, [settings]);

  React.useEffect(() => {
    try { localStorage.setItem('hms_sider_collapsed', collapsed ? '1' : '0'); } catch {}
  }, [collapsed]);

  // Scroll to top on route change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  // Get menu items for current user role
  const menuItems = useMemo(() => {
    const role = String(user?.role || '').toLowerCase();
    return getMenuItemsForRole(role);
  }, [user?.role]);

  // Get active key from current pathname
  const activeKey = useMemo(() => {
    return getActiveKeyFromPath(location.pathname, menuItems);
  }, [location.pathname, menuItems]);

  // User menu dropdown
  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: <Link to="/profile">Profile</Link> },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: logout },
    ]
  };

  /**
   * Handle menu item click
   */
  const handleMenuClick = (info: any) => {
    let targetItem: MenuItem | undefined = menuItems.find(mi => mi.key === info.key);

    if (!targetItem) {
      for (const item of menuItems) {
        if (item.children) {
          targetItem = item.children.find(child => child.key === info.key);
          if (targetItem) break;
        }
      }
    }

    if (targetItem && targetItem.path) {
      navigate(targetItem.path);
    }
  };

  /**
   * Generate breadcrumb items based on current path
   */
  const breadcrumbItems = useMemo(() => {
    const p = location.pathname;

    if (p === '/' || p === '') {
      return [{ title: 'Dashboard' }];
    }

    // Find menu item to get label
    const menuItem = getMenuItemByKey(activeKey || '');
    if (menuItem?.label) {
      // Check if it's a sub-item (has parent)
      for (const item of menuItems) {
        if (item.children?.some(child => child.key === activeKey)) {
          return [
            { title: item.label },
            { title: menuItem.label }
          ];
        }
      }
      return [{ title: menuItem.label }];
    }

    // Fallback breadcrumb generation
    if (p.startsWith('/admin/')) {
      if (p.startsWith('/admin/appointments')) return [{ title: 'Admin' }, { title: 'Appointments' }];
      if (p.startsWith('/admin/services')) return [{ title: 'Admin' }, { title: 'Services' }];
      if (p.startsWith('/admin/doctors')) return [{ title: 'Admin' }, { title: 'Doctors' }];
      if (p.startsWith('/admin/departments')) return [{ title: 'Admin' }, { title: 'Departments' }];
      if (p.startsWith('/admin/emergency-requests')) return [{ title: 'Admin' }, { title: 'Emergency Requests' }];
      if (p.startsWith('/admin/callback-requests')) return [{ title: 'Admin' }, { title: 'Callback Requests' }];
    }

    return [];
  }, [location.pathname, activeKey, menuItems]);

  return (
    <StyledLayout className="app-layout">
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={250}
        theme="light"
        breakpoint="lg"
        collapsedWidth={60}
        onBreakpoint={(broken) => { if (broken) setCollapsed(true); }}
      >
        <style>{`
          .ant-menu-light .ant-menu-item-selected {
            background-color: rgba(14,165,165,0.10) !important;
            color: ${token.colorPrimary} !important;
          }
          .ant-menu-light .ant-menu-item:hover {
            color: ${token.colorPrimary} !important;
          }
          .ant-menu-light .ant-menu-item-selected .ant-menu-item-icon,
          .ant-menu-light .ant-menu-item-selected a { color: ${token.colorPrimary} !important; }
          .ant-menu-light .ant-menu-item-selected::before {
            content: '';
            position: absolute;
            left: 0; top: 6px; bottom: 6px;
            width: 3px; border-radius: 3px; background: ${token.colorPrimary};
          }
        `}</style>

        <Logo>
          {!collapsed ? (
            <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>Hospital MS</Title>
          ) : (
            <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>HMS</Title>
          )}
        </Logo>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : []}
          onClick={handleMenuClick}
          items={menuItems.map(item => convertMenuItemToAntMenu(item, menuItems))}
        />
      </Sider>

      <Layout>
        <StyledHeader>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ThemeToggle />
            <NotificationBell />
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => navigate('/settings')}
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={(user as any)?.profileImage} icon={<UserOutlined />} />
                <span>{user?.firstName} {user?.lastName}</span>
              </Space>
            </Dropdown>
          </div>
        </StyledHeader>

        <div style={{ padding: '0 24px' }}>
          <Breadcrumb items={breadcrumbItems} />
        </div>

        <StyledContent>
          {children || <Outlet />}
        </StyledContent>
      </Layout>
    </StyledLayout>
  );
};

export default AppLayout;

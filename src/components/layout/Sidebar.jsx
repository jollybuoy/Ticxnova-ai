import { memo, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { prefetchRoute } from '../../routes/lazyPages';
import { Icon } from '../ui/IconMap';
import { NavBadge } from '../ui/Badge';
import { navItems } from '../../data/dummyData';
import { useOpenTicketCount } from '../../hooks/useOpenTicketCount';
import { useTenant } from '../../hooks/useTenant';
import { usePlanAccess } from '../../hooks/usePlanAccess';
import { usePermissions } from '../../hooks/usePermissions';
import { FEATURES } from '../../lib/plans/planConfig';

function isNavSectionActive(pathname, item) {
  if (!item.children?.length) return false;
  if (pathname === item.path) return true;
  const prefix = item.path.endsWith('/') ? item.path : `${item.path}/`;
  return pathname.startsWith(prefix);
}

function navItemAllowed(item, { canUseFeature, canAccessModule, isAdmin }) {
  if (item.id === 'admin' && !isAdmin) return false;
  if (item.planFeature && !canUseFeature(item.planFeature)) return false;
  if (item.path === '/knowledge-base' && !canUseFeature(FEATURES.KNOWLEDGE_BASE)) return false;
  return true;
}

function SidebarComponent({ open, collapsed, onClose }) {
  const width = collapsed ? 'w-[72px]' : 'w-64';
  const openTicketCount = useOpenTicketCount();
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useTenant();
  const { canUseFeature } = usePlanAccess();
  const { canAccessModule, modules } = usePermissions();
  const [aiPrompt, setAiPrompt] = useState('');
  const isAdmin = ['super_admin', 'org_admin'].includes(role);
  const visibleNavItems = useMemo(
    () =>
      navItems
        .filter((item) => navItemAllowed(item, { canUseFeature, canAccessModule, isAdmin }))
        .map((item) => {
          if (!item.children?.length) return item;
          const children = item.children.filter((child) =>
            navItemAllowed(child, { canUseFeature, canAccessModule, isAdmin }),
          );
          if (item.id === 'admin') {
            const filtered = children.filter((child) => {
              if (child.path === '/settings/users') {
                return canAccessModule(modules.USERS, 'read');
              }
              return true;
            });
            return { ...item, children: filtered };
          }
          return { ...item, children };
        })
        .filter((item) => !item.children?.length || item.children.length > 0),
    [canAccessModule, canUseFeature, isAdmin, modules.USERS],
  );

  const activeSectionIds = useMemo(
    () =>
      visibleNavItems
        .filter((item) => isNavSectionActive(location.pathname, item))
        .map((item) => item.id),
    [location.pathname, visibleNavItems],
  );

  const [expandedItems, setExpandedItems] = useState(() => new Set(activeSectionIds));

  useEffect(() => {
    if (!activeSectionIds.length) return;
    setExpandedItems((current) => {
      const next = new Set(current);
      let changed = false;
      for (const id of activeSectionIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : current;
    });
  }, [activeSectionIds]);

  const toggleExpanded = (itemId) => {
    const item = visibleNavItems.find((entry) => entry.id === itemId);
    if (item && isNavSectionActive(location.pathname, item)) {
      return;
    }
    setExpandedItems((current) => {
      const next = new Set(current);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const submitAiPrompt = (event) => {
    event.preventDefault();
    const query = aiPrompt.trim();
    setAiPrompt('');
    onClose();
    navigate(query ? `/ai-assistant?prompt=${encodeURIComponent(query)}` : '/ai-assistant');
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex ${width} flex-col border-r border-white/[0.06] glass-strong transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className={`border-b border-white/[0.06] ${collapsed ? 'px-3 py-4' : 'px-5 py-5'}`}>
          <NavLink to="/dashboard" onClick={onClose} className="block">
            <motion.div
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            >
              <motion.div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-600/30">
                <Icon name="Hexagon" size={20} className="text-white" />
              </motion.div>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="min-w-0"
                >
                  <h1 className="truncate text-base font-semibold tracking-tight text-white">
                    Ticxnova-AI
                  </h1>
                  <p className="truncate text-[11px] text-zinc-500">IT Management Platform</p>
                </motion.div>
              )}
            </motion.div>
          </NavLink>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {visibleNavItems.map((item, i) => {
            const badge =
              item.showOpenBadge && openTicketCount > 0 ? openTicketCount : null;
            const hasChildren = Boolean(item.children?.length);
            const isSectionActive = hasChildren && isNavSectionActive(location.pathname, item);
            const isExpanded = expandedItems.has(item.id) || isSectionActive;

            return (
              <div key={item.id}>
                {hasChildren ? (
                  <button
                    type="button"
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (collapsed) return;
                      toggleExpanded(item.id);
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      isSectionActive
                        ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/80 text-white shadow-lg shadow-violet-600/20'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <motion.span
                      className="flex w-full items-center gap-3"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.025 }}
                    >
                      <Icon name={item.icon} size={18} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="truncate">{item.label}</span>
                          <Icon
                            name="ChevronDown"
                            size={15}
                            className={`ml-auto transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </>
                      )}
                    </motion.span>
                  </button>
                ) : (
                  <NavLink
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    onClick={() => {
                      setExpandedItems(new Set());
                      onClose();
                    }}
                    className={({ isActive }) =>
                      `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                        collapsed ? 'justify-center' : ''
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/80 text-white shadow-lg shadow-violet-600/20'
                          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                      }`
                    }
                  >
                  <motion.span
                    className="flex w-full items-center gap-3"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.025 }}
                  >
                    <Icon name={item.icon} size={18} className="shrink-0" />
                    {!collapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {badge != null && <NavBadge count={badge} />}
                      </>
                    )}
                    {collapsed && badge != null && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </motion.span>
                  </NavLink>
                )}

                {!collapsed && hasChildren && (isExpanded || isSectionActive) && (
                  <div className="ml-6 mt-1 space-y-1 border-l border-white/[0.06] pl-3">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.id}
                        to={child.path}
                        onMouseEnter={() => prefetchRoute(child.path)}
                        onFocus={() => prefetchRoute(child.path)}
                        onClick={onClose}
                        end={child.path === item.path}
                        className={({ isActive }) =>
                          `block rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-white/[0.07] text-white'
                              : 'text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                          }`
                        }
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="border-t border-white/[0.06] p-4">
            <div className="glass rounded-xl p-3">
              <div className="mb-2 flex items-center gap-2">
                <Icon name="Bot" size={16} className="text-violet-400" />
                <span className="text-xs font-semibold text-white">AI Assistant</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Online
                </span>
              </div>
              <form onSubmit={submitAiPrompt} className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  className="flex-1 bg-transparent text-xs text-zinc-300 outline-none placeholder:text-zinc-600"
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-violet-400"
                >
                  <Icon name="Send" size={14} />
                </motion.button>
              </form>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);

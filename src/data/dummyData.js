export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'tickets', label: 'Tickets', icon: 'Ticket', path: '/tickets', showOpenBadge: true },
  { id: 'ai-assistant', label: 'AI Assistant', icon: 'Bot', path: '/ai-assistant' },
  { id: 'assets', label: 'Asset Overview', icon: 'BarChart3', path: '/assets' },
  { id: 'devices', label: 'Devices', icon: 'Monitor', path: '/devices' },
  { id: 'users', label: 'Users', icon: 'Users', path: '/dashboard' },
  { id: 'knowledge', label: 'Knowledge Base', icon: 'BookOpen', path: '/dashboard' },
  { id: 'automation', label: 'Automation', icon: 'Workflow', path: '/dashboard' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/dashboard' },
  { id: 'security', label: 'Security', icon: 'Shield', path: '/dashboard' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/dashboard' },
  { id: 'billing', label: 'Billing', icon: 'CreditCard', path: '/dashboard' },
  { id: 'settings', label: 'Settings', icon: 'Settings', path: '/dashboard' },
];

export const metrics = [
  {
    id: 'open-tickets',
    label: 'Open Tickets',
    value: '23',
    change: '↑ 12% from last month',
    changeColor: 'text-accent-purple',
    icon: 'MessageSquare',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-accent-purple',
  },
  {
    id: 'ai-resolved',
    label: 'AI Resolved',
    value: '156',
    change: '↗ 28% from last month',
    changeColor: 'text-accent-green',
    icon: 'CheckCircle2',
    iconBg: 'bg-green-500/15',
    iconColor: 'text-accent-green',
  },
  {
    id: 'active-devices',
    label: 'Active Devices',
    value: '142',
    change: '↗ 8% from last month',
    changeColor: 'text-accent-blue',
    icon: 'Monitor',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-accent-blue',
  },
  {
    id: 'sla-compliance',
    label: 'SLA Compliance',
    value: '98%',
    change: '↗ 5% from last month',
    changeColor: 'text-accent-yellow',
    icon: 'Shield',
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-accent-yellow',
  },
  {
    id: 'security-alerts',
    label: 'Security Alerts',
    value: '7',
    change: '↘ 15% from last month',
    changeColor: 'text-accent-red',
    icon: 'AlertTriangle',
    iconBg: 'bg-red-500/15',
    iconColor: 'text-accent-red',
  },
];

export const ticketsTrend = [
  { date: 'May 1', tickets: 18 },
  { date: 'May 5', tickets: 24 },
  { date: 'May 9', tickets: 31 },
  { date: 'May 13', tickets: 28 },
  { date: 'May 17', tickets: 35 },
  { date: 'May 21', tickets: 42 },
  { date: 'May 25', tickets: 38 },
  { date: 'May 29', tickets: 45 },
];

export const ticketsByCategory = [
  { name: 'Password Reset', value: 6, color: '#8b5cf6', percent: 26 },
  { name: 'Software Issue', value: 7, color: '#22c55e', percent: 30 },
  { name: 'Hardware Issue', value: 4, color: '#eab308', percent: 17 },
  { name: 'Network Issue', value: 4, color: '#3b82f6', percent: 17 },
  { name: 'Other', value: 2, color: '#6b7280', percent: 10 },
];

export const aiInsights = {
  featured: {
    title: 'Outlook login issues trending',
    description:
      'AI detected 8 similar tickets in the last 24 hours. Likely caused by recent Microsoft 365 update.',
    action: 'View Insights',
  },
  alerts: [
    { text: '3 devices need security updates', type: 'success', icon: 'ArrowUpRight' },
    { text: '5 inactive users detected', type: 'warning', icon: 'AlertCircle' },
    { text: 'High memory usage on 7 devices', type: 'orange', icon: 'Star' },
  ],
};

export const recentTickets = [
  {
    id: 'TK-2487',
    title: 'Outlook not syncing',
    user: 'Sarah Johnson',
    status: 'In Progress',
    statusColor: 'blue',
    icon: 'Mail',
  },
  {
    id: 'TK-2486',
    title: 'VPN connection failed',
    user: 'Mike Chen',
    status: 'Open',
    statusColor: 'red',
    icon: 'Wifi',
  },
  {
    id: 'TK-2485',
    title: 'Printer offline - Floor 3',
    user: 'Emily Davis',
    status: 'Pending',
    statusColor: 'yellow',
    icon: 'Printer',
  },
  {
    id: 'TK-2484',
    title: 'Password reset request',
    user: 'James Wilson',
    status: 'Resolved',
    statusColor: 'green',
    icon: 'KeyRound',
  },
  {
    id: 'TK-2483',
    title: 'Software license renewal',
    user: 'Lisa Anderson',
    status: 'In Progress',
    statusColor: 'blue',
    icon: 'FileKey',
  },
];

export const devicesStatus = [
  { name: 'Healthy', value: 102, color: '#22c55e', percent: 72 },
  { name: 'Warning', value: 26, color: '#eab308', percent: 18 },
  { name: 'Critical', value: 14, color: '#ef4444', percent: 10 },
];

export const topUsers = [
  { name: 'Sarah Johnson', department: 'Marketing', tickets: 12, avatar: 'SJ' },
  { name: 'Mike Chen', department: 'Engineering', tickets: 9, avatar: 'MC' },
  { name: 'Emily Davis', department: 'HR', tickets: 8, avatar: 'ED' },
  { name: 'James Wilson', department: 'Finance', tickets: 7, avatar: 'JW' },
  { name: 'Lisa Anderson', department: 'Sales', tickets: 6, avatar: 'LA' },
];

export const automation = {
  activeWorkflows: 12,
  executedToday: 5,
  successRate: '98%',
  nextWorkflow: {
    name: 'User Onboarding',
    time: 'in 2 hours',
  },
};

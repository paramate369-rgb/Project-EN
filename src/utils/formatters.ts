export function formatMoney(value: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('th-TH').format(value || 0);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export const AVATAR_LIST = [
  '👩🏻‍💼',
  '👨🏻‍💼',
  '👩🏼‍💻',
  '🧑🏻‍💻',
  '👨🏽‍💼',
  '👩🏽‍💼',
  '🧑🏼‍🔬',
  '👨🏼‍💻',
];

export const AVATAR_COLORS = [
  '#e8edff',
  '#ffeedd',
  '#e4f6ed',
  '#fce8f0',
  '#e8f5fb',
  '#f5ebff',
];

export function getAvatarForEmployee(name: string, index: number): { emoji: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const avatarIndex = Math.abs(hash) % AVATAR_LIST.length;
  const colorIndex = Math.abs(hash + index) % AVATAR_COLORS.length;
  return {
    emoji: AVATAR_LIST[avatarIndex],
    bg: AVATAR_COLORS[colorIndex],
  };
}

export function getStatusStyle(status: string): {
  bg: string;
  text: string;
  border: string;
  label: string;
} {
  const s = (status || '').trim().toLowerCase();

  if (s.includes('เสร็จ') || s.includes('done') || s.includes('complete')) {
    return {
      bg: 'bg-emerald-50 text-emerald-700',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      label: 'เสร็จสิ้น',
    };
  }

  if (s.includes('เสนอ') || s.includes('quote') || s.includes('proposal')) {
    return {
      bg: 'bg-amber-50 text-amber-700',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'เสนอราคา',
    };
  }

  return {
    bg: 'bg-blue-50 text-blue-700',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'กำลังดำเนินการ',
  };
}

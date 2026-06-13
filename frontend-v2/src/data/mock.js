// Mock data only — V2 is a UI prototype with zero backend wiring.

export const ONBOARDING_SLIDES = [
  {
    id: 'protect',
    icon: 'ShieldCheck',
    accent: '#2563eb',
    title: 'Protection that feels like care',
    body: 'Gentle, always-on safety for the people who matter most — without the constant worry.',
  },
  {
    id: 'location',
    icon: 'MapPin',
    accent: '#06b6d4',
    title: 'Know they’re safe',
    body: 'Real-time location and safe-zone alerts, designed to reassure rather than surveil.',
  },
  {
    id: 'insights',
    icon: 'Sparkles',
    accent: '#a855f7',
    title: 'Calm, intelligent insights',
    body: 'AlphaGuard AI turns activity into clear, kind guidance for healthier family habits.',
  },
];

export const MOCK_PAIRING_CODE = '428 913';
export const MOCK_QR_VALUE = JSON.stringify({ code: '428913', v: 2 });

export const MOCK_PARENT = { name: 'Jane', email: 'jane@family.com' };
export const MOCK_CHILD = { name: 'Emma', age: 10 };

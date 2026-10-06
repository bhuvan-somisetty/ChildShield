// Single source of truth for AlphaGuard's legal / policy content.
//
// Consumed by:
//   • centers3.jsx  → in-app Legal Center (/app/settings/legal/:slug)
//   • PublicLegal   → public reader (/legal/:slug) used by onboarding + footer
//   • Consent       → onboarding consent screen (inline policy sheet)
//
// POLICY_VERSION mirrors the backend gate (GET /legal/version). When the policy
// changes materially, bump POLICY_VERSION here AND in backend-v2/src/consent.js
// so every parent is required to re-accept. The backend remains authoritative —
// the version a parent is recorded as accepting is always stamped server-side.

export const POLICY_VERSION = '2026-06-13';
export const EFFECTIVE = 'Effective 13 June 2026 · Version 2.0.0';

// Documents a parent must accept during onboarding (slugs match routes below).
export const REQUIRED_CONSENT = [
  { slug: 'terms', label: 'Terms of Service' },
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'child-safety', label: 'Child Safety Policy' },
];

// Full, store-ready policy content. Each entry is a list of { h, t } sections.
export const LEGAL = {
  privacy: { title: 'Privacy Policy', blocks: [
    { h: 'Who we are', t: 'AlphaGuard AI, Inc. ("AlphaGuard", "we") provides a family-safety service that lets a verified parent or legal guardian monitor and protect a child’s device with the child’s awareness.' },
    { h: 'Data we collect', t: 'Account data (parent email, hashed password, name); child profile (name, age, device); precise and background location; battery and device status; safe-zone definitions and entry/exit events; chat messages between parent and child; SOS events; app-install/uninstall requests; and, only during an active monitoring session you start and the child accepts, live camera, microphone, or screen media (relayed peer-to-peer, never stored on our servers).' },
    { h: 'How we use it', t: 'Solely to deliver the safety features you enable: live location, geofencing, emergency SOS, parent–child chat, app approval, and consented live monitoring. We do not sell personal data, we do not use it for advertising, and we do not build advertising profiles of you or your child.' },
    { h: 'Legal bases (GDPR)', t: 'We process data on the basis of the parent’s consent and the performance of the family-safety service contract, and to meet our legal obligations to protect children. Verifiable parental consent is the basis for processing a child’s data (COPPA).' },
    { h: 'Sharing', t: 'We share data only with infrastructure processors strictly necessary to run the service (hosting, database, push delivery, TURN relay), under contract. We disclose data to authorities only when legally required or to protect a child from imminent harm. We never sell data.' },
    { h: 'Security', t: 'Data is encrypted in transit (TLS) and at rest. Live monitoring media is end-to-end encrypted (DTLS-SRTP) and relayed without server-side recording. Sensitive actions require a parent Security PIN.' },
    { h: 'Retention', t: 'We keep data only while your account is active. On deletion, personal data is purged within 30 days except where law requires longer retention. You can export or delete data at any time from Settings → Data & Privacy.' },
    { h: 'Your rights', t: 'You may access, correct, export (portability), restrict, or delete your and your child’s data, and withdraw consent. EU/UK (GDPR) and California (CCPA/CPRA) residents have these rights; we honour them globally. Contact privacy@alphaguard.ai or use the in-app Data Export and Delete Account flows.' },
    { h: 'Children', t: 'AlphaGuard is operated by parents on behalf of their children; a child never creates an independent account. See our COPPA Compliance and Child Safety Policy.' },
  ] },
  terms: { title: 'Terms of Service', blocks: [
    { h: 'Eligibility', t: 'You must be 18+ and the parent or legal guardian of every child you monitor, or otherwise legally authorised to monitor the device owner. By using AlphaGuard you confirm this.' },
    { h: 'Acceptable use', t: 'AlphaGuard may be used only to protect children in your care, with their awareness. Using it to stalk, harass, or surveil any person without lawful authority is strictly prohibited and may be a crime.' },
    { h: 'Your account', t: 'You are responsible for safeguarding your credentials and Security PIN, and for all activity under your account.' },
    { h: 'Subscriptions & billing', t: 'Paid plans renew until cancelled. Pricing and inclusions are shown in the Subscription center. See the Refund Policy for cancellations and refunds.' },
    { h: 'Service "as is"', t: 'AlphaGuard is a safety aid, not a guaranteed safety guarantee, and may be affected by device, OS, network, or permission state. It must not be relied on as the sole means of protecting a child. To the extent permitted by law the service is provided "as is".' },
    { h: 'Termination', t: 'You may delete your account at any time. We may suspend accounts that violate these terms or applicable law.' },
    { h: 'Changes', t: 'We may update these terms; material changes will be notified in-app and require renewed acceptance before continued use. Continued use after changes constitutes acceptance.' },
  ] },
  'child-safety': { title: 'Child Safety Policy', blocks: [
    { h: 'Transparency first', t: 'AlphaGuard is built for transparent family safety, not covert spying. The child app shows a persistent, unmissable indicator whenever camera, microphone, or screen monitoring is active, and every such session requires the child to tap Accept first.' },
    { h: 'Consent for live monitoring', t: 'Camera, microphone, and screen access can never be enabled silently. The child receives an explicit request naming the parent and the type of access, and can Decline or Stop at any time.' },
    { h: 'Prohibited uses', t: 'It is forbidden to use AlphaGuard to abuse, control, intimidate, or stalk a child or any third party, to monitor a person you are not the legal guardian of, or to monitor anyone without the transparency this app enforces.' },
    { h: 'No CSAE tolerance', t: 'We have zero tolerance for child sexual abuse and exploitation (CSAE). The service may not be used to create, store, or transmit such material. We act on credible reports and cooperate with authorities.' },
    { h: 'Reporting', t: 'Report misuse or a child-safety concern to safety@alphaguard.ai. Emergencies should always go to local emergency services first.' },
    { h: 'Data minimisation for minors', t: 'We collect only what is needed for the safety features in use, never serve ads to children, and never sell children’s data.' },
  ] },
  'data-protection': { title: 'Data Protection Policy', blocks: [
    { h: 'Principles', t: 'We apply data minimisation, purpose limitation, storage limitation, and security-by-design across all processing, consistent with GDPR, UK GDPR, CCPA/CPRA, and COPPA.' },
    { h: 'Data categories & retention', t: 'Location & zone events: kept for the rolling history window then aggregated; chat: retained until you delete it or close the account; monitoring media: not stored; account & child profile: retained while the account is active. All personal data is deleted within 30 days of account deletion unless law requires otherwise.' },
    { h: 'Processors & transfers', t: 'Sub-processors (hosting, managed PostgreSQL, push, TURN relay) are bound by data-processing agreements. Cross-border transfers rely on Standard Contractual Clauses or equivalent safeguards.' },
    { h: 'Security controls', t: 'TLS in transit, encryption at rest, hashed passwords (bcrypt), JWT-scoped access, room-scoped realtime channels, PIN-gated sensitive actions, and end-to-end-encrypted monitoring media.' },
    { h: 'Breach response', t: 'We maintain an incident-response process and will notify affected users and regulators within the timelines required by applicable law.' },
    { h: 'Data Protection Officer', t: 'Contact our DPO at dpo@alphaguard.ai for access, portability, rectification, restriction, erasure, or objection requests.' },
  ] },
  'data-deletion': { title: 'Data Deletion Policy', blocks: [
    { h: 'Your right to erasure', t: 'You may request deletion of your account and all associated personal data at any time, for yourself and for every child you manage (GDPR Art. 17 "right to be forgotten", CCPA/CPRA right to delete, and COPPA parental right to delete a child’s data).' },
    { h: 'How to request deletion', t: 'Two options: (1) Immediate self-service — Settings → Data & Privacy → Delete Account, confirmed with your Security PIN, erases your account and data from our live systems right away. (2) Formal request — submit a deletion request in-app or email privacy@alphaguard.ai; we log it and confirm completion.' },
    { h: 'What gets deleted', t: 'Your parent account; every child profile; all device pairings; location and safe-zone history; parent–child chat; SOS and security events; reports, targets, rewards, and settings. Live monitoring media is never stored, so there is nothing to recover.' },
    { h: 'Timeline', t: 'Self-service deletion removes data from production immediately and from backups within 30 days. Formal requests are fulfilled within 30 days. We retain only the minimal records the law requires us to keep (e.g. limited billing records), and an audit record that a deletion occurred.' },
    { h: 'Effect on monitoring', t: 'On deletion the child’s device is unpaired and monitoring stops immediately. The action is irreversible.' },
    { h: 'Contact', t: 'Deletion questions: privacy@alphaguard.ai. Data Protection Officer: dpo@alphaguard.ai.' },
  ] },
  community: { title: 'Community Guidelines', blocks: [
    { h: 'Be safety-focused', t: 'AlphaGuard exists to keep children safe. Use it respectfully and only for that purpose.' },
    { h: 'Respect the child', t: 'Monitoring should support trust and open conversation, not control or punishment. Talk with your child about what is monitored and why.' },
    { h: 'No misuse', t: 'No harassment, no surveillance of non-family members, no attempts to defeat the child-visibility indicators, and no sharing of another person’s data without authority.' },
    { h: 'Enforcement', t: 'Accounts that violate these guidelines or applicable law may be suspended or terminated.' },
  ] },
  'acceptable-use': { title: 'Acceptable Use Policy', blocks: [
    { h: 'Authorised devices only', t: 'Install AlphaGuard only on devices you own or that belong to a child under your legal guardianship, and only with the transparency the app provides.' },
    { h: 'Lawful purpose', t: 'Use the service solely for lawful family safety. Covert or unlawful surveillance of any person is prohibited.' },
    { h: 'No interference', t: 'Do not attempt to reverse-engineer, disrupt, overload, or bypass the consent and visibility safeguards of the service.' },
    { h: 'Consequences', t: 'Violations may result in suspension, termination, and referral to authorities where unlawful conduct is suspected.' },
  ] },
  cookie: { title: 'Cookie Policy', blocks: [
    { h: 'What we use', t: 'We use only strictly-necessary local storage and cookies: authentication tokens, your language and appearance preferences, and session state. These are required for the app to function.' },
    { h: 'What we do not use', t: 'No advertising cookies, no third-party ad trackers, and no cross-site behavioural profiling — for parents or children.' },
    { h: 'Managing storage', t: 'Clearing your browser/app storage signs you out and removes preferences. Strictly-necessary items cannot be disabled without breaking core functionality.' },
  ] },
  refund: { title: 'Refund Policy', blocks: [
    { h: 'Cancellation', t: 'You can cancel a subscription at any time from the Subscription center; access continues until the end of the current billing period.' },
    { h: 'Refunds', t: 'You may request a refund for the current billing period within 14 days of the charge. Store purchases (Google Play / App Store) are also subject to the respective store’s refund policy and may be requested there.' },
    { h: 'How to request', t: 'Email billing@alphaguard.ai with your account email and order reference.' },
  ] },
  coppa: { title: 'COPPA Compliance', blocks: [
    { h: 'Parent-operated by design', t: 'AlphaGuard is a service operated by a parent or legal guardian for their own child. Children do not register or provide data directly to us; the parent sets up and controls everything.' },
    { h: 'Verifiable parental consent', t: 'The parent creates and authenticates the account, accepts the Terms, Privacy Policy, and Child Safety Policy, and explicitly enables each data-collecting feature during setup. This constitutes the verifiable parental consent required by the U.S. Children’s Online Privacy Protection Act (COPPA) before any child data is collected.' },
    { h: 'Data from children', t: 'We collect a child’s data only to provide the safety features the parent has enabled (e.g. location for Family Radar, messages for parent–child chat). We never condition participation on collecting more than is reasonably necessary.' },
    { h: 'No ads, no sale', t: 'We do not serve behavioural advertising to children and never sell or rent children’s personal information.' },
    { h: 'Parental controls', t: 'The parent can review, export, and delete the child’s data and revoke any permission at any time from Settings → Data & Privacy and Permissions.' },
    { h: 'Contact', t: 'COPPA questions: privacy@alphaguard.ai.' },
  ] },
  gdpr: { title: 'GDPR Compliance', blocks: [
    { h: 'Roles', t: 'For account data the parent is our customer; AlphaGuard acts as controller for the limited processing needed to run the service and as processor for content the parent manages about their child.' },
    { h: 'Lawful basis', t: 'Processing rests on consent and on performance of the family-safety contract, plus our legitimate and legal interest in protecting children. Special-category processing (e.g. precise location, live media) occurs only with explicit consent and active session control.' },
    { h: 'Data-subject rights', t: 'Access, rectification, erasure ("right to be forgotten"), restriction, portability, and objection are all supported. Use the in-app Data Export and Delete Account flows or email dpo@alphaguard.ai; we respond within one month.' },
    { h: 'International transfers', t: 'Where data leaves the EEA/UK we rely on Standard Contractual Clauses or an adequacy decision.' },
    { h: 'Supervisory authority', t: 'You have the right to lodge a complaint with your local data-protection authority.' },
  ] },
  'play-families': { title: 'Google Play Families Policy', blocks: [
    { h: 'Designed-for-families compliance', t: 'AlphaGuard targets parents and complies with Google Play’s Families and Developer Program policies for apps that handle children’s data.' },
    { h: 'Prominent disclosure & consent', t: 'Before collecting location, camera, microphone, or background data, the app presents a prominent in-context disclosure and requests runtime permission. Sensitive monitoring requires the child to accept and shows a persistent active-session indicator.' },
    { h: 'Permissions justification', t: 'Each sensitive permission maps to a core safety feature: location/background-location → Family Radar & geofencing; camera/microphone → consented live check-in; foreground service → reliable safety monitoring. We request no permission we do not use.' },
    { h: 'Data safety', t: 'Our Play Data safety form declares the data types collected, that data is encrypted in transit, that data is not sold, and that users can request deletion — matching this Privacy Policy.' },
    { h: 'No ads to children & CSAE', t: 'No ads are shown to children, and we operate a zero-tolerance CSAE standard with a published reporting channel (safety@alphaguard.ai), as required by Play policy.' },
  ] },
  'app-store-safety': { title: 'App Store Child Safety', blocks: [
    { h: 'Kids & privacy guidelines', t: 'AlphaGuard follows Apple’s App Review Guidelines covering privacy, data collection from minors, and parental-control apps.' },
    { h: 'Purpose strings & consent', t: 'Location, camera, and microphone access each use clear usage-description strings and the system permission prompt; live monitoring additionally requires the child to accept in-app and displays a continuous indicator.' },
    { h: 'Parental control allowance', t: 'AlphaGuard is a legitimate parental-control / family-safety app installed by a parent on their child’s device, with transparency to the child — not covert tracking, which Apple prohibits.' },
    { h: 'Data handling', t: 'Our App Privacy nutrition labels declare collected data types and link to this Privacy Policy. Data is encrypted, not sold, and deletable on request.' },
    { h: 'Account deletion', t: 'An in-app Delete Account flow is provided, as required for apps that support account creation.' },
  ] },
  'permissions-disclosure': { title: 'Permission Disclosure', blocks: [
    { h: 'Why we ask', t: 'AlphaGuard requests only the permissions its safety features need, and explains each before the system prompt appears (prominent disclosure).' },
    { h: 'Location & background location', t: 'Used to show your child on Family Radar, calculate distance/ETA, and trigger safe-zone enter/exit alerts. Background location keeps these working when the app is closed. Without it, location features are limited.' },
    { h: 'Camera', t: 'Used only during a live camera check-in that you start and your child accepts. It is never accessed silently; the child sees a persistent "Camera Monitoring Active" indicator and can stop it.' },
    { h: 'Microphone', t: 'Used only during a consented live audio check-in, with the same accept-and-indicator safeguards as camera.' },
    { h: 'Screen', t: 'Used only during a consented live screen-view session, again with explicit acceptance and a visible active indicator.' },
    { h: 'Notifications', t: 'Used to deliver SOS, safe-zone, and device alerts to the parent.' },
    { h: 'Battery optimisation exemption', t: 'Requested so safety monitoring is not killed by the OS in the background.' },
    { h: 'Your control', t: 'Every permission can be reviewed and revoked any time in Settings → Permissions and in your device settings.' },
  ] },
};

const CONTACT_BLOCK = { h: 'Contact', t: 'Questions about this policy? Email privacy@alphaguard.ai. For data requests, dpo@alphaguard.ai; for child-safety concerns, safety@alphaguard.ai.' };

// Resolve a slug to a renderable document (title + blocks with the contact block
// appended). Unknown slugs return a safe fallback.
export const legalDoc = (slug) => {
  const d = LEGAL[slug];
  if (!d) return { title: 'Document', blocks: [{ t: 'This document is unavailable.' }] };
  return { title: d.title, blocks: [...d.blocks, CONTACT_BLOCK] };
};

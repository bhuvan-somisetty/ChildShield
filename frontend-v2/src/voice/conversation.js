// ConversationEngine — turns a transcript + live AlphaGuard context into a spoken
// reply and an optional navigation action. Intent matching is English-first; a
// backend LLM would replace `respond()` while keeping the same {text, action}
// contract. Localized greeting / fallback strings cover the major languages so
// DISHA always answers in the parent's language.
import { fmtMins } from '../data/childDemo';

export const greeting = (name, code = 'en') => {
  const G = {
    en: `Hello ${name}. I am DISHA. How can I help you today?`,
    hi: `नमस्ते ${name}। मैं दिशा हूँ। मैं आपकी कैसे मदद कर सकती हूँ?`,
    te: `నమస్తే ${name}. నేను దిశ. నేను మీకు ఎలా సహాయం చేయగలను?`,
    ta: `வணக்கம் ${name}. நான் திஷா. நான் உங்களுக்கு எப்படி உதவ முடியும்?`,
    kn: `ನಮಸ್ತೆ ${name}. ನಾನು ದಿಶಾ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?`,
    ml: `നമസ്കാരം ${name}. ഞാൻ ദിശയാണ്. എനിക്ക് നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?`,
    mr: `नमस्कार ${name}. मी दिशा आहे. मी तुम्हाला कशी मदत करू?`,
    bn: `নমস্কার ${name}। আমি দিশা। আমি কীভাবে সাহায্য করতে পারি?`,
    gu: `નમસ્તે ${name}. હું દિશા છું. હું તમને કેવી રીતે મદદ કરી શકું?`,
    pa: `ਸਤ ਸ੍ਰੀ ਅਕਾਲ ${name}। ਮੈਂ ਦਿਸ਼ਾ ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦੀ ਹਾਂ?`,
    ar: `مرحباً ${name}. أنا ديشا. كيف يمكنني مساعدتك اليوم؟`,
    es: `Hola ${name}. Soy DISHA. ¿Cómo puedo ayudarte hoy?`,
    fr: `Bonjour ${name}. Je suis DISHA. Comment puis-je vous aider aujourd'hui ?`,
    de: `Hallo ${name}. Ich bin DISHA. Wie kann ich Ihnen heute helfen?`,
    ja: `こんにちは、${name}さん。私はディーシャです。今日はどうされましたか？`,
    zh: `你好，${name}。我是 DISHA。今天有什么可以帮您？`,
  };
  return G[code] || G.en;
};

const fallbackText = (code) => ({
  en: "I can help with your child's location, battery, screen time, safe zones, app requests, security alerts, or making a call. What would you like?",
  hi: 'मैं आपके बच्चे का स्थान, बैटरी, स्क्रीन टाइम, सुरक्षित क्षेत्र, ऐप अनुरोध, या कॉल करने में मदद कर सकती हूँ।',
  te: 'మీ పిల్లల స్థానం, బ్యాటరీ, స్క్రీన్ టైమ్, సురక్షిత ప్రాంతాలు, యాప్ అభ్యర్థనలు లేదా కాల్ చేయడంలో నేను సహాయం చేయగలను.',
  ar: 'يمكنني المساعدة في موقع طفلك، البطارية، وقت الشاشة، المناطق الآمنة، طلبات التطبيقات، أو إجراء مكالمة.',
  es: 'Puedo ayudarte con la ubicación, batería, tiempo de pantalla, zonas seguras, solicitudes de apps o llamadas de tu hijo.',
}[code] || "I can help with your child's location, battery, screen time, safe zones, app requests, or a call. What would you like?");

// Returns { text, action? }. action: { type:'navigate', to } | { type:'call', phone }
export const respond = (raw, ctx) => {
  const q = (raw || '').toLowerCase();
  const { child, telemetry, setting, pendingCount = 0, code = 'en' } = ctx;
  const has = (...w) => w.some((x) => q.includes(x));

  if (has('where', 'location', 'radar', 'find')) {
    return { text: `${child.name} is at ${child.location.area}. ${child.safeZone.inside ? `Inside the ${child.safeZone.name} safe zone.` : `Away from ${child.safeZone.name}.`} Opening Family Radar.`, action: { type: 'navigate', to: '/app/location' } };
  }
  if (has('battery', 'charge', 'power')) {
    const b = telemetry?.battery;
    return { text: `${child.name}'s battery is at ${b ? b.level : child.battery} percent${b && b.charging ? ', and charging' : ''}.` };
  }
  if (has('screen time', 'screen', 'usage', 'how much time')) {
    return { text: `${child.name} has used ${fmtMins(child.screenTime.today)} of screen time today, out of a ${fmtMins(setting.screenLimit)} limit. Opening Screen Time.`, action: { type: 'navigate', to: '/app/screen-time' } };
  }
  if (has('leave school', 'left school', 'at school', 'safe zone', 'arrived')) {
    return { text: child.safeZone.inside ? `${child.name} is currently inside the ${child.safeZone.name} safe zone.` : `${child.name} is currently away from ${child.safeZone.name}.`, action: { type: 'navigate', to: '/app/safe-zones' } };
  }
  if (has('security', 'vpn', 'alert', 'warning')) {
    return { text: 'Opening Security Alerts so you can review any detections.', action: { type: 'navigate', to: '/app/notifications/Security%20Alerts' } };
  }
  if (has('request', 'install', 'approve', 'app request')) {
    return { text: pendingCount > 0 ? `You have ${pendingCount} app request${pendingCount === 1 ? '' : 's'} waiting. Opening Approvals.` : 'There are no pending app requests right now. Opening Approvals.', action: { type: 'navigate', to: '/app/requests' } };
  }
  if (has('call', 'phone', 'dial')) {
    return { text: child.phone ? `Calling ${child.name} now.` : `I don't have a phone number for ${child.name} yet. You can add one in their profile.`, action: child.phone ? { type: 'call', phone: child.phone } : { type: 'navigate', to: '/app/settings/profile' } };
  }
  if (has('emergency', 'sos', 'help')) {
    return { text: 'Opening the Emergency Command Center.', action: { type: 'navigate', to: '/app/emergency' } };
  }
  if (has('notification', 'notify', 'message')) {
    return { text: 'Opening your notifications.', action: { type: 'navigate', to: '/app/notifications' } };
  }
  if (has('chat', 'text')) {
    return { text: `Opening your chat with ${child.name}.`, action: { type: 'navigate', to: '/app/chat' } };
  }
  if (has('hello', 'hi ', 'hey', 'namaste', 'thanks', 'thank you')) {
    return { text: `I'm here and listening, ${ctx.parentName || 'there'}. Ask me about ${child.name}'s safety anytime.` };
  }
  return { text: fallbackText(code) };
};

// SOS announcement text. Uses the real child GPS coordinates when available
// (a Maps API is needed to turn them into a human-readable area name).
export const sosAnnouncement = (child, telemetry) => {
  const b = telemetry?.battery?.level ?? child.battery;
  const c = telemetry?.coords;
  const loc = c ? `latitude ${c.lat.toFixed(3)}, longitude ${c.lng.toFixed(3)}` : child.location.area;
  return `Emergency alert detected. ${child.name} has triggered S O S. Current location is ${loc}. Battery level is ${b} percent. Emergency contacts have been notified.`;
};

// Child-facing DISHA: a friendly study buddy. Personalized by name/grade/school
// and the child's goals. Backend LLM replaces respond() later.
export const childGreeting = (p) => `Hi ${p.name}! I'm DISHA, your study buddy. I can help with homework, motivate you, or talk about your dreams. What's up?`;

export const QUICK_PROMPTS = [
  { label: 'Help me study', text: 'Can you help me study?' },
  { label: 'Motivate me', text: 'I need some motivation' },
  { label: 'Career ideas', text: 'What career could I have?' },
  { label: 'Tell a joke', text: 'Tell me a joke' },
];

const CAREERS = ['a scientist 🔬', 'an engineer 🛠️', 'a doctor 🩺', 'an astronaut 🚀', 'an artist 🎨', 'a game designer 🎮', 'a teacher 📚'];

export const childRespond = (raw, p, goals = []) => {
  const q = (raw || '').toLowerCase();
  const has = (...w) => w.some((x) => q.includes(x));
  const pending = goals.filter((g) => !g.done);

  if (has('study', 'homework', 'help', 'math', 'science', 'english', 'learn')) {
    return `Sure, ${p.name}! For ${p.grade}, try this: break the work into small 15-minute chunks, do the hardest subject first, and take a short break after. ${pending.length ? `You still have “${pending[0].title}” on your goals — want to start there?` : 'Which subject should we begin with?'}`;
  }
  if (has('motivat', 'tired', 'bored', 'sad', 'give up', 'hard', 'cant', "can't")) {
    return `You've got this, ${p.name}! 🌟 Every expert was once a beginner. Finish just one small thing right now and you'll feel proud. I believe in you!`;
  }
  if (has('career', 'job', 'become', 'future', 'grow up', 'dream')) {
    const c = CAREERS[Math.floor(Math.random() * CAREERS.length)];
    return `That's exciting to think about! With curiosity like yours, you could be ${c}. Keep doing well at ${p.school} and explore what you love — math, art, building, helping people. Your future is wide open!`;
  }
  if (has('joke', 'funny', 'laugh')) {
    return 'Why did the math book look sad? Because it had too many problems! 😄 Want another one?';
  }
  if (has('goal', 'todo', 'task')) {
    return pending.length ? `You have ${pending.length} goal${pending.length === 1 ? '' : 's'} left today. The next one is “${pending[0].title}”. Let's knock it out! 💪` : `Amazing — all your goals are done, ${p.name}! 🎉 Time for a well-earned break.`;
  }
  if (has('hi', 'hello', 'hey', 'thanks', 'thank you')) {
    return `Hey ${p.name}! Always happy to help. Ask me anything about school or just chat. 😊`;
  }
  return `I'm here for you, ${p.name}! I can help you study, cheer you on, or talk about cool careers. What would you like to do?`;
};

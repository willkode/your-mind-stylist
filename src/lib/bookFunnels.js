/**
 * Book + Quiz Funnel Configuration
 * ─────────────────────────────────
 * Each key is a book's URL slug. The object contains:
 *   - quiz:       intro content + all 12 questions
 *   - archetypes: keyed result content for each possible outcome
 *
 * To add a new book funnel:
 *   1. Add a new top-level key matching the book's slug in the Product entity.
 *   2. Define `quiz` with title, subtitle, intro, and questions.
 *   3. Define `archetypes` with one entry per possible quiz outcome key.
 *   That's it — BookLanding, QuizPage, and QuizResults will pick it up automatically.
 */

export const BOOK_FUNNELS = {
  "go-fetch-yourself": {
    quiz: {
      title: "Which Dog Archetype Are You?",
      subtitle: "A quick self-discovery quiz inspired by Go Fetch Your Self",
      intro:
        "You have access to all four archetypes — but one usually leads. This quick quiz will help you discover your dominant dog pattern and how it shows up in emotional intelligence, relationships, change, stress, and work.",
      questions: [
        {
          q: "When you walk into a new situation, you usually:",
          answers: [
            { text: "Take charge and figure out what needs to happen", archetype: "leader" },
            { text: "Start engaging and reading the room", archetype: "connector" },
            { text: "Observe quietly and settle in gently", archetype: "steady" },
            { text: "Watch carefully before deciding what to do", archetype: "thoughtful" },
          ],
        },
        {
          q: "When something goes wrong, your first instinct is to:",
          answers: [
            { text: "Fix it quickly", archetype: "leader" },
            { text: "Talk it through", archetype: "connector" },
            { text: "Keep things calm", archetype: "steady" },
            { text: "Understand exactly what happened", archetype: "thoughtful" },
          ],
        },
        {
          q: "People often describe you as:",
          answers: [
            { text: "Decisive", archetype: "leader" },
            { text: "Expressive", archetype: "connector" },
            { text: "Dependable", archetype: "steady" },
            { text: "Thoughtful", archetype: "thoughtful" },
          ],
        },
        {
          q: "In a group, your natural role is:",
          answers: [
            { text: "The driver", archetype: "leader" },
            { text: "The encourager", archetype: "connector" },
            { text: "The stabilizer", archetype: "steady" },
            { text: "The strategist", archetype: "thoughtful" },
          ],
        },
        {
          q: "When emotions run high, you tend to:",
          answers: [
            { text: "Push forward", archetype: "leader" },
            { text: "Express what you feel", archetype: "connector" },
            { text: "Stay steady and supportive", archetype: "steady" },
            { text: "Pull back and analyze", archetype: "thoughtful" },
          ],
        },
        {
          q: "Change feels:",
          answers: [
            { text: "Exciting if it moves things forward", archetype: "leader" },
            { text: "Energizing if people are involved", archetype: "connector" },
            { text: "Stressful unless it's gradual", archetype: "steady" },
            { text: "Unsettling unless it makes sense", archetype: "thoughtful" },
          ],
        },
        {
          q: "Under pressure, your biggest strength is:",
          answers: [
            { text: "Courage", archetype: "leader" },
            { text: "Optimism", archetype: "connector" },
            { text: "Patience", archetype: "steady" },
            { text: "Precision", archetype: "thoughtful" },
          ],
        },
        {
          q: "Your biggest challenge is:",
          answers: [
            { text: "Slowing down", archetype: "leader" },
            { text: "Staying focused", archetype: "connector" },
            { text: "Speaking up", archetype: "steady" },
            { text: "Letting go", archetype: "thoughtful" },
          ],
        },
        {
          q: "You feel most fulfilled when:",
          answers: [
            { text: "You make progress", archetype: "leader" },
            { text: "You inspire or connect", archetype: "connector" },
            { text: "People feel safe and supported", archetype: "steady" },
            { text: "Things are clear and well done", archetype: "thoughtful" },
          ],
        },
        {
          q: "In relationships, you value most:",
          answers: [
            { text: "Respect", archetype: "leader" },
            { text: "Fun and connection", archetype: "connector" },
            { text: "Trust", archetype: "steady" },
            { text: "Integrity", archetype: "thoughtful" },
          ],
        },
        {
          q: "When facing uncertainty, you usually:",
          answers: [
            { text: "Move forward anyway", archetype: "leader" },
            { text: "Reach out and process aloud", archetype: "connector" },
            { text: "Stay with what feels familiar", archetype: "steady" },
            { text: "Gather more information", archetype: "thoughtful" },
          ],
        },
        {
          q: "People rely on you to:",
          answers: [
            { text: "Lead", archetype: "leader" },
            { text: "Energize", archetype: "connector" },
            { text: "Support", archetype: "steady" },
            { text: "Protect and think ahead", archetype: "thoughtful" },
          ],
        },
      ],
    },
    // Archetypes now loaded from QuizArchetype entity — no hardcoding here
  },

  // ── Add future book funnels below ──────────────────────────────────────────
  // "next-book-slug": {
  //   quiz: { title: "...", subtitle: "...", intro: "...", questions: [...] },
  //   archetypes: { key1: { title, emoji, summary, strengths, growth, relationships, stress, restyle }, ... }
  // },
};

/** Returns the funnel config for a given book slug, or null if not found. */
export function getFunnel(slug) {
  return BOOK_FUNNELS[slug] || null;
}
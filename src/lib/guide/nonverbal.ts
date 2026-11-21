import type { Lesson } from "./types";

// Non-verbal lessons: one for each chapter of the Non-verbal bank (chapter number = lesson order). The examples are real questions of the bank,
// shown with their figures and the bank's own answer, so a lesson can never disagree with the quiz.
// None of the chapters is confirmed past-paper material: chapter 1 is from a prep MCQ file ("Analogy Non-Verbal MCQs"), chapters 2 to 6 are practice puzzles written for this app
// and chapter 7 is from a practice book. So these lessons are not ranked by how often a topic repeats.

/** The Non-verbal chapter (unit) each lesson belongs to, in lesson order. */
export const NONVERBAL_LESSON_IDS = ["figure-analogies", "matrix-puzzles", "series", "analogies", "odd-one-out", "mirror-rotation", "mixed-puzzles"] as const;

const nonverbal = (unit: number, rest: Omit<Lesson, "group" | "practice" | "id">): Lesson => ({
  ...rest,
  id: NONVERBAL_LESSON_IDS[unit - 1],
  group: "nonverbal",
  practice: { default: { bank: "nonverbal", units: [unit] } },
});

export const NONVERBAL_LESSONS: Lesson[] = [
  nonverbal(1, {
    title: "Figure analogies",
    summary: "Busy figures: find how the first one became the second, then do the same to the third.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Compare the first two figures.", text: "Ask what happened to the whole picture: was it flipped, turned, made bigger or smaller, shaded, or did parts get added or removed?" },
          { head: "Say the change in words.", text: "For example \"flipped top to bottom\". Write it down in your head before you look at the options." },
          { head: "Do the same to the third figure.", text: "Then cross out every option that does not show that change. If two options are left, check the small details (lines and little shapes inside)." },
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-1" },
      {
        kind: "text",
        title: "How to read the example",
        paragraphs: [
          "The first figure is flipped top to bottom to make the second: the simple triangle that was at the top is now at the bottom, and the busy part moves up. So the third figure is flipped top to bottom too. The triangle points down and the little square ends up near the bottom. That is option 4.",
        ],
      },
      { kind: "watch", text: "The figures in the real papers have many small lines. Do not try to match everything at once. Decide the one big change first (flip, turn or size), then check the details." },
    ],
  }),

  nonverbal(2, {
    title: "Matrix puzzles",
    summary: "A 3 x 3 grid with one box missing. Use the rows and the columns.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Look at rows and columns separately.", text: "Read across each row, then down each column. Note what is the same and what changes." },
          { head: "Look for \"once in every row and column\".", text: "Often each shape (or fill, or size, or number) appears exactly once in every row and every column. Find which one is missing from the last row and column." },
          { head: "Look for \"same one way, changing the other way\".", text: "A feature can stay the same along a row but change down the rows (for example one, two, three shapes). Check the missing box against both rules." },
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-19" },
      { kind: "watch", text: "Check one feature at a time: shape, number, size, fill. A box can be right about the shape and wrong about the number." },
    ],
  }),

  nonverbal(3, {
    title: "Series",
    summary: "Figures that change by the same step each time. Find the step and take it once more.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Find what changes.", text: "Compare figure 1 and figure 2. Is it the number of sides, a turn, a dot that moves, shading that moves, or a size?" },
          { head: "Check the same step again.", text: "Compare figure 2 and figure 3 to be sure it is the same step every time." },
          { head: "Take one more step.", text: "Apply the step to the last figure, then pick the option that matches." },
        ],
      },
      {
        kind: "table",
        title: "Steps that the practice puzzles use",
        head: ["What changes", "Example step"],
        rows: [
          ["Number of sides", "Goes down by one each time (8, 7, 6, 5, next 4)"],
          ["A turn", "A shape turns 90 degrees clockwise each time"],
          ["A dot moving", "Moves 1 or 2 places round a square each time"],
          ["Shading moving", "Moves 1 sector round a circle each time"],
          ["An arrow turning", "Turns 45 degrees clockwise each time"],
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-59" },
      { kind: "watch", text: "Clockwise and anticlockwise are easy to mix up. Say \"clockwise\" out loud and follow the hands of a clock with your pencil." },
    ],
  }),

  nonverbal(4, {
    title: "Analogies",
    summary: "Clean figures where one simple change links the first pair. Copy it to the second pair.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "List what changed.", text: "Compare the first two figures. Check size, number of shapes, fill (empty, striped, solid) and a turn or flip." },
          { head: "There may be two changes.", text: "For example one shape becomes two, and the fill goes from empty to solid. Do both." },
          { head: "Copy the change to the third figure.", text: "Only the options that show every change are possible. Cross out the rest." },
        ],
      },
      {
        kind: "table",
        title: "Changes the practice puzzles use",
        head: ["Change", "What to look for"],
        rows: [
          ["Size", "About half, or double"],
          ["Number", "One shape becomes two, or two becomes three"],
          ["Fill", "Empty, striped or solid"],
          ["Turn", "Upside down (180 degrees)"],
          ["Two at once", "For example upside down and half the size"],
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-89" },
      { kind: "watch", text: "The third figure is usually a different shape from the first. Copy the change, not the shape." },
    ],
  }),

  nonverbal(5, {
    title: "Odd one out",
    summary: "Four figures: three share a property, one does not.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Test one property at a time.", text: "Try these in turn: straight sides or a curve, a line of symmetry, the shape inside compared with the shape outside, the direction it points, shaded or not." },
          { head: "Find what three share.", text: "When three figures pass the test and one fails, you have the odd one." },
          { head: "If every test fits, try the next property.", text: "Do not stop at the first idea that is nearly right. Make sure only one figure breaks the rule." },
        ],
      },
      {
        kind: "table",
        title: "Properties the practice puzzles use",
        head: ["Property", "Three figures have it"],
        rows: [
          ["Symmetry", "A line of symmetry: it folds into two matching halves (or none of them have one)"],
          ["Edges", "Only straight sides (the odd one has a curved edge)"],
          ["Inside and outside", "The same shape inside as outside (the odd one has a different shape inside)"],
          ["Direction", "Pointing down (the odd one points up or sideways)"],
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-119" },
      { kind: "watch", text: "To test symmetry, imagine folding the figure. If the halves match, it has a line of symmetry." },
    ],
  }),

  nonverbal(6, {
    title: "Mirror and rotation",
    summary: "Which option is the same figure turned round, or flipped like a mirror image?",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Follow one easy part.", text: "Pick a part that is easy to spot, such as the dark square or the dot, and see where it goes in each option." },
          { head: "Turned or flipped?", text: "Turning (rotation) keeps the figure the same way round. Flipping (a mirror image) reverses it. A flipped figure can never be turned to match the original." },
          { head: "Check every option.", text: "Cross out options that have a block in a different place, or that are mirror images when the question asks for a turn." },
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-144" },
      {
        kind: "table",
        title: "Two kinds of flip",
        head: ["Flip", "How to picture it"],
        rows: [
          ["Left to right", "A mirror standing up beside the figure"],
          ["Top to bottom", "A mirror lying flat under the figure"],
        ],
      },
      { kind: "watch", text: "A turned shape can be turned back to match. A mirror image never can. If an option looks the same as the original but \"backwards\", it is a flip." },
    ],
  }),

  nonverbal(7, {
    title: "Mixed puzzles",
    summary: "Puzzles from a practice book: no single pattern, so use a checklist.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "List what moves or changes.", text: "Look at the first two or three figures. Check each in turn: position, a turn, a flip, shape, shading, size, number of parts." },
          { head: "Follow each moving part on its own.", text: "If a circle and a line both move, work out how each one moves. They may follow the same rule or a different one." },
          { head: "Predict, then look at the options.", text: "Decide what the next figure should look like first. Then cross out the options that do not match." },
        ],
      },
      { kind: "bankExample", title: "A real question", questionId: "mil-nonverbal-169" },
      {
        kind: "text",
        title: "How to read the example",
        paragraphs: [
          "The circle moves one box clockwise each step: top right, bottom right, bottom left, so next it is top left. The line moves one box clockwise as well: bottom left, top left, top right, so next it is bottom right. Option 1 has the circle at the top left and the line at the bottom right.",
        ],
      },
      { kind: "watch", text: "If you cannot see the rule, ignore the options for a moment and describe each figure in a few words. The rule often shows up in the words." },
    ],
  }),
];

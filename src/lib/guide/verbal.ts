import type { Lesson } from "./types";

// Verbal lessons. The six topics are the "Past repeated" chapters of the Verbal bank (candidates recalled them from the real papers); PMA LC has the same six in its own bank.
// Every worked example below is a question that is really in the bank, and its answer is the bank's answer (checked in guide.test.ts against the bank files when they are present).

const verbal = (id: string, units: number[], pmaUnits: number[], rest: Omit<Lesson, "group" | "practice" | "id">): Lesson => ({
  ...rest,
  id,
  group: "verbal",
  practice: { default: { bank: "verbal", units }, "pma-lc": { bank: "verbal-pma-lc", units: pmaUnits } },
});

export const VERBAL_LESSONS: Lesson[] = [
  verbal("percentages", [9], [2], {
    title: "Percentages and arithmetic",
    summary: "Percent of a number, percent of a total, profit, averages and share sums.",
    minutes: 4,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Find 10% first.", text: "Move the dot one place to the left. 10% of 90 is 9. 10% of 120 is 12. One tenth means the same thing." },
          { head: "Build the percent from pieces.", text: "5% is half of 10%. 20% is two lots of 10%. 80% is eight lots of 10%. 50% is a half and 25% is a quarter." },
          { head: "For \"what percentage\", use part over whole.", text: "Part divided by whole, times 100. For the other group (girls, absent), take the part away from the whole first, or use the group itself." },
        ],
      },
      {
        kind: "examples",
        title: "How the past papers ask it",
        items: [
          { prompt: "What is 80% of 90?", lines: ["10% of 90 is 9.", "80% is eight lots of 10%: 8 x 9."], answer: "72" },
          { prompt: "What is one third of 10% of 120?", lines: ["10% of 120 is 12.", "One third of 12 is 4."], answer: "4" },
          { prompt: "Out of 500 students, 360 are boys. What percentage are girls?", lines: ["Girls: 500 - 360 = 140.", "140 divided by 500 is 0.28, so 28%."], answer: "28%" },
          { prompt: "Ali buys a pen for Rs 30 and sells it for Rs 40. What is his profit percentage?", lines: ["Profit: 40 - 30 = 10.", "Profit percentage is out of the cost price: 10 divided by 30, times 100."], answer: "33.33%" },
          { prompt: "Saleem has an average of 60 in 4 subjects. After the 5th test his average drops to 58. How many marks did he get in the 5th test?", lines: ["Total of 4 tests: 60 x 4 = 240.", "Total of 5 tests: 58 x 5 = 290.", "The 5th test: 290 - 240."], answer: "50" },
          { prompt: "One dozen pencils cost Rs 60. What is the price of 5 pencils?", lines: ["12 pencils cost Rs 60, so 1 pencil costs 60 divided by 12 = Rs 5.", "5 pencils: 5 x 5."], answer: "Rs 25" },
          { prompt: "Amjad and Ahmad keep 24 balls together. Amjad keeps 3 times as many as Ahmad. How many does Ahmad keep?", lines: ["Ahmad has 1 part and Amjad has 3 parts: 4 parts in all.", "24 divided by 4 = 6 for one part."], answer: "6" },
        ],
      },
      {
        kind: "text",
        title: "Up and down are not the same",
        paragraphs: ["50 up to 60 is +20% (10 out of 50). 60 back down to 50 is only about -16.7% (10 out of 60)."],
      },
      { kind: "watch", text: "A percent is always out of the number you started with. Profit percentage is out of the cost price, not the selling price." },
    ],
  }),

  verbal("days-dates", [8], [1], {
    title: "Days and dates",
    summary: "Find the weekday of another date, and work with yesterday, tomorrow and months.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Find the gap.", text: "Take the smaller date from the bigger one. From the 2nd to the 23rd is 21 days." },
          { head: "Only the leftover matters.", text: "Divide the gap by 7. A week brings you back to the same day, so keep only the remainder." },
          { head: "Move that many days.", text: "If the date you want is later, go forward by the remainder. If it is earlier, go back by the remainder." },
        ],
      },
      {
        kind: "table",
        title: "The week in order",
        head: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        rows: [["1", "2", "3", "4", "5", "6", "7"]],
        note: "Remainder 0 is the same day. After Sunday comes Monday again.",
      },
      {
        kind: "examples",
        title: "How the past papers ask it",
        items: [
          { prompt: "If the 28th day of a month is Sunday, which day will the 2nd day of that month be?", lines: ["Gap: 28 - 2 = 26.", "26 divided by 7 is 3 with remainder 5.", "The 2nd is earlier, so go back 5 days from Sunday: Saturday, Friday, Thursday, Wednesday, Tuesday."], answer: "Tuesday" },
          { prompt: "If the 2nd day of a month is Friday, which day will the 23rd day of that month be?", lines: ["Gap: 23 - 2 = 21, which is exactly 3 weeks.", "Remainder 0, so it is the same day."], answer: "Friday" },
          { prompt: "If the 4th day of a month is Tuesday, which day will the 26th day of that month be?", lines: ["Gap: 26 - 4 = 22. 22 divided by 7 is 3 with remainder 1.", "The 26th is later, so go forward 1 day."], answer: "Wednesday" },
          { prompt: "If yesterday was Friday, which day will the day after tomorrow be?", lines: ["Find today first: after Friday comes Saturday.", "The day after tomorrow is today + 2: Sunday, then Monday."], answer: "Monday" },
        ],
      },
      {
        kind: "facts",
        title: "Month facts the papers also ask",
        groups: [
          { title: "Months", facts: ["[[7 months]] have 31 days: January, March, May, July, August, October and December.", "[[4 months]] have exactly 30 days: April, June, September and November.", "[[February]] has 28 days, or 29 in a leap year."] },
          { title: "Leap year", facts: ["A [[leap year]] comes after every 4 years."] },
        ],
      },
      { kind: "watch", text: "\"Yesterday\" and \"tomorrow\" puzzles: always work out today first, then count. Do not count from the day they name." },
    ],
  }),

  verbal("directions-letters-series", [12, 2, 3, 4], [5], {
    title: "Directions, letters and series",
    summary: "Turns on a compass, number and letter series, and letters as numbers.",
    minutes: 5,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Directions: turn by quarter turns.", text: "North, East, South, West go round clockwise. A right turn moves one step clockwise. A left turn moves one step back. Facing North, left is West and right is East." },
          { head: "Series: write the gaps.", text: "Subtract each number from the next. If the gaps are not the same, look at the gaps of the gaps, or try multiplying. If the series jumps up and down, split it into two series (every other number)." },
          { head: "Letters: turn them into numbers.", text: "A = 1, B = 2 and so on up to Z = 26. Then the same gap tricks work on letters." },
        ],
      },
      {
        kind: "examples",
        title: "Directions",
        items: [
          { prompt: "A man walks north, then turns left, then turns right. Which direction is he facing now?", lines: ["North, then left gives West.", "Then right goes back one step clockwise: North."], answer: "North" },
          { prompt: "Ali walks north, then turns left, then turns left again. Which direction is he facing?", lines: ["North, left gives West.", "Left again gives South."], answer: "South" },
        ],
      },
      {
        kind: "examples",
        title: "Number series",
        items: [
          { prompt: "Complete the series: 2, 6, 14, 30, 62, ?", lines: ["Each number is double the one before, plus 2: 2 x 2 + 2 = 6, 6 x 2 + 2 = 14, 14 x 2 + 2 = 30, 30 x 2 + 2 = 62.", "So 62 x 2 + 2."], answer: "126" },
          { prompt: "Complete the series: 66, 63, 57, 45, ?", lines: ["The gaps are -3, -6, -12. Each gap doubles.", "The next gap is -24: 45 - 24."], answer: "21" },
          { prompt: "Complete the series: 115, 55, 170, 65, 235, ?", lines: ["Split it into two series. Places 1, 3, 5: 115, 170, 235 (adding 55, then 65).", "Places 2, 4, 6: 55, 65, then adding 10 more."], answer: "75" },
        ],
      },
      {
        kind: "examples",
        title: "Letter series and letters as numbers",
        items: [
          { prompt: "Complete the series: B, E, J, Q, ?", lines: ["As numbers: 2, 5, 10, 17.", "The gaps are 3, 5, 7. The next gap is 9, so 17 + 9 = 26.", "26 is the letter Z."], answer: "Z" },
          { prompt: "Complete the series: A, C, F, J, O, ?", lines: ["As numbers: 1, 3, 6, 10, 15.", "The gaps are 2, 3, 4, 5. The next gap is 6, so 15 + 6 = 21.", "21 is the letter U."], answer: "U" },
          { prompt: "Write the word for the numbers 18, 5, 19, 20 (A = 1, B = 2, ...).", lines: ["18 is R, 5 is E, 19 is S, 20 is T."], answer: "REST" },
          { prompt: "What is the third letter of the word AUGMENTED when its letters are arranged alphabetically?", lines: ["Sort the letters: A, D, E, E, G, M, N, T, U.", "The third one is E."], answer: "E" },
        ],
      },
      {
        kind: "examples",
        title: "Letter codes",
        items: [
          { prompt: "If CAT is coded as DBU, how is DOG coded?", lines: ["Each letter moves one step forward: C to D, A to B, T to U.", "Do the same to DOG: D to E, O to P, G to H."], answer: "EPH" },
          { prompt: "In a code, A is written as Z, B as Y, C as X and so on (the alphabet reversed). How is DOG written?", lines: ["Two letters that swap always add up to 27 (A = 1 and Z = 26).", "D = 4, so its partner is 23 = W. O = 15, so 12 = L. G = 7, so 20 = T."], answer: "WLT" },
        ],
      },
      { kind: "watch", text: "On a compass, a left turn and a right turn are opposite. Draw a small cross (N at the top) and put your pencil on it: it is faster and safer than doing it in your head." },
    ],
  }),

  verbal("odd-one-out-words", [13, 1, 7], [6], {
    title: "Odd one out and word relations",
    summary: "Find what three words share, and the link between a pair of words.",
    minutes: 3,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Odd one out: name the group.", text: "Ask \"what are three of these?\" (shapes, grains, continents, animals, games). The one that does not fit is the answer." },
          { head: "Word pairs: name the link.", text: "In the first pair, say how the two words are related in one short phrase. Then find the option that has the same link with the third word." },
          { head: "\"Why\" questions: pick the main purpose.", text: "Choose the answer that says what the thing is mainly for. Ignore answers that are true but small." },
        ],
      },
      {
        kind: "table",
        title: "Links that come up again and again",
        head: ["Link", "Example"],
        rows: [
          ["Opposite", "Hot is to cold as day is to night"],
          ["Tool and its use", "Pen is to write as knife is to cut"],
          ["Worker and place", "Doctor is to hospital as teacher is to school"],
          ["Body part and its job", "Eye is to see as ear is to hear"],
          ["Part and whole", "Page is to book as petal is to flower"],
          ["Male and female", "Dog is to bitch as horse is to mare"],
        ],
      },
      {
        kind: "examples",
        title: "Odd one out in the past papers",
        items: [
          { prompt: "Which is the odd one out: Wheat, Hay, Rice, Barley?", lines: ["Wheat, rice and barley are grain crops. Hay is dried grass."], answer: "Hay" },
          { prompt: "Which is the odd one out: America, Africa, Asia, Euro?", lines: ["America, Africa and Asia are continents. The euro is money."], answer: "Euro" },
          { prompt: "Which is the odd one out: Monkey, Chimpanzee, Panda, Baboon?", lines: ["Monkey, chimpanzee and baboon are primates. A panda is a bear."], answer: "Panda" },
          { prompt: "Which is the odd one out: Angle, Rectangle, Square, Hexagon?", lines: ["Rectangle, square and hexagon are closed shapes. An angle is not a closed shape."], answer: "Angle" },
        ],
      },
      { kind: "watch", text: "The odd one is not about spelling or length. It can come from a different group of the same kind (Euro is real and well known, but it is not a continent)." },
    ],
  }),

  verbal("speed-time-work", [10], [3], {
    title: "Speed, time and work",
    summary: "Distance from speed and time, and how long a job takes with more or fewer workers.",
    minutes: 4,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Get the rate for one unit.", text: "Speed is distance divided by time. Change it to \"per minute\" when the time is in minutes: 60 km in an hour is 1 km every minute." },
          { head: "Then multiply.", text: "Distance = rate x time. Keep the units the same: change hours to minutes (x 60) or minutes to hours (divide by 60) before you multiply." },
          { head: "Work: men x days stays the same.", text: "10 men for 5 days is 50 man-days of work. Fewer men need more days: divide the 50 by the new number of men." },
        ],
      },
      {
        kind: "examples",
        title: "How the past papers ask it",
        items: [
          { prompt: "A train moves at 90 km/h. How far does it go in 12 minutes?", lines: ["90 km in 60 minutes is 1.5 km each minute.", "12 x 1.5."], answer: "18 km" },
          { prompt: "A train covers 120 km in 1 hour 40 minutes. How far does it go in 15 minutes?", lines: ["1 hour 40 minutes is 100 minutes. 120 divided by 100 is 1.2 km each minute.", "15 x 1.2."], answer: "18 km" },
          { prompt: "A train is twice as fast as a car. The car covers 60 km in one hour. How far does the train go in 30 minutes?", lines: ["The train does 120 km in an hour.", "30 minutes is half an hour: half of 120."], answer: "60 km" },
          { prompt: "10 men dig a well in 5 days. How many days will 5 men take?", lines: ["Work: 10 x 5 = 50 man-days.", "50 divided by 5 men."], answer: "10 days" },
          { prompt: "If 5 men write 5 pages in 5 minutes, how long does 1 man take to write 1 page?", lines: ["Each man writes one page in the same 5 minutes. More men do not make one man faster."], answer: "5 minutes" },
          { prompt: "A helicopter needs 50 gallons to fly 320 km. How many gallons does it need for 400 km?", lines: ["400 is 1.25 times 320 (400 divided by 320).", "50 x 1.25."], answer: "62.5 gallons" },
        ],
      },
      { kind: "watch", text: "Read the time unit first. 1 hour 40 minutes is 100 minutes, not 140. And \"twice as fast\" doubles the speed before you do anything else." },
    ],
  }),

  verbal("ages-relations", [11], [4], {
    title: "Ages and relations",
    summary: "Ages in the future, family links and positions in a line.",
    minutes: 4,
    blocks: [
      {
        kind: "steps",
        title: "The trick",
        steps: [
          { head: "Ages: everyone gets older by the same number of years.", text: "Work out how many years pass, and add that same number to every person." },
          { head: "Relations: go one link at a time.", text: "Draw a tiny family tree. Read the sentence from the end: \"my brother's sister\" is my sister. Write each step down." },
          { head: "Positions: top + bottom - 1.", text: "If someone is 7th from the top and 12th from the bottom, the line has 7 + 12 - 1 people. From the other end: total - place + 1." },
        ],
      },
      {
        kind: "examples",
        title: "Ages",
        items: [
          { prompt: "Ali is 5 years old and Sidra is twice his age. How old will Sidra be when Ali is 11?", lines: ["Sidra is 10 now. Ali needs 11 - 5 = 6 more years.", "Sidra will be 10 + 6."], answer: "16" },
          { prompt: "My age is 10 and my brother is twice my age. What will be the ratio of my age to my brother's age after 10 years?", lines: ["Now: 10 and 20. After 10 years: 20 and 30."], answer: "2 : 3" },
        ],
      },
      {
        kind: "examples",
        title: "Relations and order",
        items: [
          { prompt: "The sister of my brother is your mother. How are you related to me?", lines: ["The sister of my brother is my sister, so my sister is your mother.", "That makes you my sister's child."], answer: "Nephew or niece" },
          { prompt: "My brother's sister is your mother. If I am a man, how am I related to you?", lines: ["My brother's sister is my sister. She is your mother.", "So I am your mother's brother."], answer: "Uncle" },
          { prompt: "Akbar is older than Ahmad. Umair is older than Akbar. Who is the eldest?", lines: ["Put them in a line: Umair, then Akbar, then Ahmad."], answer: "Umair" },
          { prompt: "Ali is 7th from the top and 12th from the bottom in a class. How many students are there?", lines: ["Ali is counted in both numbers, so take one away: 7 + 12 - 1."], answer: "18" },
        ],
      },
      { kind: "watch", text: "The gap between two ages never changes. If Sidra is 5 years older than Ali today, she is 5 years older in any year." },
    ],
  }),
];

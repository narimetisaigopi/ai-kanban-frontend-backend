import type { Board } from "./types";

export const initialBoard: Board = {
  columns: [
    { id: "col-backlog", title: "Backlog", cardIds: ["card-1", "card-2", "card-3"] },
    { id: "col-todo", title: "To Do", cardIds: ["card-4", "card-5"] },
    { id: "col-inprogress", title: "In Progress", cardIds: ["card-6", "card-7", "card-8"] },
    { id: "col-review", title: "Review", cardIds: ["card-9"] },
    { id: "col-done", title: "Done", cardIds: ["card-10", "card-11"] },
  ],
  cards: {
    "card-1": {
      id: "card-1",
      title: "Research competitors",
      details: "Review top 5 Kanban tools and note standout UX patterns.",
    },
    "card-2": {
      id: "card-2",
      title: "Define user stories",
      details: "Write stories for board, columns, cards, and drag-and-drop.",
    },
    "card-3": {
      id: "card-3",
      title: "Sketch wireframes",
      details: "Low-fidelity layouts for desktop and mobile views.",
    },
    "card-4": {
      id: "card-4",
      title: "Set up project scaffold",
      details: "Initialize Next.js app with Tailwind and testing tools.",
    },
    "card-5": {
      id: "card-5",
      title: "Design color palette",
      details: "Apply brand colors across headings, accents, and actions.",
    },
    "card-6": {
      id: "card-6",
      title: "Build board layout",
      details: "Five fixed columns with rename and card count badges.",
    },
    "card-7": {
      id: "card-7",
      title: "Implement drag and drop",
      details: "Move cards within and across columns using @dnd-kit.",
    },
    "card-8": {
      id: "card-8",
      title: "Add card form",
      details: "Inline form with title and details fields per column.",
    },
    "card-9": {
      id: "card-9",
      title: "Write unit tests",
      details: "Cover board actions and key component interactions.",
    },
    "card-10": {
      id: "card-10",
      title: "Polish UI",
      details: "Refine spacing, shadows, and hover states for a pro look.",
    },
    "card-11": {
      id: "card-11",
      title: "Run E2E tests",
      details: "Verify add, delete, rename, and drag flows in Playwright.",
    },
  },
};

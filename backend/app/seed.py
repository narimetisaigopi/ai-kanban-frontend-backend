from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Card, Column

SEED_COLUMNS = [
    ("col-backlog", "Backlog"),
    ("col-todo", "To Do"),
    ("col-inprogress", "In Progress"),
    ("col-review", "Review"),
    ("col-done", "Done"),
]

SEED_CARDS = [
    ("card-1", "col-backlog", "Research competitors",
     "Review top 5 Kanban tools and note standout UX patterns."),
    ("card-2", "col-backlog", "Define user stories",
     "Write stories for board, columns, cards, and drag-and-drop."),
    ("card-3", "col-backlog", "Sketch wireframes",
     "Low-fidelity layouts for desktop and mobile views."),
    ("card-4", "col-todo", "Set up project scaffold",
     "Initialize Next.js app with Tailwind and testing tools."),
    ("card-5", "col-todo", "Design color palette",
     "Apply brand colors across headings, accents, and actions."),
    ("card-6", "col-inprogress", "Build board layout",
     "Five fixed columns with rename and card count badges."),
    ("card-7", "col-inprogress", "Implement drag and drop",
     "Move cards within and across columns using @dnd-kit."),
    ("card-8", "col-inprogress", "Add card form",
     "Inline form with title and details fields per column."),
    ("card-9", "col-review", "Write unit tests",
     "Cover board actions and key component interactions."),
    ("card-10", "col-done", "Polish UI",
     "Refine spacing, shadows, and hover states for a pro look."),
    ("card-11", "col-done", "Run E2E tests",
     "Verify add, delete, rename, and drag flows in Playwright."),
]


async def seed_if_empty(session: AsyncSession) -> None:
    count = await session.scalar(select(func.count()).select_from(Column))
    if count:
        return

    for position, (col_id, title) in enumerate(SEED_COLUMNS):
        session.add(Column(id=col_id, title=title, position=position))

    per_column_index: dict[str, int] = {}
    for card_id, column_id, title, details in SEED_CARDS:
        position = per_column_index.get(column_id, 0)
        per_column_index[column_id] = position + 1
        session.add(
            Card(
                id=card_id,
                column_id=column_id,
                title=title,
                details=details,
                position=position,
            )
        )

    await session.commit()

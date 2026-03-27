# Improvements Log

I kept the extra work close to the original brief. The goal was to make the board better to use, not to turn it into a different product.

## Board interaction

- task drop targets support before, after, and swap behavior
- tasks can be inserted at the top of a populated stage
- stage reordering uses native drag and drop
- stage and task dragging use wider hit targets now, so drops do not need to be overly precise
- the board surface supports horizontal drag-scroll
- keyboard movement is available with `Alt+Shift+Arrow`
- drag previews and drop hints are clearer than the first working version

## Task detail improvements

- task comments were added
- task history is visible in the details panel
- reusable badge definitions were added
- badge descriptions stay hidden until hover or selection
- task priority is supported and also affects card styling

## Board management

- filter presets are saved per user
- archive and trash were added
- trash keeps items for 30 days
- bulk actions are available in the workspace
- empty stages can be removed with confirmation
- per-user board UI preferences are saved

## UI work

- the board was cleaned up into a sharper, more compact layout
- the details panel can be resized on desktop
- mobile stage tabs were added
- compact card mode was added
- tooltips were widened and made viewport-aware
- toasts were moved to the bottom-left

## Delivery work

- accessibility warnings were fixed on the flagged form controls
- TypeScript strict checks were enabled at the root
- Playwright coverage was added for the main board lifecycle
- Docker support was added as an optional run path
- documentation was rewritten for a cleaner handoff

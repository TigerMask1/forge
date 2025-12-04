# Design Guidelines: Advanced Agentic Coding Sandbox Platform

## Design Approach

**System**: Combination of VS Code's functional patterns + Linear's minimalist aesthetic + Replit's approachable web IDE experience

**Key Principles**:
- Maximum screen real estate for code and file navigation
- Minimal visual friction - every pixel serves a purpose
- Clear information hierarchy through spacing and typography alone
- Professional developer tool aesthetic with modern refinement

---

## Typography System

**Font Families**:
- **Interface**: Inter (Google Fonts) - UI elements, labels, navigation
- **Code**: JetBrains Mono (Google Fonts) - Editor and terminal
- **Headings**: Inter (same family, different weights for consistency)

**Type Scale**:
- **Extra Large** (text-2xl, font-semibold): Page titles, section headers
- **Large** (text-lg, font-medium): Panel headers, toolbar labels
- **Base** (text-base, font-normal): Body text, file names, descriptions
- **Small** (text-sm, font-normal): Metadata, timestamps, secondary labels
- **Extra Small** (text-xs, font-medium): Badges, status indicators, hotkey hints

**Code Typography**:
- **Editor**: text-sm with leading-relaxed (line-height: 1.625) for readability
- **Terminal**: text-sm with leading-normal
- **Inline code**: text-sm font-mono with subtle background treatment

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** consistently throughout
- Tight spacing: p-2, gap-2 (within buttons, compact lists)
- Standard spacing: p-4, gap-4 (panels, cards, form fields)
- Generous spacing: p-6, gap-6 (section padding, major dividers)
- Large spacing: p-8, gap-8 (modal padding, hero sections)

**Grid Structure**:
```
┌─────────────────────────────────────────────┐
│ Top Bar (h-14)                              │
├──────────┬──────────────────────┬───────────┤
│ Sidebar  │ Main Editor Area     │ Right     │
│ (w-64)   │ (flex-1)             │ Panel     │
│          │                      │ (w-80)    │
│ File     │ Tabs (h-10)          │ Optional  │
│ Tree     │ ─────────────────    │           │
│          │ Monaco Editor        │ Agent     │
│          │                      │ Config    │
│          │                      │ or        │
│          ├──────────────────────┤ Diff      │
│          │ Terminal (h-64)      │ Viewer    │
└──────────┴──────────────────────┴───────────┘
```

**Responsive Breakpoints**:
- Desktop (lg:): Full 3-column layout
- Tablet (md:): Collapsible sidebar, hide right panel
- Mobile: Single column with drawer navigation

---

## Component Library

### **Navigation & Structure**

**Top Bar**:
- Fixed height (h-14), flex layout with justify-between
- Left: Logo/brand (h-8 w-auto) + project name (text-base font-medium)
- Center: Global search/command palette trigger (w-96, rounded-lg border)
- Right: API status indicator + settings icon + user avatar
- Border bottom (border-b) for separation

**Sidebar (File Tree)**:
- Collapsible with toggle button (transition-transform duration-200)
- Nested file structure with indent levels (pl-4 per level)
- File/folder items: h-8 flex items-center gap-2
- Icons: 16px heroicons for file types (document, folder, code)
- Hover state with subtle background shift
- Active file with left border accent (border-l-2)

**Editor Tabs**:
- Horizontal scrollable container (flex overflow-x-auto)
- Tab items: px-4 py-2 flex items-center gap-2
- Close button (×) appears on hover
- Active tab with bottom border indicator (border-b-2)
- Max width per tab (max-w-xs) with ellipsis overflow

**Command Palette** (Modal):
- Centered overlay (max-w-2xl w-full)
- Search input at top (h-12 px-4 text-lg)
- Results list with keyboard navigation
- Item height: h-10 px-4 flex items-center justify-between
- Hotkey hints aligned right (text-xs)

### **Core Editing Components**

**Monaco Editor Container**:
- Fills available space (flex-1 relative)
- Minimal chrome - no borders, editor controls only
- Line numbers and minimap on by default
- Integrated scrollbars (native Monaco styling)

**Terminal Panel**:
- Fixed height (h-64) or resizable with drag handle
- JetBrains Mono font-family
- Command prompt with input field
- Output scrollable container (overflow-y-auto)

**Diff Viewer**:
- Split view: original (left) | modified (right)
- Line-by-line comparison with gutter indicators
- Added lines: left border accent
- Removed lines: different border treatment
- Accept/reject buttons inline per change block

### **Agentic System UI**

**Prompt Chain Designer**:
- Vertical flow visualization (top to bottom)
- Each step: rounded-xl p-6 with shadow-sm
- Step number badge (h-8 w-8 rounded-full) top-left
- Step content: textarea (min-h-32) with code highlighting
- Connection arrows between steps (2px lines with arrow markers)
- Add step button: dashed border (border-dashed) with hover effect

**Agent Configuration Panel**:
- Accordion sections (border-b separators)
- Section headers: py-3 px-4 flex justify-between items-center
- Expandable content: p-4 space-y-4
- Form fields: label above input (text-sm font-medium mb-2)
- Input fields: h-10 px-3 rounded-md border
- Textarea: min-h-24 p-3
- Toggle switches for boolean options

**API Integration Form**:
- Card layout (rounded-lg p-6 shadow-sm)
- Provider selection: grid grid-cols-2 gap-3 (icon + label cards)
- API key input: password field with show/hide toggle
- Endpoint URL: full-width text input
- Test connection button: primary CTA style
- Status indicator: small badge with connection state

**File Change Tracker**:
- List view of modified files (space-y-2)
- Each item: p-3 rounded-md border flex justify-between
- File path: text-sm font-mono truncate
- Change summary: "+12 -4" format (text-xs)
- Action buttons: Approve/Reject (h-8 px-3 rounded-md)

### **Forms & Inputs**

**Text Inputs**:
- Standard height: h-10
- Padding: px-3
- Border radius: rounded-md
- Focus state: outline offset (focus:ring-2 focus:ring-offset-2)

**Select Dropdowns**:
- Same dimensions as text inputs
- Chevron icon on right
- Custom dropdown menu: rounded-lg shadow-lg border mt-1

**Buttons**:
- Primary: h-10 px-6 rounded-md font-medium
- Secondary: same size with border variant
- Icon buttons: h-9 w-9 rounded-md flex items-center justify-center
- Ghost buttons: no background, just text with hover state

**Checkboxes/Toggles**:
- Toggle switches: w-11 h-6 rounded-full
- Checkboxes: h-5 w-5 rounded
- Labels: ml-3 text-sm

### **Feedback & Status**

**Badges**:
- Inline: px-2 py-1 rounded-md text-xs font-medium
- Use for: file status, API status, agent state

**Loading States**:
- Spinner: 16px heroicons with rotation animation
- Progress bars: h-2 rounded-full overflow-hidden
- Skeleton screens: animated pulse for file tree/editor loading

**Toasts/Notifications**:
- Fixed bottom-right positioning
- Max-w-sm rounded-lg shadow-lg p-4
- Icon (20px) + message + close button
- Auto-dismiss after 5 seconds

---

## Interactions & Animations

**Use Sparingly** - only for meaningful transitions:
- Sidebar collapse/expand: transition-transform duration-200
- Modal fade in: opacity and scale (duration-200)
- Dropdown menus: slide down effect (duration-150)
- File tree expand/collapse: height animation (duration-150)

**NO animations for**:
- Tab switching
- Editor focus changes
- Button hovers (instant state changes preferred)

---

## Accessibility

- All interactive elements: min-h-10 min-w-10 for touch targets
- Form fields: proper label associations (htmlFor)
- Focus indicators: visible keyboard navigation outlines
- ARIA labels for icon-only buttons
- Keyboard shortcuts displayed in tooltips

---

## Images

**No images required** - This is a pure developer tool interface. All visual interest comes from:
- Code syntax highlighting
- File tree structure
- Typography hierarchy
- Generous whitespace
- Functional iconography (heroicons)

If future marketing pages are added, those would use images differently, but the core application is image-free.
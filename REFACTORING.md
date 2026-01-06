# Refactoring Summary

This document outlines the refactoring changes made to achieve better separation of concerns, proper use of GDS/MOJ components, and i18n support.

## Directory Structure

```
server/
├── content/                    # i18n content files
│   ├── en/                     # English content
│   │   ├── common.json
│   │   ├── questions.json
│   │   ├── video.json
│   │   ├── verify.json
│   │   ├── checkAnswers.json
│   │   ├── confirmation.json
│   │   ├── errors.json
│   │   ├── index.json
│   │   ├── home.json
│   │   ├── accessibility.json
│   │   ├── guidance.json
│   │   ├── practitioner-guidance.json
│   │   └── privacy.json
│   ├── cy/                     # Welsh content (same structure)
│   │   └── ...
│   └── index.ts                # Content loader and helpers
│
├── controllers/
│   └── submission/             # Split controllers by domain
│       ├── index.ts            # Re-exports all controllers
│       ├── types.ts            # TypeScript types for locals
│       ├── helpers.ts          # Shared helper functions
│       ├── indexController.ts  # Start page
│       ├── verifyController.ts # Identity verification
│       ├── questionsController.ts # Mental health, assistance, callback
│       ├── videoController.ts  # Video recording flow
│       ├── checkAnswersController.ts # Summary and submission
│       ├── confirmationController.ts # Confirmation page
│       └── sessionController.ts # Timeout and keepalive
│
├── middleware/
│   └── languageMiddleware.ts   # i18n language detection/switching
│
└── views/
    ├── layouts/                # Layout hierarchy
    │   ├── base.njk            # Base layout with GDS macros
    │   ├── form.njk            # Form pages with error handling
    │   ├── video.njk           # Video pages with video.js
    │   └── content.njk         # Static content pages
    └── pages/
        ├── index.njk           # Home page (uses i18n)
        ├── accessibility.njk   # Static page (uses i18n)
        ├── guidance.njk        # Static page (uses i18n)
        ├── practitioner-guidance.njk # Static page (uses i18n)
        ├── privacy.njk         # Static page (uses i18n)
        └── submission/         # Submission flow pages
```

## Key Changes

### 1. Separation of Concerns - Controllers

**Before:** Single monolithic `submissionController.ts` (290 lines)
**After:** Split into 7 focused controllers:

| Controller | Responsibility |
|------------|----------------|
| `indexController.ts` | Start page, session initialization |
| `verifyController.ts` | Identity verification |
| `questionsController.ts` | All question forms |
| `videoController.ts` | Video recording flow |
| `checkAnswersController.ts` | Summary list building, form submission |
| `confirmationController.ts` | Confirmation page |
| `sessionController.ts` | Timeout/keepalive |

### 2. Template Logic Moved to Controllers

**Before:** Templates had logic like:
```nunjucks
{% for a in formData['assistance'] | split(",") %}
  {{ a | userFriendlyString }}{% if not loop.last %},{% endif %}
{% endfor %}
```

**After:** Controllers build data structures:
```typescript
// checkAnswersController.ts
const summaryRows = buildSummaryRows(formData, submissionId, t)
res.render('pages/submission/check-answers', { summaryRows })
```

### 3. GDS/MOJ Component Usage

**Replaced raw HTML with GDS macros:**

| Component | Before | After |
|-----------|--------|-------|
| Header | 43 lines raw HTML with inline SVG | `govukHeader` macro |
| Summary List | 134 lines raw HTML | `govukSummaryList` macro |
| Buttons | Mixed raw HTML and macros | All use `govukButton` |
| Tags | Raw HTML `<div class="govuk-tag">` | `govukTag` macro |
| Inset Text | Raw HTML | `govukInsetText` macro |

### 4. Layout Hierarchy

**Layout inheritance:**

```
govuk/template.njk
    └── layouts/base.njk         # Header, footer, phase banner, language toggle
            ├── layouts/form.njk     # Error summary, CSRF, form wrapper
            ├── layouts/video.njk    # video.js script inclusion
            └── layouts/content.njk  # Static content wrapper
```

**Benefits:**
- Form boilerplate (error summary, CSRF, grid) defined once
- video.js only loaded on video pages (not globally)
- Consistent structure across all pages

### 5. Middleware Scoping

**Before (app.ts):** All middleware applied globally
```typescript
app.use(bodyParser.json())           // Global
app.use(storeFormDataInSession())    // Global
app.use(populateValidationErrors())  // Global
app.use(restrictToUK)                // Global
```

**After:** Middleware scoped to relevant routes
```typescript
// Static routes use base middleware
app.use(routes())

// Submission routes get form-specific middleware
const submissionRouter = express.Router()
submissionRouter.use(bodyParser.json())
submissionRouter.use(storeFormDataInSession())
submissionRouter.use(populateValidationErrors())
submissionRouter.use(restrictToUK)
app.use('/:submissionId', submissionRouter)
```

### 6. Internationalisation (i18n)

**Features:**
- Content stored in JSON files (`server/content/en/`, `server/content/cy/`)
- Language toggle in header with proper `lang` attributes (WCAG 2.1 compliant)
- Translation helper `t()` available in templates and controllers
- `getContent()` helper for retrieving full content objects

**Language Switching Pattern:**
- When user clicks language toggle, they visit `/cy/...` or `/en/...`
- The language middleware detects the prefix, sets a cookie, and redirects to the URL without the prefix
- Subsequent requests use the cookie to determine language
- This allows bookmarkable URLs while maintaining language preference

**URL Patterns:**
- `/cy/path` → Sets Welsh cookie, redirects to `/path`
- `/en/path` → Sets English cookie, redirects to `/path`
- `/path` → Uses cookie (defaults to English if no cookie)

**Usage in templates:**
```nunjucks
{{ t('common.back') }}
{{ t('questions.mentalHealth.title') }}
{% set content = getContent('questions.mentalHealth') %}

{# For static pages with HTML content #}
{% set pageContent = getContent('accessibility') %}
{{ pageContent.content | safe }}
```

### 7. Static Content Pages with i18n

Static pages (accessibility, guidance, practitioner-guidance, privacy) now use JSON files containing HTML content for easier translation management:

**JSON structure:**
```json
{
  "pageTitle": "Page Title",
  "content": "<p class=\"govuk-body\">HTML content here...</p>"
}
```

**Template pattern:**
```nunjucks
{% set pageContent = getContent('accessibility') %}
{% set pageTitle = pageContent.pageTitle %}

{% block content %}
  <h1 class="govuk-heading-l">{{ pageTitle }}</h1>
  {{ pageContent.content | safe }}
{% endblock %}
```

**Benefits:**
- Single source of truth for each language
- No template duplication between languages
- HTML preserved for complex formatting
- Easy to send to translators

## Build Configuration

The esbuild configuration (`esbuild/esbuild.config.js`) copies JSON content files to the dist folder:

```javascript
copy: [
  {
    from: path.join(cwd, 'server/views/**/*'),
    to: path.join(cwd, 'dist/server/views'),
  },
  {
    from: path.join(cwd, 'server/content/**/*.json'),
    to: path.join(cwd, 'dist/server/content'),
  },
],
```

## Files Summary

### Controllers
- `server/controllers/submission/*.ts` (8 files)

### Middleware
- `server/middleware/languageMiddleware.ts`

### Content (i18n)
- `server/content/en/*.json` (13 files)
- `server/content/cy/*.json` (13 files)
- `server/content/index.ts`

### Layouts
- `server/views/layouts/base.njk`
- `server/views/layouts/form.njk`
- `server/views/layouts/video.njk`
- `server/views/layouts/content.njk`

### Static Pages (i18n enabled)
- `server/views/pages/index.njk` (home)
- `server/views/pages/accessibility.njk`
- `server/views/pages/guidance.njk`
- `server/views/pages/practitioner-guidance.njk`
- `server/views/pages/privacy.njk`

### Submission Flow Templates
- `server/views/pages/submission/index.njk`
- `server/views/pages/submission/verify.njk`
- `server/views/pages/submission/questions/*.njk`
- `server/views/pages/submission/video/*.njk`
- `server/views/pages/submission/check-answers.njk`
- `server/views/pages/submission/confirmation.njk`
- `server/views/pages/submission/timeout.njk`

## Verification

- TypeScript types pass (`npm run typecheck`)
- ESLint passes (`npm run lint`)
- Build succeeds (`npm run build`)

# Blog Post Page Design Guide

This document outlines the design and styling for a modern, clean, and readable blog post page. The design is responsive and uses a consistent brand color palette.

## 1. Overall Layout

The main content is centered on the page within a container that has a maximum width (e.g., `max-w-4xl`). This ensures readability on wider screens. The page has vertical spacing between sections to create a clear visual hierarchy.

- **Container:** `container mx-auto px-4 py-8 md:py-12`
- **Structure:** The page is built with semantic HTML sections (`<article>`, `<header>`, `<section>`).

## 2. Color Palette

The design uses a defined color palette to maintain brand consistency.

- **Primary Brand Orange:** `#FF7A30` (Used for links, buttons, and accents)
- **Muted Text / Blue-Gray:** `#465C88` (Used for metadata and secondary text)
- **Foreground (Text):** `#000000` (Black) in light mode, `#E9E3DF` (Beige) in dark mode.
- **Background:** `#F7F5F4` (Light Beige) in light mode, `#1A2639` (Dark Blue-Gray) in dark mode.
- **Card Background:** `#FFFFFF` (White) in light mode, `#212E47` (Darker Blue-Gray) in dark mode.
- **Border:** `#D9D1CB` (Darker Beige) in light mode, `#3A4D75` (Medium Blue-Gray) in dark mode.

## 3. Typography

A clean, sans-serif font is used for all text to enhance readability.

- **Base Font:** `text-base` (16px), `leading-relaxed` (line-height: 1.625)
- **Paragraphs (`p`):**
  - Color: `text-muted-foreground` (`#465C88`)
  - Margin Bottom: `mb-4`
- **Headings (`h1`-`h6`):**
  - Font: `font-bold`
  - Color: `text-foreground`
  - **`h1`**: `text-3xl` to `text-5xl`, `leading-tight`
  - **`h2`**: `text-2xl` to `text-4xl`, `leading-tight`
  - **`h3`**: `text-xl` to `text-2xl`, `leading-snug`
  - **`h4`**: `text-lg` to `text-xl`, `leading-snug`
- **Links (`a`):**
  - Color: `text-brand-orange`
  - Decoration: `no-underline`, `hover:underline`
- **Lists (`ul`, `ol`):**
  - Style: `list-disc` or `list-decimal`, `list-inside`
  - Spacing: `space-y-1` between items.
- **Code (`code`):**
  - Background: Lightly tinted (e.g., `bg-brand-beige/20`)
  - Color: `text-brand-orange`
  - Font: `font-mono`
- **Preformatted Text (`pre`):**
  - Background: `bg-brand-blue-gray/5`
  - Border: `border border-border rounded-lg`
  - Padding: `p-4`
- **Blockquotes (`blockquote`):**
  - Border Left: `border-l-4 border-brand-orange`
  - Padding Left: `pl-4`
  - Style: `italic`
  - Color: `text-muted-foreground`

## 4. Component Breakdown

- **Buttons:**
  - **Primary:** `bg-brand-orange`, `text-white`, `hover:bg-brand-orange/90`
  - **Outline:** `border`, `hover:bg-accent`
- **Cards:**
  - Background: `bg-card`
  - Border: `border border-border`
  - Shadow: `shadow-sm`
  - Rounded Corners: `rounded-lg`
  - Padding: `p-6` to `p-12`
- **Pills/Badges (for Category/Tags):**
  - Background: Tinted version of a brand color (e.g., `bg-brand-orange/10`)
  - Text Color: The corresponding brand color (e.g., `text-brand-orange`)
  - Font: `text-sm`, `font-medium`
  - Shape: `rounded-full`
  - Padding: `px-3 py-1`

## 5. Structural Examples (Simplified HTML/JSX)

Here is a simplified structure of the page components.

### Breadcrumbs
```html
<nav>
  <ol class="flex items-center space-x-2">
    <li><a href="/">Home</a></li>
    <li>/</li>
    <li><a href="/blog">Blog</a></li>
    <li>/</li>
    <li><span>Post Title</span></li>
  </ol>
</nav>
```

### Article Header
```html
<header>
  <!-- Category Pill -->
  <span class="px-3 py-1 bg-brand-orange/10 text-brand-orange text-sm font-medium rounded-full">
    Category
  </span>
  
  <!-- Title -->
  <h1 class="text-4xl font-bold text-foreground">Blog Post Title</h1>

  <!-- Featured Image -->
  <img src="..." alt="..." class="w-full h-full object-cover rounded-lg" />

  <!-- Excerpt -->
  <p class="text-xl text-muted-foreground">This is a short summary of the article.</p>

  <!-- Metadata -->
  <div class="flex items-center gap-6 text-sm text-muted-foreground">
    <span>Author Name</span>
    <span>Published Date</span>
    <span>Read Time</span>
  </div>
</header>
```

### Article Content
The main content is rendered inside a div with a specific class that applies all the typography styles.

```html
<section>
  <div class="bg-card rounded-lg shadow-sm border p-10">
    <div class="blog-content">
      <!-- The HTML content of the blog post goes here -->
      <h1>Heading 1</h1>
      <p>This is a paragraph...</p>
      <ul>
        <li>List item 1</li>
      </ul>
    </div>
  </div>
</section>
```

### Tags
```html
<div>
  <span>Tags:</span>
  <div class="flex flex-wrap gap-2">
    <span class="px-2 py-1 bg-brand-blue-gray/10 text-brand-blue-gray text-xs rounded">
      Tag1
    </span>
    <span class="px-2 py-1 bg-brand-blue-gray/10 text-brand-blue-gray text-xs rounded">
      Tag2
    </span>
  </div>
</div>
```

### Related Posts
```html
<section>
  <h2 class="text-2xl font-bold">Related Articles</h2>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- BlogPostCard components go here -->
  </div>
</section>
```

### Call-to-Action (CTA)
```html
<section>
  <div class="p-8 bg-brand-beige/20 text-center">
    <h3 class="text-2xl font-bold">Ready to Try?</h3>
    <p class="text-muted-foreground">Description text goes here.</p>
    <a href="#" class="bg-brand-orange text-white ...">Start for Free</a>
  </div>
</section>
```

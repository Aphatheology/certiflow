# CertiFlow

A web application for designing and batch-generating certificates. Supports customizable fields, drag-and-drop layout, and CSV import for bulk generation.

## Setup

1. **Install dependencies:**

   ```bash
   yarn install
   ```

2. **OPTIONAL: Configure Environment:**
   Copy the example environment file and add your Gemini API key (for AI features which is not available now).

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set `GEMINI_API_KEY`.

3. **Run Locally:**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Features

- **Visual Editor:** Drag, resize, and align text fields.
- **Batch Generation:** Paste CSV data to generate multiple certificates at once.
- **Custom Styling:** Control fonts, colors, and sizes.
- **Export:** Download single certificates or a ZIP of all batch-generated files.

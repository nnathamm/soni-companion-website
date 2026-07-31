# Soni Companion Website — Redesign V2

This is the clean public-site rebuild of the former Community Companion project.

## V2 additions

- Replaced the earlier glossy cartoon face with Soni’s approved minimalist face:
  - light blue screen background
  - simple dark oval eyes
  - understated eyebrows
  - small curved smile
- Added an **Our Mission** section using the original Community Companion photograph.
- Added clear wording that Soni began as a school capstone project and is intended for older adults who may be lonely, isolated, homebound, or otherwise in need of more opportunities for meaningful conversation.
- Added a three-stage **Soni’s Progression** section:
  1. working face and conversation
  2. integrated prototype hardware
  3. approved 3D-print body concept
- Updated the About page to connect the school project, human need, working hardware, and enclosure design.
- Updated the small Soni brand mark to match the real face more closely.

## Existing redesign work

- Replaced the old Community Companion public pages and mock dashboards.
- Removed mock roles, profiles, events, local-storage repositories, and admin UI from the production source.
- Added a new Soni-focused navigation, footer, responsive design system, and public content architecture.
- Added dedicated pages for:
  - How Soni works
  - Research study
  - Senior communities
  - Safety and privacy
  - About the project
  - Contact
- Added temporary redirects from the old dashboard/calendar/directory routes to the new homepage.
- Added accessible focus states, large readable typography, mobile navigation, and reduced-motion support.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production check

```bash
npm run lint
npm run build
```

## Important preview limitation

The Contact page form currently validates and displays a preview confirmation, but it does **not** send email yet. Connect it to the final email/form service before publishing.

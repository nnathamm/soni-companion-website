# Migration notes

The original uploaded Community Companion project remains preserved separately as `community-companion-website.zip`.

This rebuilt project intentionally does not carry forward the old mock datasets and browser-storage systems. That keeps obsolete volunteer/senior matching features from remaining inside the Soni production code.

Old routes redirected to `/`:
- `/volunteer`
- `/senior`
- `/community-admin`
- `/admin`
- `/calendar`
- `/directory`
- `/events/*`

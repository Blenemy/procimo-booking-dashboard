## Tech stack

- **Backend:** Node.js, Express 5, Prisma 7 with MySQL 8.4, Luxon, jose, Pino
- **Frontend:** React 19, Vite, React Router, TanStack Query, React Hook Form, Tailwind CSS 4, shadcn/ui
- **Shared:** TypeScript (strict), Zod
- **Testing:** Vitest, Supertest
- **Infrastructure:** Docker Compose, nginx, pnpm workspaces

## Design decisions

First and foremost: i used express and not next, because the app has a complete backend logic of its own, and the task asks for a separate backend anyway. i did not use nest, because for this particular case express looks much more valid: the app domain is small, and I define the architecture and structure of the project myself. For big applications nest forces a common programming style across the team, but here it is not needed.

For the database i used mysql. postgres would give an exclusion constraint on time ranges, but I did not want the double booking guarantee to depend on a specific database feature. Slots are fixed to one hour, so "bookings must not overlap" becomes "a (court, hour) pair must be unique", and that is just a primary key on the booking_slots table, which works the same in any database. The cost is that MySQL has no timestamptz, so the database runs in UTC and all time zone logic lives in the app. If slots became flexible (15 minutes, random duration), i would switch to postgre and replace the slot table with an exclusion constraint.

--
frontend is react with vite, not next. the whole app is behind login, so there is no seo and no real profit from ssr, and the task asks for a separate backend anyway, so next would add a second server layer with nothing to do. vite builds plain static files, nginx serves them on the same origin as /api, so there is no cors and the session cookie stays simple.

for server data i used tanstack query instead of redux or a custom store. almost all state in this app is server state (courts, availability, bookings), and tanstack query gives caching, loading and error states, and precise invalidation after a booking or an sse event out of the box.

forms are react hook form with zod. zod schemas live in a shared package, so the form validates exactly like the api, and server validation errors are mapped back onto the form fields.

ui is tailwind with shadcn/ui. shadcn is not a dependency but copied components on top of radix, so i own the code and can change it, and radix gives accessible dialogs, selects and popovers for free. ui polish matters less in this task, so i picked what lets me build a clean and usable ui fast.

routing is react router, and the url is the state for the selected date, court and bookings tab, so links and the back button work.
--

## What i would add up:

-pagination. right now "my bookings" and the admin day view return full lists. the admin day view is limited to one day, so it stays small, but past bookings of a user grow forever, and an admin view over a date range or a search across all bookings would need it too.i would use cursor based pagination (by starts_at and id) with infinite scroll: an intersection observer on a marker at the end of the list loads the next page through tanstack query useInfiniteQuery.
-idempotent booking creation. right now if the booking is saved but the response gets lost (network drop, timeout) and the client retries, the user gets 409 slot_taken for his own booking. there is no double booking, the slot table still protects it, but the error is wrong and confusing.
-i would add an idempotency-key header for the booking mechanisms
-rate limitting on login
-probably mor erights to the admin
-shared event channel ( redis ) to replace in memory busEvent

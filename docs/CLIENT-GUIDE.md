# Editing your website

Everything on this page can be done from a phone or a laptop — buttons and menus
rearrange to fit a small screen, nothing is hidden or harder to reach on a phone.
Nothing you do here can break the site's design — you are swapping photos and
words into slots that are already built.

## Signing in

Go to **bmcarpentry.com.au/admin** and sign in with the email and password you
were given. If you forget the password, contact your developer — there is no
self-service reset.

You'll land on a dashboard with four cards: **Homepage**, **Services**,
**Projects**, and **Media**. Tap a card to open that section. The same four
also sit along the top of every page so you can jump between them.

Sign out (bottom right) when you are on a shared or public computer.

## The four sections

| Section | What you can change |
| --- | --- |
| **Homepage** | Four tabs — **Hero** (the big photo at the top), **What we do** (the four things you do), **Featured** (the ten featured project tiles), and **Workshop** (the five build stages) |
| **Services** | The two photos on the services page. (The four discipline cards further down that page are the same ones you edit under Homepage → What we do — changing one changes both places.) |
| **Projects** | Add, edit, hide, reorder and delete projects |
| **Media** | Upload photos and video, name them, write their descriptions |

## Saving your changes

At the bottom of every editing page there's a bar that tells you what's going
on — "Unsaved changes", "Some fields need fixing", or "All changes saved" — and
two buttons: **Discard** (throw away what you just typed) and **Save** (make it
live). **Save** only lights up once you've actually changed something and every
field is valid.

A saved change is live within a few seconds — there is no separate "publish"
step for any of this. The one exception is a project's **Hidden/Live** switch
in the Projects list, which is its own separate step (see below) — a project
can be fully filled in and saved, and still not appear on the site until you
flip it to Live.

## Swapping a photo

1. Go to the section that has the photo.
2. Press **Change** underneath it.
3. Pick a photo from the library, or press **Upload** to add a new one.
4. Press **Save** at the bottom.

The preview box shows the photo cropped exactly the way the site will crop it.

A few photos — a project's cover photo, and each of the ten homepage featured
tiles — have an extra **Crop position** box underneath. If the important part
of the photo is being cut off, type something like `center 60%` to show more
of the lower half, or `center 20%` to show more of the top. Leave it blank and
the site centres the photo as it normally would.

## Adding a project

1. **Projects** → type the name → press **Add project**.
2. Fill in the location, the year, tick the categories it belongs to, and pick
   a tile size for the projects page (Small square, Wide, Tall or Large —
   Small square is a safe default).
3. Choose a **cover photo** — this is the big banner and the tile on the
   projects page.
4. Optionally add gallery photos. If you add none, the site picks five that
   suit the categories, which is what it does for most projects today.
5. Go back to **Projects** and switch it from **Hidden** to **Live**.

New projects start Hidden so nobody sees a half-finished one. Until you've
chosen a cover photo, it also shows in the list as "*Project name* (incomplete)"
— that's expected, not an error; it just means step 3 above isn't done yet.

## Renaming a project

You can change a project's name and its **web address** (the part after
`/projects/` in the link) at any time. If featured tiles on the homepage point
at this project, they'll keep pointing at it correctly — you don't need to fix
them yourself.

Changing the web address does break any outside link or bookmark to the old
one — there is no automatic forwarding to the new address. The editor will
show you the old and new address and ask you to confirm before making the
change.

## Photos: what to shoot

- **Landscape (wide)** for the homepage top photo and the project banners.
- **Portrait (tall)** for the four "what we do" photos and the build stages.
- Shoot at the highest quality your phone offers. Your browser automatically
  shrinks and compresses each photo the moment you upload it — you never need
  to resize or convert anything yourself first.
- Videos must be **.mp4** and under **25MB**. Keep them short; they play
  silently and on a loop.

## The description box ("alt text")

Every photo has a description field — labelled "Description for screen readers
and search engines" next to a photo, or "Description (alt text)" in the Media
section; they're the same thing. Write one short sentence saying what is in
the photo — "Hardwood deck and pergola in a Campsie back garden". This is read
aloud to people using screen readers, and Google uses it to understand your
photos. It is worth the ten seconds.

## Things the site will not let you do

These are guard rails, not faults:

- **Deleting a photo that is in use.** You'll be told exactly which places use
  it — for example "Used in 2 places: Home hero, Workshop 02 — Clad." Change
  those places first, then delete it.
- **Deleting photos that came with the site.** These have no Delete button at
  all — they're part of the build, not yours to remove.
- **Hiding or deleting a project that a homepage tile points at.** You'll be
  told which tile. Point it at something else first.
- **Saving a name or caption that is too long.** Most boxes show a live
  counter (like "182 / 260") so you can see the limit as you type; a couple
  just stop accepting letters once you hit it. The build-stage names on the
  homepage, for example, are capped at 12 characters — one short word — because
  that text is set very large; anything longer wraps onto a second line and
  the layout wasn't drawn for it.

## What you cannot change here

Page headings, the wording on the About and Contact pages, your phone numbers
and email, the tile sizes on the homepage's featured grid, and the list of
categories. Contact your developer for those — they are small changes, but
they need a code edit.

## If something looks wrong

Reload the page first — you may be seeing a cached version. If it is still
wrong, your last change is still saved and nothing is lost; contact your
developer with what you changed and what you are seeing.

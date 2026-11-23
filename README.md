# The whole picture

A free roadmap from Python backend to computer vision in defence tech. The handout for the workshop
"Women in Miltech & Engineering: Why You Should Try" at WAWTech 2026, Warsaw.

**Read it:** https://chuprinadaria.github.io/wawtech-2026-roadmap/

- [English, PDF](roadmap-en.pdf)
- [Українською, PDF](roadmap-uk.pdf)

«Вся картина»: безкоштовна дорожня карта з Python-бекенду в комп'ютерний зір для оборонних технологій.
Матеріал до воркшопу на WAWTech 2026.

## What is inside

The eye of a small drone is a chain: light, a lens, a sensor, classic vision, a model, a small computer,
a radio link, a person who decides. The roadmap follows that chain. Every block of the map on page 2 is
a chapter, and every chapter has the same shape: why it matters, where to read, what to build at home,
how to tell that you are done.

- 142 free resources, checked on 23 November 2026.
- One worked calculation: how height, camera angle, lens and telemetry fix the number of pixels on a target,
  and which method fits each number.
- 15 chapters, from school maths to getting into the field.
- Six home projects. A Raspberry Pi helps; a laptop with a webcam is enough for most of them.

Coursera is not here on purpose: since August 2025 only the first module of its courses is free.

## Found a dead link?

Open an issue, or write to me on [LinkedIn](https://www.linkedin.com/in/dchuprina/).

## Build it yourself

You need Python 3.10 or newer and Google Chrome. The checks also need PyMuPDF and Pillow, and the page
previews need `pdftoppm` from poppler.

```bash
cd src
python3 build.py en uk                         # writes ../roadmap-en.pdf and ../roadmap-uk.pdf
python3 check.py resources_core resources_hw   # opens every link
python3 check_pdf.py en uk                     # checks links, anchors and fonts in the finished PDFs
./render.sh en                                 # page previews in src/out/
```

| File | What it holds |
|---|---|
| `src/resources_core.py`, `src/resources_hw.py` | every link once: address, title, cost, hours, level |
| `src/text_en.py`, `src/text_uk.py` | the chapters in two languages |
| `src/figures.py` | the figures; every number in them is computed from one camera model |
| `src/build.py`, `src/style.css` | the pages as HTML, printed to PDF by headless Chrome |
| `index.html` | the page behind the QR code |

A few sites refuse automated requests and answer 403 to `check.py`: OpenCV, the Raspberry Pi
documentation, Edmund Optics, Basler, NovAtel, Roboflow, Blender. Open those by hand.

## Licence and credits

Text, layout and build scripts: © 2026 Daria Chuprina, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Share it, translate it, rebuild it for your own field, and keep the credit. Details are in [LICENSE.md](LICENSE.md).

- Fonts: IBM Plex, SIL Open Font License 1.1, see `src/fonts/OFL.txt`.
- The shape on the cover is the mask of one vehicle in a synthetic frame. 3D model: "Abrams M1A1 [Free]"
  by DerpDude, CC BY 4.0.
- The linked resources belong to their authors.

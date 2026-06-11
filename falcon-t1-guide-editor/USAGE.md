# Falcon T1 Guide Visual Editor

This folder contains a stable visual editor for the Falcon T1 guide.

## Files

- `index.html`: the guide page.
- `editor.html`: the visual editor.
- `README.txt`: original project notes.
- `USAGE.md`: GitHub usage notes.

## How to use locally

1. Download or clone this repository.
2. Open the repository folder in VS Code.
3. Install the VS Code extension `Live Server`.
4. Right click `falcon-t1-guide-editor/editor.html`.
5. Choose `Open with Live Server`.
6. Click `Load index.html`.

## Important image note

The HTML page references images from an `images/` folder, such as:

```text
images/page1-hero.png
```

If images do not show, upload the original `images/` folder into:

```text
falcon-t1-guide-editor/images/
```

Images inserted inside the editor are converted to inline Data URLs, so newly inserted images can still display after downloading the edited HTML.

## Stable editor features

- Add card
- Add image card
- Delete selected element
- Select parent card
- Select parent table
- Edit text content
- Edit font family, size, color, weight, alignment, and line height
- Edit card background, border, radius, padding, margin, width, and height
- Replace selected image
- Insert image into card
- Make image fill parent card
- Edit table width, border, cell padding, header background, and font size
- Mouse drag and resize mode
- Download edited HTML

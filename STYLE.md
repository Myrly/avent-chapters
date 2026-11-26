This file contains guidelines to follow for theming and styling the app.

## Colour scheme
Pink based. 
Below is a palette to use : 
M#602437
D8A2846
M#B9375E
M#E05780
M#FF7AA2
D#FF9EBB
D#FFC2D4
M#FFC2D4
BG#FFE0E9

M stands for Main colours, any colour used by anything
D stands for Details colours, any colours used for very small details, such as tiny border, tiny shadow, etc.
BG stands for background, this is the base background. This colour may also be used in other components if there are cards of a darker shades for instance.

## Design
The app follows Neobrutalism styles. Thick, square-ish, drop shadow with border to it. 
Reuse classes as much as possible.

Interactive controls should follow the same visual language: strong ink borders, squared corners, palette-based fills, visible focus rings, and offset shadows for prominent controls. Checkboxes use the shared `.brutal-checkbox` treatment rather than browser-default rendering.

In the header, use the primary button style and `aria-current="page"` for the current navigation page; other navigation links use the secondary style.

Ignored EPUB sections remain visible in a muted gray treatment with their title struck through and a clearly labeled Restore button. Keep the row readable and keyboard accessible.

Reading-plan statistics use the existing pink palette, strong ink borders, and offset shadow. Day tooltips for median/extreme values must be available on hover and keyboard focus.

The centered main content can grow to 1200px on wide displays, but should remain viewport-relative on small screens with no horizontal scrolling.
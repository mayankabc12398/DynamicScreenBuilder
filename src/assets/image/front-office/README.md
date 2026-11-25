# Front-office action icons

White line glyphs (20x20 SVG, stroke #ffffff) for the icon buttons on the OPD
Service Booking action bar (components/front-office/TestPayment.jsx). Unlike the
`doctor-toolbar` set these carry no coloured tile: the button underneath supplies
the colour, which is what makes each button's state readable (blinking amber for
pending, green for already booked, red for a failed read).

Import as `import icon from "../../assets/image/front-office/<name>.svg"` and
render `<img src={icon} alt="" width={18} height={18} />` inside the button, with
the label moved to `title` so the bar stays on one line.

- cpoe.svg
- referral.svg
- booked-inv.svg

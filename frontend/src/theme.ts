import { createTheme, type MantineColorsTuple } from '@mantine/core'

// App palette. Top bar = #011A27, sidebar = #003049 (deepest shades below).
// Mantine needs a 10-shade tuple per custom color; these step toward the brand
// navy so buttons/links/hover states stay consistent with the chrome.
const brand: MantineColorsTuple = [
  '#91b1c8',
  '#7a8b97',
  '#9bb4c6',
  '#7396af',
  '#517d9b',
  '#356482',
  '#1e4c66',
  '#003049', // sidebar
  '#012236',
  '#011a27', // top bar
]

export const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 7,
  colors: { brand },
  fontFamily: "system-ui, 'Segoe UI', Roboto, sans-serif",
})

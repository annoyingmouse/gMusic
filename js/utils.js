// Draws the extension toolbar icon based on the current player state and
// sets it via chrome.action.setIcon. Uses an OffscreenCanvas so this can
// run inside the service worker (no DOM access needed).
//
// playerIcon values:
//   0 = no music  — grey stop square (tab open but nothing loaded/playing)
//   1 = playing   — red pause bars
//   2 = paused    — red play triangle
//   3 = no tab    — grey triangle (YouTube Music is not open)
export const setPlayerIcon = playerIcon => {

  // Draws a regular polygon centred at (x, y). Used to draw the play triangle.
  const polygon = (ctx, x, y, radius, sides, startAngle, anticlockwise) => {
    const a = anticlockwise ? -((Math.PI * 2) / sides) : (Math.PI * 2) / sides
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(startAngle)
    ctx.moveTo(radius, 0)
    for (let i = 1; i < sides; i++) {
      ctx.lineTo(radius * Math.cos(a * i), radius * Math.sin(a * i))
    }
    ctx.closePath()
    ctx.restore()
  }

  // Draws the correct symbol for the given state onto the shared canvas context.
  const drawPlayerIcon = playerIcon => {
    const icons = [
      // State 0: tab open, no music — grey stop square (player inactive)
      () => {
        context.beginPath()
        context.rect(5, 5, 9, 9)
        context.fillStyle = '#aaaaaa'
        context.fill()
      },
      // State 1: playing — pause icon (two vertical bars)
      () => {
        context.beginPath()
        context.rect(5, 4, 3, 11)
        context.rect(11, 4, 3, 11)
        context.fillStyle = '#ff0000'
        context.fill()
      },
      // State 2: paused — play icon (solid triangle)
      () => {
        context.beginPath()
        polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI / 2)
        context.fillStyle = '#ff0000'
        context.fill()
      },
      // State 3: no tab open — grey triangle (YouTube Music not open)
      () => {
        context.beginPath()
        polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI / 2)
        context.fillStyle = '#aaaaaa'
        context.fill()
      }
    ]
    icons[playerIcon]()
  }

  // Create a 19×19 canvas, fill a circular background, then draw the icon.
  const canvas = new OffscreenCanvas(19, 19)
  const context = canvas.getContext('2d')
  context.beginPath()
  context.arc(9.5, 9.5, 9.5, 0, 2 * Math.PI, false)
  context.fillStyle = '#f6f6f6'
  context.fill()
  drawPlayerIcon(playerIcon)

  // Extract pixel data and apply it as the action icon.
  const imageData = context.getImageData(0, 0, 19, 19)
  if (imageData) {
    chrome.action.setIcon({ imageData })
  }
}

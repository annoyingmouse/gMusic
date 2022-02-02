const setPlayerIcon = (playerIcon) => {
    const setAttributes = (el, attrs) => Object.entries(attrs).forEach(args => el.setAttribute(...args))
    const polygon = (ctx, x, y, radius, sides, startAngle, anticlockwise) => {
        let a = (Math.PI * 2) / sides
        a = anticlockwise ? -a : a
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
    const drawPlayerIcon = playerIcon => {
        const icons = [
            () => {
                context.beginPath()
                polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI / 2)
                context.fillStyle = '#9CFFD3'
                context.fill()
            },
            () => {
                context.beginPath()
                context.rect(5, 4, 3, 11)
                context.rect(11, 4, 3, 11)
                context.fillStyle = '#1DB954'
                context.fill()
            },
            () => {
                context.beginPath()
                polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI / 2)
                context.fillStyle = '#1DB954'
                context.fill()
            }
        ]
        icons[playerIcon]()
    }
    document.getElementById('canvas') && document.body.removeChild(document.getElementById('canvas'))
    const cv = document.createElement('canvas')
    setAttributes(cv, {
        id: 'canvas',
        height: 19,
        width: 19
    })
    document.body.appendChild(cv)
    const canvas = document.getElementById('canvas')
    const context = canvas.getContext('2d')
    context.beginPath()
    context.arc(9.5, 9.5, 9.5, 0, 2 * Math.PI, false)
    context.fillStyle = '#f6f6f6'
    context.fill()
    drawPlayerIcon(playerIcon)
    const imageData = context.getImageData(0, 0, 19, 19)
    chrome.browserAction.setIcon({
        imageData
    })
}
let playerState = 0
setPlayerIcon(playerState)
const port = chrome.runtime.connect({
    name: "s_Music"
});
const handleConnect = port => {
    const listener = () => port.postMessage({command: playerState})
    port.onMessage.addListener(msg => {
        playerState = msg.player
        setPlayerIcon(playerState)
    });
    port.onDisconnect.addListener(port => {
        port = null
        playerState = 0
        setPlayerIcon(playerState )
        chrome.browserAction.onClicked.removeListener(listener)
    })
    chrome.browserAction.onClicked.addListener(listener)
}
chrome.runtime.onConnect.addListener(handleConnect)
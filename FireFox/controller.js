let playerState = 0;
let tabId = null;
setPlayerIcon = (playerIcon) => {
    polygon = (ctx, x, y, radius, sides, startAngle, anticlockwise) => {
        if (sides === 3){
            let a = (Math.PI * 2) / sides;
            a = anticlockwise ? -a : a;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(startAngle);
            ctx.moveTo(radius, 0);
            for (let i = 1; i < sides; i++) {
                ctx.lineTo(radius * Math.cos(a * i), radius * Math.sin(a * i));
            }
            ctx.closePath();
            ctx.restore();
        }
    }
    if (document.getElementById('canvas') !== null){
        document.body.removeChild(document.getElementById('canvas'));
    }
    const cv = document.createElement('canvas');
    cv.setAttribute('id', 'canvas');
    cv.setAttribute('height', '19');
    cv.setAttribute('width', '19');
    document.body.appendChild(cv);
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    context.beginPath();
    context.arc(9.5, 9.5, 9.5, 0, 2 * Math.PI, false);
    context.fillStyle = '#f6f6f6';
    context.fill();
    switch (playerIcon){
        case 0: 
            context.beginPath();
            polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI/2);
            context.fillStyle = '#aaaaaa';
            context.fill();
            break;
        case 1:
            context.beginPath();
            context.rect(5, 4, 3, 11);
            context.rect(11, 4, 3, 11);
            context.fillStyle = '#333333';
            context.fill();
            break;
        case 2:
            context.beginPath();
            polygon(context, 9.5, 9.5, 7, 3, 180 * Math.PI/2);
            context.fillStyle = '#333333';
            context.fill();
            break;
    }
    const imageData = context.getImageData(0, 0, 19, 19);
    browser.browserAction.setIcon({
        imageData: imageData
    });
}
browser.runtime.onMessage.addListener((request, sender) => {
    playerState = request.player;
    tabId = sender.tab.id
    setPlayerIcon(playerState);
});
browser.browserAction.onClicked.addListener(() => {
    browser.tabs.sendMessage(tabId, playerState);
});
browser.tabs.onRemoved.addListener((tab) => {
    if(tab === tabId){
        tabId = null;
        playerState = 0;
        setPlayerIcon(playerState);
    }
});
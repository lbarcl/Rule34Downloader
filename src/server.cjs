const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const { List, Post } = require('./page.cjs');
const fs = require('fs');
const { join } = require('path');

const server = createServer();
const wss = new WebSocketServer({ server });

function startServer(PORT = 9865) {
    server.listen(PORT);
    wss.on('connection', onConnection); 
}

function onConnection(wsSocket, request) {
    wsSocket.on('message', (message) => {
        handleMessage(wsSocket, JSON.parse(message))
    })
}

function handleMessage(wsSocket, data) {
    switch (data.eventType) {
        case 'download':
                download(wsSocket, data.pages, data.tags, data.path)        
            break;
    }
}

async function download(wsSocket, pages, tags, pathToDownload) {
    let list = new List(tags);
    await list.load();
    let ids = await list.getSouceId();
    let next = list.next;
    
    console.log(ids)
    await downloadPosts(ids, pathToDownload);
    let downloadedLength = ids.length;
    
    wsSocket.send(JSON.stringify({ eventType: 'Downloading', downloadedPages: 1, downloadedPosts: downloadedLength }));

    while (next) {
        if (pages == list.page) break;
        list = new List(tags, list.page + 1);
        await list.load();
        ids = await list.getSouceId();
        next = list.next;

        await downloadPosts(ids, pathToDownload);
        downloadedLength += ids.length;
        
        wsSocket.send(JSON.stringify({ eventType: 'Downloading', downloadedPages: list.page, downloadedPosts: downloadedLength }));
    }

    wsSocket.send(JSON.stringify({ eventType: 'downloaded', downloadedPages: list.page, downloadedPosts: downloadedLength }));
}

async function downloadPosts(ids, path) {
    for (let i = 0; i < ids.length; i++) { 
        const post = new Post(ids[i]);
        await post.load();
        await post.getSource();
        const data = await post.download();
        fs.writeFileSync(join(path, `${ids[i]}.${post.type == 'video/mp4' ? 'mp4' : 'jpg'}`), data);
    }
}

module.exports = startServer
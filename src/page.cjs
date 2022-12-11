const got = require('got');
const cheerio = require('cheerio');

class page {
    constructor(url) {
        this.url = url;
        this.loaded = false;
    }

    async load() {
        try {
            this.html = (await got(this.url)).body;
            this.loaded = true;
        } catch (err) {
            console.error(err)
            throw err;
        }
    }
}

class list extends page {
    constructor(tags, page = 0) {
        super(`https://rule34.xxx/index.php?page=post&s=list&tags=${tags}&pid=${page * 42}`);
        this.page = page;
        this.tags = tags;
        this.next = `https://rule34.xxx/index.php?page=post&s=list&tags=${tags}&pid=${(page + 1) * 42}`
    }

    async getSouceId() { 
        if (!this.loaded) await this.load();
        const $ = cheerio.load(this.html);
        const result = $('span.thumb');
        if (result.length == 0) {
            this.next = null;
            this.html = null;
            this.loaded = false;
            return null;
        } else if (result.length < 42) {
            this.next = null;
        }

        const ids = [];

        for (let i = 0; i < result.length; i++) { 
            ids.push(result[i].attribs.id.replace('s', ''));
        }

        this.html = null;
        this.loaded = false;
        return ids;
    }

    calculatePid(n) {
        return n * 42;
    }
}

class post extends page {
    constructor(id) {
        super(`https://rule34.xxx/index.php?page=post&s=view&id=${id}`);
        this.id = id;
    }

    async getSource() {
        if (!this.loaded) await this.load();
        const $ = cheerio.load(this.html);
        const video = $('video>source');
        const image = $('img#image');
        const content = (video.length > 0) ? video[0] : image[0];
        this.loaded = false;
        this.html = null;
        this.src = content.attribs.src;
        this.type = (content.attribs.type) ? content.attribs.type : 'image/jpeg';

        return {
            id: this.id,
            src: this.src,
            type: this.type
        }
    }

    async download() {
        if (!this.src) throw new Error('You must get the source before downloading');
        const response = await got(this.src);
        return response.rawBody;
    }
}

module.exports = {
    page,  List: list, Post: post
}
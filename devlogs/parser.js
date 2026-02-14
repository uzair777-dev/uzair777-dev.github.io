// ═══════════════════════════════════════════════
// parser.js — Custom XML parser for devLOGS
// Attempts Web Worker parsing first; falls back to
// main-thread parsing if DOMParser isn't available
// in the worker context (varies by browser).
// ═══════════════════════════════════════════════

// ─── Worker-based parsing ───

function parseXMLWorker(xmlString) {
    return new Promise((resolve, reject) => {
        const workerCode = `
            self.onmessage = function(e) {
                try {
                    if (typeof DOMParser === 'undefined') {
                        throw new Error('DOMParser not available in worker');
                    }
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(e.data, 'application/xml');

                    const errors = validateXMLStructure(xmlDoc);
                    if (errors.length > 0) throw new Error('Invalid XML: ' + errors.join(', '));

                    const channel = xmlDoc.querySelector('feed > channel');
                    if (!channel) throw new Error('No channel element found');

                    const items = channel.querySelectorAll('item');
                    const parsed = Array.from(items).map(parseItem);

                    self.postMessage({ success: true, data: parsed });
                } catch (error) {
                    self.postMessage({ success: false, error: error.message });
                }
            };

            function validateXMLStructure(doc) {
                const e = [];
                if (!doc.querySelector('feed'))    e.push('Missing <feed>');
                if (!doc.querySelector('channel')) e.push('Missing <channel>');
                if (doc.querySelectorAll('item').length === 0) e.push('No <item> elements');
                return e;
            }

            function parseItem(item) {
                if (!item.querySelector('title') || !item.querySelector('id'))
                    throw new Error('Missing required title/id in <item>');

                const pubDate = item.querySelector('pubDate');
                return {
                    title:       item.querySelector('title').textContent,
                    id:          item.querySelector('id').textContent,
                    type:        item.querySelector('type')?.textContent || '',
                    heading:     item.querySelector('heading')?.textContent || '',
                    description: item.querySelector('description')?.textContent || '',
                    content:     item.querySelector('content')?.innerHTML || '',
                    pubDate: pubDate ? {
                        date:     pubDate.querySelector('date')?.textContent     || '',
                        timezone: pubDate.querySelector('timezone')?.textContent || ''
                    } : {}
                };
            }
        `;

        const blob      = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker    = new Worker(workerUrl);

        worker.onmessage = function(e) {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            if (e.data.success) resolve(e.data.data);
            else reject(new Error(e.data.error));
        };

        worker.onerror = function(e) {
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
            reject(new Error('Worker error: ' + e.message));
        };

        worker.postMessage(xmlString);
    });
}

// ─── Main-thread fallback ───

function parseXMLMainThread(xmlString) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'application/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) throw new Error('XML parse error: ' + parserError.textContent);

    const channel = xmlDoc.querySelector('feed > channel');
    if (!channel) throw new Error('No <feed><channel> found');

    const items = channel.querySelectorAll('item');
    if (items.length === 0) throw new Error('No <item> elements found');

    return Array.from(items).map(item => {
        if (!item.querySelector('title') || !item.querySelector('id'))
            throw new Error('Missing required title/id in <item>');

        const pubDate = item.querySelector('pubDate');
        return {
            title:       item.querySelector('title').textContent,
            id:          item.querySelector('id').textContent,
            type:        item.querySelector('type')?.textContent || '',
            heading:     item.querySelector('heading')?.textContent || '',
            description: item.querySelector('description')?.textContent || '',
            content:     item.querySelector('content')?.innerHTML || '',
            pubDate: pubDate ? {
                date:     pubDate.querySelector('date')?.textContent     || '',
                timezone: pubDate.querySelector('timezone')?.textContent || ''
            } : {}
        };
    });
}

// ─── Public API ───

export async function parseXML(xmlString) {
    try {
        // Try worker first (keeps UI responsive for large feeds)
        const data = await parseXMLWorker(xmlString);
        return { success: true, data };
    } catch (_workerErr) {
        // Fallback to main thread if worker lacks DOMParser
        try {
            const data = parseXMLMainThread(xmlString);
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export async function loadXML(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load XML: ${response.statusText}`);
        const xmlString = await response.text();
        return parseXML(xmlString);
    } catch (error) {
        return { success: false, error: error.message };
    }
}
// This is parser.js for my custom XML format
// Uses Web Workers for parsing to keep UI responsive

// Worker function to parse XML
function parseXMLWorker(xmlString) {
    return new Promise((resolve, reject) => {
        const workerCode = `
            self.onmessage = function(e) {
                try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(e.data, 'application/xml');
                    
// Validate XML structure
const errors = validateXMLStructure(xmlDoc);
if (errors.length > 0) {
    throw new Error('Invalid XML structure: ' + errors.join(', '));
}
                    
                    const feed = xmlDoc.querySelector('feed');
                    if (!feed) {
                        throw new Error('No feed element found');
                    }
                    
                    const channel = feed.querySelector('channel');
                    if (!channel) {
                        throw new Error('No channel element found');
                    }
                    
                    const items = channel.querySelectorAll('item');
                    const parsedItems = Array.from(items).map(item => parseItem(item));
                    
                    self.postMessage({ success: true, data: parsedItems });
                } catch (error) {
                    self.postMessage({ success: false, error: error.message });
                }
            };
            
function validateXMLStructure(xmlDoc) {
    const errors = [];
    if (!xmlDoc.querySelector('feed')) errors.push('Missing <feed> element');
    if (!xmlDoc.querySelector('channel')) errors.push('Missing <channel> element');
    const items = xmlDoc.querySelectorAll('item');
    if (items.length === 0) errors.push('No <item> elements found');
    return errors;
}

function parseItem(item) {
    if (!item.querySelector('title') || !item.querySelector('id')) {
        throw new Error('Missing required fields in <item>');
    }
    const title = item.querySelector('title').textContent;
    const id = item.querySelector('id').textContent;
                const type = item.querySelector('type')?.textContent || '';
                const heading = item.querySelector('heading')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';
                const content = item.querySelector('content')?.innerHTML || '';
                const pubDate = item.querySelector('pubDate');
                
                return {
                    title,
                    id,
                    type,
                    heading,
                    description,
                    content: processContent(content),
                    pubDate: pubDate ? {
                        date: pubDate.querySelector('date')?.textContent || '',
                        timezone: pubDate.querySelector('timezone')?.textContent || ''
                    } : {}
                };
            }
            
            function processContent(content) {
                // Process censoring
                content = content.replace(/<censor>(.*?)<\/censor>/g, (match, p1) => {
                    return '█'.repeat(p1.length);
                });
                
                // Process partial censoring
                content = content.replace(/<PCensor>(.*?)<\/PCensor>/g, (match, p1) => {
                    const words = p1.split(' ');
                    return words.map(word => {
                        if (word.length <= 3) return word;
                        const visibleChars = Math.floor(word.length * 0.3);
                        return word.slice(0, visibleChars) + '*'.repeat(word.length - visibleChars);
                    }).join(' ');
                });
                
                // Process glitching
                content = content.replace(/<glitch intensity="(\\d+)">(.*?)<\/glitch>/g, (match, intensity, text) => {
                    const intensityNum = Math.min(Math.max(parseInt(intensity), 2), 10);
                    return glitchText(text, intensityNum);
                });
                
                // Process remaining HTML entities
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = content;
                return tempDiv.innerHTML;
            }
            
            function glitchText(text, intensity) {
                const chars = text.split('');
                const glitchChars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                                   'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
                                   '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+'];
                
                return chars.map(char => {
                    if (char === ' ') return ' ';
                    if (Math.random() * 10 < intensity) {
                        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
                    }
                    return char;
                }).join('');
            }
        `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        const worker = new Worker(workerUrl);

        worker.onmessage = function(e) {
            if (e.data.success) {
                resolve(e.data.data);
            } else {
                reject(new Error(e.data.error));
            }
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.onerror = function(e) {
            reject(new Error('Worker error: ' + e.message));
            worker.terminate();
            URL.revokeObjectURL(workerUrl);
        };

        worker.postMessage(xmlString);
    });
}

// Public API
export async function parseXML(xmlString) {
    try {
        const parsedData = await parseXMLWorker(xmlString);
        return { success: true, data: parsedData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Helper function to load XML from URL
export async function loadXML(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load XML: ${response.statusText}`);
        }
        const xmlString = await response.text();
        return parseXML(xmlString);
    } catch (error) {
        return { success: false, error: error.message };
    }
}
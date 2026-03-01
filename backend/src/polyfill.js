// Compatibility polyfill for Node 16 (Modern Web APIs missing in global scope)
import { ReadableStream } from 'node:stream/web';
import { Blob } from 'node:buffer';

if (typeof globalThis.ReadableStream === 'undefined') {
    globalThis.ReadableStream = ReadableStream;
}
if (typeof globalThis.Blob === 'undefined') {
    globalThis.Blob = Blob;
}

// Minimal File polyfill
if (typeof globalThis.File === 'undefined') {
    class FilePolyfill extends Blob {
        constructor(parts, filename, options = {}) {
            super(parts, options);
            this.name = filename;
            this.lastModified = options.lastModified || Date.now();
        }
    }
    globalThis.File = FilePolyfill;
}

// DOMException polyfill
if (typeof globalThis.DOMException === 'undefined') {
    class DOMExceptionPolyfill extends Error {
        constructor(message, name) {
            super(message);
            this.name = name || 'Error';
        }
    }
    globalThis.DOMException = DOMExceptionPolyfill;
}

// If we still need more (Headers, Request, Response, fetch), we might need undici
// but undici is what's crashing.

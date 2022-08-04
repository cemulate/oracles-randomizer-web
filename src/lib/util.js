import { readFile } from './fs.js';

export function detectGame(buffer) {
    let view = new Uint8Array(buffer);
    let decoder = new TextDecoder('utf-8');
    try {
        let text = decoder.decode(view.subarray(0x0134, 0x013F));
        if (text == 'ZELDA NAYRU') return 'ages';
    } catch (e) {
        // wasn't ages
    }

    try {
        let text = decoder.decode(view.subarray(0x0134, 0x013D));
        if (text == 'ZELDA DIN') return 'seasons';
    } catch (e) {
        // wasn't seasons
    }

    return null;
}

export function buildMultiworldArgv(globalOpts, worldRopts) {
    let argv = [''];
    if (globalOpts.useSeed) argv.push(`-seed=${ globalOpts.seed }`);
    if (globalOpts.race) argv.push('-race');

    let multiParts = worldRopts.map(opts => {
        let part = opts.game == 'seasons' ? 's+' : 'a+';
        if (opts.treewarp) part += 't';
        if (opts.hard) part += 'h';
        if (opts.dungeons) part += 'd';
        if (opts.portals && opts.game == 'seasons') part += 'p';
        if (opts.keysanity) part += 'k';
        if (opts.entrances) part += 'e';
        return part;
    });

    argv.push(`-multi=${ multiParts.join(',') }`);
    return argv;
}

export function buildNormalArgv(globalOpts, ropts) {
    let argv = [''];
    if (ropts.treewarp) argv.push('-treewarp');
    if (ropts.dungeons) argv.push('-dungeons');
    if (ropts.portals && ropts.game == 'seasons') argv.push('-portals');
    if (ropts.hard) argv.push('-hard');
    if (ropts.keysanity) argv.push('-keysanity');
    if (ropts.entrances) argv.push('-entrances');
    if (globalOpts.useSeed) argv.push(`-seed=${ globalOpts.seed }`);
    if (globalOpts.race) argv.push('-race');
    argv.push(`/${ ropts.game }.gbc`);
    return argv;
}

class DataView24 extends DataView {
    getUint24(pos = 0, littleEndian = false) {
        return littleEndian
            ? this.getUint8(pos, true) + (this.getUint16(pos + 1, true) << 8)
            : (this.getUint16(pos, false) << 8) + this.getUint8(pos + 2, false);
    }

    setUint24(pos, val, littleEndian = false) {
        if (littleEndian) {
            this.setUint16(pos + 1, val >> 8, true);
            this.setUint8(pos, val & 0xff, true);
        } else {
            this.setUint16(pos, val >> 8, false);
            this.setUint8(pos + 2, val & 0xff, false);
        }
    }
}

class IPSPatch {
    constructor(buffer) {
        this.buffer = buffer;
        this.parse();
    }
    parse() {
        let view = new DataView24(this.buffer);
        let uint8View = new Uint8Array(this.buffer);
        let decoder = new TextDecoder('utf-8');
        if (!decoder.decode(this.buffer.slice(0, 5)) == 'PATCH') throw new Error('Invalid IPS file');
    
        this.hunks = [];
        this.requiredLength = this.buffer.byteLength;
        let pos = 5;
        while (pos < view.byteLength) {
            if (decoder.decode(uint8View.subarray(pos, pos+3)) == 'EOF') break;
    
            let offset = view.getUint24(pos);
            let len = view.getUint16(pos + 3);
            if (len == 0) {
                let runLength = view.getUint16(pos + 5);
                let value = view.getUint8(pos + 7);
                this.hunks.push({ type: 'rle', offset, runLength, value });
                this.requiredLength = Math.max(this.requiredLength, offset + runLength);
                pos = pos + 8;
            } else {
                let value = uint8View.subarray(pos + 5, pos + 5 + len);
                this.hunks.push({ type: 'normal', offset, value });
                this.requiredLength = Math.max(this.requiredLength, offset + len);
                pos = pos + 5 + len;
            }
        }
    }
    apply(origBuf) {
        let buf = new ArrayBuffer(Math.max(origBuf.byteLength, this.requiredLength));
        let view = new Uint8Array(buf);
        view.set(new Uint8Array(origBuf));
    
        for (let hunk of this.hunks) {
            if (hunk.type == 'rle') {
                view.fill(hunk.value, hunk.offset, hunk.offset + hunk.runLength);
            } else if (hunk.type == 'normal') {
                view.set(hunk.value, hunk.offset);
            }
        }
        return buf;
    }
}

export async function fetchAndApplySpritePatch(rom, shortGame, character, color) {
    let url = `sprite-ips/${ shortGame }/${ character }/${ shortGame }${ color }${ character }.ips`;
    let response = await fetch(url);
    if (response?.status != 200) throw new Error('Failed to fetch sprite patch file.');
    
    let ipsFile = await response.arrayBuffer();
    let ips = new IPSPatch(ipsFile);
    return ips.apply(rom);
}

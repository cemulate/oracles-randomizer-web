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

export async function createDownload(fileName, fileType, player=null) {
    let data = await readFile(`/${ fileName }`);
    let blob = new Blob([data.buffer]);
    return {
        link: URL.createObjectURL(blob, { type: fileType == 'gbc' ? 'application/octet-stream' : 'text/plain' }),
        name: fileName,
        type: fileType,
        ...(player != null ? { player } : {}),
    };
}

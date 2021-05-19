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

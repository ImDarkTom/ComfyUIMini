function bufferIsText(buffer: Buffer) {
    try {
        const text = buffer.toString('utf8');
        JSON.parse(text);
        return true;
    } catch {
        return false;
    }
}

export default bufferIsText;
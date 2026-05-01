
export class Random {
  static hex(length: number = 8): string {
    const bytes = new Uint8Array(Math.ceil(length / 2));
    crypto.getRandomValues(bytes);
    
    return bytes.reduce((acc, val) => acc + val.toString(16).padStart(2, '0'), '').slice(0, length);
  }
}

export default Random
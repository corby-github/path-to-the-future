const TOKEN_RE = /\{([a-zA-Z]+)\}/g;

export function interpolate(text: string, vars: Record<string, string | undefined>): string {
  return text.replace(TOKEN_RE, (match, key: string) => {
    const value = vars[key];
    return value ?? match;
  });
}

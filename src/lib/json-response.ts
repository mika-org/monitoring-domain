import { NextResponse } from 'next/server';

// Polyfill BigInt.prototype.toJSON globally
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}

/**
 * Serializes any data to a JSON NextResponse safely,
 * converting any nested BigInt to a Number so JSON.stringify never throws.
 */
export function safeJson(data: any, init?: ResponseInit): NextResponse {
  const body = JSON.stringify(data, (_, value) =>
    typeof value === 'bigint' ? Number(value) : value
  );

  return new NextResponse(body, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...init?.headers,
    },
  });
}

// app/api/test-ip/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";

// Same IP detection logic from actions.ts
function isPrivateIP(ip: string): boolean {
  const cleanIP = ip.replace(/^\[|\]$/g, '');
  if (cleanIP.startsWith('10.')) return true;
  if (cleanIP.startsWith('172.')) {
    const second = parseInt(cleanIP.split('.')[1]);
    if (second >= 16 && second <= 31) return true;
  }
  if (cleanIP.startsWith('192.168.')) return true;
  if (cleanIP.startsWith('127.')) return true;
  if (cleanIP === '::1') return true;
  if (cleanIP.startsWith('::ffff:127.')) return true;
  if (cleanIP.startsWith('fc00:')) return true;
  if (cleanIP.startsWith('fd00:')) return true;
  return false;
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  
  const ipHeaders = [
    'x-nf-client-connection-ip',
    'x-forwarded-for',
    'cf-connecting-ip',
    'true-client-ip',
    'x-real-ip',
    'x-client-ip',
  ];
  
  for (const header of ipHeaders) {
    const value = headersList.get(header);
    if (value) {
      if (header === 'x-forwarded-for') {
        const ips = value.split(',');
        const clientIp = ips[0].trim();
        if (clientIp && !isPrivateIP(clientIp)) {
          return clientIp;
        }
      } else {
        const ip = value.trim();
        if (ip && !isPrivateIP(ip)) {
          return ip;
        }
      }
    }
  }
  return "unknown";
}

export async function GET() {
  const headersList = await headers();
  const clientIp = await getClientIp();
  
  // Get all IP-related headers
  const allHeaders: Record<string, string> = {};
  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  return NextResponse.json({
    detectedIp: clientIp,
    allHeaders: allHeaders,
    ipRelatedHeaders: {
      'x-nf-client-connection-ip': headersList.get('x-nf-client-connection-ip'),
      'x-forwarded-for': headersList.get('x-forwarded-for'),
      'x-real-ip': headersList.get('x-real-ip'),
      'cf-connecting-ip': headersList.get('cf-connecting-ip'),
      'x-client-ip': headersList.get('x-client-ip'),
    }
  });
}
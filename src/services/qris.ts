/**
 * QRIS Utility (EMVCo TLV Parser & Dynamic QRIS Generator)
 * Mengubah QRIS Statis (GoPay, DANA, BCA, OVO, ShopeePay) menjadi QRIS Dinamis
 * dengan nominal terkunci dan checksum CRC16 standar Bank Indonesia / EMVCo.
 */

// Algoritma CRC-16/CCITT-FALSE (Polynomial: 0x1021, Initial: 0xFFFF)
export function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Mengubah string QRIS Statis menjadi QRIS Dinamis dengan nominal tertentu
 * @param staticQrisString String asli dari QRIS statis (contoh: 00020101021126...)
 * @param amount Nominal pembayaran dalam Rupiah (integer bulat, misal 1499312)
 * @returns String QRIS dinamis yang valid dan siap di-scan aplikasi perbankan
 */
export function generateDynamicQris(staticQrisString: string, amount: number): string {
  if (!staticQrisString || typeof staticQrisString !== 'string') {
    throw new Error('String QRIS statis tidak valid.');
  }

  let qris = staticQrisString.trim();

  // Strip existing CRC tag (Tag 6304)
  const crcIndex = qris.lastIndexOf('6304');
  if (crcIndex !== -1) {
    qris = qris.substring(0, crcIndex);
  }

  // Switch EMVCo Tag 01 from static (11) to dynamic (12)
  if (qris.includes('010211')) {
    qris = qris.replace('010211', '010212');
  }

  // Remove existing amount (Tag 54) if present
  const tag54Regex = /54(\d{2})(\d+)/;
  if (tag54Regex.test(qris)) {
    qris = qris.replace(tag54Regex, '');
  }

  const amountStr = Math.round(amount).toString();
  const amountLength = amountStr.length.toString().padStart(2, '0');
  const tag54 = `54${amountLength}${amountStr}`;

  // EMVCo sequence: place Tag 54 (Amount) before Tag 58 (Country Code '5802ID')
  const tag58Index = qris.indexOf('5802ID');
  if (tag58Index !== -1) {
    qris = qris.substring(0, tag58Index) + tag54 + qris.substring(tag58Index);
  } else {
    qris = qris + tag54;
  }

  // Append Tag 63 (CRC) with length 04 and compute final checksum
  qris = qris + '6304';
  const crc = calculateCrc16(qris);

  return qris + crc;
}

/**
 * Validasi apakah sebuah string adalah format QRIS standar EMVCo
 */
export function isValidQrisString(qrisString: string): boolean {
  if (!qrisString || qrisString.length < 20) return false;
  const clean = qrisString.trim();
  // EMVCo payload starts with format indicator tag 000201
  return clean.startsWith('000201');
}

/**
 * Menghasilkan URL gambar QR code menggunakan generator publik cepat & bebas kuota
 */
export function getQrCodeImageUrl(content: string, size = 300): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(content)}`;
}

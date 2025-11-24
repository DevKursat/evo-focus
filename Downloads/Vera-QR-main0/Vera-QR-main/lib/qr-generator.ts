import QRCode from 'qrcode'

export interface QRCodeOptions {
  size?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export async function generateQRCode(
  data: string,
  options: QRCodeOptions = {}
): Promise<string> {
  try {
    const qrOptions = {
      width: options.size || 400,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'H' as const,
    }

    const qrCodeDataURL = await QRCode.toDataURL(data, qrOptions)
    return qrCodeDataURL
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export async function generateQRCodeBuffer(
  data: string,
  options: QRCodeOptions = {}
): Promise<Buffer> {
  try {
    const qrOptions = {
      width: options.size || 400,
      margin: options.margin || 2,
      color: {
        dark: options.color?.dark || '#000000',
        light: options.color?.light || '#FFFFFF',
      },
      errorCorrectionLevel: 'H' as const,
    }

    const buffer = await QRCode.toBuffer(data, qrOptions)
    return buffer
  } catch (error) {
    console.error('Error generating QR code buffer:', error)
    throw new Error('Failed to generate QR code buffer')
  }
}

export function generateTableQRData(
  organizationSlug: string,
  tableId: string,
  qrCode: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/${organizationSlug}?table=${tableId}&qr=${qrCode}`
}

export async function generateTableQRCode(
  organizationSlug: string,
  tableId: string,
  qrCode: string,
  brandColor?: string
): Promise<string> {
  const data = generateTableQRData(organizationSlug, tableId, qrCode)
  
  return generateQRCode(data, {
    size: 400,
    margin: 2,
    color: {
      dark: brandColor || '#000000',
      light: '#FFFFFF',
    },
  })
}

export interface QRCodeWithTableInfo {
  qrCodeDataURL: string
  tableNumber: string
  organizationName: string
  qrData: string
}

export async function generateQRCodeWithTableInfo(
  organizationSlug: string,
  organizationName: string,
  tableNumber: string,
  tableId: string,
  qrCode: string,
  brandColor?: string
): Promise<QRCodeWithTableInfo> {
  const qrData = generateTableQRData(organizationSlug, tableId, qrCode)
  const qrCodeDataURL = await generateQRCode(qrData, {
    size: 400,
    margin: 2,
    color: {
      dark: brandColor || '#000000',
      light: '#FFFFFF',
    },
  })

  return {
    qrCodeDataURL,
    tableNumber,
    organizationName,
    qrData,
  }
}

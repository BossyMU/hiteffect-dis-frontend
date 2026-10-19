const MAX_SIDE = 1600

/**
 * Read an image file and shrink it to at most 1600 px on its longest side, as a JPEG data: URL.
 * Keeps payment slips small enough to send to the API (well under its 3 MB limit).
 */
export async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (PNG or JPG)')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not read the image')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.82)
}

import { File } from '@prisma/client';

/**
 * Extract text from file (placeholder implementation)
 * TODO: Implement actual text extraction for PDF, DOCX, HWP, HWPX
 */
export async function extractProcessor(
  fileBuffer: Buffer,
  file: File
): Promise<Array<{ type: string; path: string; meta?: any }>> {
  // Placeholder: Just return a simple text file
  // In production, use libraries like:
  // - pdf-parse for PDF
  // - mammoth for DOCX
  // - hwp.js for HWP/HWPX

  const extractedText = `Extracted text from ${file.originalFilename}\n\nThis is a placeholder implementation.\n\nFile type: ${file.mimeType}\nFile size: ${file.size} bytes`;

  return [
    {
      type: 'TEXT',
      path: `extracted_text_${file.id}.txt`,
      meta: {
        originalFilename: file.originalFilename,
        mimeType: file.mimeType,
        extractedAt: new Date().toISOString(),
      },
    },
  ];
}


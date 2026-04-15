import { randomUUID } from 'node:crypto';

// Disable Vercel's default body parser so multipart/form-data uploads pass
// through untouched. When real storage is wired up below, parse the stream
// with `formidable` or `busboy`.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Drain the request stream so the connection closes cleanly even though
    // we're not parsing the multipart payload yet (mock-only behaviour).
    await new Promise((resolve, reject) => {
      req.on('data', () => {});
      req.on('end', resolve);
      req.on('error', reject);
    });

    // TODO: implementar storage real (S3, Cloudinary, Supabase Storage, etc.)
    // TODO: parsing real do multipart com formidable/busboy quando o storage
    //       acima for ligado, e validar tamanho/tipo do arquivo recebido.
    return res.status(200).json({
      success: true,
      imageUrl: '/mock/captured.jpg',
      id: randomUUID(),
    });
  } catch (error) {
    console.error('upload handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error?.message,
    });
  }
}

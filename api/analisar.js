export default async function handler(req, res) {
  // Use environment variable for API key (configured in Vercel)
  const API_KEY = process.env.GEMINI_API_KEY; 
  
  if (!API_KEY) {
    console.error('GEMINI_API_KEY not configured');
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
  }
  
  // Use gemini-1.5-flash-latest (modelo estável para análise multimodal)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data?.error?.message || 'API request failed',
        details: data
      });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Internal server error:', error);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
}

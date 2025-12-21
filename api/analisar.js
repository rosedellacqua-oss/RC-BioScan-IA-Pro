export default async function handler(req, res) {
  const API_KEY = "AIzaSyCi509PAtDLnH3hXGR7bYrGbW3B92EBHYg"; 
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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
    
    // Se o Google der erro, este comando vai mostrar o motivo real nos Logs
    if (!response.ok) {
      console.error("ERRO DO GOOGLE:", JSON.stringify(data));
      return res.status(response.status).json(data);
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("ERRO INTERNO:", error.message);
    return res.status(500).json({ error: 'Internal Error: ' + error.message });
  }
}

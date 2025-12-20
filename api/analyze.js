export default async function handler(req, res) {
  // ATENÇÃO: Verifique se entre as aspas abaixo está a sua chave REAL (aquela comprida)
  const API_KEY = "AIzaSyCi509PAtDLnH3hXGR7bYrGbW3B92EBHYg"; 
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Erro na análise da IA' });
  }
}

import React, { useState } from 'react'

function App() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  const testChatbot = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/chatbot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, leadId: null })
      })
      const data = await response.json()
      setAnswer(data.answer || JSON.stringify(data))
    } catch (error) {
      setAnswer('Error: ' + error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{padding: '40px', maxWidth: '800px', margin: '0 auto'}}>
      <h1>🎉 Discovery Systems POS - Test de IA</h1>
      
      <div style={{marginTop: '30px'}}>
        <input 
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Pregunta algo sobre Discovery Systems"
          style={{width: '100%', padding: '10px', fontSize: '16px'}}
        />
        <button 
          onClick={testChatbot}
          disabled={loading || !question}
          style={{
            marginTop: '10px',
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            backgroundColor: loading ? '#ccc' : '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          {loading ? 'Consultando a Claude AI...' : 'Preguntar'}
        </button>
      </div>

      {answer && (
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f0f0f0',
          borderRadius: '8px'
        }}>
          <h3>Respuesta de Claude AI:</h3>
          <p style={{whiteSpace: 'pre-wrap'}}>{answer}</p>
        </div>
      )}
    </div>
  )
}

export default App
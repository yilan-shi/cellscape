import React, { useState } from 'react';

const PRESET_QUESTIONS = [
  {
    id: 'coloc_pearson',
    category: 'Colocalization',
    question: 'Calculate the Pearson\'s correlation coefficient (PCC) between visible channels. PCC ranges from -1 (anti-correlation) to +1 (perfect correlation). What value do you estimate and why?'
  },
  {
    id: 'coloc_overlap',
    category: 'Colocalization',
    question: 'What percentage of pixels show true colocalization (multiple channels above threshold simultaneously)? Provide estimated percentages.'
  },
  {
    id: 'nuclear_boundary',
    category: 'Compartment',
    question: 'Can you identify where the nucleus ends and the cytoplasm begins? What features help you identify this boundary? How confident are you (0-100%)?'
  },
  {
    id: 'snr',
    category: 'Signal Quality',
    question: 'Estimate the signal-to-noise ratio (SNR) for each visible channel. Which channel has the best SNR?'
  },
  {
    id: 'autofluorescence',
    category: 'Signal Quality',
    question: 'Do you see evidence of autofluorescence? Can you distinguish true signal from background autofluorescence?'
  },
  {
    id: 'spectral_bleed',
    category: 'Artifacts',
    question: 'Do you see evidence of spectral bleed-through (emission from one fluorophore leaking into another channel)? Where?'
  },
  {
    id: 'z_depth',
    category: '3D Reasoning',
    question: 'Based on morphology and signal intensity, what depth through the cell does this represent? Top (membrane), middle (max nuclear cross-section), or bottom?'
  },
  {
    id: '3d_shape',
    category: '3D Reasoning',
    question: 'From this 2D slice, infer the 3D shape of visible structures. Is it a hollow sphere, tubular network, scattered puncta, or solid sphere?'
  }
];

export default function RealDataInterrogation() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [responses, setResponses] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleQuestion = (questionId) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const askQuestion = async (question, questionId) => {
    if (!imagePreview) return;

    const base64Image = imagePreview.split(',')[1];

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: 'You are analyzing confocal microscopy images from real cells. These may be z-plane slices from volumetric z-stacks. Channels may include brightfield, cell membrane, tagged subcellular structures. When asked to calculate metrics, provide numerical estimates when applicable. When uncertain, explain your reasoning and what additional data would help.',
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: question
              }
            ]
          }]
        })
      });

      const data = await response.json();
      
      if (data.content && data.content[0]) {
        return {
          questionId,
          question,
          answer: data.content[0].text,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (error) {
      return {
        questionId,
        question,
        answer: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  };

  const runInterrogation = async () => {
    if (!uploadedImage || (!selectedQuestions.length && !customQuestion)) {
      alert('Please upload an image and select at least one question');
      return;
    }

    if (!apiKey) {
      alert('Please enter your Anthropic API key');
      return;
    }

    setIsProcessing(true);
    setResponses([]);

    const questionsToAsk = [
      ...selectedQuestions.map(id => PRESET_QUESTIONS.find(q => q.id === id)),
      ...(customQuestion ? [{ id: 'custom', question: customQuestion }] : [])
    ];

    for (const q of questionsToAsk) {
      const response = await askQuestion(q.question, q.id);
      setResponses(prev => [...prev, response]);
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsProcessing(false);
  };

  const exportResults = () => {
    const exportData = {
      image: uploadedImage.name,
      timestamp: new Date().toISOString(),
      responses: responses
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interrogation-results-${Date.now()}.json`;
    a.click();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '10px' }}>Real Data Interrogation</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Upload your own microscopy images and interrogate them with Claude's vision capabilities.
      </p>

      {showApiKeyInput && (
        <div style={{ 
          marginBottom: '30px', 
          padding: '20px', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <h3 style={{ marginTop: 0 }}>API Key Required</h3>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            Enter your Anthropic API key to analyze images. Your key is stored locally in this browser session only.
          </p>
          <input
            type="password"
            placeholder="sk-ant-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{
              width: '400px',
              padding: '8px',
              marginRight: '10px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={() => setShowApiKeyInput(false)}
            disabled={!apiKey}
            style={{
              padding: '8px 16px',
              background: apiKey ? '#0ea5e9' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: apiKey ? 'pointer' : 'not-allowed'
            }}
          >
            Set Key
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Left Column: Upload & Questions */}
        <div>
          <div style={{ 
            border: '2px dashed #ddd', 
            borderRadius: '8px', 
            padding: '20px',
            marginBottom: '20px',
            background: '#fafafa'
          }}>
            <h3 style={{ marginTop: 0 }}>1. Upload Image</h3>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleImageUpload}
              style={{ marginBottom: '10px' }}
            />
            {imagePreview && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={imagePreview} 
                  alt="Uploaded" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }} 
                />
              </div>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>2. Select Questions</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
              {Object.entries(
                PRESET_QUESTIONS.reduce((acc, q) => {
                  if (!acc[q.category]) acc[q.category] = [];
                  acc[q.category].push(q);
                  return acc;
                }, {})
              ).map(([category, questions]) => (
                <div key={category} style={{ marginBottom: '15px' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    color: '#0ea5e9', 
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    {category}
                  </div>
                  {questions.map(q => (
                    <label
                      key={q.id}
                      style={{
                        display: 'block',
                        padding: '8px',
                        marginBottom: '5px',
                        background: selectedQuestions.includes(q.id) ? '#e0f2fe' : '#f9fafb',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        border: selectedQuestions.includes(q.id) ? '1px solid #0ea5e9' : '1px solid #e5e7eb'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        style={{ marginRight: '8px' }}
                      />
                      {q.question.slice(0, 80)}...
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Or Ask Custom Question</h3>
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              placeholder="Write your own question about the image..."
              style={{
                width: '100%',
                height: '100px',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'inherit',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            onClick={runInterrogation}
            disabled={isProcessing || !uploadedImage || !apiKey}
            style={{
              padding: '12px 24px',
              background: (isProcessing || !uploadedImage || !apiKey) ? '#ccc' : '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: (isProcessing || !uploadedImage || !apiKey) ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {isProcessing ? '🔄 Processing...' : '▶ Run Interrogation'}
          </button>
        </div>

        {/* Right Column: Responses */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>Responses ({responses.length})</h3>
            {responses.length > 0 && (
              <button
                onClick={exportResults}
                style={{
                  padding: '6px 12px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                📥 Export JSON
              </button>
            )}
          </div>
          
          <div style={{ 
            border: '1px solid #ddd', 
            borderRadius: '8px', 
            padding: '15px',
            height: '700px',
            overflowY: 'auto',
            background: '#fafafa'
          }}>
            {responses.length === 0 && !isProcessing && (
              <p style={{ color: '#999', textAlign: 'center', marginTop: '50px' }}>
                No responses yet. Upload an image and select questions to begin.
              </p>
            )}

            {isProcessing && responses.length === 0 && (
              <p style={{ color: '#0ea5e9', textAlign: 'center', marginTop: '50px' }}>
                🔄 Starting interrogation...
              </p>
            )}

            {responses.map((r, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ 
                  fontSize: '12px', 
                  color: '#0ea5e9', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  Question {idx + 1}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: '500',
                  marginBottom: '10px',
                  color: '#374151'
                }}>
                  {r.question}
                </div>
                <div style={{ 
                  fontSize: '13px', 
                  lineHeight: '1.6',
                  color: '#1f2937',
                  whiteSpace: 'pre-wrap'
                }}>
                  {r.answer}
                </div>
                <div style={{ 
                  fontSize: '11px', 
                  color: '#9ca3af',
                  marginTop: '8px'
                }}>
                  {new Date(r.timestamp).toLocaleString()}
                </div>
              </div>
            ))}

            {isProcessing && (
              <div style={{
                padding: '15px',
                background: '#e0f2fe',
                borderRadius: '6px',
                textAlign: 'center',
                color: '#0369a1'
              }}>
                Processing question {responses.length + 1}...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
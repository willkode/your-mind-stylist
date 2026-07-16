import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const sentimentKeywords = {
  calm: ['calm', 'peaceful', 'relaxed', 'centered', 'grounded', 'still', 'quiet', 'settled'],
  clarity: ['clear', 'clarity', 'understand', 'see', 'perspective', 'insight', 'breakthrough', 'aha'],
  resistance: ['stuck', 'resistant', 'hard', 'difficult', 'struggle', 'fighting', 'blocking'],
  overwhelm: ['overwhelm', 'too much', 'stressed', 'anxious', 'worried', 'spinning', 'chaos'],
  confidence: ['confident', 'ready', 'capable', 'strong', 'powerful', 'sure', 'trust myself'],
  curiosity: ['curious', 'wonder', 'interesting', 'exploring', 'open', 'what if'],
  tension: ['tense', 'tight', 'pressure', 'strained', 'holding', 'braced', 'contracted'],
  momentum: ['momentum', 'moving', 'progress', 'forward', 'growing', 'building', 'flowing']
};

function analyzeSentiment(text) {
  const lowerText = text.toLowerCase();
  const scores = {};
  
  // Calculate scores for each emotion
  for (const [emotion, keywords] of Object.entries(sentimentKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        score += 1;
      }
    }
    scores[emotion] = score;
  }
  
  // Find primary emotion
  let maxScore = 0;
  let primaryEmotion = 'calm';
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryEmotion = emotion;
    }
  }
  
  // Calculate confidence (0.0-1.0)
  const totalMatches = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalMatches > 0 ? Math.min(maxScore / totalMatches, 1.0) : 0.5;
  
  return {
    sentiment_primary: primaryEmotion,
    sentiment_score: confidence
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { text } = await req.json();
    
    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }
    
    const analysis = analyzeSentiment(text);
    
    return Response.json(analysis);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
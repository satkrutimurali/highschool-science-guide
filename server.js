const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const ROOT = __dirname;
const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://127.0.0.1:11434/api/chat';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

const curriculumBank = {
  'science 9': { title: 'Science 9', firstUnit: 'In a typical BC Science 9 course, the first unit is Scientific Inquiry and Lab Skills. It introduces how to ask questions, make observations, use equipment safely, and analyze evidence.', prepTips: 'To prepare for Science 9, review basic lab safety, scientific vocabulary, and how to read graphs or data tables. Practice identifying variables and writing a clear hypothesis.' },
  'science 10': { title: 'Science 10', firstUnit: 'In a typical BC Science 10 course, the first unit is often Scientific Inquiry and Lab Skills, then a course-specific foundation unit. The exact order can vary by teacher.', prepTips: 'To prepare for Science 10, review graphing, formulas, scientific notation, and the difference between independent and dependent variables. Be ready to explain cause-and-effect relationships.' },
  'biology 11': { title: 'Biology 11', firstUnit: 'The first unit in Biology 11 is often an introduction to biology, scientific thinking, and foundational cell concepts. This is a setup unit for the rest of the course.', prepTips: 'To prepare for Biology 11, review cell structure, basic chemistry, and the meaning of terms like organism, ecosystem, and adaptation. A good habit is to list the parts of the system before trying to explain the function.' },
  'chemistry 11': { title: 'Chemistry 11', firstUnit: 'The first unit in Chemistry 11 is commonly an introduction to atomic structure, bonding, and the language of chemistry. This builds the foundation needed for reactions and calculations.', prepTips: 'To prepare for Chemistry 11, review basic atomic theory, element symbols, and simple arithmetic with units. Make sure you can identify the number of particles and the quantity being asked for in a problem.' },
  'physics 11': { title: 'Physics 11', firstUnit: 'A typical Physics 11 course begins with measurement, motion, and vectors. That gives you the mathematical language needed for forces, energy, and waves.', prepTips: 'To prepare for Physics 11, review unit conversions, formulas, and how to interpret graphs. It helps to identify what quantity is being asked for before choosing a formula.' },
  'biology 12': { title: 'Biology 12', firstUnit: 'In Biology 12, the first unit is often cell biology and cell processes, including membranes and transport. This forms the base for the rest of the course.', prepTips: 'To prepare for Biology 12, review the cell membrane, organelles, and the roles of key body systems. Try to explain each process in your own words rather than memorizing only the textbook wording.' },
  'chemistry 12': { title: 'Chemistry 12', firstUnit: 'In Chemistry 12, the first unit is usually introduced through reaction rates and chemical equilibrium, since these ideas connect strongly to later units.', prepTips: 'To prepare for Chemistry 12, review reaction notation, the meaning of rate, and the difference between forward and reverse reactions. It is useful to write the system out in words before calculating.' },
  'physics 12': { title: 'Physics 12', firstUnit: 'Physics 12 often starts with momentum, collisions, and conservation laws, since these provide a strong framework for later electricity and modern physics topics.', prepTips: 'To prepare for Physics 12, review conservation laws, algebra, and your earlier work with forces and energy. Drawing a simple diagram can often reveal what quantity is conserved.' }
};

function detectQuestionType(question) {
  const lower = question.toLowerCase();
  const curriculumMarkers = [
    'first unit', 'unit overview', 'what unit', 'explain the unit', 'how to prepare', 'prepare for', 'curriculum', 'what should i study', 'explain this unit', 'unit summary', 'what is my first unit', 'what is the first unit'
  ];
  return curriculumMarkers.some((marker) => lower.includes(marker)) ? 'curriculum' : 'science';
}

function hasWholeWord(text, keyword) {
  const pattern = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(text);
}

function chooseTopic(question) {
  const lower = question.toLowerCase();
  const topicMatches = {
    biology: ['cell', 'gene', 'dna', 'plant', 'animal', 'ecosystem', 'evolution', 'organism', 'homeostasis', 'membrane', 'photosynthesis', 'chlorophyll', 'enzyme', 'mitosis', 'mitochondria', 'respiration', 'glucose'],
    chemistry: ['mole', 'atom', 'bond', 'reaction', 'acid', 'base', 'equilibrium', 'solubility', 'stoichiometry', 'molecule', 'electron'],
    physics: ['force', 'motion', 'velocity', 'acceleration', 'energy', 'mass', 'momentum', 'circuit', 'voltage', 'current', 'wave', 'speed'],
    earth: ['weather', 'climate', 'planet', 'space', 'earth', 'tectonic', 'rock', 'plate', 'sun', 'orbit']
  };

  if (hasWholeWord(lower, 'biology')) return 'biology 11';
  if (hasWholeWord(lower, 'chemistry')) return 'chemistry 11';
  if (hasWholeWord(lower, 'physics')) return 'physics 11';

  let bestTopic = 'science 9';
  let bestScore = -1;

  Object.entries(topicMatches).forEach(([area, keywords]) => {
    const score = keywords.reduce((count, keyword) => count + (hasWholeWord(lower, keyword) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestTopic = area === 'biology' ? 'biology 11' : area === 'chemistry' ? 'chemistry 11' : area === 'physics' ? 'physics 11' : 'science 9';
    }
  });

  return bestTopic;
}

function fallbackResponse(question, topicOverride = null) {
  const topic = topicOverride || chooseTopic(question);
  const type = detectQuestionType(question);
  const config = curriculumBank[topic] || curriculumBank['science 9'];

  if (type === 'curriculum') {
    const lower = question.toLowerCase();
    if (lower.includes('first unit') || lower.includes('what is my first unit') || lower.includes('what is the first unit')) {
      return `${config.title}: ${config.firstUnit}`;
    }
    if (lower.includes('prepare') || lower.includes('how to prepare')) {
      return `${config.title}: ${config.prepTips}`;
    }
    if (lower.includes('explain') || lower.includes('unit summary') || lower.includes('unit overview')) {
      return `Here is a quick overview for ${config.title}: In this course, students usually explore the main ideas of the unit through experiments, models, and evidence. Ask yourself what the key process, variable, or system is and which unit vocabulary connects to it.`;
    }
    return `${config.title}: ${config.firstUnit} ${config.prepTips}`;
  }

  return [
    `Let's work through this together in a ${config.title} way.`,
    'Start by looking for the key idea in the question. Is it a process, a relationship, a calculation, or a system?',
    'What observations can you make from the question?',
    'After you answer that, think about what you already know about the system or process.',
    'Share your first idea and I’ll help you refine it without jumping straight to the answer.'
  ].join('\n\n');
}

async function askOllama(question, topic) {
  const body = {
    model: OLLAMA_MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a warm BC science tutor for Grades 9–12. Answer curriculum questions directly, but for pure science questions use a friendly guiding, Socratic style. Keep responses concise and easy to understand.'
      },
      {
        role: 'user',
        content: `This question is about ${topic}. Please answer in a clear, student-friendly way. If it is about curriculum preparation or the unit itself, answer directly. If it is a pure science concept question, help the student discover the answer by asking guiding questions instead of giving the final answer immediately. Question: ${question}`
      }
    ],
    stream: false
  };

  const response = await fetch(OLLAMA_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || data.response || fallbackResponse(question);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.js') return 'application/javascript; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

async function handleRequest(req, res) {
  if (req.method === 'POST' && req.url === '/api/tutor') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const question = String(payload.question || '').trim();
        const topic = String(payload.topic || chooseTopic(question)).trim();

        if (!question) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'A question is required.' }));
          return;
        }

        let reply = fallbackResponse(question, topic);

        try {
          reply = await askOllama(question, topic);
        } catch (error) {
          reply = fallbackResponse(question, topic);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ reply, topic, questionType: detectQuestionType(question) }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unable to process the question.' }));
      }
    });
    return;
  }

  const requestPath = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requestPath).replace(/^\.+/, '');
  const filePath = path.join(ROOT, safePath);

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    res.end(data);
  });
}

const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`Science tutor server running on http://127.0.0.1:${PORT}`);
});

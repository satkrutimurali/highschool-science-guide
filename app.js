const logic = window.tutorLogic;
const curriculumBank = logic.curriculumBank;

const chatLog = document.querySelector('#chatLog');
const questionForm = document.querySelector('#questionForm');
const questionInput = document.querySelector('#questionInput');
const topicChips = document.querySelectorAll('.topic-chip');

const state = {
  lastTopic: 'science 9'
};

// This function sends the student's question to your classroom proxy server
// using a standard fetch() POST request.
//
// How it works:
// 1. We build a JSON body with the model name and a single user message.
// 2. We send that payload to the proxy endpoint using the required headers.
// 3. We parse the OpenAI-style response shape from the server.
// 4. We pull the assistant text from data.choices[0].message.content.
// 5. We return that text so the chat UI can show it.
async function sendToClassroomProxy(userPrompt) {
  const endpointUrl = 'https://vibe-proxy-gqv4.onrender.com/v1/chat/completions';
  const requestBody = {
    model: 'class-chat-model',
    messages: [
      {
        role: 'user',
        content: `You are a BC Canada Science Grades 9–12 tutor. Use only British Columbia curriculum-aligned science knowledge from Grades 9–12. Do not answer using other countries' curriculum frameworks. If the user asks a curriculum or unit-planning question, answer directly using BC curriculum context. If the user asks a science concept question, guide them with questions and reasoning rather than giving the final answer immediately. User question: ${userPrompt}`
      }
    ]
  };

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sk-vibe-summer-2026'
    },
    body: JSON.stringify(requestBody)
  });

  // If the proxy server responds with an error code, stop immediately.
  if (!response.ok) {
    throw new Error(`Proxy request failed with status ${response.status}`);
  }

  const data = await response.json();

  // OpenAI-style model responses usually come back like:
  // data.choices[0].message.content
  // This is the part we want to show the student.
  const answer = data?.choices?.[0]?.message?.content;

  if (!answer) {
    throw new Error('The model response did not include any content.');
  }

  return answer;
}

function addMessage(text, role) {
  const node = document.createElement('div');
  node.className = `message ${role}`;
  node.textContent = text;
  chatLog.appendChild(node);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function buildTutorReply(question) {
  const topic = logic.chooseTopic(question);
  const questionType = logic.detectQuestionType(question);

  if (questionType === 'curriculum') {
    return logic.generateAnswer(question, state.lastTopic);
  }

  return logic.generateAnswer(question, state.lastTopic);
}

async function handleQuestion(event) {
  event.preventDefault();
  const question = questionInput.value.trim();

  if (!question) {
    return;
  }

  addMessage(question, 'user');
  questionInput.value = '';

  addMessage('Thinking…', 'tutor');

  try {
    // Ask the classroom proxy model for a response.
    const reply = await sendToClassroomProxy(question);

    // Replace the temporary "Thinking..." message with the creative answer.
    const lastMessage = chatLog.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('tutor')) {
      lastMessage.textContent = `✨ Science spark: ${reply}`;
    }
  } catch (error) {
    const lastMessage = chatLog.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('tutor')) {
      lastMessage.textContent = 'I hit a small snag. Please try your question again.';
    }
  }
}

topicChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const topic = chip.dataset.topic;
    state.lastTopic = topic;
    addMessage(`Let’s focus on ${curriculumBank[topic].title}. Tell me your question and I’ll guide you slowly.`, 'tutor');
  });
});

questionForm.addEventListener('submit', handleQuestion);

addMessage(
  'Ask a science question. I will not give the answer immediately. I will help you notice the ideas, the variables, and the reasoning step by step.',
  'tutor'
);

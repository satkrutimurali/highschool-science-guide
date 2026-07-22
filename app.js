const logic = window.tutorLogic;
const curriculumBank = logic.curriculumBank;

const chatLog = document.querySelector('#chatLog');
const questionForm = document.querySelector('#questionForm');
const questionInput = document.querySelector('#questionInput');
const topicChips = document.querySelectorAll('.topic-chip');
const newChatButton = document.querySelector('#newChatButton');
const historyList = document.querySelector('#historyList');

const SYSTEM_PROMPT = 'You are a BC Canada Science Grades 9–12 tutor. Use only British Columbia curriculum-aligned science knowledge from Grades 9–12. Do not answer using other countries\' curriculum frameworks. If the user asks a curriculum or unit-planning question, answer directly using BC curriculum context. If the user asks a science concept question, guide them with questions and reasoning rather than giving the final answer immediately.';

const state = {
  lastTopic: 'science 9',
  activeSessionId: null,
  sessionHistory: [],
  conversation: []
};

function createSession(topic) {
  const title = curriculumBank[topic].title;
  return {
    id: `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    topic,
    title,
    messages: [
      {
        role: 'tutor',
        text: `Pick a subject to work on from the topic buttons below, then ask your question. I’ll guide you step by step using ${title}.`
      }
    ],
    conversation: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      }
    ]
  };
}

function getActiveSession() {
  return state.sessionHistory.find((session) => session.id === state.activeSessionId) || null;
}

function renderHistoryList() {
  historyList.innerHTML = '';

  state.sessionHistory.forEach((session) => {
    const item = document.createElement('div');
    item.className = `history-item${session.id === state.activeSessionId ? ' active' : ''}`;
    item.dataset.sessionId = session.id;

    const selectButton = document.createElement('button');
    selectButton.type = 'button';
    selectButton.className = 'history-select';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'history-delete';
    deleteButton.textContent = 'Delete';

    const lastMessage = session.messages[session.messages.length - 1];
    const snippet = lastMessage?.text?.slice(0, 70) || 'No messages yet';

    selectButton.innerHTML = `
      <span class="history-title">${session.title}</span>
      <span class="history-snippet">${snippet}</span>
    `;

    selectButton.addEventListener('click', () => {
      restoreSession(session.id);
    });

    deleteButton.addEventListener('click', () => {
      state.sessionHistory = state.sessionHistory.filter((entry) => entry.id !== session.id);

      if (state.activeSessionId === session.id) {
        state.activeSessionId = null;
        beginNewSession(state.lastTopic);
      }

      renderHistoryList();
    });

    item.appendChild(selectButton);
    item.appendChild(deleteButton);
    historyList.appendChild(item);
  });
}

function renderChat(session) {
  chatLog.innerHTML = '';
  session.messages.forEach((message) => {
    addMessage(message.text, message.role);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function addMessageToActiveSession(text, role) {
  const activeSession = getActiveSession();
  if (!activeSession) {
    return;
  }

  activeSession.messages.push({ role, text });
  addMessage(text, role);
}

function restoreSession(sessionId) {
  const session = state.sessionHistory.find((item) => item.id === sessionId);
  if (!session) {
    return;
  }

  state.activeSessionId = sessionId;
  state.lastTopic = session.topic;
  state.conversation = session.conversation.map((message) => ({ ...message }));
  renderChat(session);
  renderHistoryList();
}

function beginNewSession(topic) {
  const session = createSession(topic);
  state.lastTopic = topic;
  state.activeSessionId = session.id;
  state.sessionHistory.unshift(session);
  state.conversation = session.conversation.map((message) => ({ ...message }));
  renderChat(session);
  renderHistoryList();
}

function deleteActiveSession() {
  const activeSession = getActiveSession();
  if (!activeSession) {
    return;
  }

  state.sessionHistory = state.sessionHistory.filter((session) => session.id !== activeSession.id);
  state.activeSessionId = null;
  beginNewSession(state.lastTopic);
}

// This function sends the student's question to your classroom proxy server
// using a standard fetch() POST request.
//
// How it works:
// 1. We keep a running conversation history in app state.
// 2. We build a JSON body with the model name and the full message list.
// 3. We send that payload to the proxy endpoint using the required headers.
// 4. We parse the OpenAI-style response shape from the server.
// 5. We pull the assistant text from data.choices[0].message.content.
// 6. We return that text so the chat UI can show it.
async function sendToClassroomProxy(userPrompt) {
  const endpointUrl = 'https://vibe-proxy-gqv4.onrender.com/v1/chat/completions';
  const conversationMessages = [
    ...state.conversation,
    {
      role: 'user',
      content: `The student is working in ${curriculumBank[state.lastTopic].title}. ${userPrompt}`
    }
  ];

  const requestBody = {
    model: 'class-chat-model',
    messages: conversationMessages
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

function resetConversationForTopic(topic) {
  beginNewSession(topic);
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

  if (!getActiveSession()) {
    beginNewSession(state.lastTopic);
  }

  addMessageToActiveSession(question, 'user');
  questionInput.value = '';

  addMessageToActiveSession('Thinking…', 'tutor');

  try {
    const reply = await sendToClassroomProxy(question);

    const activeSession = getActiveSession();
    if (activeSession) {
      activeSession.conversation.push({ role: 'user', content: question });
      activeSession.conversation.push({ role: 'assistant', content: reply });
      state.conversation = activeSession.conversation.map((message) => ({ ...message }));
    }

    const lastMessage = chatLog.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('tutor')) {
      lastMessage.textContent = `✨ Science spark: ${reply}`;
      const activeSession = getActiveSession();
      if (activeSession && activeSession.messages.length > 0) {
        activeSession.messages[activeSession.messages.length - 1].text = `✨ Science spark: ${reply}`;
      }
    }

    renderHistoryList();
  } catch (error) {
    const lastMessage = chatLog.lastElementChild;
    if (lastMessage && lastMessage.classList.contains('tutor')) {
      lastMessage.textContent = 'I hit a small snag. Please try your question again.';
      const activeSession = getActiveSession();
      if (activeSession && activeSession.messages.length > 0) {
        activeSession.messages[activeSession.messages.length - 1].text = 'I hit a small snag. Please try your question again.';
      }
    }
  }
}

topicChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const topic = chip.dataset.topic;
    resetConversationForTopic(topic);
  });
});

newChatButton.addEventListener('click', () => {
  resetConversationForTopic(state.lastTopic);
});

questionInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    questionForm.requestSubmit();
  }
});

questionForm.addEventListener('submit', handleQuestion);

beginNewSession('science 9');

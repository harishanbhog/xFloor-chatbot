const form = document.getElementById('chat-form');
const input = document.getElementById('message-input');
const messages = document.getElementById('messages');

function appendMessage(role, text) {
  const bubble = document.createElement('div');
  bubble.className = `msg ${role}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

appendMessage('system', 'Ready. Type a message to call xFloor Event + Query APIs.');

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) {
    return;
  }

  appendMessage('user', message);
  input.value = '';
  input.focus();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId: 'web-demo-session'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      appendMessage('system', `Error: ${result.error || 'Unknown error'}`);
      return;
    }

    appendMessage('bot', result.reply);
  } catch (error) {
    appendMessage('system', `Network error: ${error.message}`);
  }
});

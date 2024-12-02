
/**
 * Handles sending a message in the chatbot interface.
 */
function sendMessage(chat_id) {
  let input = document.getElementById("messageInput");
  let message = input.value.trim();

  if (message !== "") {
    let conversationBox = document.getElementById("conversationBox");

    let parentdiv = document.createElement("div");
    parentdiv.classList.add("flex", "items-end", "relative", "justify-end");

    // Append user message to the conversation box
    let userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add(
      "bg-orange-300",
      "text-white",
      "p-3",
      "rounded-lg",
      "max-w-xs",
      "break-all"
    );
    parentdiv.appendChild(userMessageDiv);
    userMessageDiv.textContent = message;
    conversationBox.appendChild(parentdiv);

    // Send user's message to the backend
    fetch(`/chat/${chat_id}/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message, sender: "user", chat_id: chat_id }),
    })
      .then(() => {
        console.log("User message stored successfully.");
      })
      .catch((error) => console.error("Error storing user message:", error));

    // Fetch chatbot's response (but do not add to HTML)
    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    })
      .then((response) => response.json())
      .then((data) => {
        // Log chatbot's response to the console (if needed)
        console.log("Chatbot response:", data.response);

        // Optionally store the chatbot's response in the backend
        fetch(`/chat/${chat_id}/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data.response, sender: "ai", chat_id: chat_id }),
        }).then(() => {
          console.log("Chatbot response stored successfully.");
        });
      })
      .catch((error) => console.error("Error fetching chatbot response:", error));

    conversationBox.scrollTop = conversationBox.scrollHeight; // Auto-scroll
    input.value = ""; // Clear input field
  }
}



document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });
});



// JavaScript to toggle sidebar visibility and content
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.getElementById('main-content');
  const sidebarContent = document.getElementById('sidebar-content');
  const newChatButton = document.getElementById('new-chat-button');

  // Toggle the width of the sidebar
  sidebar.classList.toggle('w-16');
  sidebarContent.classList.toggle('hidden')
  newChatButton.classList.toggle('hidden')
  sidebar.classList.toggle('w-3/4');



  mainContent.classList.toggle('w-full');
  mainContent.classList.toggle('w-3/4');

  // Hide the sidebar content and show only the "New Chat" button when collapsed
  ; // Hide chat history and items
  ; // Hide the button if needed when collapsed
}

const homesendMessage = async () => {
  try {
    const new_chat_id = await createNewChat();
    console.log(typeof new_chat_id); // Should log 'number'

    let input = document.getElementById("messageInput");
    let message = input.value.trim();

    if (!message) {
      console.error("Message input is empty!");
      return;
    }

    // Send user message
    await sendChatMessage(new_chat_id, message, "user");

    // Get AI response
    const ai_response = await sendChatMessageToAI(message);

    // Send AI message
    await sendChatMessage(new_chat_id, ai_response, "ai");

    // Load messages after both user and AI messages are saved
    await loadChatMessages(new_chat_id);
  } catch (error) {
    console.error("Error in homesendMessage:", error);
  }
};


const createNewChat = async () => {
  try {
    const response = await fetch("/user/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Uncomment and use this line if the server expects user_id or other payload
      // body: JSON.stringify({ user_id: current_user.id }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Failed to create chat. Status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate the response structure
    if (!data.chat_id) {
      throw new Error("Invalid response from server: chat_id is missing");
    }

    return data.chat_id; // Return the chat_id
  } catch (error) {
    console.error("Error in createNewChat:", error.message);
    return null; // Return null to signal failure
  }
};



async function loadChats() {
  try {
      // Fetch chats from the backend
      const response = await fetch('/user/chats', { method: 'GET' });
      const chats = await response.json();

      // Get the sidebar content element
      const sidebarContent = document.getElementById('sidebar-content');

      // Clear any existing chat list
      sidebarContent.innerHTML = '';

      // Create and append chat list items
      const ul = document.createElement('ul');
      ul.className='flex flex-col gap-1'
      chats.forEach(chat => {
          const li = document.createElement('li');
          li.className = 'p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer';
          li.textContent = chat.chat_name;

          // Optional: Add click functionality to load chat
          li.onclick = () => loadChatMessages(chat.id);

          // const div = document.createElement('div');
          // const button = document.createElement('button');
          // button.textContent='X'
          // button.className = 'btn bg-red-100'
          // div.appendChild(button);

          // li.appendChild(div);
          ul.appendChild(li);
      });

      sidebarContent.appendChild(ul);
  } catch (error) {
      console.error('Failed to load chats:', error);
  }
}

// Example function to load chat messages when a chat is clicked
async function loadChatMessages(chatId) {
  console.log('Loading messages for chat:', chatId);
  window.location.href = '/chat/' + chatId;
  // Implement message fetching and display logic here
}


document.addEventListener("DOMContentLoaded", function() {
  // Select all message content elements that are from the AI
  const aiMessages = document.querySelectorAll('.message-content');

  aiMessages.forEach(function (messageElement) {
    // Use `marked.parse` to parse the content of AI messages into HTML
    messageElement.innerHTML = marked.parse(messageElement.textContent.trim());
  });
});


function sendChatMessage(chat_id, content, sender) {
  // Construct the request payload
  const payload = {
    content: content,
    sender: sender, // e.g., "user" or "bot"
  };

  // Make the POST request
  fetch(`/chat/${chat_id}/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Specify JSON payload
    },
    body: JSON.stringify(payload), // Convert the payload to JSON string
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Message created successfully:", data);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
}

// Example usage
const chat_id = 123; // Replace with the actual chat ID
const content = "Hello, how are you?"; // Replace with the actual message content
const sender = "user"; // Specify the sender ("user" or "bot")
sendChatMessage(chat_id, content, sender);

async function sendChatMessageToAI(message) {
  const payload = { message: message };
  const response = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.response; // Return the AI's response
}

// Example usage
const message = "What is the weather like today?"; // Replace with your message
sendChatMessageToAI(message);

function loginWithGoogle(event) {
  event.preventDefault();
  window.location.href = "/login/google";
}




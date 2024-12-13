

document.addEventListener("keydown", function (event) {
  // Check if the pressed key is "Enter"
  if (event.key === "Enter") {
    // Trigger the click event on the button
    document.getElementById("sendButton").click();

  }
});

function streamer(aiMessageDiv, aiMessage, conversationBox) {
  let length = 0;
  const interval = setInterval(() => {
    aiMessageDiv.textContent += aiMessage[length++];
    if (length >= aiMessage.length) {
      clearInterval(interval);

      // After the typing effect is complete, parse and highlight the content
      let aiResponse = marked.parse(aiMessageDiv.textContent); // Markdown parsing
      let languageMatch = aiResponse.match(/```(\w+)/); // Regex to detect language
      if (languageMatch) {
        let language = languageMatch[1]; // Extract language (e.g., 'javascript')
        aiResponse = aiResponse.replace(
          /```(\w+)([\s\S]*?)```/g,
          `<pre><code class="language-$1">$2</code></pre>`
        );
      }

      aiMessageDiv.innerHTML = aiResponse; // Inject parsed response with markdown
      Prism.highlightAll(); // Apply syntax highlighting after the content is fully typed
    }
    conversationBox.scrollTop = conversationBox.scrollHeight;
  }, 0.001);
}


function sendMessage(chat_id) {
  let input = document.getElementById("messageInput");
  let message = input.value.trim();

  if (message !== "") {
    let conversationBox = document.getElementById("conversationBox");

    let parentdiv = document.createElement("div");
    parentdiv.classList.add("flex", "items-end", "relative", "justify-end", 'w-3/4');

    // Append user message to the conversation box
    let userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add(
      "bg-orange-400",
      "text-white",
      "p-2",
      "rounded-lg",
      "max-w-fit",
      "break-word"
    );
    parentdiv.appendChild(userMessageDiv);
    userMessageDiv.textContent = message;
    conversationBox.appendChild(parentdiv);

    sendChatMessage(chat_id, message, "user");

    // Send message to backend
    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        // Append chatbot's response
        let aiparentdiv = document.createElement("div");
        aiparentdiv.classList.add("flex", "items-end", "relative", "justify-start");

        let aiMessageDiv = document.createElement("div");
        aiMessageDiv.classList.add(
          "bg-gray-300",
          "text-black",
          "p-2",
          "rounded-lg",
          "max-w-xs"
        );

        // Process chatbot response with Marked.js for Markdown
        streamer(aiMessageDiv, data.response, conversationBox)
        aiMessageDiv.innerHTML = marked.parse(data.response);

        aiparentdiv.appendChild(aiMessageDiv);
        conversationBox.appendChild(aiparentdiv);

        sendChatMessage(chat_id, data.response, "ai");

        // Send AI response to generate the title
        fetch(`/${chat_id}/generate_title`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: data.response }),
        })
          .then((titleResponse) => titleResponse.json())
          .then((titleData) => {
            if (titleData.status === "success") {
              console.log("Title updated:", titleData.title);
              // Optionally update the UI to reflect the new title
              document.getElementById("chatTitle").textContent = titleData.title;
            } else {
              console.error("Failed to update title:", titleData.error);
            }
          })
          .catch((err) => {
            console.error("Error updating title:", err);
          });
      })
      .catch((err) => {
        console.error("Error sending message:", err);
      });

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

}

const homesendMessage = async () => {

  const new_chat_id = await createNewChat();

  let input = document.getElementById("messageInput2");
  let message = input.value.trim();

  if (message !== "") {
    let conversationBox = document.getElementById("conversationBox");

    let parentdiv = document.createElement("div");

    parentdiv.classList.add("flex", "items-end", "relative", "justify-end");

    // Append user message to the conversation box
    let userMessageDiv = document.createElement("div");
    userMessageDiv.classList.add(

      "bg-orange-400",
      "text-white",
      "p-2",
      "rounded-lg",
      "max-w-xs",
      "break-all"
    );
    parentdiv.appendChild(userMessageDiv);
    userMessageDiv.textContent = message;
    conversationBox.appendChild(parentdiv);

    sendChatMessage(new_chat_id, message, "user");
    // Send message to backend
    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message }),
    })
      .then((response) => response.json())
      .then(async (data) => {
        // Append chatbot's response
        let aiparentdiv = document.createElement("div");
        let aiMessageDiv = document.createElement("div");
        aiMessageDiv.classList.add(
          "bg-gray-300",
          "text-black",
          "px-6",
          "py-4",
          "rounded-lg",
          "max-w-xs"
        );

        // Process chatbot response with Marked.js for Markdown
        aiMessageDiv.innerHTML = marked.parse(data.response);

        aiparentdiv.appendChild(aiMessageDiv);
        conversationBox.appendChild(aiparentdiv);


        sendChatMessage(new_chat_id, data.response, "ai");


      });
    await loadChatMessages(new_chat_id)
    window.location.href = "/home";
    input.value = ""; // Clear input field
    window.location.href = `/chat/${new_chat_id}`;

  }
}

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
    window.location.href = '/chat/' + data.chat_id;

    return data.chat_id; // Return the chat_id

  } catch (error) {
    console.error("Error in createNewChat:", error.message);
    return null; // Return null to signal failure
  }

};


// Example function to load chat messages when a chat is clicked
async function loadChatMessages(chatId) {
  console.log('Loading messages for chat:', chatId);
  window.location.href = '/chat/' + chatId;

}


document.addEventListener("DOMContentLoaded", function () {
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


function loginWithGoogle(event) {
  event.preventDefault();
  window.location.href = "/login/google";
}


function deleteChat(chatId) {

  fetch('/delete_chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ chatId: chatId })
  })
    .then((response) => {
      if (response.ok) {
        window.location.href = '/home';
      } else {
        return response.json();
      }
    })
    .then((data) => {
      if (data && data.status === 'error') {
        alert(data.message);  // Show error message
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An unexpected error occurred.');
    });
}

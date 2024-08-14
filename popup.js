document.getElementById("loginButton").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch('http://localhost:5000/login', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message === "Login successful") {
          console.log("User logged in");
          chrome.storage.local.set({ 'userEmail': email });
          showMainUI();
      } else {
          document.getElementById("errorMessage").innerText = "Login failed. Please try again.";
      }
  })
  .catch(error => {
      console.error("Error during login:", error);
      document.getElementById("errorMessage").innerText = "An error occurred. Please try again.";
  });
});

document.getElementById("registerButton").addEventListener("click", () => {
  const email = document.getElementById("registerEmail").value;
  const password = document.getElementById("registerPassword").value;

  fetch('http://localhost:5000/register', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
      if (data.message === "User registered successfully") {
          console.log("User registered");
          document.getElementById("registerErrorMessage").innerText = "Registration successful. You can now log in.";
      } else {
          document.getElementById("registerErrorMessage").innerText = "Registration failed. Please try again.";
      }
  })
  .catch(error => {
      console.error("Error during registration:", error);
      document.getElementById("registerErrorMessage").innerText = "An error occurred. Please try again.";
  });
});

// Switching between login and registration forms
document.getElementById("goToRegister").addEventListener("click", () => {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
});

document.getElementById("goToLogin").addEventListener("click", () => {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
});

function showMainUI() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("main").style.display = "block";
}

// Check if the user is already logged in
chrome.storage.local.get('userEmail').then((result) => {
  if (result.userEmail) {
      showMainUI();
  }
});

// Logout functionality
document.getElementById("logoutButton").addEventListener("click", () => {
  chrome.storage.local.remove('userEmail').then(() => {
      console.log("User logged out");
      document.getElementById("main").style.display = "none";
      document.getElementById("loginBox").style.display = "block";
  });
});

document.getElementById("play").addEventListener("click", () => {
  console.log("Play button clicked");
  
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/pdf";
  
  input.onchange = (event) => {
    const file = event.target.files[0];
    
    if (file) {
      console.log("File selected:", file);
      
      const formData = new FormData();
      formData.append('pdf', file);
      
      fetch('http://localhost:5000/extract_text', {
        method: 'POST',
        body: formData,
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          console.error("Error extracting PDF text:", data.error);
        } else {
          console.log("Extracted text from server:", data.text);
          chrome.runtime.sendMessage({ action: 'setText', text: data.text }, () => {
            console.log("Sending 'play' message to background script.");
            chrome.runtime.sendMessage({ action: 'play' });
          });
        }
      })
      .catch(error => console.error("Error fetching from server:", error));
    }
  };
  
  input.click();  // Trigger the file input dialog
});

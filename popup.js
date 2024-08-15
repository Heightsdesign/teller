document.getElementById("loginButton").addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  console.log("Attempting to log in with email:", email);  // Debugging statement

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
          showLoadPdfUI();
      } else {
          console.error("Login failed:", data.error);
          document.getElementById("errorMessage").innerText = "Login failed. Please try again.";
      }
  })
  .catch(error => {
      console.error("Error during login:", error);
      document.getElementById("errorMessage").innerText = "An error occurred. Please try again.";
  });
});


// Registration functionality
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

// Logout functionality
document.getElementById("logoutButton").addEventListener("click", () => {
  // Send a POST request to the logout endpoint on the server
  fetch('http://localhost:5000/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      // Force logout on client-side if the server-side session is missing
      if (response.status === 400) {
        console.warn("No server-side session found. Forcing client-side logout.");
        chrome.storage.local.remove('userEmail').then(() => {
          console.log("Client-side session cleared.");
          showLoginUI();  // Redirect to login UI
        });
      }
      throw new Error('Logout failed');
    }
  })
  .then(data => {
    if (data) {
      console.log(data.message); // Logged out successfully

      // Clear the user's email (or token) from local storage
      chrome.storage.local.remove('userEmail').then(() => {
        console.log("User logged out");
        showLoginUI();  // Redirect to login UI
      });
    }
  })
  .catch(error => {
    console.error("Error during logout:", error);
  });
});

// Load PDF functionality
document.getElementById("uploadPdfButton").addEventListener("click", () => {
  console.log("Load PDF button clicked");

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/pdf";

  input.onchange = (event) => {
      const file = event.target.files[0];

      if (file) {
          console.log("File selected:", file);

          chrome.storage.local.get('userEmail', (data) => {
              const email = data.userEmail;

              if (!email) {
                  console.error("No email found in storage.");
                  document.getElementById("pdfErrorMessage").innerText = "User is not logged in.";
                  return;
              }

              const formData = new FormData();
              formData.append('pdf', file);
              formData.append('email', email);
              formData.append('title', file.name);

              fetch('http://localhost:5000/extract_text', {
                  method: 'POST',
                  body: formData,
              })
              .then(response => response.json())
              .then(data => {
                  if (data.error) {
                      console.error("Error extracting PDF text:", data.error);
                      document.getElementById("pdfErrorMessage").innerText = "Error extracting PDF text.";
                  } else {
                      console.log("Extracted text from server:", data.chunks);
                      chrome.runtime.sendMessage({ action: 'setText', chunks: data.chunks }, () => {
                          console.log("PDF text chunks set in background.");
                          // Navigate to the media player or another relevant UI here.
                      });
                  }
              })
              .catch(error => {
                  console.error("Error fetching from server:", error);
                  document.getElementById("pdfErrorMessage").innerText = "Error communicating with server.";
              });
          });
      }
  };

  input.click();  // Trigger the file input dialog
});

// Navigation between login, registration, and PDF loading
document.getElementById("goToRegister").addEventListener("click", () => {
  showRegisterUI();
});

document.getElementById("goToLogin").addEventListener("click", () => {
  showLoginUI();
});

// Navigation UI functions
function showLoginUI() {
  document.getElementById("loginBox").style.display = "block";
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loadPdfBox").style.display = "none";
  document.getElementById("main").style.display = "none";
}

function showRegisterUI() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
  document.getElementById("loadPdfBox").style.display = "none";
  document.getElementById("main").style.display = "none";
}

function showLoadPdfUI() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loadPdfBox").style.display = "block";
  document.getElementById("main").style.display = "none";
}

// Check if the user is already logged in
chrome.storage.local.get('userEmail').then((result) => {
  if (result.userEmail) {
      showLoadPdfUI();  // Redirect to load PDF UI if the user is logged in
  } else {
      showLoginUI();  // Show login UI if not logged in
  }
});

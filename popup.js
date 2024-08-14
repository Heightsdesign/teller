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

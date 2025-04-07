/**
 * This function calculates the loan payment based on the input values
 */
function calculateLoan() {
  const amount = parseFloat(document.getElementById('loan-amount').value);
  const duration = parseFloat(document.getElementById('loan-duration').value);
  const rate = parseFloat(document.getElementById('interest-rate').value);

  if (!amount || !duration || !rate) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  const monthlyRate = rate / 100 / 12;
  const months = duration * 12;
  const monthlyPayment = (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const totalCost = monthlyPayment * months;

  document.getElementById('monthly-payment').textContent = monthlyPayment.toFixed(2);
  document.getElementById('total-cost').textContent = totalCost.toFixed(2);
  document.getElementById('result').style.display = 'block';
}

/**
 * Function to apply a highlight animation to an element
 */
function highlightElement(element, className) {
  // Remove the class if it's already there
  element.classList.remove(className);

  // Force a reflow to ensure the animation restarts
  void element.offsetWidth;

  // Add the highlight class to trigger the animation
  element.classList.add(className);

  // Remove the class after the animation completes
  setTimeout(() => {
    element.classList.remove(className);
  }, 1500); // Match the animation duration in CSS
}

/**
 * Function to scroll to an element with a smooth animation
 */
function scrollToElement(element) {
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  });
}

/**
 * This function is called when the web chat receives a message from the assistant
 * containing an instruction to fill the loan amount
 */
function receiveHandler(event) {
  console.log("Received message:", JSON.stringify(event.data));

  if (!event.data || !event.data.output || !event.data.output.generic) {
    console.log("Invalid message structure");
    return;
  }

  const generic = event.data.output.generic;

  for (let i = 0; i < generic.length; i++) {
    console.log("Response item:", generic[i]);

    // Check if this response has user_defined data
    if (generic[i].user_defined && generic[i].user_defined.user_defined_type === "fill_loan_amount") {
      let amount = generic[i].user_defined.amount;

      // Extract the number from the text if needed
      if (typeof amount === 'string' && amount.includes("$step_001")) {
        // Try to get the amount from the text property instead
        const text = generic[i].text || "";
        const matches = text.match(/avec la valeur (\d+)/);
        if (matches && matches.length > 1) {
          amount = matches[1];
          console.log("Extracted amount from text:", amount);
        }
      }

      // Get the loan amount input element
      const loanAmountInput = document.getElementById('loan-amount');
      const calculateBtn = document.getElementById('calculate-btn');

      console.log("Setting loan amount to:", amount);
      loanAmountInput.value = amount;

      // Apply the highlight animation to the input
      highlightElement(loanAmountInput, 'highlight');

      // Scroll to the input field to ensure it's visible
      scrollToElement(loanAmountInput);

      // After a short delay, highlight the calculate button
      setTimeout(() => {
        highlightElement(calculateBtn, 'pulse');
      }, 1000);
    }
  }
}

/**
 * This is the function that is called when the web chat code has been loaded and ready to render
 */
async function onLoad(instance) {
  // Listen for the receive event to handle messages from the assistant
  instance.on({ type: 'receive', handler: receiveHandler });

  await instance.render();
}

// Initialize Watson Assistant when the page loads
document.addEventListener('DOMContentLoaded', function() {
  // Watson Assistant configuration
  window.watsonAssistantChatOptions = {
    integrationID: "2cbbd706-f711-41d6-bd81-83eee378f8ba",
    region: "au-syd",
    serviceInstanceID: "02cff0bf-6880-413a-a103-7e26e50ff214",
    onLoad: onLoad
  };

  // Load Watson Assistant script
  const t = document.createElement('script');
  t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
          (window.watsonAssistantChatOptions.clientVersion || 'latest') +
          "/WatsonAssistantChatEntry.js";
  document.head.appendChild(t);
});
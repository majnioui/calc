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
  if (!event.data || !event.data.output || !event.data.output.generic) {
    return;
  }

  const generic = event.data.output.generic;
  console.log('Processing receive event:', generic);

  for (let i = 0; i < generic.length; i++) {
    const message = generic[i];
    console.log('Processing message:', message);

    // Handle loan duration
    if (message.text && message.text.includes("Durée (en mois)")) {
      console.log('Detected duration message');
      const matches = message.text.match(/avec la valeur (\d+)/);
      if (matches && matches.length > 1) {
        const duration = matches[1];
        console.log('Setting duration:', duration);
        const loanDurationInput = document.getElementById('loan-duration');
        if (loanDurationInput) {
          loanDurationInput.value = duration;
          highlightElement(loanDurationInput, 'highlight');
        }
      }
    }

    // Also handle user_defined in receive event
    if (message.user_defined) {
      const type = message.user_defined.user_defined_type;
      console.log('Processing user_defined in receive:', type);

      if (type === 'fill_all_fields') {
        console.log('Processing all fields in receive:', message.user_defined);

        // Handle loan amount
        let amount = message.user_defined.amount;
        console.log('Setting loan amount in receive:', amount);

        if (typeof amount === 'string' && amount.includes("$step_001")) {
          const text = message.text || "";
          const matches = text.match(/avec la valeur (\d+)/);
          if (matches && matches.length > 1) {
            amount = matches[1];
          }
        }

        const loanAmountInput = document.getElementById('loan-amount');
        const calculateBtn = document.getElementById('calculate-btn');

        if (loanAmountInput) {
          loanAmountInput.value = amount;
          highlightElement(loanAmountInput, 'highlight');
          scrollToElement(loanAmountInput);

          if (calculateBtn) {
            setTimeout(() => {
              highlightElement(calculateBtn, 'pulse');
            }, 1000);
          }
        }

        // Handle project type
        const projectType = message.user_defined.project_type;
        console.log('Setting project type in receive:', projectType);
        const projectTypeSelect = document.getElementById('project-type');
        if (projectTypeSelect && projectType) {
          projectTypeSelect.value = projectType;
          highlightElement(projectTypeSelect, 'highlight');
        }

        // Handle profession
        const profession = message.user_defined.profession;
        console.log('Setting profession in receive:', profession);
        const professionSelect = document.getElementById('profession');
        if (professionSelect && profession) {
          professionSelect.value = profession;
          highlightElement(professionSelect, 'highlight');
        }
      }
    }
  }
}

/**
 * This is the function that is called when the web chat code has been loaded and ready to render
 */
async function onLoad(instance) {
  // Listen for the receive event to handle messages from the assistant
  instance.on({ type: 'receive', handler: receiveHandler });

  // Listen for userDefinedResponse events
  instance.on({ type: 'userDefinedResponse', handler: userDefinedHandler });

  await instance.render();
}

function userDefinedHandler(event) {
  const { message } = event.data;
  console.log('Processing userDefinedResponse:', message);

  if (message.user_defined) {
    const type = message.user_defined.user_defined_type;
    console.log('Processing user_defined type:', type);

    if (type === 'fill_all_fields') {
      console.log('Processing all fields:', message.user_defined);

      // Handle loan amount
      let amount = message.user_defined.amount;
      console.log('Setting loan amount:', amount);

      if (typeof amount === 'string' && amount.includes("$step_001")) {
        const text = message.text || "";
        const matches = text.match(/avec la valeur (\d+)/);
        if (matches && matches.length > 1) {
          amount = matches[1];
        }
      }

      const loanAmountInput = document.getElementById('loan-amount');
      const calculateBtn = document.getElementById('calculate-btn');

      if (loanAmountInput) {
        loanAmountInput.value = amount;
        highlightElement(loanAmountInput, 'highlight');
        scrollToElement(loanAmountInput);

        if (calculateBtn) {
          setTimeout(() => {
            highlightElement(calculateBtn, 'pulse');
          }, 1000);
        }
      }

      // Handle project type
      const projectType = message.user_defined.project_type;
      console.log('Setting project type:', projectType);
      const projectTypeSelect = document.getElementById('project-type');
      if (projectTypeSelect && projectType) {
        projectTypeSelect.value = projectType;
        highlightElement(projectTypeSelect, 'highlight');
      }

      // Handle profession
      const profession = message.user_defined.profession;
      console.log('Setting profession:', profession);
      const professionSelect = document.getElementById('profession');
      if (professionSelect && profession) {
        professionSelect.value = profession;
        highlightElement(professionSelect, 'highlight');
      }
    }
  }
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
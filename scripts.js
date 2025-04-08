// Constants
const INTEREST_RATE = 7; // Annual interest rate in percentage

/**
 * @param {number} amount - Loan amount
 * @param {number} duration - Loan duration in years
 * @param {number} rate - Annual interest rate
 * @returns {Object} Object containing monthly payment and total cost
 */
function calculateLoanPayment(amount, duration, rate) {
  const monthlyRate = rate / 100 / 12;
  const months = duration;
  const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const totalCost = monthlyPayment * months;

  return {
    monthlyPayment: monthlyPayment.toFixed(2),
    totalCost: totalCost.toFixed(2)
  };
}

/**
 * Applies a highlight animation to an element
 * @param {HTMLElement} element - The element to highlight
 * @param {string} className - The CSS class to apply
 */
function highlightElement(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
  setTimeout(() => element.classList.remove(className), 1500);
}

/**
 * Scrolls to an element with smooth animation
 * @param {HTMLElement} element - The element to scroll to
 */
function scrollToElement(element) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Extracts numeric value from a string containing a variable reference
 * @param {string} value - The string to parse
 * @param {string} text - Additional text to search in
 * @returns {string} The extracted numeric value
 */
function extractNumericValue(value, text = '') {
  if (typeof value === 'string' && value.includes('$step_')) {
    const matches = text.match(/avec la valeur (\d+)/);
    return matches && matches.length > 1 ? matches[1] : value;
  }
  return value;
}

/**
 * Updates form fields with values from the chatbot response
 * @param {Object} data - The user_defined data from the chatbot
 * @param {string} text - Additional text from the chatbot
 */
function updateFormFields(data, text) {
  const fields = {
    'loan-amount': extractNumericValue(data.amount, text),
    'loan-duration': extractNumericValue(data.duration, text),
    'project-type': data.project_type,
    'profession': data.profession
  };

  Object.entries(fields).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element && value) {
      element.value = value;
      highlightElement(element, 'highlight');
      if (id === 'loan-amount') {
        scrollToElement(element);
      }
    }
  });

  const calculateBtn = document.getElementById('calculate-btn');
  if (calculateBtn) {
    setTimeout(() => highlightElement(calculateBtn, 'pulse'), 1000);
  }
}

/**
 * Main loan calculation function
 */
function calculateLoan() {
  const amount = parseFloat(document.getElementById('loan-amount').value);
  const duration = parseFloat(document.getElementById('loan-duration').value);

  if (!amount || !duration) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  const { monthlyPayment, totalCost } = calculateLoanPayment(amount, duration, INTEREST_RATE);

  document.getElementById('monthly-payment').textContent = monthlyPayment;
  document.getElementById('total-cost').textContent = totalCost;
  document.getElementById('result').style.display = 'block';
}

/**
 * Handles messages received from the chatbot
 */
function receiveHandler(event) {
  if (!event.data?.output?.generic) return;

  const generic = event.data.output.generic;
  for (const message of generic) {
    if (message.user_defined?.user_defined_type === 'fill_all_fields') {
      updateFormFields(message.user_defined, message.text);
    }
  }
}

/**
 * Initializes the chatbot when the page loads
 */
async function onLoad(instance) {
  instance.on({ type: 'receive', handler: receiveHandler });
  await instance.render();
}

// Initialize Watson Assistant when the page loads
document.addEventListener('DOMContentLoaded', function() {
  window.watsonAssistantChatOptions = {
    integrationID: "2cbbd706-f711-41d6-bd81-83eee378f8ba",
    region: "au-syd",
    serviceInstanceID: "02cff0bf-6880-413a-a103-7e26e50ff214",
    onLoad: onLoad
  };

  const t = document.createElement('script');
  t.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/" +
          (window.watsonAssistantChatOptions.clientVersion || 'latest') +
          "/WatsonAssistantChatEntry.js";
  document.head.appendChild(t);
});
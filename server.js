const express = require('express');
const cors = require('cors');
const path = require('path');
const branchLocator = require('./branch-locator');

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
    origin: ['https://test.majnioui.me', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
    credentials: true
}));

app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Include branch locator routes
app.use('/api', branchLocator);

// Calculate monthly payment
function calculateMonthlyPayment(loanAmount, annualInterestRate, loanTerm) {
    // Convert annual interest rate to monthly rate
    const monthlyRate = annualInterestRate / 12 / 100;
    // Convert loan term to months
    const numberOfPayments = loanTerm;

    // Calculate monthly payment using the formula
    const monthlyPayment = loanAmount *
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    return monthlyPayment;
}

app.post('/calculate-payment', (req, res) => {
    try {
        const { loan_amount, loan_percentage, loan_term } = req.body;

        // Validate input
        if (!loan_amount || !loan_percentage || !loan_term) {
            return res.status(400).json({
                error: 'Missing required parameters: loan_amount, loan_percentage, loan_term'
            });
        }

        // Convert inputs to numbers
        const amount = parseFloat(loan_amount);
        const rate = parseFloat(loan_percentage);
        const term = parseInt(loan_term);

        // Calculate monthly payment
        const monthlyPayment = calculateMonthlyPayment(amount, rate, term);

        res.json({
            monthly_payment: monthlyPayment.toFixed(2),
            total_payment: (monthlyPayment * term).toFixed(2),
            total_interest: ((monthlyPayment * term) - amount).toFixed(2)
        });
    } catch (error) {
        res.status(500).json({
            error: 'An error occurred while calculating the payment'
        });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
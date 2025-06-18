// main.js

document.addEventListener('DOMContentLoaded', () => {
    // Only run game-specific logic if elements exist (i.e., on game.html)
    if (document.getElementById('passwordInput')) {
        const passwordInput = document.getElementById('passwordInput');
        const passwordStrengthBar = document.getElementById('passwordStrengthBar');
        const strengthText = document.getElementById('strengthText');
        const timeToCrackText = document.getElementById('timeToCrackText');
        const resetButton = document.getElementById('resetButton');
        const gameMessage = document.getElementById('gameMessage');
        const gameContainer = document.getElementById('gameContainer');

        const feedbackElements = {
            length: document.getElementById('lengthFeedback'),
            upper: document.getElementById('upperFeedback'),
            lower: document.getElementById('lowerFeedback'),
            number: document.getElementById('numberFeedback'),
            symbol: document.getElementById('symbolFeedback')
        };

        /**
         * Updates the visual feedback (icon and background) for a given criterion.
         * @param {HTMLElement} element - The feedback div element.
         * @param {boolean} isValid - True if the criterion is met, false otherwise.
         */
        function updateFeedback(element, isValid) {
            const icon = element.querySelector('i');
            // Remove all current state classes
            element.classList.remove('bg-gray-50', 'bg-green-50', 'bg-red-50');
            icon.classList.remove('fa-check', 'fa-times', 'text-green-500', 'text-red-500');

            // Apply new state classes
            if (isValid) {
                element.classList.add('bg-green-50');
                icon.classList.add('fa-check', 'text-green-500');
            } else {
                element.classList.add('bg-red-50');
                icon.classList.add('fa-times', 'text-red-500');
            }
        }

        /**
         * Calculates the strength score of a password based on defined criteria.
         * Also updates the individual feedback elements in the UI.
         * @param {string} password - The password string to check.
         * @returns {number} - The strength score.
         */
        function checkPasswordStrength(password) {
            let score = 0;
            const feedback = {
                length: password.length >= 8,
                upper: /[A-Z]/.test(password),
                lower: /[a-z]/.test(password),
                number: /[0-9]/.test(password),
                symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)
            };

            // Add score based on criteria met
            if (feedback.length) score++;
            if (feedback.upper) score++;
            if (feedback.lower) score++;
            if (feedback.number) score++;
            if (feedback.symbol) score++;

            // Bonus for longer passwords
            if (password.length >= 12) score++;

            // Update UI feedback for each criterion
            updateFeedback(feedbackElements.length, feedback.length);
            updateFeedback(feedbackElements.upper, feedback.upper);
            updateFeedback(feedbackElements.lower, feedback.lower);
            updateFeedback(feedbackElements.number, feedback.number);
            updateFeedback(feedbackElements.symbol, feedback.symbol);

            return score;
        }

        /**
         * Estimates the time it would take to crack a password.
         * This is a simplified model based on character set size and length.
         * @param {string} password - The password string.
         * @returns {string} - A human-readable estimate of crack time.
         */
        function calculateTimeToCrack(password) {
            if (password.length === 0) {
                return "Instantly";
            }

            let charsetSize = 0;
            // Determine the size of the character set based on password content
            if (/[a-z]/.test(password)) charsetSize += 26; // Lowercase letters
            if (/[A-Z]/.test(password)) charsetSize += 26; // Uppercase letters
            if (/[0-9]/.test(password)) charsetSize += 10; // Numbers
            // Common symbols (approx 32 for a reasonable set)
            if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) charsetSize += 32;

            // If no standard characters detected, assume a minimal charset to prevent errors
            if (charsetSize === 0) {
                charsetSize = 1;
            }

            // Assumption: A powerful modern cracking system can make 1 trillion guesses per second.
            const guessesPerSecond = 1e12; // 10^12

            // Calculate total possible combinations (charsetSize ^ password.length) using BigInt for large numbers
            let combinations = 1n;
            try {
                for (let i = 0; i < password.length; i++) {
                    combinations *= BigInt(charsetSize);
                }
            } catch (e) {
                console.error("Error calculating combinations with BigInt:", e);
                return "Error calculating";
            }

            // Calculate seconds to crack. Handle potential large BigInt values before converting to Number.
            let seconds;
            // Check if combinations divided by guessesPerSecond (both BigInts) would still be too large for a standard Number
            if (combinations > BigInt(Number.MAX_SAFE_INTEGER) * BigInt(guessesPerSecond)) {
                // If it's astronomically large, just directly assign a value that signifies "effectively infinite"
                seconds = Number(combinations / BigInt(guessesPerSecond));
            } else {
                seconds = Number(combinations) / guessesPerSecond;
            }


            // Convert seconds into human-readable format
            if (seconds < 1) return "Instantly";
            if (seconds < 60) return `${Math.round(seconds)} seconds`;
            if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
            if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
            if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
            if (seconds < 31536000 * 1000) return `${Math.round(seconds / 31536000)} years`; // Up to 1000 years
            return "Effectively infinite (hundreds of millions of years)"; // Cap for extremely long times
        }

        /**
         * Updates the UI elements (strength bar, text, crack time, game message)
         * based on the current password strength score.
         * @param {number} score - The current strength score.
         */
        function updateStrengthDisplay(score) {
            const password = passwordInput.value;
            let strengthName = "Start typing";
            let barWidth = 0;
            let barClass = "";
            let message = "Let's make that treasure chest impenetrable!";
            let timeToCrack = "Calculating...";

            // Reset UI state
            passwordStrengthBar.classList.remove('strength-0', 'strength-1', 'strength-2', 'strength-3', 'strength-4');
            gameContainer.classList.remove('mission-accomplished'); // Remove success styling

            if (password.length === 0) {
                strengthName = "Start typing";
                barWidth = 0;
                barClass = "strength-0"; // Default color when empty
                message = "Let's make that treasure chest impenetrable!";
                timeToCrack = "Instantly";
                // Reset feedback icons to initial red cross state
                Object.values(feedbackElements).forEach(element => {
                    const icon = element.querySelector('i');
                    element.classList.remove('bg-green-50', 'bg-red-50');
                    element.classList.add('bg-gray-50');
                    icon.classList.remove('fa-check', 'text-green-500');
                    icon.classList.add('fa-times', 'text-red-500');
                });
            } else if (score === 0) {
                strengthName = "Very Weak";
                barWidth = 20;
                barClass = "strength-0";
                message = "Your fortress walls are crumbling! Add more defenses.";
            } else if (score === 1) {
                strengthName = "Weak";
                barWidth = 40;
                barClass = "strength-0";
                message = "Still a bit risky! Aim for more criteria to make your fortress tougher.";
            } else if (score === 2) {
                strengthName = "Moderate";
                barWidth = 60;
                barClass = "strength-1";
                message = "The outer defenses are up, but a strong assault could breach them. Improve your walls!";
            } else if (score === 3) {
                strengthName = "Good";
                barWidth = 75;
                barClass = "strength-2";
                message = "Your fortress has solid walls! Most attackers will be deterred.";
            } else if (score === 4) {
                strengthName = "Strong";
                barWidth = 90;
                barClass = "strength-3";
                message = "An impenetrable fortress! Only the most determined (and patient) attackers stand a chance.";
            } else if (score >= 5) {
                strengthName = "Very Strong";
                barWidth = 100;
                barClass = "strength-4";
                message = "MISSION ACCOMPLISHED! Your digital treasure is SAFE within its IMPREGNABLE FORTRESS!";
                gameContainer.classList.add('mission-accomplished'); // Apply success styling
                // Redirect to results page after a slight delay
                setTimeout(() => {
                    window.location.href = 'results.html';
                }, 1500); // 1.5 seconds delay before redirecting
            }

            if (password.length > 0) {
                timeToCrack = `Time to crack: ${calculateTimeToCrack(password)}`;
            } else {
                timeToCrack = "Time to crack: Instantly";
            }

            passwordStrengthBar.style.width = `${barWidth}%`;
            if (barClass) {
                passwordStrengthBar.classList.add(barClass);
            }
            strengthText.textContent = `Strength: ${strengthName}`;
            timeToCrackText.textContent = timeToCrack;
            gameMessage.textContent = message;
        }

        // Event listener for password input changes
        passwordInput.addEventListener('input', () => {
            const password = passwordInput.value;
            const score = checkPasswordStrength(password);
            updateStrengthDisplay(score);
        });

        // Event listener for reset button
        resetButton.addEventListener('click', () => {
            passwordInput.value = ''; // Clear the input field
            const score = checkPasswordStrength(''); // Recalculate strength for empty string
            updateStrengthDisplay(score); // Update display
            passwordInput.focus(); // Keep focus on input for immediate typing
        });

        // Initial display update on load
        updateStrengthDisplay(checkPasswordStrength(passwordInput.value));
    }
});

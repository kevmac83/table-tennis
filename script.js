document.addEventListener('DOMContentLoaded', () => {
    // Game elements
    const gameContainer = document.getElementById('gameContainer');
    const playerPaddle = document.getElementById('playerPaddle');
    const opponentPaddle = document.getElementById('opponentPaddle');
    const ball = document.getElementById('ball');
    const playerScoreDisplay = document.getElementById('playerScore');
    const opponentScoreDisplay = document.getElementById('opponentScore');

    // Game dimensions - will be updated dynamically
    let containerHeight, containerWidth, paddleHeight, ballSize, paddleWidth, playerPaddleMaxY, opponentPaddleMaxY;

    // Game speeds - can be adjusted for better feel across sizes
    const initialPaddleSpeed = 8; // Base speed
    let paddleSpeed = initialPaddleSpeed;
    const initialBallSpeed = 4; // Base speed
    let ballSpeedX = initialBallSpeed;
    let ballSpeedY = initialBallSpeed;


    // Game state
    let playerScore = 0;
    let opponentScore = 0;
    let ballX, ballY;
    let playerPaddleY, opponentPaddleY;

    function updateGameDimensions() {
        containerHeight = gameContainer.clientHeight;
        containerWidth = gameContainer.clientWidth;
        paddleHeight = playerPaddle.offsetHeight;
        ballSize = ball.offsetHeight; // Assuming ball width and height are the same
        paddleWidth = playerPaddle.offsetWidth;

        // Max Y positions for paddles
        playerPaddleMaxY = containerHeight - paddleHeight;
        opponentPaddleMaxY = containerHeight - paddleHeight;

        // Adjust speeds based on container size (optional, for consistent feel)
        // Example: paddleSpeed = Math.max(6, containerHeight / 50);
        // ballSpeedX = Math.max(3, containerWidth / 150);
        // ballSpeedY = Math.max(3, containerHeight / 100);
    }


    // Update element positions
    function updateElementPositions() {
        playerPaddle.style.top = `${playerPaddleY}px`;
        opponentPaddle.style.top = `${opponentPaddleY}px`;
        ball.style.left = `${ballX}px`;
        ball.style.top = `${ballY}px`;
    }

    // Reset ball to center
    function resetBall() {
        ballX = containerWidth / 2 - ballSize / 2;
        ballY = containerHeight / 2 - ballSize / 2;

        // Keep current ballSpeed magnitude but randomize direction
        const currentSpeed = Math.sqrt(ballSpeedX**2 + ballSpeedY**2) || initialBallSpeed;
        ballSpeedX = (Math.random() > 0.5 ? currentSpeed : -currentSpeed) * (Math.random() * 0.5 + 0.75); // Add some variance
        ballSpeedY = (Math.random() > 0.5 ? currentSpeed : -currentSpeed) * (Math.random() * 0.5 + 0.75);

        // Ensure ballSpeed is not too slow or too fast initially after reset
        ballSpeedX = Math.sign(ballSpeedX) * Math.max(initialBallSpeed / 2, Math.abs(ballSpeedX));
        ballSpeedY = Math.sign(ballSpeedY) * Math.max(initialBallSpeed / 2, Math.abs(ballSpeedY));
    }

    // Update scores
    function updateScores() {
        playerScoreDisplay.textContent = playerScore;
        opponentScoreDisplay.textContent = opponentScore;
    }

    // Player paddle movement
    document.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
            playerPaddleY = Math.max(0, playerPaddleY - paddleSpeed);
        } else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
            playerPaddleY = Math.min(playerPaddleMaxY, playerPaddleY + paddleSpeed);
        }
    });

    // Touch controls for player paddle
    gameContainer.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
            event.preventDefault(); // Prevent screen scrolling
            movePlayerPaddleWithTouch(event.touches[0]);
        }
    }, { passive: false }); // passive: false to allow preventDefault

    gameContainer.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
            event.preventDefault(); // Prevent screen scrolling
            movePlayerPaddleWithTouch(event.touches[0]);
        }
    }, { passive: false });

    function movePlayerPaddleWithTouch(touchEvent) {
        const gameRect = gameContainer.getBoundingClientRect();
        // Calculate touch position relative to the game container
        // clientY is the touch position relative to the viewport
        // gameRect.top is the game container's top edge relative to the viewport
        let touchYInContainer = touchEvent.clientY - gameRect.top;

        // Center paddle on touch position
        let newPaddleY = touchYInContainer - paddleHeight / 2;

        // Constrain paddle within game boundaries
        playerPaddleY = Math.max(0, Math.min(playerPaddleMaxY, newPaddleY));
        // updateElementPositions(); // Optional: for immediate feedback, though gameLoop also does this
    }

    // Opponent AI
    function opponentAI() {
        // Simple AI: tries to follow the ball, slightly slower
        const opponentAdjustedSpeed = paddleSpeed * 0.75; // Opponent is a bit slower
        const targetY = ballY - paddleHeight / 2;

        if (opponentPaddleY + paddleHeight / 2 < ballY - ballSize / 2 && opponentPaddleY < opponentPaddleMaxY) {
            opponentPaddleY = Math.min(opponentPaddleMaxY, opponentPaddleY + opponentAdjustedSpeed);
        } else if (opponentPaddleY + paddleHeight / 2 > ballY + ballSize / 2 && opponentPaddleY > 0) {
            opponentPaddleY = Math.max(0, opponentPaddleY - opponentAdjustedSpeed);
        }
    }


    // Game loop
    function gameLoop() {
        // Move ball
        ballX += ballSpeedX;
        ballY += ballSpeedY;

        // Ball collision with top/bottom walls
        if (ballY <= 0) {
            ballY = 0;
            ballSpeedY *= -1;
        } else if (ballY + ballSize >= containerHeight) {
            ballY = containerHeight - ballSize;
            ballSpeedY *= -1;
        }

        // Ball collision with player paddle
        // Using paddleWidth variable now
        if (ballX <= playerPaddle.offsetLeft + paddleWidth && // paddleWidth instead of playerPaddle.offsetWidth
            ballX >= playerPaddle.offsetLeft &&
            ballY + ballSize >= playerPaddleY &&
            ballY <= playerPaddleY + paddleHeight) {
            ballSpeedX *= -1.1; // Increase speed slightly on hit
            ballX = playerPaddle.offsetLeft + paddleWidth; // Prevent sticking
            let hitPos = (ballY + ballSize / 2 - playerPaddleY) / paddleHeight;
            ballSpeedY = (hitPos - 0.5) * 10; // Max angle change, could be (hitPos - 0.5) * Math.abs(ballSpeedX) for more dynamic changes
            // Clamp ballSpeedY to prevent extreme vertical speeds
            ballSpeedY = Math.max(-Math.abs(ballSpeedX), Math.min(Math.abs(ballSpeedX), ballSpeedY));


        }

        // Ball collision with opponent paddle
        // Using paddleWidth variable now
        if (ballX + ballSize >= opponentPaddle.offsetLeft &&
            ballX + ballSize <= opponentPaddle.offsetLeft + paddleWidth && // paddleWidth instead of opponentPaddle.offsetWidth
            ballY + ballSize >= opponentPaddleY &&
            ballY <= opponentPaddleY + paddleHeight) {
            ballSpeedX *= -1.1; // Increase speed slightly on hit
            ballX = opponentPaddle.offsetLeft - ballSize; // Prevent sticking
            let hitPos = (ballY + ballSize / 2 - opponentPaddleY) / paddleHeight;
            ballSpeedY = (hitPos - 0.5) * 10;
            ballSpeedY = Math.max(-Math.abs(ballSpeedX), Math.min(Math.abs(ballSpeedX), ballSpeedY));

        }

        // Ball out of bounds (scoring)
        if (ballX < 0 - ballSize) { // Give a little margin before reset
            opponentScore++;
            updateScores();
            resetBall();
            ballSpeedX = initialBallSpeed; // Reset speed to initial
            ballSpeedY = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        } else if (ballX > containerWidth) { // Give a little margin
            playerScore++;
            updateScores();
            resetBall();
            ballSpeedX = -initialBallSpeed; // Reset speed to initial
            ballSpeedY = initialBallSpeed * (Math.random() > 0.5 ? 1 : -1);
        }

        // Max ball speed
        const maxSpeed = 15; // Or some factor of containerWidth/Height
        ballSpeedX = Math.max(-maxSpeed, Math.min(maxSpeed, ballSpeedX));
        ballSpeedY = Math.max(-maxSpeed, Math.min(maxSpeed, ballSpeedY));


        // Opponent movement
        opponentAI();

        // Update positions
        updateElementPositions();

        // Next frame
        requestAnimationFrame(gameLoop);
    }

    // Initialize and start game
    function initializeGame() {
        updateGameDimensions(); // Initial calculation of dimensions

        // Set initial paddle positions based on new dimensions
        playerPaddleY = containerHeight / 2 - paddleHeight / 2;
        opponentPaddleY = containerHeight / 2 - paddleHeight / 2;

        updateScores();
        resetBall(); // Position ball and set initial speeds
        updateElementPositions(); // Set initial positions in DOM
        gameLoop();
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        const oldContainerWidth = containerWidth;
        const oldContainerHeight = containerHeight;

        updateGameDimensions();

        // Scale paddle positions
        playerPaddleY = (playerPaddleY / oldContainerHeight) * containerHeight;
        opponentPaddleY = (opponentPaddleY / oldContainerHeight) * containerHeight;
        playerPaddleY = Math.max(0, Math.min(playerPaddleMaxY, playerPaddleY));
        opponentPaddleY = Math.max(0, Math.min(opponentPaddleMaxY, opponentPaddleY));


        // Scale ball position and speed (optional, can also just reset)
        ballX = (ballX / oldContainerWidth) * containerWidth;
        ballY = (ballY / oldContainerHeight) * containerHeight;

        // If ball is out of new bounds, reset it
        if (ballX < 0 || ballX > containerWidth || ballY < 0 || ballY > containerHeight) {
            resetBall();
        }
        // Potentially adjust ballSpeedX and ballSpeedY if they were dependent on size
        // For now, resetBall handles speed randomization.

        updateElementPositions(); // Update visuals immediately
    });

    initializeGame();
});

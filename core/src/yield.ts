const DEADLINE = 5; // milliseconds

let startTime: number = 0;

function shouldYield(): boolean {
  if (startTime === 0) {
    startTime = Date.now();
  }

  const timeElapsed = Date.now() - startTime;

  if (timeElapsed >= DEADLINE) {
    startTime = 0;
    return true;
  }

  return false;
}

// Reset the start time when beginning a new work loop
function resetYieldTime() {
  startTime = 0;
}

export { shouldYield, resetYieldTime };

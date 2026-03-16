import confetti from "canvas-confetti";

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["hsl(262, 83%, 58%)", "hsl(47, 100%, 68%)", "hsl(142, 71%, 45%)"],
  });
}

export function fireStepConfetti() {
  confetti({
    particleCount: 40,
    spread: 50,
    startVelocity: 20,
    origin: { y: 0.7 },
    colors: ["hsl(262, 83%, 58%)", "hsl(47, 100%, 68%)"],
  });
}

export function fireFinalConfetti() {
  const duration = 2000;
  const end = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.6 },
      colors: ["hsl(262, 83%, 58%)", "hsl(47, 100%, 68%)", "hsl(142, 71%, 45%)"],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.6 },
      colors: ["hsl(262, 83%, 58%)", "hsl(47, 100%, 68%)", "hsl(142, 71%, 45%)"],
    });

    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

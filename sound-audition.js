const audioPlayers = Array.from(document.querySelectorAll("audio"));
const playButtons = Array.from(document.querySelectorAll("[data-audio]"));
const volumeInput = document.getElementById("previewVolume");
const volumeValue = document.getElementById("volumeValue");
const stopAllButton = document.getElementById("stopAllButton");
const copyChoicesButton = document.getElementById("copyChoicesButton");
const copyStatus = document.getElementById("copyStatus");

const choiceOutputs = {
  countdown: document.getElementById("countdownChoice"),
  time: document.getElementById("timeChoice"),
  correct: document.getElementById("correctChoice"),
  wrong: document.getElementById("wrongChoice"),
};

function resetPlayerUi(player) {
  const button = document.querySelector(`[data-audio="${player.id}"]`);
  if (button) {
    button.textContent = "Play";
    button.setAttribute("aria-pressed", "false");
    button.closest(".sound-option")?.classList.remove("is-playing");
  }
}

function stopPlayer(player) {
  player.pause();
  player.currentTime = 0;
  resetPlayerUi(player);
}

function stopAllPlayers(exceptPlayer = null) {
  audioPlayers.forEach((player) => {
    if (player !== exceptPlayer) {
      stopPlayer(player);
    }
  });
}

playButtons.forEach((button) => {
  button.setAttribute("aria-pressed", "false");
  button.addEventListener("click", async () => {
    const player = document.getElementById(button.dataset.audio);
    if (!player) return;

    if (!player.paused) {
      stopPlayer(player);
      return;
    }

    stopAllPlayers(player);
    player.currentTime = 0;
    button.textContent = "Stop";
    button.setAttribute("aria-pressed", "true");
    button.closest(".sound-option")?.classList.add("is-playing");

    try {
      await player.play();
      copyStatus.textContent = "";
    } catch (error) {
      resetPlayerUi(player);
      copyStatus.textContent = "That sound could not play. Refresh the page and try again.";
    }
  });
});

audioPlayers.forEach((player) => {
  player.volume = 1;
  player.addEventListener("ended", () => resetPlayerUi(player));
  player.addEventListener("error", () => resetPlayerUi(player));
});

volumeInput.addEventListener("input", () => {
  const value = Number(volumeInput.value);
  const volume = Math.max(0, Math.min(1, value / 100));
  audioPlayers.forEach((player) => {
    player.volume = volume;
  });
  volumeValue.value = `${value}%`;
  volumeValue.textContent = `${value}%`;
});

stopAllButton.addEventListener("click", () => stopAllPlayers());

document.querySelectorAll('input[type="radio"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    document.querySelectorAll(`input[name="${radio.name}"]`).forEach((groupRadio) => {
      groupRadio.closest(".sound-option")?.classList.toggle("is-selected", groupRadio.checked);
    });

    choiceOutputs[radio.name].textContent = radio.value;
    const allChosen = Object.keys(choiceOutputs).every((name) =>
      Boolean(document.querySelector(`input[name="${name}"]:checked`)),
    );
    copyChoicesButton.disabled = !allChosen;
    copyStatus.textContent = "";
  });
});

copyChoicesButton.addEventListener("click", async () => {
  const labels = {
    countdown: "Last five seconds",
    time: "Time is up",
    correct: "Correct answer",
    wrong: "Wrong answer",
  };
  const text = [
    "My Philopoly sound choices:",
    ...Object.keys(labels).map((name) => {
      const choice = document.querySelector(`input[name="${name}"]:checked`);
      return `${labels[name]}: ${choice?.value || "Not chosen"}`;
    }),
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied. Paste the list into our chat.";
  } catch (error) {
    copyStatus.textContent = text;
  }
});

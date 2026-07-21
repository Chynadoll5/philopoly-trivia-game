const SOUND_LIBRARY = {
  countdown: {
    containerId: "countdownOptions",
    options: [
      { id: "countdown-mechanical-tick", name: "Mechanical tick", note: "One crisp clock tick for each remaining second.", duration: "1 second", file: "countdown-mechanical-tick.wav" },
      { id: "countdown-fast-wall-clock", name: "Fast wall clock", note: "Rapid mechanical ticking with more urgency.", duration: "2 seconds", file: "countdown-fast-wall-clock.wav" },
      { id: "countdown-ticking-counter", name: "Ticking counter", note: "A steady countdown with clear, even beats.", duration: "7 seconds", file: "countdown-ticking-counter.wav" },
      { id: "countdown-race", name: "Race countdown", note: "A short sports-style countdown with a strong finish.", duration: "4 seconds", file: "countdown-race.wav" },
      { id: "countdown-close-up", name: "Close-up tick-tock", note: "A close, realistic clock mechanism.", duration: "11 seconds", file: "countdown-close-up-tick-tock.wav" },
      { id: "countdown-classic-timer", name: "Classic clock timer", note: "A familiar, steady tick-tock rhythm.", duration: "16 seconds", file: "countdown-classic-clock-timer.wav" },
      { id: "countdown-ten-second", name: "Ten-second timer", note: "Clear ticking that builds pressure near zero.", duration: "10 seconds", file: "countdown-ten-second-timer.wav" },
      { id: "countdown-percussion", name: "Percussion tick-tock", note: "A heavier rhythmic tick with more presence.", duration: "24 seconds", file: "countdown-percussion-tick-tock.wav" },
      { id: "countdown-slow-race", name: "Slow race countdown", note: "A measured race-start countdown cue.", duration: "6 seconds", file: "countdown-slow-race.wav" },
      { id: "countdown-wall-clock", name: "Wall clock tick-tock", note: "A natural room-clock sound with depth.", duration: "23 seconds", file: "countdown-wall-clock.wav" }
    ]
  },
  time: {
    containerId: "timeOptions",
    options: [
      { id: "time-basketball-buzzer", name: "Basketball buzzer", note: "A loud arena buzzer with a long finish.", duration: "4 seconds", file: "time-basketball-buzzer.wav" },
      { id: "time-hockey-buzzer", name: "Hockey buzzer", note: "A deeper arena horn that cuts through a noisy room.", duration: "4 seconds", file: "time-hockey-buzzer.wav" },
      { id: "time-digital-alarm", name: "Digital alarm", note: "A sustained alarm for maximum urgency.", duration: "8 seconds", file: "time-digital-alarm.wav" },
      { id: "time-bell-buzzer", name: "Bell buzzer", note: "A short buzzer with a clear metal bell edge.", duration: "2 seconds", file: "time-bell-buzzer.wav" },
      { id: "time-alarm-clock", name: "Alarm clock", note: "A strong bedside alarm that is hard to miss.", duration: "8 seconds", file: "time-alarm-clock.wav" },
      { id: "time-clock-alarm", name: "Clock alarm", note: "A second alarm style with a sharper pulse.", duration: "8 seconds", file: "time-clock-alarm.wav" },
      { id: "time-classic-gong", name: "Classic clock gong", note: "A resonant clock gong for a dramatic finish.", duration: "7 seconds", file: "time-classic-clock-gong.wav" },
      { id: "time-clock-bells", name: "Clock bell signal", note: "Several clear bells marking the end of time.", duration: "6 seconds", file: "time-clock-bell-signal.wav" },
      { id: "time-long-gong", name: "Long clock gong", note: "A deep, sustained gong with room-filling weight.", duration: "9 seconds", file: "time-long-clock-gong.wav" },
      { id: "time-ding-dong", name: "Ding-dong alarm", note: "A familiar two-tone bell that stays clear at full volume.", duration: "4 seconds", file: "time-ding-dong.wav" }
    ]
  },
  correct: {
    containerId: "correctOptions",
    options: [
      { id: "correct-achievement-bell", name: "Achievement bell", note: "A bright bell that is quick and polished.", duration: "2 seconds", file: "correct-achievement-bell.wav" },
      { id: "correct-prize-payout", name: "Prize payout", note: "A satisfying game-prize payout sound.", duration: "4 seconds", file: "correct-prize-payout.wav" },
      { id: "correct-group-applause", name: "Group applause", note: "A real group clapping and celebrating.", duration: "4 seconds", file: "correct-group-applause.wav" },
      { id: "correct-victory-crowd", name: "Victory crowd", note: "A big, loud crowd cheering a win.", duration: "10 seconds", file: "correct-victory-crowd.wav" },
      { id: "correct-crowd-whistle", name: "Crowd and whistle", note: "Loud cheering with a celebratory whistle.", duration: "14 seconds", file: "correct-crowd-whistle.wav" },
      { id: "correct-fanfare", name: "Victory fanfare", note: "A bold brass fanfare announcing a win.", duration: "8 seconds", file: "correct-victory-fanfare.wav" },
      { id: "correct-auditorium", name: "Auditorium applause", note: "A larger audience applauding and cheering.", duration: "17 seconds", file: "correct-auditorium-applause.wav" },
      { id: "correct-yes", name: "Victory yes", note: "A quick human yes for an immediate response.", duration: "1 second", file: "correct-victory-yes.wav" },
      { id: "correct-slot-machine", name: "Slot machine win", note: "A bright casino-style winning alarm.", duration: "6 seconds", file: "correct-slot-machine-win.wav" },
      { id: "correct-reward", name: "Correct answer reward", note: "A compact game-show reward cue.", duration: "2 seconds", file: "correct-answer-reward.wav" }
    ]
  },
  wrong: {
    containerId: "wrongOptions",
    options: [
      { id: "wrong-bass-buzzer", name: "Bass buzzer", note: "A low, classic quiz-show wrong-answer buzzer.", duration: "3 seconds", file: "wrong-bass-buzzer.wav" },
      { id: "wrong-game-show-buzz", name: "Game show buzz", note: "A quick, familiar wrong-answer buzz.", duration: "2 seconds", file: "wrong-game-show-buzz.wav" },
      { id: "wrong-sad-trombone", name: "Sad trombone", note: "A real brass fail cue with a comic finish.", duration: "6 seconds", file: "wrong-sad-trombone.wav" },
      { id: "wrong-dramatic-game-show", name: "Dramatic game show", note: "A longer wrong-answer cue with more impact.", duration: "4 seconds", file: "wrong-dramatic-game-show.wav" },
      { id: "wrong-failure-piano", name: "Failure piano", note: "A short falling piano phrase for a miss.", duration: "2 seconds", file: "wrong-failure-piano.wav" },
      { id: "wrong-losing-cue", name: "Losing cue", note: "A fuller game-loss sound with a clear ending.", duration: "3 seconds", file: "wrong-losing-cue.wav" },
      { id: "wrong-long-buzzer", name: "Long buzzer", note: "A blunt, unmistakable wrong-answer buzzer.", duration: "1 second", file: "wrong-long-buzzer.wav" },
      { id: "wrong-car-ignition", name: "Failed ignition", note: "A real car failing to start.", duration: "2 seconds", file: "wrong-failed-car-ignition.wav" },
      { id: "wrong-drum-xylophone", name: "Drum and xylophone", note: "A playful percussion fail cue.", duration: "3 seconds", file: "wrong-drum-xylophone.wav" },
      { id: "wrong-drum-bells", name: "Drum and bells", note: "A heavier musical fail cue with bells.", duration: "3 seconds", file: "wrong-drum-bells.wav" }
    ]
  }
};

function renderSoundLibrary() {
  Object.entries(SOUND_LIBRARY).forEach(([groupName, group]) => {
    const container = document.getElementById(group.containerId);
    container.innerHTML = group.options.map((option) => `
      <article class="sound-option">
        <div class="option-copy">
          <p class="sound-name">${option.name}</p>
          <p class="sound-note">${option.note}</p>
          <p class="sound-length">${option.duration}</p>
        </div>
        <div class="option-actions">
          <button class="play-button" type="button" data-audio="${option.id}" aria-pressed="false">Play</button>
          <label class="choice-label">
            <input type="radio" name="${groupName}" value="${option.name}">
            <span>Choose</span>
          </label>
        </div>
        <audio id="${option.id}" preload="metadata" src="assets/sound-previews/${option.file}"></audio>
      </article>
    `).join("");
  });
}

renderSoundLibrary();

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
  wrong: document.getElementById("wrongChoice")
};

function resetPlayerUi(player) {
  const button = document.querySelector(`[data-audio="${player.id}"]`);
  if (!button) return;
  button.textContent = "Play";
  button.setAttribute("aria-pressed", "false");
  button.closest(".sound-option")?.classList.remove("is-playing");
}

function stopPlayer(player) {
  player.pause();
  player.currentTime = 0;
  resetPlayerUi(player);
}

function stopAllPlayers(exceptPlayer = null) {
  audioPlayers.forEach((player) => {
    if (player !== exceptPlayer) stopPlayer(player);
  });
}

playButtons.forEach((button) => {
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
      Boolean(document.querySelector(`input[name="${name}"]:checked`))
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
    wrong: "Wrong answer"
  };
  const text = [
    "My Philopoly sound choices:",
    ...Object.keys(labels).map((name) => {
      const choice = document.querySelector(`input[name="${name}"]:checked`);
      return `${labels[name]}: ${choice?.value || "Not chosen"}`;
    })
  ].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    copyStatus.textContent = "Copied. Paste the list into our chat.";
  } catch (error) {
    copyStatus.textContent = text;
  }
});

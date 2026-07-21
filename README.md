# Philopoly Trivia Game

This folder is ready for GitHub Pages. The game is a static website, and the questions/settings come from your Google Sheet.

## What You Have

- `index.html`, `styles.css`, `app.js`, `config.js`: the phone/tablet trivia game.
- `apps-script/Code.gs`: the Google Apps Script bridge that reads your Sheet.
- `philopoly_trivia_database_template.xlsx`: the spreadsheet template backup.
- Live rule book source: https://docs.google.com/document/d/1ecrP2-qq8RypjtBzQ6IYhIBPz0GqdowY2UD33SwY0vY/edit
- Live Google Sheet: Philopoly Trivia Database — https://docs.google.com/spreadsheets/d/1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE/edit

## Google Sheet Rules

- `Command Center` controls timer, button behavior, title text, and the default answer mode.
- `Command Center` also controls the default answer mode, the on-screen mode switch, and the End Game button.
- `Topic Controls` turns category tabs on and off.
- Every other playable tab is a category.
- Each category tab needs these columns: `Level`, `Question`, `Answer`, `Accepted Variations`, `Blocked`.
- Use `easy`, `medium`, or `difficult` in the Level column.
- Separate accepted variations with `|`, like `Michael Jackson|MJ|Mike Jackson`.
- Set a category to `FALSE` on `Topic Controls` to hide that whole category.
- Set a question row's `Blocked` value to `TRUE` to keep that specific question out of the game.
- The `Random` cell pulls from all levels in the selected category.

## Rule Book

- The in-game rule book pulls live rules from the rule book document listed above when the `Rules` button is opened.
- Keep major rule sections written like `1. Welcome to Philopoly`.
- Short subheadings such as `Doubles` or `Trivia Mode` will show as subsections.
- Bullet rows and simple `Column | Column | Column` rows will be styled as lists and tables in the website.
- If rules do not load, update and redeploy `apps-script/Code.gs` so the Apps Script can read the document.

## Phone Play Modes

- Every phone should use the same `Room`, such as `game-1`, when playing the same shared game. Type the room code and tap `Join`.
- In live mode, the Apps Script reserves each drawn question for that room so multiple phones share the same used-question history.
- The board has rows for every category and columns for `Easy`, `Medium`, `Difficult`, and `Random`.
- `Type answer` mode lets players type an answer and tap `Check`.
- `Host mode` hides the typing box and lets the host use `Correct`, `Missed`, `Show answer`, `Restart timer`, `Skip`, and `End game`.
- `Correct` and `Missed` judge the current question and then move to the next question after a short pause.
- `Skip` pulls another question from the same category and level.
- `End game` saves progress and returns to the board.
- `New game` resets the shared used-question history for the current room.
- Open `Sound` to set the timer tick, buzzer, correct-answer sound, missed-answer sound, volume, and mute setting.

## Connect The Google Sheet

1. Open the live Google Sheet.
2. Go to `Extensions` > `Apps Script`.
3. Delete any starter code and paste everything from `apps-script/Code.gs`.
4. Click `Deploy` > `New deployment`.
5. Choose type `Web app`.
6. Set `Execute as` to `Me`.
7. Set `Who has access` to `Anyone`.
8. Click `Deploy`, approve permissions, and copy the web app URL ending in `/exec`.
9. Open `config.js` and paste that URL into `dataUrl`.
10. Commit the updated `config.js` to GitHub.

This copy is already connected to your Apps Script web app.

Example:

```js
window.TRIVIA_CONFIG = {
  dataUrl: "https://script.google.com/macros/s/AKfycbwavxh7EUvWiAUBbu356EUn3LwH0EENq1tWGfTH1d_S7MBZKgPjGbihCRaWEodl8oBn/exec",
  spreadsheetId: "1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE",
  rulesDocumentUrl: "https://docs.google.com/document/d/1ecrP2-qq8RypjtBzQ6IYhIBPz0GqdowY2UD33SwY0vY/edit",
  useDemoDataWhenEmpty: true,
  storageKey: "philopoly-trivia-game"
};
```

## Put It On GitHub Pages

1. Create a GitHub repository.
2. Upload everything in this folder to the repository.
3. In GitHub, open `Settings` > `Pages`.
4. Under `Build and deployment`, choose `Deploy from a branch`.
5. Pick your main branch and `/root`, then save.
6. GitHub will give you a website URL. That is the URL your QR code should open.

## QR Code

Once GitHub Pages gives you the website URL, create a QR code from that URL. If you change questions later, the QR code can stay the same because the website URL does not change.

## No-Repeat Behavior

The game remembers used question spaces in each browser. A question will not repeat on that device until all eligible questions in the chosen set have been used, then that set refreshes.

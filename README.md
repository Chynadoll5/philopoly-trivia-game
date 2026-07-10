# Family Trivia Game

This folder is ready for GitHub Pages. The game is a static website, and the questions/settings come from your Google Sheet.

## What You Have

- `index.html`, `styles.css`, `app.js`, `config.js`: the phone/tablet trivia game.
- `apps-script/Code.gs`: the Google Apps Script bridge that reads your Sheet.
- `philopoly_trivia_database_template.xlsx`: the spreadsheet template backup.
- Live Google Sheet: Philopoly Trivia Database — https://docs.google.com/spreadsheets/d/1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE/edit

## Google Sheet Rules

- `Command Center` controls timer, colors, button behavior, and title text.
- `Command Center` also controls the default answer mode, the on-screen mode switch, and the End Game button.
- `Topic Controls` turns category tabs on and off.
- Every other playable tab is a category.
- Each category tab needs these columns: `Level`, `Question`, `Answer`, `Accepted Variations`, `Blocked`.
- Use `easy`, `medium`, or `difficult` in the Level column.
- Separate accepted variations with `|`, like `Michael Jackson|MJ|Mike Jackson`.
- Set a category to `FALSE` on `Topic Controls` to hide that whole category.
- Set a question row's `Blocked` value to `TRUE` to keep that specific question out of the game.
- The `Surprise Me` button pulls from all levels in the selected category.

## Phone Play Modes

- `Type Answer` mode lets players type an answer and tap `Check`.
- `Host Mode` hides the typing box and gives the host `Correct`, `Missed`, `Show Answer`, `Shuffle Again`, and `Select Again` controls.
- `Shuffle Again` pulls another question from the same category and level.
- `Select Again` goes back to the category screen for the next turn.
- `End Game` stops the timer and lets you resume, save progress, or start a new game.
- `Save Progress` keeps used questions saved on that device, which is useful when Philopoly stretches over multiple sessions.

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

Example:

```js
window.TRIVIA_CONFIG = {
  dataUrl: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec",
  spreadsheetId: "1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE",
  useDemoDataWhenEmpty: true,
  storageKey: "family-trivia-game"
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

# Start Here

You already have the game files and the Google Sheet database.

## Step 1: Google Sheet Is Connected

The game is already connected to this Apps Script URL:

```text
https://script.google.com/macros/s/AKfycbx0y-xw_ZZWcTVTNIMcy1W_fzGuzwp_ikWcPKMtesQemgoIu4s-eWNjjq7zskie5kxP/exec
```

You only need to repeat these steps if you ever create a brand-new Apps Script deployment:

1. Open the Google Sheet:
   https://docs.google.com/spreadsheets/d/1b6_V2o3BThSVcRt0YJG4Y_sTqerqP6Zbw6s2Ef0CVlE/edit
2. In Google Sheets, click `Extensions` > `Apps Script`.
3. Delete any starter code.
4. Paste everything from this file:
   `apps-script/Code.gs`
5. Click `Deploy` > `New deployment`.
6. Choose `Web app`.
7. Set `Execute as` to `Me`.
8. Set `Who has access` to `Anyone`.
9. Click `Deploy` and approve the Google prompts.
10. Copy the web app URL that ends in `/exec`.

## Step 2: Put the Game on GitHub

Upload everything in this `family-trivia-game` folder to a GitHub repository.

Then in GitHub:

1. Go to `Settings`.
2. Go to `Pages`.
3. Choose `Deploy from a branch`.
4. Choose your main branch and `/root`.
5. Save.

GitHub will give you a website link. That link is what your QR code should open.

## Step 3: Make the QR Code

Create a QR code from the GitHub Pages website link.

You can keep the same QR code later. When you change questions in the Google Sheet, the game updates from the Sheet.

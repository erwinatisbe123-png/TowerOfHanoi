# Hanoi Toy Tower — Tower of Hanoi powered by SWI-Prolog

```
hanoi-v2/
├── Dockerfile      <- tells Render how to run Prolog
├── hanoi.pl        <- Prolog logic (solver, rules, validation)
├── server.pl       <- Prolog web server (API + website)
├── tests.pl        <- Prolog unit tests
├── DEPLOY.md       <- GitHub + Render step-by-step
└── public/         <- the website (index.html, style.css, app.js)
```

Run locally (PowerShell, inside this folder):
```
swipl -g run_tests -t halt tests.pl
swipl server.pl
```
Then open http://localhost:8080

Put it online: see DEPLOY.md.

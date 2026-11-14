# Langwa: brief description

**Langwa makes digital banking understandable in Cameroon's national languages, without
touching the bank's code.**

## The problem

Banking, payment and microfinance interfaces in Cameroon are in French or English. Many people
read and speak a national language more comfortably. A misread balance, fee, beneficiary or
security warning can cost money, and some people avoid digital services for that reason.

## The solution

Langwa is a browser extension that sits on top of an unchanged digital financial service and
explains it in a national language: today **Cameroon Pidgin English (Kamtok)** and
**Fulfulde**, with seven more languages prepared (Ewondo, Duala, Basaá, Ghomálá', Lamnso',
Mankon, Kom).

- **Point at any text** (hold Ctrl, or no key in "Point" mode): the translation opens under it,
  with a Listen button.
- **The panel** (round Langwa button) translates the whole page at once and lists every message,
  important ones first.
- **The assistant** answers questions about what is on screen, such as "How much will I pay?",
  with the exact amounts.
- **New messages**, such as an error or a security warning added after the page loaded, are
  caught at once and explained.
- **A natural voice** reads the translations aloud, offline, on the computer.

Amounts, fees, names and references are locked before any translation and checked after: no
translation can change them. When Langwa cannot translate a message safely, it says what kind
of message it is (error, warning, confirmation) and shows the exact values, instead of
guessing. Every translation shows whether a native speaker has validated it.

Native speakers improve each language from their phone on the contribution page; nothing is
marked validated until a speaker approves it.

## Links

- Website and downloads: https://langwa-five.vercel.app
- Source code: https://github.com/BrayanMorningstar237/lingua
- Technical document (architecture, integration, dependencies, limitations, languages and
  validation method): [Langwa-Documentation.pdf](Langwa-Documentation.pdf)

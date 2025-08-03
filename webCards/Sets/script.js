function parseCSV(text) {
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj = {};
        headers.forEach((h, i) => obj[h] = values[i] ?? "");
        return obj;
    });
    return { headers, data };
}

const { headers, data: originalWords } = parseCSV(csvData);
let words = [...originalWords];
let currentIndex = 0;
let flipped = false;
let wrongCards = [];
let reviewingWrong = false;
let inBetween = false;

const history = [];

const flashcard = document.getElementById("flashcard");
const frontText = document.getElementById("frontText");
const backText = document.getElementById("backText");
const counter = document.getElementById("counter");
const wordTable = document.getElementById("wordTable");
const wordHead = document.getElementById("wordHead");
const optionsDiv = document.getElementById("languageOptions");

const selectedLanguages = new Set(headers.slice(1));

document.getElementById("btnFlip").onclick = () => flipCard();
document.getElementById("btnNext").onclick = () => markCorrect();
document.getElementById("btnPrev").onclick = () => markWrong();
document.getElementById("btnShuffle").onclick = () => shuffleCards();
document.getElementById("btnReset").onclick = () => resetCards();
document.getElementById("btnUndo").onclick = () => undoAction();
flashcard.onclick = () => flipCard();

document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") markCorrect();
    else if (e.key === "ArrowLeft") markWrong();
    else if (e.key === " ") {
        e.preventDefault();
        flipCard();
    }
});

const languageNames = {
    de: "Deutsch", es: "Spanisch", la: "Latein", fr: "Französisch", it: "Italienisch", rm: "Romanisch", en: "Englisch"
};

headers.slice(1).forEach(lang => {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = lang;
    input.checked = true;
    input.addEventListener("change", () => {
        if (input.checked) selectedLanguages.add(lang);
        else selectedLanguages.delete(lang);
        renderCard();
    });
    const span = document.createElement("span");
    span.textContent = languageNames[lang] ?? lang;
    label.appendChild(input);
    label.appendChild(span);
    optionsDiv.appendChild(label);
});

function renderCard() {
    if (inBetween) {
        frontText.innerHTML = `<strong>Jetzt eine Wiederholung der falschen Karten.</strong>`;
        backText.innerHTML = `<em>Drücke „Weiter“ (richtig) oder „Zurück“ (falsch), um zu starten.</em>`;
        counter.textContent = `Zwischenkarte: 0 / 0`;
        flipped = false;
        flashcard.classList.remove("flipped");
        return;
    }

    if (currentIndex >= words.length) {
        frontText.innerHTML = `<strong>Drücke auf „Zurücksetzen“ oder „Mischen“, um die Karten zu mischen.</strong>`;
        backText.innerHTML = "";
        counter.textContent = "";
        flipped = false;
        flashcard.classList.remove("flipped");
        return;
    }

    const word = words[currentIndex];
    frontText.innerHTML = `<strong>${word[headers[0]]}</strong>`;
    backText.innerHTML = [...selectedLanguages]
        .map(lang => `<div><em>${languageNames[lang] ?? lang}:</em> ${word[lang]}</div>`)
        .join("") || "<em>(nichts gewählt)</em>";

    counter.textContent = `Karte ${currentIndex + 1} von ${words.length}` + (reviewingWrong ? " (Wiederholung)" : "");

    flipped = false;
    flashcard.classList.remove("flipped");
}

function flipCard() {
    if (currentIndex >= words.length || inBetween) return;
    flipped = !flipped;
    flashcard.classList.toggle("flipped", flipped);
}

function markCorrect() {
    history.push({
        currentIndex,
        wasWrong: false,
        reviewingWrong,
        inBetween,
        words: [...words],
        wrongCards: [...wrongCards]
    });

    if (inBetween) {
        inBetween = false;
        if (wrongCards.length > 0) {
            words = [...wrongCards];
            wrongCards = [];
            currentIndex = 0;
            reviewingWrong = true;
        } else {
            reviewingWrong = false;
            currentIndex = words.length; // Endkarte
        }
        renderCard();
        return;
    }

    if (currentIndex < words.length) {
        currentIndex++;
        if (!reviewingWrong && currentIndex === words.length) {
            if (wrongCards.length > 0) {
                inBetween = true;
            } else {
                reviewingWrong = false;
            }
        } else if (reviewingWrong && currentIndex === words.length) {
            if (wrongCards.length > 0) {
                inBetween = true;  // Wenn noch Fehler bei Wiederholung: Zwischenkarte erneut
                reviewingWrong = false;
            } else {
                reviewingWrong = false;
            }
        }
        renderCard();
    }
}

function markWrong() {
    history.push({
        currentIndex,
        wasWrong: true,
        reviewingWrong,
        inBetween,
        words: [...words],
        wrongCards: [...wrongCards]
    });

    if (inBetween) {
        inBetween = false;
        if (wrongCards.length > 0) {
            words = [...wrongCards];
            wrongCards = [];
            currentIndex = 0;
            reviewingWrong = true;
        } else {
            reviewingWrong = false;
            currentIndex = words.length; // Endkarte
        }
        renderCard();
        return;
    }

    if (currentIndex < words.length) {
        wrongCards.push(words[currentIndex]);
        currentIndex++;
        if (!reviewingWrong && currentIndex === words.length) {
            if (wrongCards.length > 0) {
                inBetween = true;
            } else {
                reviewingWrong = false;
            }
        } else if (reviewingWrong && currentIndex === words.length) {
            if (wrongCards.length > 0) {
                inBetween = true;
                reviewingWrong = false;
            } else {
                reviewingWrong = false;
            }
        }
        renderCard();
    }
}

function undoAction() {
    if (history.length === 0) return;
    const last = history.pop();

    currentIndex = last.currentIndex;
    reviewingWrong = last.reviewingWrong;
    inBetween = last.inBetween;
    words = [...last.words];
    wrongCards = [...last.wrongCards];
    flipped = false;
    flashcard.classList.remove("flipped");
    renderCard();
}

function shuffleCards() {
    history.push({
        currentIndex,
        wasWrong: false,
        reviewingWrong,
        inBetween,
        words: [...words],
        wrongCards: [...wrongCards]
    });

    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }
    currentIndex = 0;
    flipped = false;
    reviewingWrong = false;
    inBetween = false;
    wrongCards = [];
    flashcard.classList.remove("flipped");
    renderCard();
    renderTable();
}

function resetCards() {
    history.push({
        currentIndex,
        wasWrong: false,
        reviewingWrong,
        inBetween,
        words: [...words],
        wrongCards: [...wrongCards]
    });

    words = [...originalWords];
    currentIndex = 0;
    flipped = false;
    reviewingWrong = false;
    inBetween = false;
    wrongCards = [];
    flashcard.classList.remove("flipped");
    renderCard();
    renderTable();
}

function renderTable() {
    wordHead.innerHTML = "<tr>" + headers.map(h => `<th>${languageNames[h] ?? h}</th>`).join("") + "</tr>";
    wordTable.innerHTML = "";
    words.forEach(w => {
        const row = "<tr>" + headers.map(h => `<td>${w[h]}</td>`).join("") + "</tr>";
        wordTable.innerHTML += row;
    });
}

renderCard();
renderTable();
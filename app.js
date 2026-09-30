let cards = [];
let currentIndex = 0;
let known = 0;
let unknown = 0;

const csvFile = document.getElementById("csvFile");

const emptyState = document.getElementById("emptyState");
const cardElement = document.getElementById("card");
const buttonsElement = document.getElementById("buttons");

const chineseElement = document.getElementById("chinese");
const pinyinElement = document.getElementById("pinyin");
const russianElement = document.getElementById("russian");
const exampleElement = document.getElementById("example");

const answerElement = document.getElementById("answer");
const showAnswerBtn = document.getElementById("showAnswerBtn");

const speakBtn = document.getElementById("speakBtn");

const currentNumber = document.getElementById("currentNumber");
const totalNumber = document.getElementById("totalNumber");
const knownCount = document.getElementById("knownCount");
const unknownCount = document.getElementById("unknownCount");

const shuffleBtn = document.getElementById("shuffleBtn");
const resetBtn = document.getElementById("resetBtn");


// ==============================
// CSV IMPORT
// ==============================

csvFile.addEventListener("change", function(event) {

    const file = event.target.files[0];

    if (!file) {
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {

        const text = e.target.result;

        try {

            cards = parseCSV(text);

            if (cards.length === 0) {
                alert("В CSV нет карточек.");
                return;
            }

            currentIndex = 0;
            known = 0;
            unknown = 0;

            saveProgress();

            emptyState.classList.add("hidden");
            cardElement.classList.remove("hidden");
            buttonsElement.classList.remove("hidden");

            showCard();

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось прочитать CSV.\n\n" +
                "Проверь формат файла."
            );
        }
    };

    reader.readAsText(file, "UTF-8");
});


// ==============================
// CSV PARSER
// ==============================

function parseCSV(text) {

    const rows = [];
    let row = [];
    let value = "";
    let insideQuotes = false;

    for (let i = 0; i < text.length; i++) {

        const char = text[i];
        const next = text[i + 1];

        if (char === '"' && insideQuotes && next === '"') {

            value += '"';
            i++;

        } else if (char === '"') {

            insideQuotes = !insideQuotes;

        } else if (char === "," && !insideQuotes) {

            row.push(value);
            value = "";

        } else if ((char === "\n" || char === "\r") && !insideQuotes) {

            if (char === "\r" && next === "\n") {
                i++;
            }

            row.push(value);
            value = "";

            if (row.some(cell => cell.trim() !== "")) {
                rows.push(row);
            }

            row = [];

        } else {

            value += char;
        }
    }

    if (value.length > 0 || row.length > 0) {

        row.push(value);

        if (row.some(cell => cell.trim() !== "")) {
            rows.push(row);
        }
    }

    if (rows.length < 2) {
        return [];
    }

    const headers = rows[0].map(header =>
        header.trim().toLowerCase()
    );

    const chineseIndex = headers.indexOf("chinese");
    const pinyinIndex = headers.indexOf("pinyin");
    const russianIndex = headers.indexOf("russian");
    const exampleIndex = headers.indexOf("example");

    if (chineseIndex === -1 || russianIndex === -1) {

        throw new Error(
            "CSV должен содержать chinese и russian."
        );
    }

    return rows.slice(1)
        .map(row => {

            return {
                chinese: (row[chineseIndex] || "").trim(),
                pinyin: pinyinIndex !== -1
                    ? (row[pinyinIndex] || "").trim()
                    : "",
                russian: (row[russianIndex] || "").trim(),
                example: exampleIndex !== -1
                    ? (row[exampleIndex] || "").trim()
                    : ""
            };

        })
        .filter(card => card.chinese && card.russian);
}


// ==============================
// SHOW CARD
// ==============================

function showCard() {

    if (cards.length === 0) {
        return;
    }

    const current = cards[currentIndex];

    chineseElement.textContent = current.chinese;
    pinyinElement.textContent = current.pinyin;
    russianElement.textContent = current.russian;
    exampleElement.textContent = current.example;

    currentNumber.textContent = currentIndex + 1;
    totalNumber.textContent = cards.length;

    knownCount.textContent = known;
    unknownCount.textContent = unknown;

    answerElement.classList.add("hidden");
    showAnswerBtn.classList.remove("hidden");

    if (current.example) {
        document.getElementById("exampleContainer")
            .classList.remove("hidden");
    } else {
        document.getElementById("exampleContainer")
            .classList.add("hidden");
    }
}


// ==============================
// SHOW ANSWER
// ==============================

showAnswerBtn.addEventListener("click", function() {

    answerElement.classList.remove("hidden");
    showAnswerBtn.classList.add("hidden");

});


// ==============================
// SPEECH
// ==============================

speakBtn.addEventListener("click", function() {

    if (cards.length === 0) {
        return;
    }

    const text = cards[currentIndex].chinese;

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "zh-CN";
    speech.rate = 0.8;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);

});


// ==============================
// KNOW / DON'T KNOW
// ==============================

document.getElementById("knownBtn")
    .addEventListener("click", function() {

        known++;

        nextCard();
    });


document.getElementById("unknownBtn")
    .addEventListener("click", function() {

        unknown++;

        nextCard();
    });


// ==============================
// NEXT CARD
// ==============================

function nextCard() {

    if (currentIndex < cards.length - 1) {

        currentIndex++;

    } else {

        alert(
            `Раунд закончен!\n\n` +
            `Знаю: ${known}\n` +
            `Не знаю: ${unknown}`
        );

        currentIndex = 0;
    }

    saveProgress();

    showCard();
}


// ==============================
// SHUFFLE
// ==============================

shuffleBtn.addEventListener("click", function() {

    for (let i = cards.length - 1; i > 0; i--) {

        const j = Math.floor(Math.random() * (i + 1));

        [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    currentIndex = 0;

    showCard();
});


// ==============================
// RESET
// ==============================

resetBtn.addEventListener("click", function() {

    if (!confirm("Сбросить прогресс?")) {
        return;
    }

    currentIndex = 0;
    known = 0;
    unknown = 0;

    saveProgress();

    if (cards.length > 0) {
        showCard();
    }
});


// ==============================
// LOCAL STORAGE
// ==============================

function saveProgress() {

    localStorage.setItem(
        "chineseFlashcardsProgress",
        JSON.stringify({
            known: known,
            unknown: unknown
        })
 
        
    );
}
/* =========================================================
   ELEMENTLER
========================================================= */

const openingScreen = document.getElementById("openingScreen");
const continueButton = document.getElementById("continueButton");

const darkRoom = document.getElementById("darkRoom");
const lightButton = document.getElementById("lightButton");

const surpriseScreen = document.getElementById("surpriseScreen");
const confettiContainer = document.getElementById("confettiContainer");

const micButton = document.getElementById("micButton");
const soundLevel = document.querySelector(".sound-level");

const candles = document.querySelectorAll(".candle");
const finalMessage = document.getElementById("finalMessage");


/* =========================================================
   DURUM
========================================================= */

let audioContext = null;
let analyser = null;
let microphone = null;
let microphoneStream = null;

let microphoneActive = false;
let candlesBlown = false;

let volumeHistory = [];
let blowStartTime = 0;


/* =========================================================
   AÇILIŞ
========================================================= */

continueButton.addEventListener("click", () => {

    openingScreen.classList.add("hidden");

    setTimeout(() => {
        darkRoom.classList.add("active");
    }, 900);

});


/* =========================================================
   IŞIĞI KAPAT
========================================================= */

lightButton.addEventListener("click", () => {

    // Düğmeye bastıktan sonra hemen sürprizi göstermiyoruz.
    // Kısa ve değişken bir bekleme süresi oluşturuyoruz.

    lightButton.disabled = true;

    darkRoom.classList.add("waiting");

    const randomDelay =
        1100 +
        Math.random() * 1800;

    setTimeout(() => {

        startSurprise();

    }, randomDelay);

});


/* =========================================================
   SÜRPRİZİ BAŞLAT
========================================================= */

function startSurprise() {

    darkRoom.classList.remove("active");

    surpriseScreen.classList.add("active");

    // Kamera flaşı gibi ani ışık
    surpriseScreen.classList.add("flash-active");

    setTimeout(() => {
        surpriseScreen.classList.remove("flash-active");
    }, 1200);

    // İlk büyük konfeti patlaması
    createConfettiBurst();

    // Birkaç saniye sonra ekstra küçük konfeti
    setTimeout(() => {
        createConfettiBurst();
    }, 1100);

}


/* =========================================================
   KONFETİ
========================================================= */

function createConfettiBurst() {

    const amount = window.innerWidth < 600
        ? 85
        : 130;

    const colors = [
        "#ffffff",
        "#e8d09f",
        "#d8b875",
        "#b88a45",
        "#f2f2f2"
    ];

    for (let i = 0; i < amount; i++) {

        const piece = document.createElement("div");

        piece.className = "confetti";

        const size = 4 + Math.random() * 7;

        const left = Math.random() * 100;

        const duration =
            2.8 +
            Math.random() * 3;

        const delay =
            Math.random() * 0.7;

        const drift =
            (Math.random() - 0.5) * 300;

        const rotation =
            360 +
            Math.random() * 900;

        piece.style.left = `${left}%`;
        piece.style.width = `${size}px`;
        piece.style.height = `${size * 1.7}px`;
        piece.style.background = colors[
            Math.floor(Math.random() * colors.length)
        ];

        piece.style.setProperty(
            "--drift",
            `${drift}px`
        );

        piece.style.setProperty(
            "--rotation",
            `${rotation}deg`
        );

        piece.style.animationDuration =
            `${duration}s`;

        piece.style.animationDelay =
            `${delay}s`;

        piece.style.borderRadius =
            Math.random() > 0.5
                ? "1px"
                : "50%";

        confettiContainer.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, (duration + delay) * 1000 + 500);

    }

}


/* =========================================================
   MİKROFON
========================================================= */

micButton.addEventListener("click", async () => {

    if (microphoneActive) {
        return;
    }

    try {

        microphoneStream =
            await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                }
            });

        startMicrophone();

    } catch (error) {

        console.error(
            "Mikrofon erişimi alınamadı:",
            error
        );

        micButton.textContent =
            "Mikrofon izni gerekli";

    }

});


/* =========================================================
   SES ANALİZİ
========================================================= */

function startMicrophone() {

    microphoneActive = true;

    micButton.textContent =
        "Üfle...";

    micButton.style.opacity = "0.55";

    audioContext =
        new (
            window.AudioContext ||
            window.webkitAudioContext
        )();

    analyser =
        audioContext.createAnalyser();

    analyser.fftSize = 1024;

    analyser.smoothingTimeConstant = 0.25;

    microphone =
        audioContext.createMediaStreamSource(
            microphoneStream
        );

    microphone.connect(analyser);

    monitorMicrophone();

}


/* =========================================================
   MİKROFONU SÜREKLİ KONTROL ET
========================================================= */

function monitorMicrophone() {

    if (!microphoneActive || candlesBlown) {
        return;
    }

    const bufferLength =
        analyser.fftSize;

    const dataArray =
        new Uint8Array(bufferLength);

    analyser.getByteTimeDomainData(
        dataArray
    );

    let sum = 0;

    for (let i = 0; i < bufferLength; i++) {

        const normalized =
            (dataArray[i] - 128) / 128;

        sum += normalized * normalized;

    }

    const rms =
        Math.sqrt(sum / bufferLength);

    const volume =
        Math.min(1, rms * 4.5);

    updateSoundVisualizer(volume);

    detectBlow(volume);

    requestAnimationFrame(
        monitorMicrophone
    );

}


/* =========================================================
   SES GÖSTERGESİ
========================================================= */

function updateSoundVisualizer(volume) {

    if (volume > 0.025) {
        soundLevel.classList.add("active");
    } else {
        soundLevel.classList.remove("active");
    }

    const bars =
        soundLevel.querySelectorAll("span");

    bars.forEach((bar, index) => {

        const randomFactor =
            0.35 +
            Math.random() * 0.9;

        const height =
            4 +
            volume *
            70 *
            randomFactor;

        bar.style.height =
            `${Math.min(height, 20)}px`;

        bar.style.opacity =
            `${Math.min(
                0.35 + volume * 2,
                1
            )}`;

    });

}


/* =========================================================
   ÜFLEME ALGILAMA
========================================================= */

function detectBlow(volume) {

    /*
        Normal konuşma ile üflemeyi ayırmaya
        yardımcı olmak için birkaç örneği
        hafızada tutuyoruz.
    */

    volumeHistory.push(volume);

    if (volumeHistory.length > 15) {
        volumeHistory.shift();
    }

    const average =
        volumeHistory.reduce(
            (total, value) =>
                total + value,
            0
        ) / volumeHistory.length;


    /*
        Üfleme sırasında ses seviyesi
        kısa süre içerisinde yükseliyor.
    */

    const isLoudEnough =
        volume > 0.13;

    const isAboveAverage =
        volume > average * 1.55;

    if (
        isLoudEnough &&
        isAboveAverage
    ) {

        if (blowStartTime === 0) {
            blowStartTime =
                performance.now();
        }

        const duration =
            performance.now() -
            blowStartTime;

        /*
            Ses yaklaşık 140 ms kadar
            devam ederse üfleme kabul ediyoruz.
        */

        if (duration > 140) {
            blowOutCandles();
        }

    } else {

        blowStartTime = 0;

    }

}


/* =========================================================
   MUMLARI SÖNDÜR
========================================================= */

function blowOutCandles() {

    if (candlesBlown) {
        return;
    }

    candlesBlown = true;

    microphoneActive = false;

    micButton.textContent =
        "Dileğin kabul olsun.";

    soundLevel.classList.remove(
        "active"
    );


    // Mumları çok küçük gecikmelerle söndür.
    candles.forEach((candle, index) => {

        setTimeout(() => {

            candle.classList.add(
                "extinguished"
            );

        }, index * 90);

    });


    // Mikrofonu kapat
    stopMicrophone();


    // Üfleme sonrası küçük konfeti
    setTimeout(() => {

        createConfettiBurst();

    }, 500);


    // Final mesajı biraz sonra gelsin
    setTimeout(() => {

        finalMessage.classList.add(
            "active"
        );

    }, 1300);

}


/* =========================================================
   MİKROFONU KAPAT
========================================================= */

function stopMicrophone() {

    microphoneActive = false;

    if (microphoneStream) {

        microphoneStream
            .getTracks()
            .forEach(track => {
                track.stop();
            });

        microphoneStream = null;

    }

    if (audioContext) {

        audioContext
            .close()
            .catch(() => {});

        audioContext = null;

    }

    analyser = null;
    microphone = null;

}


/* =========================================================
   TELEFON / SAYFA GÜVENLİĞİ
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            microphoneActive
        ) {

            stopMicrophone();

        }

    }
);


/* =========================================================
   EKSTRA KONFETİ EFEKTİ
========================================================= */

function smallConfettiBurst() {

    const amount = 25;

    for (let i = 0; i < amount; i++) {

        const piece =
            document.createElement("div");

        piece.className = "confetti";

        piece.style.left =
            `${50 + (Math.random() - 0.5) * 25}%`;

        piece.style.background =
            Math.random() > 0.5
                ? "#ffffff"
                : "#d8b875";

        piece.style.setProperty(
            "--drift",
            `${(Math.random() - 0.5) * 180}px`
        );

        piece.style.setProperty(
            "--rotation",
            `${360 + Math.random() * 720}deg`
        );

        piece.style.animationDuration =
            `${2 + Math.random() * 1.5}s`;

        confettiContainer.appendChild(piece);

        setTimeout(() => {
            piece.remove();
        }, 4000);

    }

}


/* =========================================================
   İLK YÜKLENME
========================================================= */

window.addEventListener(
    "load",
    () => {

        // Açılışın biraz daha doğal görünmesi
        openingScreen.style.opacity = "1";

    }
);
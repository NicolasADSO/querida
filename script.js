// Selección de Elementos
const prevBtn = document.querySelector("#prev-btn");
const nextBtn = document.querySelector("#next-btn");
const book = document.querySelector("#book");

// Selección dinámica de todas las hojas (excluyendo la contraportada vacía si tiene clase específica, pero aquí usamos .paper genérico y filtramos o asumimos estructura)
// Nota: En el HTML actual, la última es .empty-page. La lógica cuenta 'numOfPapers' como las que se mueven.
// La última .empty-page NO DEBE ser seleccionada como hoja interactiva normal si no queremos que gire (o sí?).
// En el código original NO estaba en el array 'papers'.
const papers = Array.from(document.querySelectorAll(".paper:not(.empty-page)"));

// Configuración
const numOfPapers = papers.length;

// --- ESTADO ---
// currentPaperIndex: 1 = Portada cerrada (P1 encima). 2 = P1 girada. 3 = P2 girada. 4 = P3 girada (Fin).
let currentPaperIndex = 1;

// mobileViewState: Solo para móvil.
// 0: Viendo lado derecho (Front).
// 1: Viendo lado izquierdo (Back).
// Cuando el libro está CERRADO (currentPaperIndex=1), solo existe estado 'Right' (Portada).
// Cuando currentPaperIndex > 1, existe Left (Back de hoja anterior) y Right (Front de hoja actual).
let mobileViewSide = 'right'; // 'left' | 'right'

// Ajuste inicial de Z-Indexes se maneja en updateView()


function isMobile() {
    return window.innerWidth <= 768;
}

// --- VISUALIZACIÓN ---
function updateView() {
    // 1. Gestionar Flipped States y Z-Index
    // Reset básico para asegurar consistencia
    papers.forEach((p, i) => {
        const pNum = i + 1;
        // Si el índice del papel es menor que el índice actual, debe estar girado.
        // Ejemplo: currentPaperIndex = 2. Significa que hemos pasado la hoja 1. P1 debe estar flipped.
        if (pNum < currentPaperIndex) {
            p.classList.add("flipped");
            // Z-Index para hojas giradas (Pila Izquierda)
            // La última girada debe estar encima.
            // P1 girada (idx 1). P2 girada (idx 2).
            // P2 debe tapar a P1. => zIndex = pNum.
            p.style.zIndex = pNum;
        } else {
            p.classList.remove("flipped");
            // Z-Index para hojas NO giradas (Pila Derecha)
            // La primera no girada debe estar encima.
            // currentPaperIndex=2. P1 flipped. P2 visible. P3 detrás.
            // P2 (idx 2) debe tener más Z que P3 (idx 3).
            // Formula: (Total + 1) - pNum
            p.style.zIndex = (numOfPapers + 1) - pNum;
        }
    });

    // 2. Gestionar Posición del Libro (Transform)
    if (isMobile()) {
        // Lógica Móvil Lineal
        if (currentPaperIndex === 1) {
            // Portada: Siempre centrada (o shift 0)
            book.style.transform = "translateX(0%)";
        } else {
            if (mobileViewSide === 'left') {
                // Viendo Izquierda (Back de hoja anterior)
                // Shift libro a la derecha para centrar la hoja izquierda
                book.style.transform = "translateX(100%)";
            } else {
                // Viendo Derecha (Front de hoja actual)
                book.style.transform = "translateX(0%)";
            }
        }
    } else {
        // Lógica Escritorio
        if (currentPaperIndex > 1) {
            // Libro abierto centrado
            book.style.transform = "translateX(50%)";
            // Caso especial final: Si todas están giradas (fin), a veces se prefiere cerrar a la derecha.
            if (currentPaperIndex > numOfPapers) {
                book.style.transform = "translateX(100%)";
            }
        } else {
            // Portada centrada
            book.style.transform = "translateX(0%)";
        }
    }
}

// --- NAVEGACIÓN ---

function goNext() {
    if (isMobile()) {
        if (currentPaperIndex === 1) {
            // De Portada -> Abrir libro (Ver Izquierda: Enero)
            currentPaperIndex++;
            mobileViewSide = 'left';
        } else if (currentPaperIndex <= numOfPapers) {
            if (mobileViewSide === 'left') {
                // De Izquierda -> Derecha (Misma hoja visible)
                mobileViewSide = 'right';
            } else {
                // De Derecha -> Girar página (Ver siguiente Izquierda)
                currentPaperIndex++;
                mobileViewSide = 'left';
            }
        } else {
            // Fin del libro - Nada más
            // Opcional: Cerrar?
        }
    } else {
        // Desktop: Avanzar página completa
        if (currentPaperIndex <= numOfPapers) {
            currentPaperIndex++;
        }
    }
    updateView();
}

function goPrev() {
    if (isMobile()) {
        if (currentPaperIndex === 1) {
            // Nada antes de la portada
        } else if (currentPaperIndex === 2 && mobileViewSide === 'left') { // Back P1
            // Volver a Portada
            currentPaperIndex--;
            mobileViewSide = 'right';
        } else {
            if (mobileViewSide === 'right') {
                // De Derecha -> Izquierda (Misma apertura)
                mobileViewSide = 'left';
            } else {
                // De Izquierda -> Des-girar página anterior (Ver Derecha anterior)
                currentPaperIndex--;
                mobileViewSide = 'right';
            }
        }
    } else {
        // Desktop
        if (currentPaperIndex > 1) {
            currentPaperIndex--;
        }
    }
    updateView();
}

// --- EVENTOS ---

// Botones
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);

// Clic en Hojas (Desktop & Mobile Tap)
papers.forEach((paper, i) => {
    paper.addEventListener('click', (e) => {
        e.stopPropagation();
        // Unificar interacción: Click siempre avanza en la narrativa visual
        // O lógica inteligente:
        if (isMobile()) {
            goNext();
        } else {
            // Desktop: Lógica Izquierda/Derecha basada en si está flipped
            const pNum = i + 1;
            // Si clicamos hoja visible derecha (No flipped) -> Next
            if (!paper.classList.contains('flipped')) {
                // Validar que sea la top
                if (currentPaperIndex === pNum) goNext();
            }
            // Si clicamos hoja girada izquierda -> Prev
            else {
                // Validar que sea la top de la pila izquierda
                if (currentPaperIndex === pNum + 1) goPrev();
            }
        }
    });
});

// Swipe
let touchStartX = 0;
let touchEndX = 0;
const SWIPE_THRESHOLD = 50;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
        goNext();
    }
    if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
        goPrev();
    }
});

// Resize
window.addEventListener('resize', updateView);

// Reset
const resetBtn = document.querySelector("#reset-btn");
if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        currentPaperIndex = 1;
        mobileViewSide = 'right';
        updateView();
    });
}

// Init
updateView();

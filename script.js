document.addEventListener('DOMContentLoaded', function() {
    const element = document.getElementById('movableObject');
    const container = document.querySelector('.anim-item-1');
    const saveButton = document.querySelector('.anim-button');
    const playButton = document.getElementById('play');
    
    // Dodaj przyciski do resetowania i usuwania keyframes
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Zresetuj klatki';
    resetButton.id = 'reset-keyframes';
    playButton.parentNode.insertBefore(resetButton, playButton.nextSibling);
    
    // Dodaj kontener dla logów
    const logContainer = document.querySelector('.anim-item-2 > span');
    
    // Zmienne do śledzenia tymczasowej pozycji
    let tempX = 0;
    let tempY = 0;
    
    // Tablica do przechowywania wszystkich zapisanych pozycji
    let keyframes = [];
    
    // Zmienne do przeciągania
    let isDragging = false;
    let offsetX, offsetY;
    
    // Element do wizualizacji keyframes
    const keyframesContainer = document.querySelector('.keyframes-container');
    
    // Upewnij się, że keyframesContainer ma właściwe style do przewijania
    keyframesContainer.style.overflowX = 'auto';
    keyframesContainer.style.position = 'relative';
    
    // Dodaj wskaźnik timeline'a - linia pokazująca aktualny postęp animacji
    const timelineIndicator = document.querySelector('.timeline-indicator');
    timelineIndicator.style.position = 'absolute';
    timelineIndicator.style.top = '0';
    timelineIndicator.style.height = '100%';
    timelineIndicator.style.width = '2px';
    timelineIndicator.style.backgroundColor = 'red';
    timelineIndicator.style.pointerEvents = 'none';
    timelineIndicator.style.zIndex = '1000';
    timelineIndicator.style.opacity = '0';
    
    // Zmienne do śledzenia animacji
    let animationInProgress = false;
    let animationStartTime = 0;
    let currentKeyframeIndex = 0;
    let animationFrameId = null;
    
    // Funkcja do aktualizacji tymczasowej pozycji
    function updateTempPosition(x, y) {
        tempX = x;
        tempY = y;
        
        // Zastosuj pozycję do elementu
        element.style.position = 'absolute';
        element.style.left = x + 'px';
        element.style.top = y + 'px';
    }
    
    function createKeyframeVisual(index, x, y) {
        const keyframeMarker = document.createElement('div');
        keyframeMarker.className = 'keyframe-marker';
        keyframeMarker.dataset.index = index;
        keyframeMarker.style.width = '10px';
        keyframeMarker.style.boxSizing = 'border-box';
        keyframeMarker.style.padding = '18px';
        keyframeMarker.style.height = '100%';
        keyframeMarker.style.backgroundColor = '#333';
        keyframeMarker.style.color = 'white';
        keyframeMarker.style.display = 'flex';
        keyframeMarker.style.alignItems = 'center';
        keyframeMarker.style.justifyContent = 'center';
        keyframeMarker.style.cursor = 'pointer';
        keyframeMarker.style.marginRight = '80px'; // Add spacing between markers
        keyframeMarker.textContent = index + 1;
        
        // Dodaj tooltip z informacją o pozycji
        keyframeMarker.title = `Keyframe ${index + 1}: (${x}, ${y})`;
        
        // Dodaj możliwość usunięcia keyframe po kliknięciu
        keyframeMarker.addEventListener('click', function() {
            if (confirm(`Usunąć keyframe ${index + 1}?`)) {
                keyframes.splice(index, 1);
                updateKeyframesVisual();
                logContainer.innerHTML = `Usunięto keyframe ${index + 1}`;
            }
        });
        
        return keyframeMarker;
    }
    
    // Funkcja do aktualizacji wizualizacji keyframes
    function updateKeyframesVisual() {
        // Wyczyść kontener
        keyframesContainer.innerHTML = '';
        
        // Stwórz wewnętrzny kontener dla keyframes, który będzie się przewijał
        const innerContainer = document.createElement('div');
        innerContainer.className = 'keyframes-inner-container';
        innerContainer.style.display = 'flex';
        innerContainer.style.minWidth = '100%';
        keyframesContainer.appendChild(innerContainer);
        
        // Dodaj markery dla każdego keyframe
        keyframes.forEach((keyframe, index) => {
            const marker = createKeyframeVisual(index, keyframe.x, keyframe.y);
            innerContainer.appendChild(marker);
        });
        
        // Dodaj ponownie wskaźnik timeline'a
        keyframesContainer.appendChild(timelineIndicator);
    }
    
    // Funkcja do zapisywania pozycji jako keyframe
    function savePosition() {
        // Zapisz aktualną pozycję
        const position = {
            x: tempX,
            y: tempY
        };
        
        // Dodaj pozycję do tablicy keyframes
        keyframes.push(position);
        
        // Aktualizuj wizualizację keyframes
        updateKeyframesVisual();
        
        // Wyświetl log na stronie zamiast w konsoli
        logContainer.innerHTML = `Zapisano pozycję: x=${position.x}, y=${position.y}`;
        
        // Zachowaj również log w konsoli do celów debugowania
        console.log('Zapisano pozycję:', position);
    }
    
    // Funkcja do resetowania keyframes
    function resetKeyframes() {
         keyframesContainer.style.width = ''
        if (confirm('Czy na pewno chcesz usunąć wszystkie keyframes?')) {
            keyframes = [];
            updateKeyframesVisual();
            logContainer.innerHTML = 'Wszystkie keyframes zostały usunięte';
        }
    }
    
    // Funkcja do obliczania pozycji wskaźnika timeline dla danego keyframe
    function getKeyframePosition(index) {
        const markers = document.querySelectorAll('.keyframe-marker');
        if (markers.length > index) {
            const marker = markers[index];
            const rect = marker.getBoundingClientRect();
            const containerRect = keyframesContainer.getBoundingClientRect();
            return rect.left - containerRect.left + keyframesContainer.scrollLeft + (rect.width / 2);
        }
        return 0;
    }
    
    // Funkcja do aktualizacji pozycji wskaźnika timeline z auto-przewijaniem
    function updateTimelineIndicator(currentIndex, progress) {
        if (currentIndex >= keyframes.length - 1) return;
        
        const startPosition = getKeyframePosition(currentIndex);
        const endPosition = getKeyframePosition(currentIndex + 1);
        const distance = endPosition - startPosition;
        
        // Oblicz aktualną pozycję
        const position = startPosition + (distance * progress);
        
        // Ustaw pozycję wskaźnika
        timelineIndicator.style.left = position + 'px';
        
        // Auto-przewijanie
        const containerWidth = keyframesContainer.clientWidth;
        const scrollLeft = keyframesContainer.scrollLeft;
        
        // Sprawdź, czy wskaźnik jest poza widocznym obszarem
        if (position < scrollLeft || position > scrollLeft + containerWidth) {
            keyframesContainer.scrollLeft = position - (containerWidth / 2);
        }
        
        // Podświetl aktualny marker
        highlightCurrentMarker(currentIndex, progress);
    }
    
    // Funkcja do podświetlania aktualnego markera
    function highlightCurrentMarker(currentIndex, progress) {
        const markers = document.querySelectorAll('.keyframe-marker');
        
        // Usuń wcześniejsze podświetlenia
        markers.forEach(marker => {
            marker.style.border = 'none';
            marker.style.backgroundColor = '#333';
        });
        
        // Podświetl aktualny marker
        if (markers[currentIndex]) {
            markers[currentIndex].style.border = '2px solid red';
            markers[currentIndex].style.backgroundColor = '#555';
        }
        
        // Jeśli jesteśmy blisko następnego markera, podświetl również jego
        if (progress > 0.9 && markers[currentIndex + 1]) {
            markers[currentIndex + 1].style.border = '2px solid orange';
        }
    }
    
    // Funkcja do odtwarzania animacji
    function playAnimation() {
        // Sprawdź, czy mamy co najmniej dwa keyframes do animacji
        if (keyframes.length < 2) {
            alert('Potrzebne są co najmniej dwa keyframes do animacji.');
            return;
        }
        
        // Wyłącz przyciski podczas animacji
        saveButton.disabled = true;
        playButton.disabled = true;
        resetButton.disabled = true;
        
        // Zatrzymaj poprzednią animację, jeśli istnieje
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        // Reset zmiennych animacji
        animationInProgress = true;
        currentKeyframeIndex = 0;
        animationStartTime = performance.now();
        
        // Ustaw element na początkową pozycję
        element.style.transition = 'none';
        element.style.left = keyframes[0].x + 'px';
        element.style.top = keyframes[0].y + 'px';
        
        // Wymuszenie reflow
        void element.offsetWidth;
        
        // Pokaż wskaźnik timeline
        timelineIndicator.style.opacity = '1';
        
        // Ustaw początkową pozycję wskaźnika
        updateTimelineIndicator(0, 0);
        
        // Rozpocznij animację
        animateFrame();
        
        logContainer.innerHTML = 'Rozpoczęto animację';
    }
    
    // Funkcja animująca jeden frame
    function animateFrame() {
        if (!animationInProgress || currentKeyframeIndex >= keyframes.length - 1) {
            // Zakończ animację
            finishAnimation();
            return;
        }
        
        const animationDuration = 300; // czas trwania animacji między keyframes (ms)
        const currentTime = performance.now();
        const elapsedTime = currentTime - animationStartTime;
        
        // Oblicz postęp dla bieżącego keyframe (0-1)
        const progress = Math.min(elapsedTime / animationDuration, 1);
        
        // Aktualizuj wskaźnik timeline
        updateTimelineIndicator(currentKeyframeIndex, progress);
        
        // Interpoluj pozycję między keyframes
        const current = keyframes[currentKeyframeIndex];
        const next = keyframes[currentKeyframeIndex + 1];
        
        const x = current.x + (next.x - current.x) * progress;
        const y = current.y + (next.y - current.y) * progress;
        
        // Aktualizuj pozycję elementu
        element.style.transition = 'none'; // Używamy własnej interpolacji zamiast CSS transitions
        element.style.left = x + 'px';
        element.style.top = y + 'px';
        
        // Sprawdź, czy czas tego keyframe upłynął
        if (progress >= 1) {
            // Przejdź do następnego keyframe
            currentKeyframeIndex++;
            animationStartTime = currentTime;
            
            // Zaktualizuj log
            logContainer.innerHTML = `Animacja: keyframe ${currentKeyframeIndex + 1} z ${keyframes.length}`;
            
            // Jeśli to ostatni keyframe, zakończ animację
            if (currentKeyframeIndex >= keyframes.length - 1) {
                finishAnimation();
                keyframesContainer.scrollLeft = 0;
                return;
                
            }
        }
        
        // Kontynuuj animację w następnym frame
        animationFrameId = requestAnimationFrame(animateFrame);
    }
    
    // Funkcja kończąca animację
    function finishAnimation() {
        // Ustaw element na końcową pozycję
        if (keyframes.length > 0) {
            const lastKeyframe = keyframes[keyframes.length - 1];
            element.style.left = lastKeyframe.x + 'px';
            element.style.top = lastKeyframe.y + 'px';
        }
        
        // Ukryj wskaźnik timeline
        timelineIndicator.style.opacity = '0';
        
        // Usuń podświetlenia markerów
        const markers = document.querySelectorAll('.keyframe-marker');
        markers.forEach(marker => {
            marker.style.border = 'none';
            marker.style.backgroundColor = '#333';
        });
        
        // Włącz przyciski
        saveButton.disabled = false;
        playButton.disabled = false;
        resetButton.disabled = false;
        
        // Zaktualizuj stan
        animationInProgress = false;
        animationFrameId = null;
        
        // Zaktualizuj log
        logContainer.innerHTML = 'Animacja zakończona';
    }
    
    // Dodaj obsługę kliknięcia przycisków
    saveButton.addEventListener('click', savePosition);
    playButton.addEventListener('click', playAnimation);
    resetButton.addEventListener('click', resetKeyframes);
    
    element.addEventListener('mousedown', function(e) {
        isDragging = true;
        
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        offsetX = e.clientX - elementRect.left;
        offsetY = e.clientY - elementRect.top;
        
        // Wyłącz transition podczas przeciągania
        element.style.transition = 'none';
        element.classList.add('dragging');
        logContainer.innerHTML = 'Rozpoczęto przeciąganie';
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        
        // Oblicz nową pozycję względem kontenera
        let x = e.clientX - containerRect.left - offsetX;
        let y = e.clientY - containerRect.top - offsetY;
        
        // Zastosuj ograniczenia
        if (x < 0) x = 0;
        if (y < 0) y = 0;
        if (x + elementRect.width > containerRect.width) {
            x = containerRect.width - elementRect.width;
        }
        if (y + elementRect.height > containerRect.height) {
            y = containerRect.height - elementRect.height;
        }
        
        // Aktualizuj tymczasową pozycję
        updateTempPosition(x, y);
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');
            logContainer.innerHTML = `Zakończono przeciąganie: x=${tempX}, y=${tempY}`;
        }
    });
    
    document.addEventListener('mouseleave', function() {
        if (isDragging) {
            isDragging = false;
            element.classList.remove('dragging');
            logContainer.innerHTML = `Zakończono przeciąganie: x=${tempX}, y=${tempY}`;
        }
    });
    
    // Inicjalizacja początkowej pozycji
    const computedStyle = window.getComputedStyle(element);
    const initialX = parseInt(computedStyle.left) || 0;
    const initialY = parseInt(computedStyle.top) || 0;
    updateTempPosition(initialX, initialY);
    
    // Początkowy log
    logContainer.innerText = 'Gotowy do rozpoczęcia. Przeciągnij element i zapisz pozycje.';

}); 



const element = document.getElementById('movableObject'); // poprawiona nazwa ID

element.addEventListener('mousemove', (e) => {
    const { left, top, width, height } = element.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100 + "%";
    const y = ((e.clientY - top) / height) * 100 + "%";

    element.style.setProperty('--x', x);
    element.style.setProperty('--y', y);
});
//styles
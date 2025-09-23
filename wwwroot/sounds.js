// Sound management for Pokémon game
class PokemonSoundManager {
    constructor(masterVolume = 0.3) { // Lowered master volume by default
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = new Map();
        this.isMuted = false;
        
        // Master gain node to control overall volume
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = masterVolume;
        this.masterGain.connect(this.audioContext.destination);
        this.volume = masterVolume;
    }

    // Load Pokémon cry from PokéAPI
    async loadPokemonCry(pokemonId) {
        try {
            if (this.sounds.has(pokemonId)) {
                return this.sounds.get(pokemonId);
            }

            // Fetch Pokémon data to get cry URL
            const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch Pokémon data for ID ${pokemonId}`);
            }
            const pokemonData = await response.json();
            
            // Get the latest cry URL
            const cryUrl = pokemonData.cries?.latest || pokemonData.cries?.legacy;
            if (!cryUrl) {
                throw new Error(`No cry sound available for Pokémon ID ${pokemonId}`);
            }

            // Fetch and decode audio
            const audioResponse = await fetch(cryUrl);
            if (!audioResponse.ok) {
                throw new Error(`Failed to fetch cry sound for Pokémon ID ${pokemonId}`);
            }
            const arrayBuffer = await audioResponse.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.sounds.set(pokemonId, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Error loading Pokémon cry for ID ${pokemonId}:`, error);
            return null;
        }
    }

    // Play Pokémon cry
    async playPokemonCry(pokemonId) {
        if (this.isMuted) return;
    
        const audioBuffer = await this.loadPokemonCry(pokemonId);
        if (!audioBuffer) return;
    
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
    
        // Create a new gain node specifically for the Pokémon cry
        const cryGain = this.audioContext.createGain();
        cryGain.gain.value = 0.1; // You can adjust this value (e.g., from 0.1 to 1.0) to your preference.
        
        // Connect the cry to its new gain node, and then to the master gain
        source.connect(cryGain);
        cryGain.connect(this.masterGain);
        
        // Add slight randomization to pitch
        source.playbackRate.value = 1 + (Math.random() * 0.1 - 0.05);
        source.start(0);
    }

    // Play UI sound effects
    playUISound(type) {
        if (this.isMuted) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        
        // Improved UI sounds with more pleasant tones and better envelopes
        switch (type) {
            case 'pokedex_open':
                source.buffer = this.createGentleSweep(300, 600, 0.3, 'sine');
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                break;
            case 'pokedex_close':
                source.buffer = this.createGentleSweep(600, 300, 0.3, 'sine');
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                break;
            case 'hover':
                source.buffer = this.createTone(800, 0.08, 'sine', 0.1);
                gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                break;
            case 'click':
                source.buffer = this.createClickSound(600, 0.1);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                break;
            case 'catch_success':
                source.buffer = this.createSuccessFanfare();
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                break;
            case 'notification':
                source.buffer = this.createTone(784, 0.15, 'sine', 0.2); // G5 note
                gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime);
                break;
            default:
                return;
        }

        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        source.start(0);
    }

    // Create a gentle frequency sweep (up or down)
    createGentleSweep(startFreq, endFreq, duration, waveType = 'sine') {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const progress = i / buffer.length;
            const currentFreq = startFreq + (endFreq - startFreq) * progress;
            
            switch (waveType) {
                case 'sine':
                    data[i] = Math.sin(2 * Math.PI * currentFreq * t);
                    break;
                case 'triangle':
                    data[i] = 2 * Math.abs(2 * (t * currentFreq - Math.floor(t * currentFreq + 0.5))) - 1;
                    break;
            }
            
            // Gentle envelope with quick attack and slow release
            const envelope = Math.min(1, Math.sin(Math.PI * progress) * 1.5);
            data[i] *= envelope * 0.3;
        }

        return buffer;
    }

    // Create a pleasant click sound with a short attack
    createClickSound(frequency, duration) {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            data[i] = Math.sin(2 * Math.PI * frequency * t);
            
            // Very quick attack, immediate decay
            const envelope = Math.exp(-t * 20);
            data[i] *= envelope * 0.4;
        }

        return buffer;
    }

    // Create a simple tone with customizable fade
    createTone(frequency, duration, type, fadeDuration = 0.05) {
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            switch (type) {
                case 'sine':
                    data[i] = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    data[i] = Math.sin(2 * Math.PI * frequency * t) > 0 ? 0.5 : -0.5;
                    break;
                case 'triangle':
                    data[i] = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
                    break;
            }
            
            // Improved envelope with customizable fade
            const fadeSamples = fadeDuration * sampleRate;
            let envelope = 1;
            
            if (i < fadeSamples) {
                envelope = i / fadeSamples; // Fade in
            } else if (i > buffer.length - fadeSamples) {
                envelope = (buffer.length - i) / fadeSamples; // Fade out
            }
            
            data[i] *= envelope * 0.3;
        }

        return buffer;
    }

    // Create a simple success fanfare (two ascending tones)
    createSuccessFanfare() {
        const duration = 0.6;
        const sampleRate = this.audioContext.sampleRate;
        const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < buffer.length; i++) {
            const t = i / sampleRate;
            const progress = i / buffer.length;
            
            // Two tones: first at 523Hz (C5), second at 784Hz (G5)
            const toneSplit = 0.4;
            let frequency = progress < toneSplit ? 523.25 : 784.00;
            
            // Adjust time for the second tone
            const toneTime = progress < toneSplit ? t : t - toneSplit * duration;
            data[i] = Math.sin(2 * Math.PI * frequency * toneTime);
            
            // Envelope with peaks at tone transitions
            let envelope;
            if (progress < toneSplit) {
                envelope = Math.sin(Math.PI * progress / toneSplit);
            } else {
                envelope = Math.sin(Math.PI * (progress - toneSplit) / (1 - toneSplit));
            }
            
            data[i] *= envelope * 0.4;
        }

        return buffer;
    }

    // Toggle mute state
    toggleMute() {
        this.isMuted = !this.isMuted;
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioContext.currentTime);
        return this.isMuted;
    }
}

// Initialize sound manager
const soundManager = new PokemonSoundManager();

// Modify existing event listeners to include sounds
document.addEventListener('DOMContentLoaded', function() {
    // Add sound to existing Pokémon sprite clicks
    gameArea.addEventListener('click', async function(event) {
        if (event.target.classList.contains('pokemon-sprite')) {
            soundManager.playUISound('click');
            const pokemonId = parseInt(event.target.dataset.id);
            if (pokemonId) {
                await soundManager.playPokemonCry(pokemonId);
            }
        }
    });

    // Add sound to Pokédex button
    pokedexBtn.addEventListener('click', () => {
        soundManager.playUISound('pokedex_open');
    });

    // Add sound to close button
    closeModal.addEventListener('click', () => {
        soundManager.playUISound('pokedex_close');
    });

    // Add hover sounds to Pokémon cards (with debounce to prevent spam)
    let hoverTimeout;
    pokedexList.addEventListener('mouseover', function(event) {
        if (event.target.closest('.pokemon-card')) {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
                soundManager.playUISound('hover');
            }, 50);
        }
    });

    // Add sound to filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playUISound('click');
        });
    });

    // Add sound to view toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            soundManager.playUISound('click');
        });
    });

    // Add sound to sort dropdown
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            soundManager.playUISound('click');
        });
    }

    // Add notification sound to search input (on first interaction)
    if (searchInput) {
        let firstInteraction = true;
        searchInput.addEventListener('input', () => {
            if (firstInteraction) {
                soundManager.playUISound('notification');
                firstInteraction = false;
            } else {
                soundManager.playUISound('click');
            }
        });
    }
    
    // Override the catchPokemon function to add sound effects
    const originalCatchPokemon = window.catchPokemon;
    if (typeof originalCatchPokemon === 'function') {
        window.catchPokemon = async function(pokemon, sprite) {
            // Play success sound and Pokémon cry
            soundManager.playUISound('catch_success');
            if (pokemon && pokemon.collectorNumber) {
                await soundManager.playPokemonCry(pokemon.collectorNumber);
            }
            
            await originalCatchPokemon(pokemon, sprite);
        };
    } else {
        console.warn("`window.catchPokemon` was not found. Catch sound effects will not play.");
    }
});

// Export sound manager for global access
window.soundManager = soundManager;
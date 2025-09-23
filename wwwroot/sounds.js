// Sound management for Pokémon game
class PokemonSoundManager {
    constructor(masterVolume = 0.1) { // Lowered master volume by default
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
        cryGain.gain.value = 0.5; // You can adjust this value (e.g., from 0.1 to 1.0) to your preference.
        
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
        
        // Create simple waveforms for different UI interactions with much lower volumes
        switch (type) {
            case 'pokedex_open':
                source.buffer = this.createTone(440, 0.2, 'sine');
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Was 0.3
                break;
            case 'pokedex_close':
                source.buffer = this.createTone(392, 0.2, 'sine');
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime); // Was 0.3
                break;
            case 'hover':
                source.buffer = this.createTone(880, 0.1, 'triangle');
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);  // Was 0.2
                break;
            case 'click':
                source.buffer = this.createTone(660, 0.1, 'square');
                gainNode.gain.setValueAtTime(0.12, this.audioContext.currentTime); // Was 0.25
                break;
            case 'catch_success':
                source.buffer = this.createTone(523.25, 0.3, 'sine');
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);  // Was 0.4
                break;
            default:
                return;
        }

        source.connect(gainNode);
        // Connect the specific UI sound to the master gain
        gainNode.connect(this.masterGain);
        source.start(0);
    }

    // Create a simple tone for UI interactions
    createTone(frequency, duration, type) {
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
                    data[i] = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
                    break;
                case 'triangle':
                    data[i] = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
                    break;
            }
            // Apply envelope (fade in/out)
            const envelope = Math.sin(Math.PI * i / buffer.length);
            data[i] *= envelope * 0.5;
        }

        return buffer;
    }

    // Toggle mute state
    toggleMute() {
        this.isMuted = !this.isMuted;
        // Mute by setting master volume to 0, and restore it when unmuting
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.audioContext.currentTime);
        return this.isMuted;
    }
}

// Initialize sound manager (with the new default low volume)
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

    // Add hover sounds to Pokémon cards
    pokedexList.addEventListener('mouseover', function(event) {
        if (event.target.closest('.pokemon-card')) {
            soundManager.playUISound('hover');
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

    // Add sound to search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            soundManager.playUISound('click');
        });
    }
    
    // Override the catchPokemon function to add sound effects.
    // NOTE: This requires the original `catchPokemon` function from `script.js` to be
    // globally accessible (e.g., by adding `window.catchPokemon = catchPokemon;`).
    const originalCatchPokemon = window.catchPokemon;
    if (typeof originalCatchPokemon === 'function') {
        window.catchPokemon = async function(pokemon, sprite) {
            // Play the Pokémon's cry and a success sound when the catch is initiated.
            soundManager.playUISound('catch_success');
            if (pokemon && pokemon.collectorNumber) {
                await soundManager.playPokemonCry(pokemon.collectorNumber);
            }
            
            // Call the original function to handle the rest of the catch logic.
            await originalCatchPokemon(pokemon, sprite);
        };
    } else {
        console.warn("`window.catchPokemon` was not found. Catch sound effects will not play. Ensure the `catchPokemon` function is globally accessible in `script.js`.");
    }
});

// Export sound manager for global access
window.soundManager = soundManager;
// Pokemon data - simplified list for the game
const pokemonList = [
    { name: 'Pikachu', type: 'Electric', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png' },
    { name: 'Charmander', type: 'Fire', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png' },
    { name: 'Squirtle', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png' },
    { name: 'Bulbasaur', type: 'Grass', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png' },
    { name: 'Jigglypuff', type: 'Fairy', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png' },
    { name: 'Psyduck', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/54.png' },
    { name: 'Meowth', type: 'Normal', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/52.png' },
    { name: 'Snorlax', type: 'Normal', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/143.png' },
    { name: 'Eevee', type: 'Normal', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/133.png' },
    { name: 'Magikarp', type: 'Water', image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/129.png' }
];

// Game state
let caughtPokemon = [];
let spawnInterval;
let currentFilter = 'all';

// DOM elements
const gameArea = document.getElementById('game-area');
const pokedexBtn = document.getElementById('pokedex-btn');
const pokedexModal = document.getElementById('pokedex-modal');
const pokedexList = document.getElementById('pokedex-list');
const closeModal = document.querySelector('.close');
const scoreCount = document.getElementById('score-count');
const catchNotification = document.getElementById('catch-notification');
const catchText = document.getElementById('catch-text');
const showAllBtn = document.getElementById('show-all');
const showFavoritesBtn = document.getElementById('show-favorites');

// Initialize game
document.addEventListener('DOMContentLoaded', function() {
    startPokemonSpawning();
    loadPokedex();
    setupEventListeners();
});

function setupEventListeners() {
    pokedexBtn.addEventListener('click', openPokedex);
    closeModal.addEventListener('click', closePokedex);
    showAllBtn.addEventListener('click', () => setFilter('all'));
    showFavoritesBtn.addEventListener('click', () => setFilter('favorites'));
    
    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === pokedexModal) {
            closePokedex();
        }
    });
}

function startPokemonSpawning() {
    spawnInterval = setInterval(() => {
        if (document.querySelectorAll('.pokemon-sprite').length < 5) {
            spawnRandomPokemon();
        }
    }, 2000);
}

function spawnRandomPokemon() {
    const pokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
    const sprite = document.createElement('div');
    
    sprite.className = 'pokemon-sprite';
    sprite.style.backgroundImage = `url(${pokemon.image})`;
    sprite.style.left = Math.random() * (window.innerWidth - 100) + 'px';
    sprite.style.top = Math.random() * (window.innerHeight - 200) + 100 + 'px';
    
    // Add click event to catch pokemon
    sprite.addEventListener('click', () => catchPokemon(pokemon, sprite));
    
    gameArea.appendChild(sprite);
    
    // Remove sprite after 8 seconds if not caught
    setTimeout(() => {
        if (sprite.parentNode) {
            sprite.remove();
        }
    }, 8000);
}

async function catchPokemon(pokemon, sprite) {
    sprite.classList.add('catching');
    
    try {
        const response = await fetch('/api/pokemon/catch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: pokemon.name,
                type: pokemon.type,
                imageUrl: pokemon.image
            })
        });
        
        if (response.ok) {
            const caughtPokemonData = await response.json();
            showCatchNotification(`Caught ${pokemon.name}!`);
            updateScore();
            
            setTimeout(() => {
                sprite.remove();
            }, 500);
        } else {
            console.error('Failed to catch Pokemon');
        }
    } catch (error) {
        console.error('Error catching Pokemon:', error);
    }
}

function showCatchNotification(message) {
    catchText.textContent = message;
    catchNotification.classList.add('show');
    
    setTimeout(() => {
        catchNotification.classList.remove('show');
    }, 2000);
}

async function updateScore() {
    try {
        const response = await fetch('/api/pokemon');
        if (response.ok) {
            const pokemon = await response.json();
            scoreCount.textContent = pokemon.length;
        }
    } catch (error) {
        console.error('Error updating score:', error);
    }
}

async function loadPokedex() {
    try {
        let url = '/api/pokemon';
        if (currentFilter === 'favorites') {
            url = '/api/pokemon/favorites';
        }
        
        const response = await fetch(url);
        if (response.ok) {
            caughtPokemon = await response.json();
            displayPokedex();
            updateScore();
        }
    } catch (error) {
        console.error('Error loading Pokedex:', error);
    }
}

function displayPokedex() {
    pokedexList.innerHTML = '';
    
    if (caughtPokemon.length === 0) {
        pokedexList.innerHTML = '<p style="text-align: center; color: #7f8c8d; grid-column: 1/-1;">No Pokemon caught yet! Go catch some!</p>';
        return;
    }
    
    caughtPokemon.forEach(pokemon => {
        const card = createPokemonCard(pokemon);
        pokedexList.appendChild(card);
    });
}

function createPokemonCard(pokemon) {
    const card = document.createElement('div');
    card.className = `pokemon-card ${pokemon.isFavorite ? 'favorite' : ''}`;
    card.innerHTML = `
        <div class="pokemon-header">
            <div class="pokemon-name" id="name-${pokemon.id}">${pokemon.name}</div>
            <button class="favorite-btn" onclick="toggleFavorite(${pokemon.id})">
                ${pokemon.isFavorite ? '⭐' : '☆'}
            </button>
        </div>
        <div class="pokemon-type">Type: ${pokemon.type}</div>
        <div class="pokemon-caught">Caught: ${new Date(pokemon.caughtAt).toLocaleDateString()}</div>
        <div class="pokemon-actions">
            <button class="action-btn edit-btn" onclick="editPokemonName(${pokemon.id})">Rename</button>
            <button class="action-btn delete-btn" onclick="deletePokemon(${pokemon.id})">Release</button>
        </div>
    `;
    return card;
}

async function toggleFavorite(pokemonId) {
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}/favorite`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            loadPokedex();
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

function editPokemonName(pokemonId) {
    const nameElement = document.getElementById(`name-${pokemonId}`);
    const currentName = nameElement.textContent;
    
    nameElement.innerHTML = `
        <input type="text" value="${currentName}" id="input-${pokemonId}" style="width: 100%;">
        <div style="margin-top: 5px;">
            <button class="action-btn save-btn" onclick="savePokemonName(${pokemonId})">Save</button>
            <button class="action-btn cancel-btn" onclick="cancelEdit(${pokemonId}, '${currentName}')">Cancel</button>
        </div>
    `;
    
    document.getElementById(`input-${pokemonId}`).focus();
}

async function savePokemonName(pokemonId) {
    const input = document.getElementById(`input-${pokemonId}`);
    const newName = input.value.trim();
    
    if (!newName) {
        alert('Name cannot be empty!');
        return;
    }
    
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}/name`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ newName: newName })
        });
        
        if (response.ok) {
            loadPokedex();
        } else {
            alert('Failed to update name');
        }
    } catch (error) {
        console.error('Error updating name:', error);
        alert('Error updating name');
    }
}

function cancelEdit(pokemonId, originalName) {
    const nameElement = document.getElementById(`name-${pokemonId}`);
    nameElement.textContent = originalName;
}

async function deletePokemon(pokemonId) {
    if (!confirm('Are you sure you want to release this Pokémon?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/pokemon/${pokemonId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadPokedex();
        }
    } catch (error) {
        console.error('Error deleting Pokemon:', error);
    }
}

function openPokedex() {
    loadPokedex();
    pokedexModal.style.display = 'block';
}

function closePokedex() {
    pokedexModal.style.display = 'none';
}

function setFilter(filter) {
    currentFilter = filter;
    
    // Update button states
    showAllBtn.classList.remove('active');
    showFavoritesBtn.classList.remove('active');
    
    if (filter === 'all') {
        showAllBtn.classList.add('active');
    } else {
        showFavoritesBtn.classList.add('active');
    }
    
    loadPokedex();
}
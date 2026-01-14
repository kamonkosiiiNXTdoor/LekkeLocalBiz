document.addEventListener("DOMContentLoaded", () => {

const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

// Toggle Mobile Menu
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('mobile-active');
    const icon = menuToggle.querySelector('.material-symbols-rounded');
    icon.textContent = navLinks.classList.contains('mobile-active') ? 'close' : 'menu';
});

// Close menu when a link is clicked
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
        document.querySelector('.menu-toggle .material-symbols-rounded').textContent = 'menu';
    });
});




const swiper = new Swiper('.container.swiper', {
    loop: true,
    spaceBetween: 30,

    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets:true,
    },

    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },

    breakpoints: {
        0: {
            slidesPerView: 1
        },
        768: {
            slidesPerView: 2
        },
        1024: {
            slidesPerView: 3
        }
    }
});

const detectBtn = document.getElementById("detectLocation");
const locationInput = document.getElementById("manualLocation");

/*detectBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    detectBtn.innerText = "Detecting...";

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude.toFixed(4);
            const lon = position.coords.longitude.toFixed(4);

            locationInput.value = `Lat: ${lat}, Lng: ${lon}`;
            detectBtn.innerHTML = `<span class="material-symbols-rounded">check_circle</span> Location Added`;
        },
        () => {
            alert("Unable to retrieve location");
            detectBtn.innerText = "Use My Location";
        }
    );
});*/
// =====================
// ELEMENTS
// =====================
const nearbyContainer = document.querySelector(".nearby-biz-container");

const modal = document.getElementById("biz-modal");
const modalName = document.getElementById("modal-name");
const modalCategory = document.getElementById("modal-category");
const modalAddress = document.getElementById("modal-address");
const modalWebsite = document.getElementById("modal-website");
const modalMaps = document.getElementById("modal-maps");
const modalCall = document.getElementById("modal-call");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");

// =====================
// STATE
// =====================
let allBusinesses = [];
let savedBiz = JSON.parse(localStorage.getItem("savedBusinesses")) || [];

// =====================
// SAVE LOGIC
// =====================
function isSaved(name, address) {
    return savedBiz.some(b => b.name === name && b.address === address);
}

function toggleSave(biz) {
    const index = savedBiz.findIndex(
        b => b.name === biz.name && b.address === biz.address
    );

    if (index > -1) {
        savedBiz.splice(index, 1);
    } else {
        savedBiz.push(biz);
    }

    localStorage.setItem("savedBusinesses", JSON.stringify(savedBiz));
}

// =====================
// FETCH BUSINESSES
// =====================
function fetchNearbyBiz(lat, lon) {
    const apiKey = "55edea2577fc469f892750696fc947e8";
    const radius = 1500;

    const url = `https://api.geoapify.com/v2/places?categories=commercial&filter=circle:${lon},${lat},${radius}&limit=30&apiKey=${apiKey}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            allBusinesses = data.features || [];
            renderBusinesses(allBusinesses);
        })
        .catch(err => {
            console.error(err);
            nearbyContainer.innerHTML = "<p>Failed to load businesses.</p>";
        });
}

// =====================
// RENDER BUSINESSES
// =====================
function renderBusinesses(businesses) {
    nearbyContainer.innerHTML = "";

    businesses.forEach(biz => {
        const name = biz.properties.name || "Unknown Business";
        const address = biz.properties.formatted || "";
        const website = biz.properties.website || "";
        const phone = biz.properties.phone || "";
        const lat = biz.geometry.coordinates[1];
        const lon = biz.geometry.coordinates[0];

        let category = "General";
        if (Array.isArray(biz.properties.categories)) {
            category = biz.properties.categories[0];
        }

        const card = document.createElement("div");
        card.className = "nearby-card";

        const saved = isSaved(name, address);

        card.innerHTML = `
            <div class="card-header">
                <h3>${name}</h3>
                <button class="save-btn ${saved ? "saved" : ""}">❤️</button>
            </div>
            <span class="category">${category}</span>
            <p>${address}</p>
        `;

        // OPEN MODAL ON CARD CLICK
        card.addEventListener("click", () => openModal(biz));

        // SAVE BUTTON
        const saveBtn = card.querySelector(".save-btn");
        saveBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            toggleSave({ name, address, category, website, phone, lat, lon });
            saveBtn.classList.toggle("saved");
        });

        nearbyContainer.appendChild(card);
    });
}

// =====================
// MODAL
// =====================
function openModal(biz) {
    modal.classList.remove("hidden");

    modalName.textContent = biz.properties.name || "Business";
    modalCategory.textContent = biz.properties.categories?.[0] || "General";
    modalAddress.textContent = biz.properties.formatted || "";

    modalWebsite.href = biz.properties.website || "#";
    modalWebsite.style.display = biz.properties.website ? "inline-block" : "none";

    modalCall.href = biz.properties.phone ? `tel:${biz.properties.phone}` : "#";
    modalCall.style.display = biz.properties.phone ? "inline-block" : "none";

    const lat = biz.geometry.coordinates[1];
    const lon = biz.geometry.coordinates[0];
    modalMaps.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}

// CLOSE MODAL
document.getElementById("close-modal").onclick = () => {
    modal.classList.add("hidden");
};

// =====================
// SEARCH + FILTER
// =====================
function applyFilters() {
    const search = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    const filtered = allBusinesses.filter(biz => {
        const name = biz.properties.name?.toLowerCase() || "";
        const cats = biz.properties.categories || [];

        const matchesSearch = name.includes(search);
        const matchesCategory =
            category === "all" || cats.some(c => c.includes(category));

        return matchesSearch && matchesCategory;
    });

    renderBusinesses(filtered);
}

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);

// =====================
// GEOLOCATION
// =====================
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        pos => fetchNearbyBiz(pos.coords.latitude, pos.coords.longitude),
        () => {
            nearbyContainer.innerHTML = "<p>Enable location to see nearby businesses.</p>";
        }
    );
}
const menuItems = document.querySelectorAll(".menu-item");
const sections = document.querySelectorAll(".content-section");

menuItems.forEach(item => {
    item.addEventListener("click", () => {

        // active button
        menuItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        // show section
        const target = item.dataset.section;
        sections.forEach(section => {
            section.classList.remove("active");
            if (section.id === target) {
                section.classList.add("active");
            }
        });

        // render saved when opened
        if (target === "saved") {
            renderSavedBusinesses();
        }
    });
});

/*===Animations====*/
// Initialize Swiper
const swiper2 = new Swiper('.swiper', {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
    breakpoints: {
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 }
    }
});

// Function to build the card HTML
function renderBusinessCard(biz) {
    const slideHTML = `
        <div class="swiper-slide card-item custom-biz-card" id="slide-${biz.id}">
            <button class="delete-btn" onclick="deleteBusiness(${biz.id})">
                <span class="material-symbols-rounded">delete</span>
            </button>
            <a href="#" class="card-link">
                <img src="${biz.image}" class="card-image" alt="${biz.name}">
                <p class="badge">${biz.name}</p>
                <h2 class="card-title">${biz.description}</h2>
                <button class="card-button material-symbols-rounded">
                    arrow_forward
                </button>
            </a>
        </div>
    `;
    swiper.appendSlide(slideHTML);
}

// The function that actually removes the business
function deleteBusiness(id) {
    if (confirm("Are you sure you want to remove this business?")) {
        // 1. Get current list from LocalStorage
        let savedBusinesses = JSON.parse(localStorage.getItem('myBusinesses')) || [];

        // 2. Filter out the business with the matching ID
        savedBusinesses = savedBusinesses.filter(biz => biz.id !== id);

        // 3. Save the updated list back to LocalStorage
        localStorage.setItem('myBusinesses', JSON.stringify(savedBusinesses));

        // 4. Refresh the page to update the Swiper slider
        // (This is the simplest way to ensure Swiper recalculates everything)
        window.location.reload();
    }
}


const searchBtn = document.getElementById('search');
const searchOverlay = document.getElementById('searchOverlay');
const closeSearch = document.getElementById('closeSearch');
const searchInput2 = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');

// 1. Open/Close Search
searchBtn.addEventListener('click', () => searchOverlay.style.display = 'block');
closeSearch.addEventListener('click', () => searchOverlay.style.display = 'none');

// 2. Search Logic
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    searchResults.innerHTML = ""; // Clear old results

    if (term.length < 2) return; // Don't search until 2 letters typed

    // Get all businesses from LocalStorage
    const savedBiz = JSON.parse(localStorage.getItem('myBusinesses')) || [];
    
    // Add your hard-coded businesses here too so they are searchable!
    const hardCodedBiz = [
        { name: "Pizza Hut", description: "Fresh pizzas made daily...", image: "images/pizza.png" },
        { name: "Amalisva", description: "Authentic township flavours...", image: "images/1.png" }
    ];

    const allBiz = [...hardCodedBiz, ...savedBiz];

    // Filter the list
    const matches = allBiz.filter(biz => biz.name.toLowerCase().includes(term));

    // Display Results
    matches.forEach(biz => {
        const resultItem = document.createElement('div');
        resultItem.className = 'card-item'; // Reuse your existing card styling
        resultItem.innerHTML = `
            <a href="#" class="card-link">
                <img src="${biz.image}" class="card-image">
                <p class="badge">${biz.name}</p>
                <h2 class="card-title">${biz.description}</h2>
            </a>
        `;
        searchResults.appendChild(resultItem);
    });

});

});

document.addEventListener("DOMContentLoaded", () => {

    /* =====================
       NAVIGATION
    ===================== */
    const menuToggle = document.getElementById("menuToggle");
    const navLinks = document.getElementById("navLinks");

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            navLinks.classList.toggle("mobile-active");
            const icon = menuToggle.querySelector(".material-symbols-rounded");
            icon.textContent = navLinks.classList.contains("mobile-active")
                ? "close"
                : "menu";
        });

        document.querySelectorAll(".nav-links a").forEach(link => {
            link.addEventListener("click", () => {
                navLinks.classList.remove("mobile-active");
                menuToggle.querySelector(".material-symbols-rounded").textContent = "menu";
            });
        });
    }

    /* =====================
       SWIPER 
    ===================== */
    const swiper = new Swiper(".swiper", {
        loop: true,
        spaceBetween: 20,
        pagination: {
            el: ".swiper-pagination",
            clickable: true,
            dynamicBullets: true
        },
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev"
        },
        breakpoints: {
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 }
        }
    });

    /* =====================
       STATE
    ===================== */
    const nearbyContainer = document.querySelector(".nearby-biz-container");
    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");

    let allBusinesses = [];
    let savedBiz = JSON.parse(localStorage.getItem("savedBusinesses")) || [];

    /* =====================
       SAVE HELPERS
    ===================== */
    const isSaved = (name, address) =>
        savedBiz.some(b => b.name === name && b.address === address);

    const toggleSave = biz => {
        const index = savedBiz.findIndex(
            b => b.name === biz.name && b.address === biz.address
        );

        index > -1 ? savedBiz.splice(index, 1) : savedBiz.push(biz);
        localStorage.setItem("savedBusinesses", JSON.stringify(savedBiz));
    };

    /* =====================
       FETCH BUSINESSES
    ===================== */
    function fetchNearbyBiz(lat, lon) {
        const apiKey = "55edea2577fc469f892750696fc947e8";
        const radius = 1500;

        const url = `https://api.geoapify.com/v2/places?categories=commercial&filter=circle:${lon},${lat},${radius}&limit=30&apiKey=${apiKey}`;

        nearbyContainer.innerHTML = "<p>Loading nearby businesses...</p>";

        fetch(url)
            .then(res => res.json())
            .then(data => {
                allBusinesses = data.features || [];
                renderBusinesses(allBusinesses);
            })
            .catch(() => {
                nearbyContainer.innerHTML = "<p>Failed to load businesses.</p>";
            });
    }

    /* =====================
       RENDER BUSINESS CARDS
    ===================== */
    function renderBusinesses(list) {
        nearbyContainer.innerHTML = "";

        list.forEach(biz => {
            const props = biz.properties;
            const name = props.name || "Unknown Business";
            const address = props.formatted || "";
            const category = props.categories?.[0] || "General";
            const lat = biz.geometry.coordinates[1];
            const lon = biz.geometry.coordinates[0];

            const card = document.createElement("div");
            card.className = "nearby-card";

            card.innerHTML = `
                <div class="card-header">
                    <h3>${name}</h3>
                    <button class="save-btn ${isSaved(name, address) ? "saved" : ""}">❤️</button>
                </div>
                <span class="category">${category}</span>
                <p>${address}</p>
            `;

            
            card.addEventListener("click", () => openModal(biz));

           
            card.querySelector(".save-btn").addEventListener("click", e => {
                e.stopPropagation();
                toggleSave({ name, address, category, lat, lon });
                e.target.classList.toggle("saved");
            });

            nearbyContainer.appendChild(card);
        });
    }

    /* =====================
       MODAL
    ===================== */
    const modal = document.getElementById("biz-modal");
    const modalName = document.getElementById("modal-name");
    const modalCategory = document.getElementById("modal-category");
    const modalAddress = document.getElementById("modal-address");
    const modalWebsite = document.getElementById("modal-website");
    const modalMaps = document.getElementById("modal-maps");
    const modalCall = document.getElementById("modal-call");

    function openModal(biz) {
        const props = biz.properties;
        modal.classList.remove("hidden");

        modalName.textContent = props.name || "Business";
        modalCategory.textContent = props.categories?.[0] || "General";
        modalAddress.textContent = props.formatted || "";

        modalWebsite.style.display = props.website ? "inline-block" : "none";
        modalWebsite.href = props.website || "#";

        modalCall.style.display = props.phone ? "inline-block" : "none";
        modalCall.href = props.phone ? `tel:${props.phone}` : "#";

        const [lon, lat] = biz.geometry.coordinates;
        modalMaps.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    }

    document.getElementById("close-modal")?.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    /* =====================
       SEARCH & FILTER
    ===================== */
    function applyFilters() {
        const search = searchInput.value.toLowerCase();
        const category = categoryFilter.value;

        const filtered = allBusinesses.filter(biz => {
            const name = biz.properties.name?.toLowerCase() || "";
            const categories = biz.properties.categories || [];
            return (
                name.includes(search) &&
                (category === "all" || categories.some(c => c.includes(category)))
            );
        });

        renderBusinesses(filtered);
    }

    searchInput?.addEventListener("input", applyFilters);
    categoryFilter?.addEventListener("change", applyFilters);

    /* =====================
       GEOLOCATION
    ===================== */
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            pos => fetchNearbyBiz(pos.coords.latitude, pos.coords.longitude),
            () => {
                nearbyContainer.innerHTML =
                    "<p>Please allow location access to see nearby businesses.</p>";
            }
        );
    }

});


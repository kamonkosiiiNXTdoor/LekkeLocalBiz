const businessForm = document.getElementById('businessForm');
const imageInput = document.getElementById('bizImage');
const imagePreview = document.getElementById('imagePreview');
let base64Image = ""; 

// Handle Image Preview & Conversion
imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            base64Image = event.target.result;
            imagePreview.innerHTML = `<img src="${base64Image}" alt="Preview" style="width:100px; height:100px; object-fit:cover; border-radius:8px; margin-top:10px;">`;
        };
        reader.readAsDataURL(file);
    }
});

// Handle Form Submission
businessForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const category = document.getElementById('bizCategory').value;
    
    // Create the data object
    const newBusiness = {
        id: Date.now(),
        name: document.getElementById('bizName').value,
        category: category,
        description: document.getElementById('bizDesc').value,
        location: document.getElementById('manualLocation').value,
        // If user didn't upload, use a default image based on category
        image: base64Image || `images/${category}.png` 
    };

    // Save to LocalStorage
    const savedBusinesses = JSON.parse(localStorage.getItem('myBusinesses')) || [];
    savedBusinesses.push(newBusiness);
    localStorage.setItem('myBusinesses', JSON.stringify(savedBusinesses));

    // Redirect to home
    window.location.href = 'index.html';
});

// Geolocation Logic
document.getElementById('detectLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            document.getElementById('manualLocation').value = 
                `Lat: ${position.coords.latitude.toFixed(2)}, Lon: ${position.coords.longitude.toFixed(2)}`;
        });
    }
});


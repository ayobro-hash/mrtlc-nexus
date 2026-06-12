// --- MRTLC NEXUS MODULE: WALLPAPER SAVE ENGINE ---

// Run this immediately when the script loads to check for a saved wallpaper
document.addEventListener("DOMContentLoaded", () => {
    const savedWallpaper = localStorage.getItem("nexus_wallpaper");
    if (savedWallpaper) {
        document.body.style.backgroundImage = `url(${savedWallpaper})`;
    }
});

function processWallpaperUpload(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64Image = e.target.result;
        
        // 1. Apply it to the live background instantly
        document.body.style.backgroundImage = `url(${base64Image})`;
        
        // 2. Save it to the browser's persistent storage matrix
        try {
            localStorage.setItem("nexus_wallpaper", base64Image);
            alert("💾 Wallpaper successfully cached to browser storage!");
        } catch(error) {
            // Mobile browsers usually give you 5MB of storage, plenty for optimized images
            alert("⚠️ Image size too large for local browser memory cache. Try a smaller file.");
        }
    };
    reader.readAsDataURL(file);
}

function clearSavedWallpaper() {
    localStorage.removeItem("nexus_wallpaper");
    // Revert back to the default Aero gradient lights
    document.body.style.backgroundImage = `
        radial-gradient(circle at 20% 20%, rgba(0, 240, 255, 0.12), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(189, 0, 255, 0.12), transparent 40%)
    `;
    alert("☢️ Custom wallpaper dropped. Reverted to default stream.");
      }

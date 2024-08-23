document.addEventListener("DOMContentLoaded", function () {
  const planningSection = document.getElementById("planning-anime");
  const watchedSection = document.getElementById("watched-anime");
  const favAnimeSection = document.getElementById("fav-anime");
  const addAnimeForm = document.getElementById("add-anime-form");
  const addAnimeInput = document.getElementById("anime-name");
  const loaderOverlay = document.querySelector(".loader-overlay");

  const API_BASE_URL = "https://anime-list-backend-ruul.onrender.com/"; // Your backend URL

  function showLoader() {
    loaderOverlay.style.display = "flex";
  }

  function hideLoader() {
    loaderOverlay.style.display = "none";
  }

  function handleError(error) {
    console.error(error);
    alert("An error occurred. Please try again later.");
  }

  async function loadAnimeData() {
    showLoader();
    try {
      const response = await fetch(`${API_BASE_URL}/anime`); 
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Mock loader delay
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Display planning list
      data.planningList.forEach((anime) => {
        displayAnime(anime, planningSection);
      });

      // Display watched list
      data.watchedList.forEach((anime) => {
        displayAnime(anime, watchedSection);
      });
    } catch (error) {
      handleError(error);
    } finally {
      hideLoader();
    }
  }

  async function searchAnime(title) {
    try {
      const response = await fetch(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=10`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.data.length > 0) {
        return data.data; // Return all results
      }
      throw new Error("No anime found");
    } catch (error) {
      handleError(error);
      return null;
    }
  }

  // This function is now simplified as it only handles the display
  // The actual adding of the anime is handled by the backend
  async function displayAnime(anime, section) {
    const animeCard = document.createElement("div");
    animeCard.classList.add("anime-card");
    animeCard.dataset.animeId = anime._id; // Fetching the id from the data
    animeCard.innerHTML = `
        <img src="${anime.imgSrc}" alt="${anime.title}">
        <span>${anime.title}</span>
      `;

    // ... (Rest of the displayAnime function) 

    section.querySelector(".anime-container").appendChild(animeCard);
  }

  // Function to display search results (you'll need to create a modal or dropdown)
  function displaySearchResults(animeData) {
    const dropdown = document.createElement("div");
    dropdown.classList.add("search-dropdown");
    animeData.forEach((anime) => {
      const option = document.createElement("div");
      option.classList.add("search-option");
      option.textContent = anime.title;
      option.addEventListener("click", async () => {
        // Handle the selection (e.g., add anime to list)
        const response = await fetch(`${API_BASE_URL}/anime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: anime.title,
            imgSrc: anime.images.jpg.image_url,
            status: "Planning",
          }),
        });
        if (response.ok) {
          const addedAnime = await response.json();
          displayAnime(addedAnime, planningSection); // Display the added anime
          addAnimeInput.value = "";
          // Close the dropdown
          dropdown.remove();
        } else {
          handleError(new Error("Failed to add anime"));
        }
      });
      dropdown.appendChild(option);
    });
    // Append the dropdown to the body or where you want it
    document.body.appendChild(dropdown);
  }

  addAnimeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const animeTitle = addAnimeInput.value.trim();
    if (animeTitle) {
      try {
        const animeData = await searchAnime(animeTitle);
        if (animeData) {
          displaySearchResults(animeData);
        } else {
          alert("Anime not found. Please try a different title.");
        }
      } catch (error) {
        handleError(error);
      }
    }
  });

  loadAnimeData();
});

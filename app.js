document.addEventListener("DOMContentLoaded", function () {
  const planningSection = document.getElementById("planning-anime");
  const watchedSection = document.getElementById("watched-anime");
  const favAnimeSection = document.getElementById("fav-anime");
  const addAnimeForm = document.getElementById("add-anime-form");
  const addAnimeInput = document.getElementById("anime-name");
  const loaderOverlay = document.querySelector(".loader-overlay");

  const API_BASE_URL = "https://backend-six-pi-35.vercel.app"; // Your backend URL

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
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=10&language=en`
      ); // Increased limit to 10
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

  async function addAnimeToDB(anime) {
    try {
      const response = await fetch(`${API_BASE_URL}/anime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: anime.title,
          imgSrc: anime.images.jpg.image_url,
          status: "Planning",
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      handleError(error);
    }
  }

  async function moveToWatched(anime, animeCard) {
    showLoader();
    try {
      const response = await fetch(
        `${API_BASE_URL}/anime/${anime._id}/watched`,
        { method: "PUT" }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedAnime = await response.json();
      animeCard.remove();
      displayAnime(updatedAnime, watchedSection);
    } catch (error) {
      handleError(error);
    } finally {
      hideLoader();
    }
  }

  async function deleteAnime(animeCard) {
    const animeId = animeCard.dataset.animeId;

    if (!animeId) {
      console.error("Anime ID is undefined");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/anime/${animeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      animeCard.remove();
    } catch (error) {
      handleError(error);
    }
  }

  function displayAnime(anime, section) {
    const animeCard = document.createElement("div");
    animeCard.classList.add("anime-card");
    animeCard.dataset.animeId = anime._id;
    animeCard.innerHTML = `
        <img src="${anime.imgSrc}" alt="${anime.title}">
        <span>${anime.title}</span>
      `;

    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon-container");
    animeCard.appendChild(iconContainer);

    if (section === planningSection) {
      const plusIcon = document.createElement("span");
      plusIcon.innerHTML = `<i class="fa-solid fa-plus"></i>`;
      plusIcon.style.cursor = "pointer";
      plusIcon.addEventListener("click", () => moveToWatched(anime, animeCard));
      iconContainer.appendChild(plusIcon);
    }

    if (section === watchedSection || section === planningSection) {
      const trashBinIcon = document.createElement("span");
      trashBinIcon.innerHTML = `<i class="fa-solid fa-trash"></i>`;
      trashBinIcon.style.cursor = "pointer";
      trashBinIcon.addEventListener("click", () => deleteAnime(animeCard));
      iconContainer.appendChild(trashBinIcon);
    }

    if (section === watchedSection) {
      const starIcon = document.createElement("span");
      starIcon.innerHTML = `<i class="fa-regular fa-star"></i>`;
      starIcon.style.cursor = "pointer";
      starIcon.addEventListener("click", () => {
        starIcon.innerHTML = `<i class="fa-solid fa-star"></i>`;
        addToBestAnime(anime);
      });
      iconContainer.appendChild(starIcon);
    }

    section.querySelector(".anime-container").appendChild(animeCard);
  }

  function addToBestAnime(anime) {
    // Check if anime is already in Best Choice section
    const existingAnime = favAnimeSection.querySelector(
      `[data-anime-id="${anime._id}"]`
    );
    if (!existingAnime) {
      displayAnime(anime, favAnimeSection);
    } else {
      alert("This anime is already in your Best Choice section.");
    }
  }

  // Function to display search results (you'll need to create a modal or dropdown)
function displaySearchResults(animeData) {
  // Remove any existing dropdown to avoid stacking multiple dropdowns
  const existingDropdown = document.querySelector(".search-dropdown");
  if (existingDropdown) {
    existingDropdown.remove();
  }

  // Create a new dropdown for search results
  const dropdown = document.createElement("div");
  dropdown.classList.add("search-dropdown");

  // Loop through the anime data and create an option for each result
  animeData.forEach((anime) => {
    const option = document.createElement("div");
    option.classList.add("search-option");
    option.textContent = anime.title;
    option.style.cursor = "pointer";

    // Handle click event for each search option
    option.addEventListener("click", async () => {
      try {
        // Add selected anime to the database
        const response = await fetch(`${API_BASE_URL}/anime`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: anime.title,
            imgSrc: anime.images.jpg.image_url,
            status: "Planning",
          }),
        });

        // If the anime is added successfully, display it in the Planning section
        if (response.ok) {
          const addedAnime = await response.json();
          displayAnime(addedAnime, planningSection);
          addAnimeInput.value = "";  // Clear input after selection
          dropdown.remove();  // Close the dropdown
        } else {
          handleError(new Error("Failed to add anime"));
        }
      } catch (error) {
        handleError(error);
      }
    });

    // Append each option to the dropdown
    dropdown.appendChild(option);
  });

  // Append the dropdown to the input's parent to ensure proper positioning
  addAnimeInput.parentNode.appendChild(dropdown);
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

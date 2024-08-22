document.addEventListener("DOMContentLoaded", function () {
    const planningSection = document.getElementById("planning-anime");
    const watchedSection = document.getElementById("watched-anime");
    const favAnimeSection = document.getElementById("fav-anime");
    const addAnimeForm = document.getElementById("add-anime-form");
    const addAnimeInput = document.getElementById("anime-name");
    const loaderOverlay = document.querySelector(".loader-overlay");
  
    const API_BASE_URL = "https://anime-list-backend-qhox.onrender.com";
  
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
          `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.data.length > 0) {
          return {
            title: data.data[0].title,
            imgSrc: data.data[0].images.jpg.image_url,
          };
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
          body: JSON.stringify(anime),
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
  
    addAnimeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const animeTitle = addAnimeInput.value.trim();
      if (animeTitle) {
        try {
          const animeData = await searchAnime(animeTitle);
          if (animeData) {
            animeData.status = "Planning";
            const addedAnime = await addAnimeToDB(animeData);
            displayAnime(addedAnime, planningSection);
            addAnimeInput.value = "";
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

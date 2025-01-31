let controller;

async function searchArtworks(query) 
{
  try 
  {
    if (controller) 
    {
      controller.abort();
    }

    controller = new AbortController();
    const signal = controller.signal;
    displayMessage("Searching...");
    const searchUrl = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${encodeURIComponent(query)}&hasImages=true`;
    const response = await fetch(searchUrl, { signal });
    const data = await response.json();

    if (data.total > 0) 
    {
      const objectIDs = data.objectIDs.slice(0, 1000);
      const artworks = await Promise.all(objectIDs.map(id => fetchArtworkDetails(id, signal)));
      const filteredArtworks = artworks.filter(artwork => artwork.title?.toLowerCase().includes(query) || artwork.artistDisplayName?.toLowerCase().includes(query));
      displayArtworks(filteredArtworks);
    } 
    else 
    {
      displayMessage("No artworks found");
    }
  } 
  catch (error) 
  {
    if (error.name === "AbortError") 
    {
      console.log("Request was cancelled");
    } 
    else 
    {
      console.error("Error searching artworks:", error);
      displayMessage("There was an error with the search. Please try again later.");
    }
  }
}

async function fetchArtworkDetails(objectID, signal) 
{
  const objectUrl = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectID}`;
  const objectResponse = await fetch(objectUrl, { signal });
  return await objectResponse.json();
}

function displayArtworks(artworks) 
{
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  if (artworks.length === 0) 
  {
    displayMessage("No artworks found that match the search.");
    return;
  }

  artworks.forEach(artwork => {
    const artworkDiv = document.createElement("div");
    artworkDiv.className = "artwork";

    const title = artwork.title ? `<h2>${artwork.title}</h2>` : "<h2>No title</h2>";
    const artist = artwork.artistDisplayName ? `<p><strong>Artist:</strong> ${artwork.artistDisplayName}</p>` : "<p><strong>Artist:</strong> Unknown</p>";
    const date = artwork.objectDate ? `<p><strong>Date:</strong> ${artwork.objectDate}</p>` : "<p><strong>Date:</strong> Unknown</p>";
    const image = artwork.primaryImageSmall ? `<img src="${artwork.primaryImageSmall}" alt="${artwork.title}">`
      : `<img src="IMG/No_image_available.png" alt="No image available" class="default-image">`;
    artworkDiv.innerHTML = `${title}${artist}${date}${image}`;
    resultsDiv.appendChild(artworkDiv);
  });
}

function displayMessage(message) 
{
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<p class="message">${message}</p>`;
}

document.getElementById("searchInput").addEventListener("input", function () 
{
  const query = this.value.trim().toLowerCase();

  if (query === "") 
    {
    displayMessage("Enter a search term");
  } 
  else 
  {
    searchArtworks(query);
  }
});
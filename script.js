/* ADDING ELEMENTS */

const mediaType = ["movie","podcast","book"];
let hasAddedElements = false;

function BuildElement({	type = "div",	className = "",	id = "",	text = "",	parent = mediaDiv}) {
    const element = document.createElement(type);
    if (className) element.className = className;
    if (id) element.id = id;
    if (text) element.textContent = text;
    parent = parent.appendChild(element);

    return element;
};

function addElements() {
  if (hasAddedElements === false) {
    const mediaPath = document.querySelector("#media-selection");
    mediaType.forEach (mediaType => {
      
      mediaDiv = BuildElement({className: "display-media", id: `display-${mediaType}`, parent: mediaPath});

      BuildElement({type: "h2", id: `${mediaType}-title`});
      BuildElement({type: "span", className: "media-year", id: `${mediaType}-year`});

      const mediaCard = BuildElement({className: "media-card", id: `${mediaType}-card`});
      
      BuildElement({type: "img", className: "media-image", id: `${mediaType}-image`, parent: mediaCard});

      const mediaButtons = BuildElement({className: "media-buttons", id: `${mediaType}-buttons`, parent: mediaCard});
      addButtons(mediaButtons,mediaType);

      const mediaInfo = BuildElement({className: "media-info"});

      const mediaTime = BuildElement({className: "media-time", id: `${mediaType}-time`, parent: mediaInfo})
      BuildElement({type: "span", className: "material-symbols-outlined", text: "schedule", parent: mediaTime});
      BuildElement({type: "span", id: `import-${mediaType}-time`, parent: mediaTime});

      const mediaLabel = BuildElement({className: "media-label", id: `${mediaType}-label`, parent: mediaInfo});
      BuildElement({type: "span", className: "material-symbols-outlined", text: "sell", parent: mediaLabel});
      BuildElement ({type: "span", id: `import-${mediaType}-label`, parent: mediaLabel});
      
      const mediaOverview = BuildElement({type: "details", className: "media-overview"});
      BuildElement({type: "summary", text: "summary", parent: mediaOverview});
      BuildElement({type: "p", id: `${mediaType}-overview`, parent: mediaOverview});

      /*const mediaDetails = BuildElement({type: "details", className: "media-details"});
      BuildElement({type: "summary", text: "details", parent: mediaDetails});
      BuildElement({type: "p", id: `${mediaType}-details`, parent: mediaDetails}); => TO BE ADDED*/ 
  })
  hasAddedElements = true;
  }
};

/* MEDIA DIRECTORY */

let movieList = [];
let movieCounter = 0;
let movieMaxPage = null;
let movieMax = null;

let bookList = [];
let bookCounter = 0;

let bookmarkedMovie = [];
let bookmarkedPod = [];
let bookmarkedBook = [];

let discardedMovie = [];
let discardedPod = [];
let discardedBook = [];

let currentMovie = null;
let currentBook = null;

const media = {
  movie: {
    fetchList: fetchMovieList,
    counter: 0,
    page: 1,
    fetchNextList: false,
    listLength: () => movieList.results.length,
    maxPage: () => 0,
    mediaId: ()=> movieList.results[media.movie.counter].id,
    currentMedia: ()=> currentMovie,
    bookmarkedList: ()=> bookmarkedMovie,
    targetLink: ()=> "",
    discardedList: ()=> discardedMovie
    },

  pod: {

  },

  book: {
    fetchList: fetchBookList,
    counter: 0,
    startIndex: 0,
    fetchNextList: false,
    listLength: () => bookList.items.length,
    mediaId: ()=> bookList.items[media.book.counter].id,
    bookmarkedList: ()=> bookmarkedBook,
    currentMedia: ()=> currentBook,
    targetLink: ()=> "",
    discardedList: ()=> discardedBook
  }
}

const buttonAction = ["bookmark","shuffle","explore","discard"];
const buttonIcon = ["favorite","autorenew","open_in_new","delete"];

function bookmarkMedia(mediaType) {
  const bookmark = media[mediaType];
  const copyBookmark = JSON.parse(JSON.stringify(bookmark.currentMedia()));
  bookmark.bookmarkedList().push(copyBookmark);
  loadMedia(mediaType);
}

function exploreMedia() {
  
}

function discardMedia(mediaType) {
  const discard = media[mediaType];
  const copyDiscard = JSON.parse(JSON.stringify(discard.currentMedia()));
  discard.discardedList().push(copyDiscard);
  loadMedia(mediaType);
}

async function loadMedia(mediaType) {
  const directory = media[mediaType];

  let fetchNextList = false;
  const check = await checkCounter(directory);

  if (directory.fetchNextList === true) {
    await directory.fetchList();
    fetchNextList = false;
  }

  await updateMedia({updateMediaType: mediaType, apiId: directory.mediaId()})
}

async function checkCounter(directory) {

  if (directory.counter + 1 >= directory.listLength()) {
    directory.counter = 0;
    directory.fetchNextList = true;
  } else {
    directory.counter++;
  }

}

const mediaFunctions = {
  "bookmark": bookmarkMedia,
  "shuffle": loadMedia,
  "explore": exploreMedia,
  "discard": discardMedia
}

function addButtons(mediaButtons, mediaType) {
  buttonAction.forEach((action, index) => {
    const button = BuildElement({
      type: "button",
      className: `${action}`,
      id: `${action}-${mediaType}`,
      parent: mediaButtons
    });

    BuildElement({
      type: "span",
      className: "material-symbols-outlined",
      text: buttonIcon[index],
      parent: button
    });

 button.addEventListener("click", () => {
      if (mediaFunctions[action]) {
        mediaFunctions[action](mediaType);
      }
    });
  });
}

/* SEARCH BAR */

let searchCategory = null;

const findButton = document.querySelector("#find-button");
findButton.addEventListener("click", () => {
  searchCategory = document.querySelector("input").value;
  addElements();
  populateMedia("movie");
  populateMedia("book");
});

async function populateMedia(mediaType) {
  const load = media[mediaType];
  await load.fetchList();
  await updateMedia({updateMediaType: mediaType, apiId: load.mediaId()})
}

/* FETCH | MOVIE LIST */

async function fetchMovieList() {
  try {
    const movieGenreList = await fetch(`https://api.themoviedb.org/3/search/keyword?query=${searchCategory}`, options);

    if (!movieGenreList.ok) {
      throw new Error(`Error! Status: ${movieGenreList.status}`); // expand and develop
    }

    const movieGenreKeyword = await movieGenreList.json();
    let movieSearch = movieGenreKeyword.results[0]; // add option if error (API returns total pages and total results!)
    
    if (media.movie.fetchNextList === true) {
      media.movie.page++
    }

    const movieResponse = await fetch(`https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=${media.movie.page}&sort_by=popularity.desc&with_keywords=${movieSearch.id}`, options);

    if (!movieResponse.ok) {
      throw new Error(`Error! Status: ${movieResponse.status}`);
    }

    movieList = await movieResponse.json();

    return movieList;

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

/* FETCH | BOOK LIST */

async function fetchBookList() {
  try {
    
    const book = media.book

    if (book.fetchNextList === true) {
      book.startIndex += 10;
    }

    let bookResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchCategory}&startIndex=${book.startIndex}&key=AIzaSyAKwOW5az8D5Iy8w5T0JkzCXA1qSZWYZEA`)

    if (!bookResponse.ok) {
        throw new Error(`Error! Status: ${bookResponse.status}`); // expand and develop
      }
    
    bookList = await bookResponse.json();
    return bookList;

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

/* FETCH INFO & UPDATE DISPLAYED MEDIA */

let getMedia = null;
let mediaResponse = null;

async function updateMedia({
  updateMediaType = "",
  apiId = ""
  }) {

  try {
        
    if (updateMediaType === "movie") {
            
      getMedia = await fetch(`https://api.themoviedb.org/3/movie/${apiId}`, options);

    } else if (updateMediaType === "podcast") {

    } else {
      getMedia = await fetch(`https://www.googleapis.com/books/v1/volumes/${apiId}?key=AIzaSyAKwOW5az8D5Iy8w5T0JkzCXA1qSZWYZEA`);
    }

    if (!getMedia.ok) {
       throw new Error(`Error! Status: ${getMedia.status}`); // TBD: expand and develop
    }

    mediaResponse = await getMedia.json();
    
      if (updateMediaType === "movie") {
        currentMovie = mediaResponse;
        updateDom({
        updateMediaType:  "movie",
        titlePath: mediaResponse.title,
        yearPath: mediaResponse.release_date?.split("-")[0],
        imagePath: `https://image.tmdb.org/t/p/w500${mediaResponse.poster_path}`,
        timePath: mediaResponse.runtime,
        labelPath: mediaResponse.genres[0]?.name,
        overviewPath: mediaResponse.overview
      })
      
    } else if (updateMediaType === "podcast") {

    } else {
        currentBook = mediaResponse;
        const book = mediaResponse.volumeInfo;
        updateDom({
        updateMediaType:  "book",
        titlePath: book.title,
        yearPath: mediaResponse.volumeInfo.publishedDate?.split("-")[0],
        imagePath: book.imageLinks?.medium || book.imageLinks?.large || book.imageLinks?.thumbnail,
        timePath: book.pageCount,
        labelPath: book.categories[0]?.split("/")[0],
        overviewPath: book.description

      })
    }

    return mediaResponse;

  } catch (error) {
    console.error('Error fetching data:', error);
  };
}

/*UPDATE DOM */

function updateDom({updateMediaType = "", titlePath = "", yearPath = "", imagePath = "", timePath = "", labelPath = "", overviewPath = ""}) {
  const selector = {
    titlePath: `#${updateMediaType}-title`,
    yearPath: `#${updateMediaType}-year`,
    imagePath: `#${updateMediaType}-image`,
    timePath: `#import-${updateMediaType}-time`,
    labelPath: `#import-${updateMediaType}-label`,
    overviewPath: `#${updateMediaType}-overview`
  };

  Object.entries(selector).forEach(([apiItem, path]) => {
    const updateElement = document.querySelector(path);
    
    switch (apiItem) {
      case "titlePath":
        updateElement.textContent = titlePath || "-";
        break
      case "yearPath":
        updateElement.textContent = yearPath || "-";
        break
      case "imagePath":
        const safeImage = imagePath.replace(/^http:/, "https:") || "-";
        updateElement.setAttribute("src", safeImage);
        break
      case "timePath":
        updateElement.textContent = timePath || "-";
        break
      case "labelPath":
        updateElement.textContent = labelPath || "-";
        break
      case "overviewPath":
        updateElement.textContent = overviewPath || "Not provided";
        break

  }});
}

/* API COMPLEMENT - OPTIONS */

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJiZWRkNWJlOWQ5NmNhOWFiZWE3MDdjM2FmNjFkZDUyYiIsIm5iZiI6MTc1ODczODIyMS41NTUsInN1YiI6IjY4ZDQzNzJkMWIzNTJmNmEyZmU3MjIxMyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.VI7cQfb1x9SOVxW7yJ1ix5Oc3IarjgENFlKA6LAxqPo'
  }
};


